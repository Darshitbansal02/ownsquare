import mongoose from "mongoose";
import { WITHDRAWAL_STATUS } from "../../../shared/constants.js";
import { count, enumField, options, ref, text } from "./helpers.js";

export const bankSchema = new mongoose.Schema({
  accountHolder: text(2, 100, true),
  accountNumber: { ...text(6, 20, true), match: /^\d{6,20}$/ },
  ifsc: { ...text(11, 11, true), match: /^[A-Z]{4}0[A-Z0-9]{6}$/ }
}, { _id: false, strict: "throw" });
export const withdrawalSchema = new mongoose.Schema({
  userId: ref("User", true), amount: count(1), status: enumField(WITHDRAWAL_STATUS, WITHDRAWAL_STATUS.PENDING),
  bankDetails: { type: bankSchema, required: true }, reason: text(1, 2000),
  processedBy: ref("User"), processedAt: { type: Date, default: null }
}, options);
withdrawalSchema.index({ status: 1, createdAt: 1 });
withdrawalSchema.index({ userId: 1, status: 1 });
