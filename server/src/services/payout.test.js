import { describe, expect, it } from "vitest";
import { calculatePayout } from "./payout.service.js";

describe("exact payout calculation", () => {
  it("matches the source crore sale and ROI", () => {
    const payout = calculatePayout({ propertyId: "property", salePrice: 1400000000,
      platformFeePct: 2, totalUnits: 1000,
      holdings: [{ investorId: "Aman", units: 20 }, { investorId: "Priya", units: 50 },
        { investorId: "Karan", units: 400 }, { investorId: "Others", units: 530 }] });
    expect(payout.platformFee).toBe(28000000);
    expect(payout.distributable).toBe(1372000000);
    const amounts = Object.fromEntries(payout.items.map((row) => [row.investorId, row.amount]));
    expect(amounts.Aman).toBe(27440000);
    expect(amounts.Priya).toBe(68600000);
    expect(amounts.Karan).toBe(548800000);
    expect((amounts.Aman - 20000000) / 20000000 * 100).toBe(37.2);
    expect(payout.totalPayout + payout.platformFee).toBe(payout.salePrice);
  });
  it("retains zero shares and assigns a rounding remainder deterministically", () => {
    const payout = calculatePayout({ propertyId: "p", salePrice: 1, platformFeePct: 0, totalUnits: 3,
      holdings: [{ investorId: "a", units: 1 }, { investorId: "b", units: 2 }] });
    expect(payout.items).toEqual([{ investorId: "a", units: 1, amount: 0 }, { investorId: "b", units: 2, amount: 1 }]);
    expect(payout.remainder).toBe(1);
    expect(payout.remainderInvestorId).toBe("b");
  });
  it("supports loss sales and full fees, rejects inconsistent units and unsafe money", () => {
    const inputs = { propertyId: "p", salePrice: 100, platformFeePct: 100, totalUnits: 1, holdings: [{ investorId: "a", units: 1 }] };
    expect(calculatePayout(inputs).totalPayout).toBe(0);
    expect(() => calculatePayout({ ...inputs, totalUnits: 2 })).toThrow();
    expect(() => calculatePayout({ ...inputs, salePrice: Number.MAX_SAFE_INTEGER + 1 })).toThrow();
  });
});
