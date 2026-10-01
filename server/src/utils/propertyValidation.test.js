import { describe, expect, it } from "vitest";
import { validatePropertyFinancials, validatePropertySubmission } from "./propertyValidation.js";

describe("shared draft financial validation", () => {
  it("keeps partial drafts and derives complete whole-rupee financials", () => {
    expect(validatePropertyFinancials({ valuation: 1000 })).toEqual({ valuation: 1000 });
    expect(validatePropertyFinancials({ valuation: 1000, totalUnits: 10 })).toEqual({
      valuation: 1000, totalUnits: 10, unitPrice: 100, minUnits: 1
    });
  });
  it("rejects incompatible caps and incomplete submission", () => {
    expect(() => validatePropertyFinancials({ valuation: 1000, totalUnits: 10, maxUnitsPerInvestor: 11 })).toThrow();
    expect(() => validatePropertySubmission({ images: [], documents: [] })).toThrow();
  });
});
