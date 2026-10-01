import { describe, expect, it } from "vitest";
import { allocate, basisPoints, multiply, percentageFloor, sum, unitPrice } from "./money.js";
import { dateFilters, empty, listQuery, positiveInteger } from "../validators/common.schema.js";

describe("exact paise helpers", () => {
  it("matches source values with exact intermediates", () => {
    expect(unitPrice(1000000000, 1000)).toBe(1000000);
    expect(percentageFloor(1400000000, 2)).toBe(28000000);
    expect(percentageFloor(Number.MAX_SAFE_INTEGER, 0.01)).toBe(Number(BigInt(Number.MAX_SAFE_INTEGER) / 10000n));
    expect(basisPoints(1.01)).toBe(101);
  });
  it("assigns all remainder to largest holder with deterministic ties", () => {
    expect(allocate(101, [{ id: "b", units: 2 }, { id: "a", units: 1 }], 3)).toEqual({
      items: [{ id: "b", units: 2, amount: 68 }, { id: "a", units: 1, amount: 33 }],
      remainder: 1, remainderId: "b"
    });
    expect(allocate(101, [{ id: "b", units: 1 }, { id: "a", units: 1 }], 2).items.map((row) => row.amount)).toEqual([50, 51]);
    expect(allocate(0, [{ id: "a", units: 1 }], 1).remainderId).toBeNull();
  });
  it("rejects unsafe money, fractional units, rate precision and whole-rupee violations", () => {
    for (const work of [
      () => multiply(Number.MAX_SAFE_INTEGER, 2), () => sum([Number.MAX_SAFE_INTEGER, 1]),
      () => unitPrice(100, 3), () => unitPrice(101, 1), () => basisPoints(1.001),
      () => basisPoints(NaN), () => allocate(10, [{ id: "a", units: 1.5 }], 2)
    ]) expect(work).toThrow();
  });
});

describe("strict request primitives", () => {
  it("rejects silent coercion, unknown keys and unsafe pagination", () => {
    expect(positiveInteger.safeParse("100").success).toBe(false);
    expect(empty.safeParse({ walletBalance: 1 }).success).toBe(false);
    const query = listQuery(["createdAt"]);
    expect(query.parse({})).toEqual({ page: 1, limit: 20, sort: "-createdAt" });
    for (const input of [{ page: "0" }, { limit: "101" }, { sort: "passwordHash" }, { page: String(Number.MAX_SAFE_INTEGER) }]) {
      expect(query.safeParse(input).success).toBe(false);
    }
  });
  it("compares UTC date instants rather than ISO strings with different precision", () => {
    const query = listQuery(["createdAt"], dateFilters);
    expect(query.safeParse({ from: "2026-10-01T00:00:00Z", to: "2026-10-01T00:00:00.100Z" }).success).toBe(true);
    expect(query.safeParse({ from: "2026-10-01T00:00:00.100Z", to: "2026-10-01T00:00:00Z" }).success).toBe(false);
  });
});
