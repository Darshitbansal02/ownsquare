import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  tokenHash: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  family: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  usedAt: { type: Date, default: null },
  revokedAt: { type: Date, default: null },
  sessionVersion: { type: Number, required: true, validate: Number.isSafeInteger }
}, { timestamps: { createdAt: true, updatedAt: false }, strict: 'throw' });
schema.index({ tokenHash: 1 }, { unique: true });
schema.index({ userId: 1, family: 1 });
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export default mongoose.model('RefreshToken', schema);
