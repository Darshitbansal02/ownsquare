import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { openTestDatabase } from "../utils/testHarness.js";
import { inTransaction } from "../utils/transaction.js";
import { createHmac, randomUUID } from "node:crypto";
import { createWithdrawalService } from "./withdrawal.service.js";

let db;
const bankDetails = { accountHolder: "Dummy Holder", accountNumber: "0000000000", ifsc: "TEST0000000" };
beforeAll(async () => { db = await openTestDatabase(); });
afterAll(async () => { if (db) await db.close(); });

describe("real replica-set ledger and wallet", () => {
  it("does not credit order creation; validates proof binding and concurrent duplicates", async () => {
    const investor = await db.user();
    const stranger = await db.user();
    const order = await db.wallet.order(investor._id, 12345);
    expect((await db.wallet.get(investor._id)).balance).toBe(0);
    const input = { gatewayOrderId: order.gatewayOrderId, ...order.checkout };
    await expect(db.wallet.verify(stranger._id, input)).rejects.toMatchObject({ code: "PAYMENT_VERIFICATION_FAILED" });
    await expect(db.wallet.verify(investor._id, { ...input, mockOrderToken: `x${input.mockOrderToken}` })).rejects.toMatchObject({ code: "PAYMENT_VERIFICATION_FAILED" });
    const results = await Promise.allSettled([db.wallet.verify(investor._id, input), db.wallet.verify(investor._id, input)]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.find((result) => result.status === "rejected").reason.code).toBe("DUPLICATE_PAYMENT");
    expect(await db.wallet.get(investor._id)).toEqual({ balance: 12345, reservedBalance: 0, availableBalance: 12345 });
    expect(await db.models.Transaction.countDocuments({ userId: investor._id })).toBe(1);
  });
  it("serializes reservations and debits, processes once, releases rejection", async () => {
    const investor = await db.user();
    const admin = await db.user("ADMIN");
    await db.credit(investor._id, 10000);
    const results = await Promise.allSettled([
      db.withdrawals.request(investor._id, { amount: 7000, bankDetails }),
      db.withdrawals.request(investor._id, { amount: 7000, bankDetails })
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.find((result) => result.status === "rejected").reason.code).toBe("INSUFFICIENT_BALANCE");
    expect(await db.wallet.get(investor._id)).toEqual({ balance: 10000, reservedBalance: 7000, availableBalance: 3000 });
    const withdrawal = results.find((result) => result.status === "fulfilled").value.withdrawal;
    const approvals = await Promise.allSettled([
      db.withdrawals.process(admin._id, withdrawal._id, { status: "APPROVED" }),
      db.withdrawals.process(admin._id, withdrawal._id, { status: "APPROVED" })
    ]);
    expect(approvals.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(approvals.find((result) => result.status === "rejected").reason.code).toBe("WITHDRAWAL_ALREADY_PROCESSED");
    const pending = await db.withdrawals.request(investor._id, { amount: 3000, bankDetails });
    await db.withdrawals.process(admin._id, pending.withdrawal._id, { status: "REJECTED", reason: "Dummy review" });
    expect(await db.wallet.get(investor._id)).toEqual({ balance: 3000, reservedBalance: 0, availableBalance: 3000 });
  });
  it("rolls back inserted ledger/cache/version and prevents ledger mutation", async () => {
    const investor = await db.user();
    await expect(inTransaction(db.connection, async (session) => {
      await db.ledger.post({ userId: investor._id, type: "TOPUP", direction: "CREDIT", amount: 100,
        refType: "TopupOrder", refId: "rollback", gatewayOrderId: "rollback", gatewayPaymentId: "rollback" }, session);
      throw new Error("Injected failure after ledger insertion");
    })).rejects.toThrow("Injected failure");
    expect((await db.wallet.get(investor._id)).balance).toBe(0);
    expect((await db.models.User.findById(investor._id)).walletVersion).toBe(0);
    const entry = await db.credit(investor._id, 100);
    await expect(db.models.Transaction.updateOne({ _id: entry._id }, { $set: { amount: 200 } })).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(db.models.Transaction.deleteOne({ _id: entry._id })).rejects.toMatchObject({ code: "CONFLICT" });
  });
  it("rechecks persisted actor status and detects unreconciled cache", async () => {
    const investor = await db.user();
    await db.models.User.updateOne({ _id: investor._id }, { $set: { isActive: false } });
    await expect(db.wallet.get(investor._id)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    const corrupted = await db.user();
    await db.models.User.updateOne({ _id: corrupted._id }, { $set: { walletBalance: 100 } });
    await expect(db.wallet.get(corrupted._id)).rejects.toMatchObject({ code: "CONFLICT" });
  });
  it("rejects expired/currency proofs and prevents distinct payment IDs crediting one order", async () => {
    const investor = await db.user();
    const order = await db.wallet.order(investor._id, 100);
    const original = JSON.parse(Buffer.from(order.checkout.mockOrderToken.split(".")[0], "base64url").toString("utf8"));
    const proofInput = (overrides = {}) => {
      const proof = { ...original, ...overrides };
      const payload = Buffer.from(JSON.stringify(proof)).toString("base64url");
      return { gatewayOrderId: proof.gatewayOrderId, gatewayPaymentId: proof.gatewayPaymentId,
        mockOrderToken: `${payload}.${createHmac("sha256", db.payment.secret).update(payload).digest("base64url")}` };
    };
    await expect(db.wallet.verify(investor._id, proofInput({ expiresAt: Date.now() - 1 }))).rejects.toMatchObject({ code: "PAYMENT_VERIFICATION_FAILED" });
    await expect(db.wallet.verify(investor._id, proofInput({ currency: "USD" }))).rejects.toMatchObject({ code: "PAYMENT_VERIFICATION_FAILED" });
    await db.wallet.verify(investor._id, proofInput());
    await expect(db.wallet.verify(investor._id, proofInput({ gatewayPaymentId: `mock_payment_${randomUUID()}` }))).rejects.toMatchObject({ code: "DUPLICATE_PAYMENT" });
    await expect(db.wallet.verify(investor._id, proofInput({ gatewayOrderId: `mock_order_${randomUUID()}` }))).rejects.toMatchObject({ code: "DUPLICATE_PAYMENT" });
    expect((await db.wallet.get(investor._id)).balance).toBe(100);
  });
  it("rolls withdrawal processing back after debit and preserves its reservation", async () => {
    const investor = await db.user();
    const admin = await db.user("ADMIN");
    await db.credit(investor._id, 1000);
    const pending = await db.withdrawals.request(investor._id, { amount: 700, bankDetails });
    const beforeVersion = (await db.models.User.findById(investor._id)).walletVersion;
    const service = createWithdrawalService({ ...db, ledger: {
      ...db.ledger, post: async (input, session) => {
        await db.ledger.post(input, session);
        throw new Error("Injected withdrawal debit failure");
      }
    } });
    await expect(service.process(admin._id, pending.withdrawal._id, { status: "APPROVED" })).rejects.toThrow("Injected withdrawal");
    expect(await db.wallet.get(investor._id)).toEqual({ balance: 1000, reservedBalance: 700, availableBalance: 300 });
    expect((await db.models.User.findById(investor._id)).walletVersion).toBe(beforeVersion);
    expect((await db.models.Withdrawal.findById(pending.withdrawal._id)).status).toBe("PENDING");
    expect(await db.models.Transaction.countDocuments({ userId: investor._id, type: "WITHDRAWAL" })).toBe(0);
  });
  it("filters ledger owners before pagination and refuses user overrides", async () => {
    const owner = await db.user();
    const other = await db.user();
    const admin = await db.user("ADMIN");
    await db.credit(owner._id, 100);
    await db.credit(other._id, 200);
    const query = { page: 1, limit: 20, sort: "-createdAt" };
    const owned = await db.ledger.list(owner._id, query);
    expect(owned.items).toHaveLength(1);
    expect(owned.items[0].userId).toBe(String(owner._id));
    expect(owned.items[0]).not.toHaveProperty("walletVersion");
    expect((await db.ledger.list(owner._id, { ...query, from: owned.items[0].createdAt })).total).toBe(1);
    expect((await db.ledger.list(owner._id, { ...query, to: owned.items[0].createdAt })).total).toBe(0);
    await expect(db.ledger.list(owner._id, { ...query, userId: String(other._id) })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect((await db.ledger.list(admin._id, { ...query, userId: String(other._id) })).items[0].amount).toBe(200);
    const empty = await db.ledger.list(owner._id, { ...query, page: 2 });
    expect(empty.items).toEqual([]);
    expect([empty.total, empty.totalPages]).toEqual([1, 1]);
  });
});
