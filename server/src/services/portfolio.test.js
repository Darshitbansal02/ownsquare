import { describe, expect, it } from "vitest";
import { estimatedValue } from "./portfolio.service.js";

describe("noncash holding estimates", () => {
  it("uses 365.25-day years and rounds only the displayed estimate", () => {
    const liveAt = new Date("2025-01-01T00:00:00.000Z");
    const now = new Date(liveAt.getTime() + 365.25 * 86400000);
    expect(estimatedValue(10000, 12, liveAt, now)).toBe(11200);
    expect(estimatedValue(10000, 12, liveAt, new Date("2024-01-01T00:00:00Z"))).toBe(10000);
  });
  it("rejects unsafe estimate outputs and missing dates", () => {
    expect(() => estimatedValue(Number.MAX_SAFE_INTEGER, 100, new Date("2025-01-01"), new Date("2030-01-01"))).toThrow();
    expect(() => estimatedValue(100, 12, null, new Date())).toThrow();
  });
});
