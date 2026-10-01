import { z } from "zod";
import { basisPoints } from "../utils/money.js";

export const objectId = z.string().regex(/^[0-9a-f]{24}$/i).transform((value) => value.toLowerCase());
export const positiveInteger = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
export const nonnegativeInteger = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const percentage = z.number().min(0).max(100).refine((value) => {
  try { basisPoints(value); return true; } catch { return false; }
}, "At most two decimal places are allowed");
export const empty = z.object({}).strict();
export const idParams = z.object({ id: objectId }).strict();
const queryInteger = (max) => z.string().regex(/^[1-9]\d*$/).transform(Number).pipe(z.number().int().positive().max(max));
const date = z.string().datetime({ offset: false });

export function listQuery(sortFields, filters = {}) {
  const sorts = sortFields.flatMap((field) => [field, `-${field}`]);
  return z.object({
    page: queryInteger(Number.MAX_SAFE_INTEGER).default("1"),
    limit: queryInteger(100).default("20"),
    sort: z.enum(sorts).default("-createdAt"),
    ...filters
  }).strict().superRefine((value, ctx) => {
    if (value.from && value.to && value.from >= value.to) ctx.addIssue({ code: "custom", path: ["to"], message: "Must be after from" });
    if (!Number.isSafeInteger((value.page - 1) * value.limit)) ctx.addIssue({ code: "custom", path: ["page"], message: "Page offset exceeds safe range" });
  });
}
export const dateFilters = { from: date.optional(), to: date.optional() };
export const bankDetails = z.object({
  accountHolder: z.string().trim().min(2).max(100),
  accountNumber: z.string().regex(/^\d{6,20}$/),
  ifsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/)
}).strict();
export const media = z.object({
  url: z.string().url().max(2048).startsWith("https://"),
  publicId: z.string().min(1).max(500), name: z.string().trim().min(1).max(255)
}).strict();
