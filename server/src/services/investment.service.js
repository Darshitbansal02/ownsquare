import { ApiError } from "../utils/ApiError.js";
import { requireActor, requireSettings } from "../utils/actors.js";
import { integer, multiply, percentageFloor, sum } from "../utils/money.js";
import { inTransaction } from "../utils/transaction.js";
import { investmentDTO, propertyDTO } from "../utils/dto.js";
import { pageOf } from "../utils/pagination.js";
import { parse } from "../middlewares/validate.js";
import { idempotencyKey, investmentInput } from "../validators/investments.schema.js";

export function createInvestmentService({ connection, models, ledger, notifications, features }) {
  for (const name of ["kyc", "ownershipCap"]) {
    if (typeof features?.[name] !== "boolean") throw new ApiError("SERVICE_UNAVAILABLE", `${name} configuration is required`);
  }
  function replay(row, request) {
    if (String(row.requestFingerprint.propertyId) !== request.propertyId || row.requestFingerprint.units !== request.units) {
      throw new ApiError("IDEMPOTENCY_CONFLICT", "Idempotency key has a different purchase payload");
    }
    return { data: row.responseSnapshot.toObject(), replay: true };
  }
  function insufficient(property) {
    const remaining = property.totalUnits - property.unitsSold;
    return new ApiError("INSUFFICIENT_UNITS", `Only ${remaining} units remain`, [
      { field: "remainingUnits", message: "Current availability", value: remaining }
    ]);
  }
  async function invest(investorId, input, key) {
    const request = parse(investmentInput, input);
    const canonicalKey = parse(idempotencyKey, key);
    let observedLive = false;
    try {
      return await inTransaction(connection, async (session) => {
        const investor = await requireActor(models, investorId, ["INVESTOR"], session);
        const prior = await models.Investment.findOne({ investorId, idempotencyKey: canonicalKey }).session(session);
        if (prior) return replay(prior, request);
        if (features.kyc && investor.kyc.status !== "APPROVED") throw new ApiError("KYC_REQUIRED", "Approved KYC is required");
        const property = await models.Property.findById(request.propertyId).session(session);
        if (!property) throw new ApiError("NOT_FOUND", "Property not found");
        if (property.status === "FUNDED") {
          if (observedLive) throw insufficient(property);
          throw new ApiError("ALREADY_FUNDED", "Property is already fully funded");
        }
        if (property.status !== "LIVE") throw new ApiError("INVALID_PROPERTY_STATUS", "Property is not LIVE");
        observedLive = true;
        integer(property.totalUnits, "totalUnits", 1);
        integer(property.unitPrice, "unitPrice", 1);
        integer(property.version + 1, "version");
        if (request.units < property.minUnits) throw new ApiError("VALIDATION_ERROR", "Purchase is below minimum units", [
          { field: "units", message: "Minimum units", value: property.minUnits }
        ]);
        if (request.units > property.totalUnits - property.unitsSold) throw insufficient(property);
        if (features.ownershipCap) {
          const settings = await requireSettings(models, session);
          const rows = await models.Investment.find({ investorId, propertyId: property._id, status: "ACTIVE" }).select("units").session(session);
          const owned = sum(rows.map((row) => row.units), "units");
          const limit = Math.min(property.maxUnitsPerInvestor ?? property.totalUnits, percentageFloor(property.totalUnits, settings.maxOwnershipPct));
          if (BigInt(owned) + BigInt(request.units) > BigInt(limit)) {
            throw new ApiError("OWNERSHIP_LIMIT_EXCEEDED", "Cumulative ownership exceeds the approved cap");
          }
        }
        const amount = multiply(request.units, property.unitPrice);
        let claimed = await models.Property.findOneAndUpdate({
          _id: property._id, status: "LIVE", version: property.version,
          unitsSold: { $lte: property.totalUnits - request.units }
        }, { $inc: { unitsSold: request.units, version: 1 } }, { session, new: true, runValidators: true });
        if (!claimed) throw insufficient(property);
        const investment = new models.Investment({
          investorId, propertyId: property._id, units: request.units, amount,
          idempotencyKey: canonicalKey, requestFingerprint: request, createdAt: new Date(), updatedAt: new Date()
        });
        const transaction = await ledger.post({ userId: investorId, type: "INVESTMENT", direction: "DEBIT",
          amount, refType: "Investment", refId: String(investment._id) }, session);
        if (claimed.unitsSold === claimed.totalUnits) {
          claimed = await models.Property.findOneAndUpdate({
            _id: claimed._id, status: "LIVE", version: claimed.version, unitsSold: claimed.totalUnits
          }, { $set: { status: "FUNDED", fundedAt: new Date() } }, { session, new: true, runValidators: true });
          if (!claimed) throw new ApiError("CONFLICT", "Funding transition failed");
          if (claimed.brokerId) {
            const broker = await models.User.findById(claimed.brokerId).session(session);
            if (!broker || broker.role !== "BROKER") throw new ApiError("CONFLICT", "Funding broker account is invalid");
            const settings = await requireSettings(models, session);
            const commission = percentageFloor(claimed.valuation, settings.brokerCommissionPct);
            if (commission) await ledger.post({ userId: claimed.brokerId, type: "COMMISSION", direction: "CREDIT",
              amount: commission, refType: "Property", refId: String(claimed._id) }, session);
          }
        }
        const data = {
          investment: investmentDTO(investment, claimed.totalUnits),
          property: { _id: String(claimed._id), unitsSold: claimed.unitsSold,
            fundingPct: claimed.unitsSold / claimed.totalUnits * 100, status: claimed.status },
          walletBalance: transaction.balanceAfter
        };
        investment.responseSnapshot = data;
        await investment.save({ session });
        if (claimed.status === "FUNDED") {
          const recipients = await models.Investment.distinct("investorId", { propertyId: claimed._id, status: "ACTIVE" }).session(session);
          if (claimed.brokerId) recipients.push(claimed.brokerId);
          for (const userId of recipients) await notifications.record({
            userId, type: "FUNDING_COMPLETE", title: "Funding complete", body: "This property is fully funded.",
            link: `/properties/${claimed._id}`
          }, session);
        }
        return { data, replay: false };
      });
    } catch (error) {
      if (error.code === 11000 && error.keyPattern?.idempotencyKey) {
        await requireActor(models, investorId, ["INVESTOR"]);
        const prior = await models.Investment.findOne({ investorId, idempotencyKey: canonicalKey });
        if (prior) return replay(prior, request);
      }
      if (observedLive && error instanceof ApiError && error.code === "CONFLICT") {
        const current = await models.Property.findById(request.propertyId);
        if (current && (current.status === "FUNDED" || current.totalUnits - current.unitsSold < request.units)) throw insufficient(current);
      }
      throw error;
    }
  }
  async function list(investorId, query) {
    await requireActor(models, investorId, ["INVESTOR"]);
    return inTransaction(connection, (session) => pageOf(models.Investment, {
      investorId, ...(query.propertyId ? { propertyId: query.propertyId } : {}), ...(query.status ? { status: query.status } : {})
    }, query, async (row) => {
      const property = await models.Property.findById(row.propertyId).session(session);
      if (!property) throw new ApiError("CONFLICT", "Investment property missing");
      return { investment: investmentDTO(row, property.totalUnits), property: await propertyDTO(models, property, session) };
    }, session));
  }
  return { invest, list };
}
