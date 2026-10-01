import express from 'express';
import { kycController } from '../controllers/kyc.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';
import { validate } from '../middlewares/validate.js';
import { submitKycSchema, reviewKycSchema } from '../validators/kyc.schema.js';
import { ROLES } from '../../shared/constants.js';

const router = express.Router();

// POST /api/v1/kyc - Investor submits dummy KYC
router.post(
  '/',
  authenticate,
  requireRole(ROLES.INVESTOR),
  validate(submitKycSchema),
  kycController.submitKyc
);

// PATCH /api/v1/admin/kyc/:userId - Admin approves or rejects KYC
router.patch(
  '/:userId',
  authenticate,
  requireRole(ROLES.ADMIN),
  validate(reviewKycSchema),
  kycController.reviewKyc
);

export default router;
