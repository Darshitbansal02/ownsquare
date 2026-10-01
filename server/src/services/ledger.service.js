import { ApiError } from "../utils/ApiError.js";
import { integer, safeNumber, sum } from "../utils/money.js";
import { requireSession } from "../utils/transaction.js";
import { requireActor } from "../utils/actors.js";
import { transactionDTO } from "../utils/dto.js";
import { dateRange, pageOf } from "../utils/pagination.js";

const causes = {
  TOPUP: ["CREDIT", "TopupOrder"], INVESTMENT: ["DEBIT", "Investment"],
  PAYOUT: ["CREDIT", "Payout"], REFUND: ["CREDIT", "Investment"],
  COMMISSION: ["CREDIT", "Property"], WITHDRAWAL: ["DEBIT", "Withdrawal"], FEE: ["CREDIT", "Payout"]
};

export function createLedgerService({ models }) {
  async function read(userId, session) {
    requireSession(session);
    const user = await models.User.findById(userId).session(session);
    if (!user) throw new ApiError("NOT_FOUND", "Wallet owner not found");
    const entries = await models.Transaction.find({ userId }).sort({ walletVersion: 1 }).session(session);
    let balance = 0n;
    let lastVersion = 0;
    for (const entry of entries) {
      balance += BigInt(entry.amount) * (entry.direction === "CREDIT" ? 1n : -1n);
      if (balance < 0n || balance !== BigInt(entry.balanceAfter) || entry.walletVersion <= lastVersion || entry.walletVersion > user.walletVersion) {
        throw new ApiError("CONFLICT", "Ledger sequence does not reconcile");
      }
      lastVersion = entry.walletVersion;
    }
    if (balance !== BigInt(user.walletBalance)) throw new ApiError("CONFLICT", "Wallet cache does not reconcile");
    const pending = await models.Withdrawal.find({ userId, status: "PENDING" }).select("amount").session(session);
    const reservedBalance = sum(pending.map((row) => row.amount));
    const balanceNumber = safeNumber(balance);
    if (reservedBalance > balanceNumber) throw new ApiError("CONFLICT", "Wallet reservations do not reconcile");
    return { balance: balanceNumber, reservedBalance, availableBalance: balanceNumber - reservedBalance };
  }

  async function lock(userId, session) {
    requireSession(session);
    const user = await models.User.findById(userId).session(session);
    if (!user) throw new ApiError("NOT_FOUND", "Wallet owner not found");
    integer(user.walletVersion + 1, "walletVersion");
    const locked = await models.User.findOneAndUpdate(
      { _id: userId, walletVersion: user.walletVersion },
      { $inc: { walletVersion: 1 } }, { session, new: true, runValidators: true }
    );
    if (!locked) throw new ApiError("CONFLICT", "Wallet changed concurrently");
    return locked;
  }

  async function post(input, session) {
    requireSession(session);
    const { userId, type, direction, amount, refType, refId, gatewayOrderId, gatewayPaymentId } = input;
    integer(amount, "amount", 1);
    const cause = causes[type];
    if (!cause || cause[0] !== direction || cause[1] !== refType || typeof refId !== "string" || !refId) {
      throw new ApiError("VALIDATION_ERROR", "Invalid ledger cause");
    }
    if (type !== "TOPUP" && !/^[0-9a-f]{24}$/i.test(refId)) {
      throw new ApiError("VALIDATION_ERROR", "Domain ledger references must be ObjectIds");
    }
    if (type === "TOPUP") {
      if (typeof gatewayOrderId !== "string" || typeof gatewayPaymentId !== "string" ||
          !gatewayOrderId || !gatewayPaymentId || gatewayOrderId !== refId) throw new ApiError("VALIDATION_ERROR", "Top-up identifiers are required");
    } else if (gatewayOrderId !== undefined || gatewayPaymentId !== undefined) {
      throw new ApiError("VALIDATION_ERROR", "Gateway identifiers are top-up only");
    }
    const user = await lock(userId, session);
    const wallet = await read(userId, session);
    if (direction === "DEBIT" && wallet.availableBalance < amount) {
      throw new ApiError("INSUFFICIENT_BALANCE", "Available wallet balance is insufficient", [
        { field: "availableBalance", message: "Available paise", value: wallet.availableBalance },
        { field: "requiredAmount", message: "Required paise", value: amount }
      ]);
    }
    const balanceAfter = direction === "CREDIT" ? sum([wallet.balance, amount]) : wallet.balance - amount;
    await models.User.updateOne({ _id: userId, walletVersion: user.walletVersion },
      { $set: { walletBalance: balanceAfter } }, { session, runValidators: true });
    const [transaction] = await models.Transaction.create([{
      userId, type, direction, amount, balanceAfter, walletVersion: user.walletVersion,
      refType, refId, ...(gatewayOrderId ? { gatewayOrderId, gatewayPaymentId } : {})
    }], { session });
    return transaction;
  }
  async function list(userId, query) {
    const user = await requireActor(models, userId);
    if (query.userId && user.role !== "ADMIN") throw new ApiError("FORBIDDEN", "Only ADMIN may select another user");
    return pageOf(models.Transaction, {
      ...(user.role === "ADMIN" ? query.userId ? { userId: query.userId } : {} : { userId }),
      ...(query.type ? { type: query.type } : {}), ...(query.direction ? { direction: query.direction } : {}),
      ...dateRange(query)
    }, query, transactionDTO);
  }
  return { read, lock, post, list };
}
