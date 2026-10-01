import mongoose from 'mongoose';
import { TRANSACTION_TYPES, TRANSACTION_DIRECTIONS } from '../../shared/constants.js';

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(TRANSACTION_TYPES), required: true },
    direction: { type: String, enum: Object.values(TRANSACTION_DIRECTIONS), required: true },
    amount: { type: Number, required: true, min: 1 }, // Integer paise
    balanceAfter: { type: Number, required: true, min: 0 }, // Integer paise
    walletVersion: { type: Number, required: true },
    refType: {
      type: String,
      enum: ['TopupOrder', 'Investment', 'Property', 'Payout', 'Withdrawal'],
      required: true
    },
    refId: { type: String, required: true },
    gatewayOrderId: { type: String, default: null },
    gatewayPaymentId: { type: String, default: null }
  },
  {
    timestamps: { createdAt: true, updatedAt: false } // Ledger is append-only
  }
);

transactionSchema.index({ userId: 1, createdAt: -1, _id: -1 });
transactionSchema.index({ userId: 1, walletVersion: 1 }, { unique: true });

export const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
