import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { openTestDatabase } from "../utils/testHarness.js";
import { createPortfolioService } from "./portfolio.service.js";
import { createPayoutService } from "./payout.service.js";
import { createInvestmentService } from "./investment.service.js";

let db;
let portfolio;
const liveAt = new Date("2025-01-01T00:00:00.000Z");
const now = new Date(liveAt.getTime() + 365.25 * 86400000);
beforeAll(async () => {
  db = await openTestDatabase(); await db.settings();
  portfolio = createPortfolioService({ ...db, clock: () => now });
});
afterAll(async () => { if (db) await db.close(); });

describe("portfolio with real financial history", () => {
  it("returns exact empty DTO with null ROI and wallet cash excluded from currentValue", async () => {
    const investor = await db.user();
    await db.credit(investor._id, 1000);
    expect(await portfolio.summary(investor._id)).toEqual({
      totalInvested: 0, currentValue: 0, totalPayouts: 0, overallRoiPct: null,
      wallet: { balance: 1000, reservedBalance: 0, availableBalance: 1000 }, holdings: [], allocation: []
    });
  });
  it("aggregates repeat purchases and keeps active estimates distinct from full refunds", async () => {
    const investor = await db.user();
    const admin = await db.user("ADMIN");
    await db.credit(investor._id, 10000);
    const active = await db.liveProperty({ title: "Active fixture", liveAt });
    const refund = await db.liveProperty({ title: "Refund fixture", liveAt });
    for (const units of [5, 5]) await db.investments.invest(investor._id, { propertyId: String(active._id), units }, randomUUID());
    await db.investments.invest(investor._id, { propertyId: String(refund._id), units: 5 }, randomUUID());
    await db.lifecycle.changeStatus(admin._id, refund._id, "CANCELLED");
    const result = await portfolio.summary(investor._id);
    expect(result.totalInvested).toBe(1500);
    expect(result.currentValue).toBe(1620);
    expect(result.totalPayouts).toBe(0);
    expect(result.wallet.balance).toBe(9000);
    expect(result.overallRoiPct).toBe(8);
    expect(result.allocation).toEqual([{ propertyId: String(active._id), title: "Active fixture", amount: 1000 }]);
    expect(result.holdings.find((row) => row.status === "ACTIVE")).toMatchObject({ units: 10, invested: 1000, estimatedValue: 1120, ownershipPct: 10 });
    expect(result.holdings.find((row) => row.status === "REFUNDED")).toMatchObject({ invested: 500, estimatedValue: 500, payoutAmount: 0, roiPct: 0 });
  });
  it("uses realized sale payouts, not projections, and isolates owners", async () => {
    const investor = await db.user();
    const stranger = await db.user();
    const admin = await db.user("ADMIN");
    await db.credit(investor._id, 300);
    const property = await db.liveProperty({ valuation: 300, totalUnits: 3, liveAt });
    const investments = createInvestmentService({ ...db, features: { ...db.features, ownershipCap: false } });
    await investments.invest(investor._id, { propertyId: String(property._id), units: 3 }, randomUUID());
    await db.lifecycle.changeStatus(admin._id, property._id, "HOLDING");
    await createPayoutService(db).execute(admin._id, property._id, { salePrice: 100, expectedPlatformFeePct: 2 });
    const result = await portfolio.summary(investor._id);
    expect(result.currentValue).toBe(98);
    expect(result.totalPayouts).toBe(98);
    expect(result.wallet.balance).toBe(98);
    expect(result.allocation).toEqual([]);
    expect(result.holdings[0].status).toBe("EXITED");
    expect(result.overallRoiPct).toBeCloseTo(-67.3333333333);
    expect((await portfolio.summary(stranger._id)).holdings).toEqual([]);
    await expect(portfolio.summary(admin._id)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
