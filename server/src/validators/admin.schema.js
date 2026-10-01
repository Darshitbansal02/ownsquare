import { z } from "zod";
import { KYC_STATUS, PROPERTY_STATUS, ROLES, WITHDRAWAL_STATUS } from "../../../shared/constants.js";
import { basisPoints } from "../utils/money.js";
import { dateFilters, empty, idParams, listQuery, objectId, percentage } from "./common.schema.js";

const booleanish = z.enum(["true", "false"]).transform((value) => value === "true");

export const adminStatsQuery = { query: listQuery(["createdAt"], dateFilters) };

export const adminUsersQuery = {
  query: listQuery(["createdAt", "name"], {
    search: z.string().trim().min(1).max(100).optional(),
    role: z.enum(Object.values(ROLES)).optional(),
    isActive: booleanish.optional(),
    brokerApproved: booleanish.optional(),
    kycStatus: z.enum(Object.values(KYC_STATUS)).optional()
  })
};

export const adminUserUpdate = {
  params: idParams,
  body: z.object({
    isActive: z.boolean().optional(),
    role: z.enum(Object.values(ROLES)).optional(),
    brokerApproved: z.boolean().optional()
  }).strict().refine((data) => Object.keys(data).length > 0, { message: "At least one field is required" })
};

export const adminSettingsUpdate = {
  body: z.object({
    platformFeePct: percentage.optional(),
    brokerCommissionPct: percentage.optional(),
    // maxOwnershipPct must be strictly positive, so it needs its own range plus precision check.
    maxOwnershipPct: z.number().gt(0).max(100).refine((value) => {
      try { basisPoints(value, "maxOwnershipPct"); return true; } catch { return false; }
    }, "At most two decimal places are allowed").optional()
  }).strict().refine((data) => Object.keys(data).length > 0, { message: "At least one field is required" })
};

export const adminWithdrawalsQuery = {
  query: listQuery(["createdAt", "amount"], {
    status: z.enum(Object.values(WITHDRAWAL_STATUS)).optional(),
    userId: objectId.optional(), ...dateFilters
  })
};

export const adminWithdrawalReview = {
  params: idParams,
  body: z.object({
    status: z.enum([WITHDRAWAL_STATUS.APPROVED, WITHDRAWAL_STATUS.REJECTED]),
    reason: z.string().trim().min(1).max(2000).optional()
  }).strict().refine((data) => data.status !== WITHDRAWAL_STATUS.REJECTED || Boolean(data.reason),
    { message: "A reason is required when rejecting", path: ["reason"] })
};

export const adminPropertiesQuery = {
  query: listQuery(["createdAt", "title", "unitsSold"], {
    search: z.string().trim().min(1).max(100).optional(),
    status: z.enum(Object.values(PROPERTY_STATUS)).optional(),
    brokerId: objectId.optional(),
    city: z.string().trim().min(1).max(100).optional()
  })
};

export const adminPropertyApprove = { params: idParams, query: empty, body: empty };

export const adminPropertyReject = {
  params: idParams, query: empty,
  body: z.object({ reason: z.string().trim().min(1).max(2000) }).strict()
};

export const adminPropertyStatus = {
  params: idParams, query: empty,
  body: z.object({ status: z.enum([PROPERTY_STATUS.HOLDING, PROPERTY_STATUS.CANCELLED]) }).strict()
};

export const adminPayoutPreview = {
  params: idParams,
  query: z.object({ salePrice: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER) }).strict()
};

export const adminPropertySell = {
  params: idParams, query: empty,
  body: z.object({
    salePrice: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    expectedPlatformFeePct: percentage
  }).strict()
};

export const adminPropertyInvestors = {
  params: idParams,
  query: listQuery(["units", "createdAt"])
};
