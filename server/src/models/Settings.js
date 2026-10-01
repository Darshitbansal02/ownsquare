import mongoose from "mongoose";
import { options, rate, ref } from "./helpers.js";

export const settingsSchema = new mongoose.Schema({
  singletonKey: { type: String, enum: ["platform"], default: "platform", required: true, immutable: true },
  platformFeePct: rate(2), brokerCommissionPct: rate(1),
  maxOwnershipPct: { ...rate(49), min: 0.01 },
  feeAccountUserId: ref("User", true)
}, options);
settingsSchema.index({ singletonKey: 1 }, { unique: true });
