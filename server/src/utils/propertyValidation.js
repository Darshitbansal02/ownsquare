import { z } from "zod";
import { PROPERTY_TYPES } from "../../../shared/constants.js";
import { parse } from "../middlewares/validate.js";
import { media, positiveInteger } from "../validators/common.schema.js";
import { unitPrice } from "./money.js";
import { invalid } from "./ApiError.js";

const submission = z.object({
  title: z.string().trim().min(3).max(150), description: z.string().trim().min(20).max(10000),
  type: z.enum(Object.values(PROPERTY_TYPES)), address: z.string().trim().min(1).max(300),
  city: z.string().trim().min(1).max(100), state: z.string().trim().min(1).max(100),
  pincode: z.string().regex(/^\d{6}$/), areaSqft: z.number().finite().positive(),
  images: z.array(media).min(3), documents: z.array(media),
  valuation: positiveInteger, totalUnits: positiveInteger, minUnits: positiveInteger,
  expectedAppreciationPct: z.number().finite().min(0).max(100),
  rentalYieldPct: z.number().finite().min(0).max(100), holdingPeriodMonths: positiveInteger
});

export function validatePropertyFinancials(fields) {
  const result = { ...fields };
  const supplied = (value) => value !== null && value !== undefined;
  for (const field of ["valuation", "totalUnits", "minUnits", "maxUnitsPerInvestor"]) {
    if (result[field] !== undefined && result[field] !== null) parse(positiveInteger, result[field]);
  }
  if (supplied(result.valuation) && supplied(result.totalUnits)) {
    result.unitPrice = unitPrice(result.valuation, result.totalUnits);
    if (!supplied(result.minUnits)) result.minUnits = 1;
  }
  if (supplied(result.totalUnits)) {
    for (const field of ["minUnits", "maxUnitsPerInvestor"]) {
      if (supplied(result[field]) && result[field] > result.totalUnits) throw invalid(field, "Cannot exceed totalUnits");
    }
  }
  return result;
}

export function validatePropertySubmission(property) {
  const plain = property.toObject ? property.toObject() : property;
  parse(submission, plain);
  const financials = validatePropertyFinancials(plain);
  if (plain.unitPrice !== financials.unitPrice) throw invalid("unitPrice", "Stored unit price does not reconcile");
  if (plain.unitsSold !== 0) throw invalid("unitsSold", "Unpublished property cannot have sold units");
}
