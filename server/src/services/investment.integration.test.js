import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { openTestDatabase } from "../utils/testHarness.js";
import { createInvestmentService } from "./investment.service.js";
import { createPropertyLifecycleService } from "./propertyLifecycle.service.js";
import { inTransaction } from "../utils/transaction.js";

let db;
beforeAll(async () => { db = await openTestDatabase(); await db.settings(); });
afterAll(async () => { if (db) await db.close(); });
const buy = (user, property, units, key = randomUUID()) => db.investments.invest(user._id, { propertyId: String(property._id), units }, key);
async function fundedInvestor(amount = 10000) {
  const investor = await db.user();
  await db.credit(investor._id, amount);
  return investor;
}

describe("atomic real-MongoDB investments", () => {
  it("repeats final-10-unit races with one purchase and exactly one commission", async () => {
    for (let round = 0; round < 5; round += 1) {
      const broker = await db.user("BROKER");
      const property = await db.liveProperty({ brokerId: broker._id, createdBy: broker._id });
      await buy(await fundedInvestor(), property, 45);
      await buy(await fundedInvestor(), property, 45);
      const first = await fundedInvestor();
      const second = await fundedInvestor();
      let release;
      const barrier = new Promise((resolve) => { release = resolve; });
      const calls = [first, second].map(async (user) => { await barrier; return buy(user, property, 10); });
      release();
      const results = await Promise.allSettled(calls);
      expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
      const failure = results.find((result) => result.status === "rejected").reason;
      expect(failure).toMatchObject({ code: "INSUFFICIENT_UNITS", status: 409 });
      expect(failure.details).toContainEqual({ field: "remainingUnits", message: "Current availability", value: 0 });
      const current = await db.models.Property.findById(property._id);
      expect(current.unitsSold).toBe(100);
      expect(current.status).toBe("FUNDED");
      expect(await db.models.Investment.countDocuments({ propertyId: property._id })).toBe(3);
      expect(await db.models.Transaction.countDocuments({ refId: String(property._id), type: "COMMISSION" })).toBe(1);
      const balances = [(await db.wallet.get(first._id)).balance, (await db.wallet.get(second._id)).balance].sort((a, b) => a - b);
      expect(balances).toEqual([9000, 10000]);
      expect((await inTransaction(db.connection, (session) => db.ledger.read(broker._id, session))).balance).toBe(100);
      await expect(buy(await fundedInvestor(), property, 1)).rejects.toMatchObject({ code: "ALREADY_FUNDED" });
    }
  });
  it("prevents simultaneous spending across different properties", async () => {
    const investor = await fundedInvestor(1000);
    const properties = [await db.liveProperty(), await db.liveProperty()];
    const results = await Promise.allSettled(properties.map((property) => buy(investor, property, 8)));
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.find((result) => result.status === "rejected").reason.code).toBe("INSUFFICIENT_BALANCE");
    expect((await db.wallet.get(investor._id)).balance).toBe(200);
    expect(await db.models.Investment.countDocuments({ investorId: investor._id })).toBe(1);
    expect((await db.models.Property.find({ _id: { $in: properties.map((property) => property._id) } })).map((property) => property.unitsSold).sort()).toEqual([0, 8]);
  });
  it("replays concurrent same-key confirmation unchanged even after refunds", async () => {
    const investor = await fundedInvestor();
    const admin = await db.user("ADMIN");
    const property = await db.liveProperty();
    const key = randomUUID();
    const results = await Promise.all([buy(investor, property, 10, key), buy(investor, property, 10, key)]);
    expect(results.map((result) => result.replay).sort()).toEqual([false, true]);
    expect(results[0].data).toEqual(results[1].data);
    await expect(buy(investor, property, 11, key)).rejects.toMatchObject({ code: "IDEMPOTENCY_CONFLICT" });
    const refund = await db.lifecycle.changeStatus(admin._id, property._id, "CANCELLED");
    expect(refund.refundedAmount).toBe(1000);
    expect(refund.refundedInvestments).toBe(1);
    expect((await buy(investor, property, 10, key)).data).toEqual(results[0].data);
    expect((await db.wallet.get(investor._id)).balance).toBe(10000);
    await expect(db.lifecycle.changeStatus(admin._id, property._id, "CANCELLED")).rejects.toMatchObject({ code: "INVALID_PROPERTY_STATUS" });
    expect(await db.models.Transaction.countDocuments({ userId: investor._id, type: "REFUND" })).toBe(1);
  });
  it("rolls back inventory, debit and investment when posting fails after insertion", async () => {
    const investor = await fundedInvestor();
    const property = await db.liveProperty();
    const failing = createInvestmentService({ ...db, ledger: {
      ...db.ledger, post: async (input, session) => {
        await db.ledger.post(input, session);
        throw new Error("Injected failure after debit");
      }
    } });
    await expect(failing.invest(investor._id, { propertyId: String(property._id), units: 5 }, randomUUID())).rejects.toThrow("Injected failure");
    expect((await db.models.Property.findById(property._id)).unitsSold).toBe(0);
    expect((await db.wallet.get(investor._id)).balance).toBe(10000);
    expect(await db.models.Investment.countDocuments({ propertyId: property._id })).toBe(0);
  });
  it("enforces cumulative cap, KYC, minimum and withdrawal reservations", async () => {
    const investor = await fundedInvestor();
    const property = await db.liveProperty({ maxUnitsPerInvestor: 20 });
    await buy(investor, property, 15);
    await expect(buy(investor, property, 6)).rejects.toMatchObject({ code: "OWNERSHIP_LIMIT_EXCEEDED" });
    await db.models.User.updateOne({ _id: investor._id }, { $set: { "kyc.status": "PENDING" } });
    await expect(buy(investor, property, 1)).rejects.toMatchObject({ code: "KYC_REQUIRED" });
    const reserved = await fundedInvestor(1000);
    await db.withdrawals.request(reserved._id, { amount: 800,
      bankDetails: { accountHolder: "Dummy Holder", accountNumber: "0000000000", ifsc: "TEST0000000" } });
    await expect(buy(reserved, await db.liveProperty(), 3)).rejects.toMatchObject({ code: "INSUFFICIENT_BALANCE" });
  });
  it("serializes cancellation against a concurrent purchase without orphan debit", async () => {
    const investor = await fundedInvestor();
    const admin = await db.user("ADMIN");
    const property = await db.liveProperty();
    const results = await Promise.allSettled([
      buy(investor, property, 5), db.lifecycle.changeStatus(admin._id, property._id, "CANCELLED")
    ]);
    expect(results[1].status).toBe("fulfilled");
    expect((await db.models.Property.findById(property._id)).status).toBe("CANCELLED");
    expect((await db.wallet.get(investor._id)).balance).toBe(10000);
    expect(await db.models.Investment.countDocuments({ propertyId: property._id, status: "ACTIVE" })).toBe(0);
  });
  it("rolls back final investment, commission and events after a funding-event failure", async () => {
    const investor = await fundedInvestor();
    const broker = await db.user("BROKER");
    const property = await db.liveProperty({ brokerId: broker._id, createdBy: broker._id });
    const service = createInvestmentService({ ...db, features: { ...db.features, ownershipCap: false },
      notifications: { record: async (event, session) => {
        await db.notifications.record(event, session);
        throw new Error("Injected funding event failure");
      } } });
    await expect(service.invest(investor._id, { propertyId: String(property._id), units: 100 }, randomUUID())).rejects.toThrow("Injected funding");
    const current = await db.models.Property.findById(property._id);
    expect([current.status, current.unitsSold, current.fundedAt]).toEqual(["LIVE", 0, null]);
    expect((await db.wallet.get(investor._id)).balance).toBe(10000);
    expect(await db.models.Transaction.countDocuments({ userId: broker._id })).toBe(0);
    expect(await db.models.Investment.countDocuments({ propertyId: property._id })).toBe(0);
    expect(await db.models.Notification.countDocuments({ userId: investor._id })).toBe(0);
  });
  it("rolls back all refunds and cancellation if a refund posting fails", async () => {
    const investor = await fundedInvestor();
    const admin = await db.user("ADMIN");
    const property = await db.liveProperty();
    await buy(investor, property, 10);
    const service = createPropertyLifecycleService({ ...db, ledger: {
      ...db.ledger, post: async (input, session) => {
        await db.ledger.post(input, session);
        throw new Error("Injected refund failure");
      }
    } });
    await expect(service.changeStatus(admin._id, property._id, "CANCELLED")).rejects.toThrow("Injected refund");
    expect((await db.models.Property.findById(property._id)).status).toBe("LIVE");
    expect((await db.wallet.get(investor._id)).balance).toBe(9000);
    expect(await db.models.Investment.countDocuments({ propertyId: property._id, status: "ACTIVE" })).toBe(1);
    expect(await db.models.Transaction.countDocuments({ userId: investor._id, type: "REFUND" })).toBe(0);
  });
  it("serializes repeated-owner purchases across a cumulative cap", async () => {
    const investor = await fundedInvestor();
    const property = await db.liveProperty({ maxUnitsPerInvestor: 20 });
    const results = await Promise.allSettled([buy(investor, property, 15), buy(investor, property, 15)]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.find((result) => result.status === "rejected").reason.code).toBe("OWNERSHIP_LIMIT_EXCEEDED");
    expect((await db.models.Property.findById(property._id)).unitsSold).toBe(15);
  });
});
