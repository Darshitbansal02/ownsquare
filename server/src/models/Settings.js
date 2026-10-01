import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    singletonKey: { type: String, required: true, unique: true, default: 'platform' },
    platformFeePct: { type: Number, required: true, default: 2, min: 0, max: 100 },
    brokerCommissionPct: { type: Number, required: true, default: 1, min: 0, max: 100 },
    maxOwnershipPct: { type: Number, required: true, default: 49, min: 0.01, max: 100 },
    feeAccountUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  {
    timestamps: true
  }
);

export const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);
