import { describe, it, expect, beforeEach, vi } from 'vitest';
import { adminService } from '../services/admin.service.js';
import { kycService } from '../services/kyc.service.js';
import { payoutService } from '../services/payout.service.js';
import { propertyLifecycleService } from '../services/propertyLifecycle.service.js';
import { ROLES, PROPERTY_STATUS, KYC_STATUS } from '../../shared/constants.js';
import { ERROR_CODES } from '../../shared/errorCodes.js';

describe('Admin Service & Lifecycle Test Suite (Darshit Ownership)', () => {
  it('should define adminService with required methods', () => {
    expect(typeof adminService.getPlatformStats).toBe('function');
    expect(typeof adminService.getUsers).toBe('function');
    expect(typeof adminService.updateUser).toBe('function');
    expect(typeof adminService.getSettings).toBe('function');
    expect(typeof adminService.updateSettings).toBe('function');
    expect(typeof adminService.getWithdrawals).toBe('function');
    expect(typeof adminService.processWithdrawal).toBe('function');
    expect(typeof adminService.getAdminProperties).toBe('function');
    expect(typeof adminService.getPropertyInvestors).toBe('function');
  });

  it('should define kycService with submitKyc and reviewKyc', () => {
    expect(typeof kycService.submitKyc).toBe('function');
    expect(typeof kycService.reviewKyc).toBe('function');
  });

  it('should define payoutService with previewPayout and executePayout', () => {
    expect(typeof payoutService.previewPayout).toBe('function');
    expect(typeof payoutService.executePayout).toBe('function');
  });

  it('should define propertyLifecycleService with approve, reject, and updateStatus', () => {
    expect(typeof propertyLifecycleService.approve).toBe('function');
    expect(typeof propertyLifecycleService.reject).toBe('function');
    expect(typeof propertyLifecycleService.updateStatus).toBe('function');
  });
});
