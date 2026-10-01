import { z } from 'zod';
import { PROPERTY_STATUS } from '../../../shared/constants.js';

export const rejectPropertySchema = z.object({
  body: z.object({
    reason: z.string().trim().min(1, 'Rejection reason is required').max(2000, 'Rejection reason cannot exceed 2000 characters')
  })
});

export const updatePropertyStatusSchema = z.object({
  body: z.object({
    status: z.enum([PROPERTY_STATUS.HOLDING, PROPERTY_STATUS.CANCELLED])
  })
});

export const payoutPreviewQuerySchema = z.object({
  query: z.object({
    salePrice: z.coerce.number().int().positive('Sale price must be a positive integer in paise').max(Number.MAX_SAFE_INTEGER)
  }).passthrough()
});

export const sellPropertySchema = z.object({
  body: z.object({
    salePrice: z.number().int().positive('Sale price must be a positive integer in paise').max(Number.MAX_SAFE_INTEGER),
    expectedPlatformFeePct: z.number().min(0).max(100)
  })
});

export const propertyInvestorsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.string().optional().default('-units')
  }).passthrough()
});
