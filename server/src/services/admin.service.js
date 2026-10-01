import { ApiError } from "../utils/ApiError.js";
import { requireActor, requireSettings } from "../utils/actors.js";
import { propertyDTO, userDTO, withdrawalDTO } from "../utils/dto.js";
import { basisPoints } from "../utils/money.js";
import { dateRange, pageOf, sortOptions } from "../utils/pagination.js";
import { inTransaction } from "../utils/transaction.js";

const escapeLiteral = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function createAdminService({ connection, models, withdrawals }) {
  const { User, Property, Transaction, Settings, Investment } = models;

  // GET /admin/stats. AUM counts funded/holding valuation; funds raised nets refunds in range.
  async function stats(from, to) {
    const now = new Date();
    const start = from ?? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const end = to ?? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    const aum = (await Property.aggregate([
      { $match: { status: { $in: ["FUNDED", "HOLDING"] } } },
      { $group: { _id: null, total: { $sum: "$valuation" } } }
    ]))[0]?.total ?? 0;
    const byRole = Object.fromEntries((await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ])).map((row) => [row._id, row.count]));
    const raised = await Transaction.aggregate([
      { $match: { createdAt: { $gte: start, $lt: end }, type: { $in: ["INVESTMENT", "REFUND"] } } },
      { $group: { _id: "$type", total: { $sum: "$amount" } } }
    ]);
    const invested = raised.find((row) => row._id === "INVESTMENT")?.total ?? 0;
    const refunded = raised.find((row) => row._id === "REFUND")?.total ?? 0;
    const [liveProperties, fees, byStatus, pendingProperties, pendingBrokers, pendingKyc, pendingWithdrawals, series] =
      await Promise.all([
        Property.countDocuments({ status: "LIVE" }),
        Transaction.aggregate([{ $match: { type: "FEE" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
        Property.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
        Property.countDocuments({ status: "PENDING_APPROVAL" }),
        User.countDocuments({ role: "BROKER", brokerApproved: false }),
        User.countDocuments({ "kyc.status": "PENDING" }),
        models.Withdrawal.countDocuments({ status: "PENDING" }),
        Transaction.aggregate([
          { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 86400000) }, type: "INVESTMENT" } },
          { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, amount: { $sum: "$amount" } } },
          { $sort: { _id: 1 } }
        ])
      ]);
    return {
      aum,
      usersByRole: { ADMIN: byRole.ADMIN ?? 0, BROKER: byRole.BROKER ?? 0, INVESTOR: byRole.INVESTOR ?? 0 },
      liveProperties,
      fundsRaisedThisMonth: Math.max(0, invested - refunded),
      platformFeesEarned: fees[0]?.total ?? 0,
      fundsRaisedSeries: series.map((row) => ({ date: row._id, amount: row.amount })),
      propertiesByStatus: ["DRAFT", "PENDING_APPROVAL", "LIVE", "FUNDED", "HOLDING", "SOLD", "REJECTED", "CANCELLED"]
        .map((status) => ({ status, count: byStatus.find((row) => row._id === status)?.count ?? 0 })),
      approvalQueue: { properties: pendingProperties, brokers: pendingBrokers, kyc: pendingKyc, withdrawals: pendingWithdrawals }
    };
  }

  // GET /admin/users. Never selects password or reset-token hashes; kyc docs are admin-only.
  function users(query) {
    const filter = {};
    if (query.role) filter.role = query.role;
    if (query.isActive !== undefined) filter.isActive = query.isActive;
    if (query.brokerApproved !== undefined) filter.brokerApproved = query.brokerApproved;
    if (query.kycStatus) filter["kyc.status"] = query.kycStatus;
    if (query.search) {
      const escaped = escapeLiteral(query.search.trim());
      filter.$or = [{ name: { $regex: escaped, $options: "i" } }, { email: { $regex: escaped, $options: "i" } }];
    }
    return pageOf(User, filter, query, async (row) => ({
      ...userDTO(row),
      kycDocs: row.kyc.docs, kycSelfie: row.kyc.selfie,
      kycReviewedBy: row.kyc.reviewedBy ? String(row.kyc.reviewedBy) : null,
      kycReviewedAt: row.kyc.reviewedAt ? row.kyc.reviewedAt.toISOString() : null
    }));
  }

  // PATCH /admin/users/:id. Guards the last active admin and invalidates sessions on change.
  async function updateUser(actorId, userId, data) {
    return inTransaction(connection, async (session) => {
      await requireActor(models, actorId, ["ADMIN"], session);
      const user = await User.findById(userId).session(session);
      if (!user) throw new ApiError("NOT_FOUND", "User not found");
      if (data.brokerApproved === true && (data.role ?? user.role) !== "BROKER") {
        throw new ApiError("VALIDATION_ERROR", "Only brokers can be approved as brokers");
      }
      const demoting = data.role !== undefined && data.role !== "ADMIN";
      if (user.role === "ADMIN" && (demoting || data.isActive === false)) {
        const others = await User.countDocuments({ role: "ADMIN", isActive: true, _id: { $ne: user._id } });
        if (others === 0) throw new ApiError("CONFLICT", "The last active admin cannot be deactivated or demoted");
      }
      if (data.role !== undefined && data.role !== user.role) {
        if (await Property.exists({ brokerId: user._id, status: { $in: ["DRAFT", "PENDING_APPROVAL", "REJECTED"] } })) {
          throw new ApiError("CONFLICT", "User still owns broker listings requiring the broker role");
        }
        if (data.role !== "INVESTOR" && await Investment.exists({ investorId: user._id, status: "ACTIVE" })) {
          throw new ApiError("CONFLICT", "User still holds active investments");
        }
      }
      const changes = {};
      if (data.isActive !== undefined) changes.isActive = data.isActive;
      if (data.role !== undefined) changes.role = data.role;
      if (data.brokerApproved !== undefined) changes.brokerApproved = data.brokerApproved;
      // Role or activation changes must not leave previously issued tokens usable.
      if (data.role !== undefined || data.isActive === false) changes.sessionVersion = user.sessionVersion + 1;
      const updated = await User.findOneAndUpdate({ _id: user._id }, { $set: changes },
        { session, new: true, runValidators: true });
      return {
        ...userDTO(updated), kycDocs: updated.kyc.docs, kycSelfie: updated.kyc.selfie,
        kycReviewedBy: null, kycReviewedAt: null
      };
    });
  }

  // GET /admin/settings. A missing singleton is a configuration error, not a silent default.
  async function getSettings() {
    const settings = await requireSettings(models);
    return { platformFeePct: settings.platformFeePct, brokerCommissionPct: settings.brokerCommissionPct,
      maxOwnershipPct: settings.maxOwnershipPct };
  }

  // PATCH /admin/settings. Rates apply to future events only; posted money never recomputes.
  async function updateSettings(actorId, data) {
    return inTransaction(connection, async (session) => {
      await requireActor(models, actorId, ["ADMIN"], session);
      const settings = await requireSettings(models, session);
      const changes = {};
      for (const field of ["platformFeePct", "brokerCommissionPct", "maxOwnershipPct"]) {
        if (data[field] !== undefined) {
          basisPoints(data[field], field);
          changes[field] = data[field];
        }
      }
      const updated = await Settings.findOneAndUpdate({ _id: settings._id }, { $set: changes },
        { session, new: true, runValidators: true });
      return { platformFeePct: updated.platformFeePct, brokerCommissionPct: updated.brokerCommissionPct,
        maxOwnershipPct: updated.maxOwnershipPct };
    });
  }

  // GET /admin/withdrawals. P1 queue; bank details stay private to admin and the owner.
  function listWithdrawals(query) {
    const filter = { ...(query.status ? { status: query.status } : {}),
      ...(query.userId ? { userId: query.userId } : {}), ...dateRange(query) };
    return pageOf(models.Withdrawal, filter, query, async (row) => withdrawalDTO(row));
  }

  // PATCH /admin/withdrawals/:id delegates to the single withdrawal owner (no independent balance writes).
  function processWithdrawal(actorId, withdrawalId, data) {
    return withdrawals.process(actorId, withdrawalId, data);
  }

  // GET /admin/properties. Includes drafts and rejected assets, unlike the public marketplace.
  function allProperties(query) {
    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.brokerId) filter.brokerId = query.brokerId;
    if (query.city) filter.city = { $regex: escapeLiteral(query.city.trim()), $options: "i" };
    if (query.search) {
      const escaped = escapeLiteral(query.search.trim());
      filter.$or = [{ title: { $regex: escaped, $options: "i" } },
        { address: { $regex: escaped, $options: "i" } }, { city: { $regex: escaped, $options: "i" } }];
    }
    return pageOf(Property, filter, query, async (row) => propertyDTO(models, row));
  }

  // GET /properties/:id/investors. Aggregated server-side; broker view masks investor names.
  async function propertyInvestors(actor, propertyId, query) {
    const property = await Property.findById(propertyId).lean();
    if (!property || (actor.role === "BROKER" && String(property.brokerId) !== String(actor._id))) {
      throw new ApiError("NOT_FOUND", "Property not found");
    }
    const match = { propertyId: property._id, status: { $ne: "REFUNDED" } };
    const requested = query.sort === "units" ? "units" : "-units";
    const [counted, grouped] = await Promise.all([
      Investment.aggregate([{ $match: match }, { $group: { _id: "$investorId" } }, { $count: "total" }]),
      Investment.aggregate([{ $match: match },
        { $group: { _id: "$investorId", units: { $sum: "$units" }, amount: { $sum: "$amount" } } },
        { $sort: sortOptions(requested) },
        { $skip: (query.page - 1) * query.limit }, { $limit: query.limit }])
    ]);
    const investors = await User.find({ _id: { $in: grouped.map((row) => row._id) } }).select("name").lean();
    const names = new Map(investors.map((row) => [String(row._id), row.name]));
    const total = counted[0]?.total ?? 0;
    return {
      items: grouped.map((row) => {
        const name = names.get(String(row._id)) ?? "Investor";
        return { investorId: String(row._id), displayName: actor.role === "BROKER" ? `${name.charAt(0)}***` : name,
          units: row.units, amount: row.amount,
          ownershipPct: property.totalUnits ? row.units / property.totalUnits * 100 : 0 };
      }),
      page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit)
    };
  }

  return { stats, users, updateUser, getSettings, updateSettings, listWithdrawals, processWithdrawal,
    allProperties, propertyInvestors };
}
