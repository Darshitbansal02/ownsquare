import express from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';
import { validate } from '../middlewares/validate.js';
import {
  adminUsersQuerySchema,
  updateUserSchema,
  adminSettingsQuerySchema,
  updateSettingsSchema,
  adminWithdrawalsQuerySchema,
  processWithdrawalSchema,
  adminPropertiesQuerySchema
} from '../validators/admin.schema.js';
import { ROLES } from '../../shared/constants.js';

const router = express.Router();

// Enforce authentication and ADMIN role on all admin routes
router.use(authenticate, requireRole(ROLES.ADMIN));

router.get('/stats', adminController.getStats);
router.get('/users', validate(adminUsersQuerySchema), adminController.getUsers);
router.patch('/users/:id', validate(updateUserSchema), adminController.updateUser);
router.get('/settings', adminController.getSettings);
router.patch('/settings', validate(updateSettingsSchema), adminController.updateSettings);
router.get('/withdrawals', validate(adminWithdrawalsQuerySchema), adminController.getWithdrawals);
router.patch('/withdrawals/:id', validate(processWithdrawalSchema), adminController.processWithdrawal);
router.get('/properties', validate(adminPropertiesQuerySchema), adminController.getProperties);

export default router;
