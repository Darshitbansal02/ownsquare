import { z } from 'zod';
import { ROLES, KYC_STATUS, WITHDRAWAL_STATUS, PROPERTY_STATUS } from '../../../shared/constants.js';

export const adminUsersQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.string().optional().default('-createdAt'),
    search: z.string().min(1).max(100).optional(),
    role: z.enum([ROLES.ADMIN, ROLES.BROKER, ROLES.INVESTOR]).optional(),
    isActive: z.enum(['true', 'false']).transform((val) => val === 'true').optional(),
    brokerApproved: z.enum(['true', 'false']).transform((val) => val === 'true').optional(),
    kycStatus: z.enum([
      KYC_STATUS.NOT_SUBMITTED,
      KYC_STATUS.PENDING,
      KYC_STATUS.APPROVED,
      KYC_STATUS.REJECTED
    ]).optional()
  }).passthrough()
});

export const updateUserSchema = z.object({
  body: z.object({
    isActive: z.boolean().optional(),
    role: z.enum([ROLES.ADMIN, ROLES.BROKER, ROLES.INVESTOR]).optional(),
    brokerApproved: z.boolean().optional()
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field (isActive, role, brokerApproved) must be provided'
  })
});

export const updateSettingsSchema = z.object({
  body: z.object({
    platformFeePct: z.number().min(0).max(100).refine((val) => Number(val.toFixed(2)) === val, {
      message: 'platformFeePct can have at most 2 decimal places'
    }).optional(),
    brokerCommissionPct: z.number().min(0).max(100).refine((val) => Number(val.toFixed(2)) === val, {
      message: 'brokerCommissionPct can have at most 2 decimal places'
    }).optional(),
    maxOwnershipPct: z.number().gt(0).max(100).refine((val) => Number(val.toFixed(2)) === val, {
      message: 'maxOwnershipPct must be > 0 and <= 100 with at most 2 decimal places'
    }).optional()
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one settings field must be provided'
  })
});

export const adminWithdrawalsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.string().optional().default('-createdAt'),
    status: z.enum([
      WITHDRAWAL_STATUS.PENDING,
      WITHDRAWAL_STATUS.APPROVED,
      WITHDRAWAL_STATUS.REJECTED
    ]).optional(),
    userId: z.string().optional(),
    from: z.string().datetime({ offset: true }).optional(),
    to: z.string().datetime({ offset: true }).optional()
  }).passthrough()
});

export const processWithdrawalSchema = z.object({
  body: z.object({
    status: z.enum([WITHDRAWAL_STATUS.APPROVED, WITHDRAWAL_STATUS.REJECTED]),
    reason: z.string().min(1, 'Reason is required when rejecting a withdrawal').max(1000).optional()
  }).refine((data) => {
    if (data.status === WITHDRAWAL_STATUS.REJECTED && (!data.reason || data.reason.trim() === '')) {
      return false;
    }
    return true;
  }, {
    message: 'Reason is required for rejection',
    path: ['reason']
  })
});

export const adminPropertiesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.string().optional().default('-createdAt'),
    search: z.string().min(1).max(100).optional(),
    status: z.enum([
      PROPERTY_STATUS.DRAFT,
      PROPERTY_STATUS.PENDING_APPROVAL,
      PROPERTY_STATUS.LIVE,
      PROPERTY_STATUS.FUNDED,
      PROPERTY_STATUS.HOLDING,
      PROPERTY_STATUS.SOLD,
      PROPERTY_STATUS.REJECTED,
      PROPERTY_STATUS.CANCELLED
    ]).optional(),
    brokerId: z.string().optional(),
    city: z.string().optional()
  }).passthrough()
});
