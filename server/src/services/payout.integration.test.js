import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { openTestDatabase } from "../utils/testHarness.js";
import { createInvestmentService } from "./investment.service.js";
import { createPayoutService } from "./payout.service.js";
import { createPortfolioService } from "./portfolio.service.js";

let db;
let payouts;
let settings;
beforeAll(async () => {
  db = await openTestDatabase();
  settings = await db.settings();
  payouts = createPayoutService(db);
});
afterAll(async () => { if (db) await db.close(); });

async function holding(units = [1, 2], price = 100, extra = {}) {
  const admin = await db.user("ADMIN");
  const property = await db.liveProperty({ ...extra, valuation: units.reduce((a, b) => a + b, 0) * price,
    totalUnits: units.reduce((a, b) => a + b, 0), unitPrice: price });
  const service = createInvestmentService({ ...db, features: { ...db.features, ownershipCap: false } });
  const investors = [];
  for (const count of units) {
    const investor = await db.user();
    await db.credit(investor._id, count * price);
    await service.invest(investor._id, { propertyId: String(property._id), units: count }, randomUUID());
    investors.push(investor);
  }
  await db.lifecycle.changeStatus(admin._id, property._id, "HOLDING");
  return { admin, property, investors, service };
}

describe("atomic payout execution on real MongoDB", () => {
  it("preview is read-only; concurrent/repeated sale credits only once", async () => {
    const { admin, property, investors } = await holding();
    const before = await db.models.Transaction.countDocuments();
    const preview = await payouts.preview(admin._id, property._id, 101);
    expect(await db.models.Transaction.countDocuments()).toBe(before);
    expect(preview.platformFee).toBe(2);
    expect(preview.totalPayout).toBe(99);
    const results = await Promise.allSettled([
      payouts.execute(admin._id, property._id, { salePrice: 101, expectedPlatformFeePct: 2 }),
      payouts.execute(admin._id, property._id, { salePrice: 101, expectedPlatformFeePct: 2 })
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.find((result) => result.status === "rejected").reason.code).toBe("ALREADY_SOLD");
    expect(await db.models.Payout.countDocuments({ propertyId: property._id })).toBe(1);
    expect((await db.wallet.get(investors[0]._id)).balance).toBe(33);
    expect((await db.wallet.get(investors[1]._id)).balance).toBe(66);
    const rows = await db.models.Investment.find({ propertyId: property._id });
    expect(rows.every((row) => row.status === "EXITED")).toBe(true);
    expect(rows.reduce((total, row) => total + row.payoutAmount, 0)).toBe(99);
    const result = results.find((item) => item.status === "fulfilled").value;
    expect(await db.models.Transaction.countDocuments({ type: "FEE", refId: result.payout._id })).toBe(1);
    await expect(payouts.execute(admin._id, property._id, { salePrice: 101, expectedPlatformFeePct: 2 })).rejects.toMatchObject({ code: "ALREADY_SOLD" });
  });
  it("rejects stale fees and rolls back every credit after a payout insertion failure", async () => {
    const { admin, property, investors } = await holding();
    await expect(payouts.execute(admin._id, property._id, { salePrice: 1000, expectedPlatformFeePct: 1 })).rejects.toMatchObject({ code: "PREVIEW_STALE" });
    const failing = createPayoutService({ ...db, ledger: {
      ...db.ledger, post: async (input, session) => {
        await db.ledger.post(input, session);
        throw new Error("Injected payout credit failure");
      }
    } });
    await expect(failing.execute(admin._id, property._id, { salePrice: 1000, expectedPlatformFeePct: 2 })).rejects.toThrow("Injected payout");
    expect(await db.models.Payout.countDocuments({ propertyId: property._id })).toBe(0);
    expect((await db.models.Property.findById(property._id)).status).toBe("HOLDING");
    expect((await db.wallet.get(investors[0]._id)).balance).toBe(0);
    expect((await db.wallet.get(investors[1]._id)).balance).toBe(0);
    expect(await db.models.Investment.countDocuments({ propertyId: property._id, status: "ACTIVE" })).toBe(2);
    await payouts.execute(admin._id, property._id, { salePrice: 1000, expectedPlatformFeePct: 2 });
  });
  it("aggregates repeat purchases and allocates row-level remainders exactly", async () => {
    const admin = await db.user("ADMIN");
    const property = await db.liveProperty({ valuation: 300, totalUnits: 3 });
    const investor = await db.user();
    await db.credit(investor._id, 300);
    const service = createInvestmentService({ ...db, features: { ...db.features, ownershipCap: false } });
    const initial = await service.invest(investor._id, { propertyId: String(property._id), units: 1 }, randomUUID());
    await service.invest(investor._id, { propertyId: String(property._id), units: 2 }, randomUUID());
    await db.lifecycle.changeStatus(admin._id, property._id, "HOLDING");
    const result = await payouts.execute(admin._id, property._id, { salePrice: 103, expectedPlatformFeePct: 2 });
    expect(result.payout.items).toHaveLength(1);
    expect(result.payout.items[0].amount).toBe(101);
    const rows = await db.models.Investment.find({ propertyId: property._id }).sort({ units: 1 });
    expect(rows.map((row) => row.payoutAmount)).toEqual([33, 68]);
    const replay = await service.invest(investor._id, { propertyId: String(property._id), units: 1 }, rows[0].idempotencyKey);
    expect(replay.data).toEqual(initial.data);
  });
  it("preserves zero-value payout items without zero ledger rows", async () => {
    const { admin, property, investors } = await holding();
    const result = await payouts.execute(admin._id, property._id, { salePrice: 1, expectedPlatformFeePct: 2 });
    expect(result.payout.items.map((row) => row.amount).sort()).toEqual([0, 1]);
    expect(await db.models.Transaction.countDocuments({ type: "PAYOUT", refId: result.payout._id })).toBe(1);
    expect(await db.models.Transaction.countDocuments({ type: "FEE", refId: result.payout._id })).toBe(0);
    const balances = await Promise.all(investors.map((investor) => db.wallet.get(investor._id)));
    expect(balances.reduce((total, wallet) => total + wallet.balance, 0)).toBe(1);
    expect(String(settings.feeAccountUserId)).toBeTruthy();
  });
  it("executes the full source crore example and reconciles all paise and commission", async () => {
    const broker = await db.user("BROKER");
    const { admin, property, investors } = await holding([20, 50, 400, 300, 230], 1000000, {
      brokerId: broker._id, createdBy: broker._id
    });
    const commission = await db.models.Transaction.findOne({ userId: broker._id, type: "COMMISSION", refId: String(property._id) });
    expect(commission.amount).toBe(10000000);
    const result = await payouts.execute(admin._id, property._id, { salePrice: 1400000000, expectedPlatformFeePct: 2 });
    expect(result.payout.platformFee).toBe(28000000);
    expect(result.payout.distributable).toBe(1372000000);
    expect((await db.wallet.get(investors[0]._id)).balance).toBe(27440000);
    expect((await db.wallet.get(investors[1]._id)).balance).toBe(68600000);
    expect((await db.wallet.get(investors[2]._id)).balance).toBe(548800000);
    expect((await createPortfolioService(db).summary(investors[0]._id)).overallRoiPct).toBe(37.2);
    const entries = await db.models.Transaction.find({ refId: result.payout._id });
    expect(entries.reduce((total, row) => total + row.amount, 0)).toBe(1400000000);
  });
  it("rolls back investor credits if the configured fee account is not an ADMIN", async () => {
    const { admin, property, investors } = await holding();
    const invalidAccount = await db.user();
    await db.models.Settings.updateOne({ _id: settings._id }, { $set: { feeAccountUserId: invalidAccount._id } });
    try {
      await expect(payouts.execute(admin._id, property._id, { salePrice: 1000, expectedPlatformFeePct: 2 })).rejects.toMatchObject({ code: "CONFLICT" });
      expect(await db.models.Payout.countDocuments({ propertyId: property._id })).toBe(0);
      expect((await db.models.Property.findById(property._id)).status).toBe("HOLDING");
      expect((await db.wallet.get(investors[0]._id)).balance).toBe(0);
      expect((await db.wallet.get(investors[1]._id)).balance).toBe(0);
    } finally {
      await db.models.Settings.updateOne({ _id: settings._id }, { $set: { feeAccountUserId: settings.feeAccountUserId } });
    }
  });
});
