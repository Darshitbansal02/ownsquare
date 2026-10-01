import { ApiError } from "../utils/ApiError.js";
import { requireActor, requireSettings } from "../utils/actors.js";
import { allocate, basisPoints, integer, multiply, percentageFloor, sum } from "../utils/money.js";
import { inTransaction } from "../utils/transaction.js";
import { payoutDTO, propertyDTO } from "../utils/dto.js";

export function calculatePayout({ propertyId, salePrice, platformFeePct, totalUnits, holdings }) {
  integer(salePrice, "salePrice", 1);
  const platformFee = percentageFloor(salePrice, platformFeePct);
  const distributable = salePrice - platformFee;
  if (sum(holdings.map((row) => row.units), "units") !== totalUnits || holdings.length === 0) {
    throw new ApiError("CONFLICT", "Payout holdings do not reconcile");
  }
  const allocation = allocate(distributable, holdings.map((row) => ({ id: String(row.investorId), units: row.units })), totalUnits);
  const items = allocation.items.map((row) => ({ investorId: row.id, units: row.units, amount: row.amount }))
    .sort((a, b) => a.investorId.localeCompare(b.investorId));
  const totalPayout = sum(items.map((row) => row.amount));
  if (totalPayout !== distributable || sum([platformFee, totalPayout]) !== salePrice) {
    throw new ApiError("CONFLICT", "Payout money does not reconcile");
  }
  return { propertyId: String(propertyId), salePrice, platformFeePct, platformFee, distributable,
    items, totalPayout, remainder: allocation.remainder, remainderInvestorId: allocation.remainderId };
}

export function createPayoutService({ connection, models, ledger, notifications }) {
  async function read(propertyId, session) {
    const property = await models.Property.findById(propertyId).session(session);
    if (!property) throw new ApiError("NOT_FOUND", "Property not found");
    if (property.status === "SOLD" || await models.Payout.exists({ propertyId }).session(session)) throw new ApiError("ALREADY_SOLD", "Payout has already executed");
    if (property.status !== "HOLDING" || property.unitsSold !== property.totalUnits) {
      throw new ApiError("INVALID_PROPERTY_STATUS", "Fully funded HOLDING property required");
    }
    const rows = await models.Investment.find({ propertyId, status: "ACTIVE" }).sort({ investorId: 1, _id: 1 }).session(session);
    const groups = new Map();
    for (const row of rows) {
      if (row.amount !== multiply(row.units, property.unitPrice)) throw new ApiError("CONFLICT", "Investment principal does not reconcile");
      const investorId = String(row.investorId);
      const existing = groups.get(investorId) || { investorId, units: 0, rows: [] };
      existing.units = sum([existing.units, row.units], "units");
      existing.rows.push(row);
      groups.set(investorId, existing);
    }
    if (sum(rows.map((row) => row.amount)) !== property.valuation) throw new ApiError("CONFLICT", "Raised principal does not reconcile");
    return { property, groups };
  }
  async function preview(adminId, propertyId, salePrice) {
    integer(salePrice, "salePrice", 1);
    return inTransaction(connection, async (session) => {
      await requireActor(models, adminId, ["ADMIN"], session);
      const { property, groups } = await read(propertyId, session);
      const settings = await requireSettings(models, session);
      return calculatePayout({ propertyId, salePrice, platformFeePct: settings.platformFeePct,
        totalUnits: property.totalUnits, holdings: [...groups.values()] });
    });
  }
  async function execute(adminId, propertyId, { salePrice, expectedPlatformFeePct }) {
    integer(salePrice, "salePrice", 1);
    basisPoints(expectedPlatformFeePct, "expectedPlatformFeePct");
    try {
      return await inTransaction(connection, async (session) => {
        await requireActor(models, adminId, ["ADMIN"], session);
        const { property, groups } = await read(propertyId, session);
        const settings = await requireSettings(models, session);
        if (basisPoints(settings.platformFeePct) !== basisPoints(expectedPlatformFeePct)) {
          throw new ApiError("PREVIEW_STALE", "Platform fee changed; refresh the preview");
        }
        // Serialize the fee snapshot against concurrent administrative settings writes.
        await models.Settings.updateOne({ _id: settings._id }, { $currentDate: { updatedAt: true } }, { session });
        const calculation = calculatePayout({ propertyId, salePrice, platformFeePct: settings.platformFeePct,
          totalUnits: property.totalUnits, holdings: [...groups.values()] });
        integer(property.version + 1, "version");
        const soldAt = new Date();
        const sold = await models.Property.findOneAndUpdate({
          _id: property._id, status: "HOLDING", version: property.version, unitsSold: property.totalUnits
        }, { $set: { status: "SOLD", salePrice, soldAt }, $inc: { version: 1 } }, { session, new: true, runValidators: true });
        if (!sold) throw new ApiError("ALREADY_SOLD", "Property changed during sale");
        const payout = new models.Payout({
          propertyId, salePrice, platformFeePct: calculation.platformFeePct,
          platformFee: calculation.platformFee, distributable: calculation.distributable,
          items: calculation.items, executedBy: adminId, executedAt: soldAt
        });
        await payout.save({ session });
        for (const item of calculation.items) {
          const investor = await models.User.findById(item.investorId).session(session);
          if (!investor || investor.role !== "INVESTOR") throw new ApiError("CONFLICT", "Payout investor account is invalid");
          if (item.amount > 0) await ledger.post({
            userId: item.investorId, type: "PAYOUT", direction: "CREDIT",
            amount: item.amount, refType: "Payout", refId: String(payout._id)
          }, session);
          const rows = groups.get(item.investorId).rows;
          const allocation = allocate(item.amount, rows.map((row) => ({ id: String(row._id), units: row.units })), item.units);
          for (const row of allocation.items) {
            await models.Investment.updateOne({ _id: row.id, status: "ACTIVE" }, {
              $set: { status: "EXITED", payoutAmount: row.amount }
            }, { session, runValidators: true });
          }
          await notifications.record({
            userId: item.investorId, type: "PAYOUT_CREDITED", title: "Sale payout credited",
            body: "Your sale proceeds have been allocated to your wallet.", link: "/investor/portfolio"
          }, session);
        }
        if (calculation.platformFee > 0) {
          const account = await models.User.findById(settings.feeAccountUserId).session(session);
          if (!account || account.role !== "ADMIN") throw new ApiError("CONFLICT", "Platform fee accounting user is invalid");
          await ledger.post({ userId: account._id, type: "FEE", direction: "CREDIT",
            amount: calculation.platformFee, refType: "Payout", refId: String(payout._id) }, session);
        }
        return { property: await propertyDTO(models, sold, session), payout: payoutDTO(payout) };
      });
    } catch (error) {
      if (error.code === 11000 && error.keyPattern?.propertyId) throw new ApiError("ALREADY_SOLD", "Payout has already executed");
      if (error instanceof ApiError && error.code === "CONFLICT") {
        const current = await models.Property.findById(propertyId);
        if (current?.status === "SOLD") throw new ApiError("ALREADY_SOLD", "Payout has already executed");
      }
      throw error;
    }
  }
  return { preview, execute };
}
