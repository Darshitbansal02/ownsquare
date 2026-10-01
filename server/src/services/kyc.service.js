import mongoose from 'mongoose';
import { User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { ROLES, KYC_STATUS } from '../../shared/constants.js';
import { ERROR_CODES } from '../../shared/errorCodes.js';

export class KycService {
  /**
   * POST /kyc
   * Investor submits dummy ID document and selfie for verification.
   */
  async submitKyc(userId, data) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw ApiError.badRequest('Invalid user ID', ERROR_CODES.VALIDATION_ERROR);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found', ERROR_CODES.NOT_FOUND);
    }

    if (user.role !== ROLES.INVESTOR) {
      throw ApiError.forbidden('Only investors can submit KYC', ERROR_CODES.FORBIDDEN);
    }

    if (user.kyc?.status === KYC_STATUS.PENDING || user.kyc?.status === KYC_STATUS.APPROVED) {
      throw ApiError.conflict('KYC has already been submitted or approved', ERROR_CODES.KYC_ALREADY_SUBMITTED);
    }

    user.kyc = {
      status: KYC_STATUS.PENDING,
      docs: data.docs,
      selfie: data.selfie,
      reason: null,
      reviewedBy: null,
      reviewedAt: null
    };

    await user.save();

    return {
      status: user.kyc.status,
      docs: user.kyc.docs,
      selfie: user.kyc.selfie,
      reason: user.kyc.reason
    };
  }

  /**
   * PATCH /admin/kyc/:userId
   * Admin approves or rejects pending investor KYC with mandatory reason if rejected.
   */
  async reviewKyc(userId, data, adminId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw ApiError.badRequest('Invalid user ID', ERROR_CODES.VALIDATION_ERROR);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found', ERROR_CODES.NOT_FOUND);
    }

    if (user.role !== ROLES.INVESTOR) {
      throw ApiError.badRequest('KYC review is only applicable for investor accounts', ERROR_CODES.VALIDATION_ERROR);
    }

    if (user.kyc?.status !== KYC_STATUS.PENDING) {
      throw ApiError.conflict('KYC review is only permitted for submissions in PENDING status', ERROR_CODES.INVALID_KYC_STATUS);
    }

    user.kyc.status = data.status;
    user.kyc.reason = data.status === KYC_STATUS.REJECTED ? data.reason : null;
    user.kyc.reviewedBy = adminId;
    user.kyc.reviewedAt = new Date();

    await user.save();

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      brokerApproved: user.brokerApproved,
      kyc: user.kyc,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
}

export const kycService = new KycService();
