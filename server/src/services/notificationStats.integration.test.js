import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { openTestDatabase } from "../utils/testHarness.js";
import { inTransaction } from "../utils/transaction.js";
import { createNotificationService } from "./notification.service.js";
import { createPublicStatsService } from "./publicStats.service.js";
import { createInvestmentService } from "./investment.service.js";
import { createPayoutService } from "./payout.service.js";
import { createBackendServices } from "../utils/backendServices.js";

let db;
beforeAll(async () => { db = await openTestDatabase(); await db.settings(); });
afterAll(async () => { if (db) await db.close(); });

describe("recipient notifications and public aggregates", () => {
  it("isolates reads and makes mark-read idempotent without duplicate records", async () => {
    const owner = await db.user();
    const other = await db.user();
    await inTransaction(db.connection, (session) => db.notifications.record({
      userId: owner._id, type: "KYC_APPROVED", title: "Dummy KYC approved",
      body: "Dummy document review completed", link: "/investor/kyc"
    }, session));
    const query = { page: 1, limit: 20, sort: "-createdAt" };
    const owned = await db.notifications.list(owner._id, query);
    expect(owned.total).toBe(1);
    expect((await db.notifications.list(other._id, query)).items).toEqual([]);
    await expect(db.notifications.markRead(other._id, owned.items[0]._id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect((await db.notifications.markRead(owner._id, owned.items[0]._id)).read).toBe(true);
    expect((await db.notifications.markRead(owner._id, owned.items[0]._id)).read).toBe(true);
    expect((await db.notifications.list(owner._id, { ...query, read: false })).totalPages).toBe(0);
    expect(await db.models.Notification.countDocuments({ userId: owner._id })).toBe(1);
  });
  it("rolls events back with the domain transaction and explicitly gates disabled reads", async () => {
    const investor = await db.user();
    await expect(inTransaction(db.connection, async (session) => {
      await db.notifications.record({ userId: investor._id, type: "KYC_APPROVED", title: "Dummy", body: "Dummy event" }, session);
      throw new Error("Injected event failure");
    })).rejects.toThrow("Injected event");
    expect(await db.models.Notification.countDocuments({ userId: investor._id })).toBe(0);
    const disabled = createNotificationService({ ...db, features: { ...db.features, notifications: false } });
    await inTransaction(db.connection, (session) => disabled.record({ userId: investor._id }, session));
    await expect(disabled.list(investor._id, { page: 1, limit: 20, sort: "-createdAt" })).rejects.toMatchObject({ code: "FEATURE_DISABLED" });
    expect(await db.models.Notification.countDocuments({ userId: investor._id })).toBe(0);
  });
  it("counts non-refunded principal including sold history and active registered investors", async () => {
    const stats = createPublicStatsService({ ...db, paymentProvider: "mock" });
    const starting = await stats.get();
    const investor = await db.user();
    const admin = await db.user("ADMIN");
    const active = await db.liveProperty();
    const refunded = await db.liveProperty();
    const sold = await db.liveProperty({ valuation: 100, totalUnits: 1 });
    await db.credit(investor._id, 1000);
    const service = createInvestmentService({ ...db, features: { ...db.features, ownershipCap: false } });
    for (const property of [active, refunded, sold]) {
      await service.invest(investor._id, { propertyId: String(property._id), units: 1 }, randomUUID());
    }
    await db.lifecycle.changeStatus(admin._id, refunded._id, "CANCELLED");
    await db.lifecycle.changeStatus(admin._id, sold._id, "HOLDING");
    await createPayoutService(db).execute(admin._id, sold._id, { salePrice: 120, expectedPlatformFeePct: 2 });
    const result = await stats.get();
    expect(result.totalRaised - starting.totalRaised).toBe(200);
    expect(result.investorCount - starting.investorCount).toBe(1);
    expect(Object.keys(result).sort()).toEqual(["features", "investorCount", "paymentProvider", "totalRaised"]);
    expect(result.features).toEqual(db.features);
    await db.models.User.updateOne({ _id: investor._id }, { $set: { isActive: false } });
    expect((await stats.get()).investorCount).toBe(starting.investorCount);
  });
  it("requires explicit capability/provider configuration, not silent defaults", () => {
    expect(() => createPublicStatsService({ ...db, features: {}, paymentProvider: "mock" })).toThrow("configuration");
    expect(() => createPublicStatsService({ ...db, paymentProvider: "razorpay" })).toThrow("mock provider only");
    const services = createBackendServices(db, {
      features: db.features, payment: { provider: "mock", secret: randomUUID() },
      mediaAdapter: {
        upload: async () => { throw new Error("Not used"); },
        resource: async () => { throw new Error("Not used"); },
        url: () => { throw new Error("Not used"); }
      }
    });
    expect(Object.keys(services).sort()).toEqual([
      "investments", "ledger", "lifecycle", "notifications", "payouts", "portfolio", "publicStats", "uploads", "wallet", "withdrawals"
    ]);
    expect(Object.isFrozen(services)).toBe(true);
  });
});
