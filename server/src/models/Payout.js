import mongoose from 'mongoose';

const payoutItemSchema = new mongoose.Schema(
  {
    investorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    units: { type: Number, required: true, min: 1 },
    amount: { type: Number, required: true, min: 0 } // Integer paise
  },
  { _id: false }
);

const payoutSchema = new mongoose.Schema(
  {
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true, unique: true },
    salePrice: { type: Number, required: true, min: 1 }, // Integer paise
    platformFeePct: { type: Number, required: true, min: 0, max: 100 },
    platformFee: { type: Number, required: true, min: 0 },
    distributable: { type: Number, required: true, min: 0 },
    items: { type: [payoutItemSchema], default: [] },
    executedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    executedAt: { type: Date, required: true, default: Date.now }
  },
  {
    timestamps: true
  }
);

payoutSchema.index({ propertyId: 1 }, { unique: true });
payoutSchema.index({ executedAt: -1 });

export const Payout = mongoose.models.Payout || mongoose.model('Payout', payoutSchema);
