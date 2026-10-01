import { ApiError } from "../utils/ApiError.js";
import { requireActor, requireFeature } from "../utils/actors.js";
import { inTransaction } from "../utils/transaction.js";
import { parse } from "../middlewares/validate.js";
import { bankDetails, positiveInteger } from "../validators/common.schema.js";
import { withdrawalDTO } from "../utils/dto.js";
import { pageOf, dateRange } from "../utils/pagination.js";

export function createWithdrawalService({ connection, models, ledger, notifications, features }) {
  async function request(userId, input) {
    requireFeature(features, "withdrawals");
    const amount = parse(positiveInteger, input.amount);
    const bank = parse(bankDetails, input.bankDetails);
    return inTransaction(connection, async (session) => {
      await requireActor(models, userId, ["INVESTOR"], session);
      await ledger.lock(userId, session);
      const wallet = await ledger.read(userId, session);
      if (wallet.availableBalance < amount) throw new ApiError("INSUFFICIENT_BALANCE", "Insufficient available balance", [
        { field: "availableBalance", message: "Available paise", value: wallet.availableBalance },
        { field: "requiredAmount", message: "Required paise", value: amount }
      ]);
      const [withdrawal] = await models.Withdrawal.create([{ userId, amount, bankDetails: bank }], { session });
      return { withdrawal: withdrawalDTO(withdrawal), wallet: await ledger.read(userId, session) };
    });
  }
  async function process(adminId, withdrawalId, input) {
    requireFeature(features, "withdrawals");
    if (!["APPROVED", "REJECTED"].includes(input.status) ||
        (input.status === "REJECTED" && (typeof input.reason !== "string" || !input.reason.trim() || input.reason.trim().length > 2000))) {
      throw new ApiError("VALIDATION_ERROR", "Approval or rejection with reason is required");
    }
    return inTransaction(connection, async (session) => {
      await requireActor(models, adminId, ["ADMIN"], session);
      const row = await models.Withdrawal.findById(withdrawalId).session(session);
      if (!row) throw new ApiError("NOT_FOUND", "Withdrawal not found");
      if (row.status !== "PENDING") throw new ApiError("WITHDRAWAL_ALREADY_PROCESSED", "Withdrawal is already processed");
      await ledger.lock(row.userId, session);
      const withdrawal = await models.Withdrawal.findOneAndUpdate({ _id: row._id, status: "PENDING" }, {
        $set: { status: input.status, reason: input.status === "REJECTED" ? input.reason.trim() : null,
          processedBy: adminId, processedAt: new Date() }
      }, { session, new: true, runValidators: true });
      if (!withdrawal) throw new ApiError("WITHDRAWAL_ALREADY_PROCESSED", "Withdrawal is already processed");
      if (input.status === "APPROVED") {
        await ledger.post({ userId: row.userId, type: "WITHDRAWAL", direction: "DEBIT",
          amount: row.amount, refType: "Withdrawal", refId: String(row._id) }, session);
      }
      await notifications.record({
        userId: row.userId, type: `WITHDRAWAL_${input.status}`, title: `Withdrawal ${input.status.toLowerCase()}`,
        body: "Your simulated withdrawal request has been reviewed.", link: "/investor/wallet"
      }, session);
      return { withdrawal: withdrawalDTO(withdrawal), wallet: await ledger.read(row.userId, session) };
    });
  }
  async function list(actorId, query, admin = false) {
    requireFeature(features, "withdrawals");
    await requireActor(models, actorId, [admin ? "ADMIN" : "INVESTOR"]);
    return pageOf(models.Withdrawal, {
      ...(admin ? query.userId ? { userId: query.userId } : {} : { userId: actorId }),
      ...(query.status ? { status: query.status } : {}), ...dateRange(query)
    }, query, withdrawalDTO);
  }
  return { request, process, list };
}
