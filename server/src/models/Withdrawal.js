import mongoose from 'mongoose';
import { WITHDRAWAL_STATUS } from '../../shared/constants.js';

const bankDetailsSchema = new mongoose.Schema(
  {
    accountHolder: { type: String, required: true },
    accountNumber: { type: String, required: true },
    ifsc: { type: String, required: true }
  },
  { _id: false }
);

const withdrawalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 1 }, // Integer paise
    status: {
      type: String,
      enum: Object.values(WITHDRAWAL_STATUS),
      default: WITHDRAWAL_STATUS.PENDING
    },
    bankDetails: { type: bankDetailsSchema, required: true },
    reason: { type: String, default: null },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    processedAt: { type: Date, default: null }
  },
  {
    timestamps: true
  }
);

withdrawalSchema.index({ status: 1, createdAt: 1 });
withdrawalSchema.index({ userId: 1, status: 1 });

export const Withdrawal = mongoose.models.Withdrawal || mongoose.model('Withdrawal', withdrawalSchema);
