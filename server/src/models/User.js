import mongoose from 'mongoose';
import { ROLES, KYC_STATUS } from '../../shared/constants.js';

const mediaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    name: { type: String, required: true }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.INVESTOR },
    isActive: { type: Boolean, default: true },
    brokerApproved: { type: Boolean, default: false },
    kyc: {
      status: { type: String, enum: Object.values(KYC_STATUS), default: KYC_STATUS.NOT_SUBMITTED },
      docs: { type: [mediaSchema], default: [] },
      selfie: { type: mediaSchema, default: null },
      reason: { type: String, default: null },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      reviewedAt: { type: Date, default: null }
    },
    walletBalance: { type: Number, default: 0, min: 0 }, // Integer paise
    walletVersion: { type: Number, default: 0 },
    sessionVersion: { type: Number, default: 0 },
    resetTokenHash: { type: String, default: null, select: false },
    resetTokenExpiresAt: { type: Date, default: null, select: false }
  },
  {
    timestamps: true
  }
);

userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ 'kyc.status': 1, createdAt: 1 });

export const User = mongoose.models.User || mongoose.model('User', userSchema);
