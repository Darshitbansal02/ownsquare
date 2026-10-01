import { z } from 'zod';
import { KYC_STATUS } from '../../../shared/constants.js';

const mediaDTOSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  publicId: z.string().min(1, 'Public ID is required'),
  name: z.string().min(1, 'Document name is required')
});

export const submitKycSchema = z.object({
  body: z.object({
    docs: z.array(mediaDTOSchema).min(1, 'At least one identification document is required'),
    selfie: mediaDTOSchema
  })
});

export const reviewKycSchema = z.object({
  body: z.object({
    status: z.enum([KYC_STATUS.APPROVED, KYC_STATUS.REJECTED]),
    reason: z.string().trim().max(1000).optional()
  }).refine((data) => {
    if (data.status === KYC_STATUS.REJECTED && (!data.reason || data.reason.trim() === '')) {
      return false;
    }
    return true;
  }, {
    message: 'Rejection reason is required when rejecting KYC',
    path: ['reason']
  })
});
