import express from 'express';
import { propertyAdminController } from '../controllers/propertyAdmin.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';
import { validate } from '../middlewares/validate.js';
import {
  rejectPropertySchema,
  updatePropertyStatusSchema,
  payoutPreviewQuerySchema,
  sellPropertySchema,
  propertyInvestorsQuerySchema
} from '../validators/propertyAdmin.schema.js';
import { ROLES } from '../../shared/constants.js';

const router = express.Router();

// Admin-only property lifecycle & sale management
router.post('/:id/approve', authenticate, requireRole(ROLES.ADMIN), propertyAdminController.approveProperty);
router.post('/:id/reject', authenticate, requireRole(ROLES.ADMIN), validate(rejectPropertySchema), propertyAdminController.rejectProperty);
router.post('/:id/status', authenticate, requireRole(ROLES.ADMIN), validate(updatePropertyStatusSchema), propertyAdminController.updateStatus);
router.get('/:id/payout-preview', authenticate, requireRole(ROLES.ADMIN), validate(payoutPreviewQuerySchema), propertyAdminController.getPayoutPreview);
router.post('/:id/sell', authenticate, requireRole(ROLES.ADMIN), validate(sellPropertySchema), propertyAdminController.sellProperty);

// Admin & owning Broker investor inspection
router.get(
  '/:id/investors',
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.BROKER),
  validate(propertyInvestorsQuerySchema),
  propertyAdminController.getPropertyInvestors
);

export default router;
