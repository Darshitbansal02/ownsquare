import mongoose from "mongoose";
import { KYC_STATUS, ROLES } from "../../../shared/constants.js";
import { count, enumField, mediaSchema, options, ref, text } from "./helpers.js";

const kyc = new mongoose.Schema({
  status: enumField(KYC_STATUS, KYC_STATUS.NOT_SUBMITTED),
  docs: { type: [mediaSchema], default: [] },
  selfie: { type: mediaSchema, default: null },
  reason: text(1, 2000), reviewedBy: ref("User"), reviewedAt: { type: Date, default: null }
}, { _id: false, strict: "throw" });

export const userSchema = new mongoose.Schema({
  name: text(2, 100, true),
  email: { ...text(3, 254, true), lowercase: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  phone: { ...text(10, 16, true), match: /^\+?\d{10,15}$/ },
  passwordHash: { type: String, required: true, select: false },
  role: enumField(ROLES), isActive: { type: Boolean, default: true, required: true },
  brokerApproved: { type: Boolean, default: false, required: true },
  kyc: { type: kyc, default: () => ({}) },
  walletBalance: count(0, true, 0), walletVersion: count(0, true, 0), sessionVersion: count(0, true, 0),
  resetTokenHash: { type: String, default: null, select: false },
  resetTokenExpiresAt: { type: Date, default: null, select: false }
}, options);
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ "kyc.status": 1, createdAt: 1 });
userSchema.index({ resetTokenHash: 1 }, { sparse: true });
