import mongoose from 'mongoose';
import { INVESTMENT_STATUS } from '../../shared/constants.js';

const investmentSchema = new mongoose.Schema(
  {
    investorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    units: { type: Number, required: true, min: 1 },
    amount: { type: Number, required: true, min: 1 }, // Integer paise
    status: {
      type: String,
      enum: Object.values(INVESTMENT_STATUS),
      default: INVESTMENT_STATUS.ACTIVE
    },
    payoutAmount: { type: Number, default: 0, min: 0 },
    idempotencyKey: { type: String, required: true },
    requestFingerprint: {
      propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
      units: { type: Number }
    },
    responseSnapshot: { type: Object }
  },
  {
    timestamps: true
  }
);

investmentSchema.index({ investorId: 1, propertyId: 1, status: 1 });
investmentSchema.index({ propertyId: 1, status: 1 });
investmentSchema.index({ investorId: 1, idempotencyKey: 1 }, { unique: true });

export const Investment = mongoose.models.Investment || mongoose.model('Investment', investmentSchema);
