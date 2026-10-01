import mongoose from "mongoose";
import { ref, text } from "./helpers.js";

export const refreshTokenSchema = new mongoose.Schema({
  // Only the SHA-256 digest is stored; the raw token exists only in the client cookie.
  tokenHash: text(64, 64, true),
  userId: ref("User", true),
  family: text(1, 64, true),
  expiresAt: { type: Date, required: true },
  usedAt: { type: Date, default: null },
  revokedAt: { type: Date, default: null },
  sessionVersion: { type: Number, required: true, validate: Number.isSafeInteger }
}, { timestamps: { createdAt: true, updatedAt: false }, strict: "throw" });

refreshTokenSchema.index({ tokenHash: 1 }, { unique: true });
refreshTokenSchema.index({ userId: 1, family: 1 });
// TTL index removes only the token document, never the user it belongs to.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
