import mongoose from "mongoose";
import { TRANSACTION_DIRECTIONS, TRANSACTION_TYPES } from "../../../shared/constants.js";
import { appendOnly, count, enumField, ref, text } from "./helpers.js";

export const transactionSchema = new mongoose.Schema({
  userId: ref("User", true), type: enumField(TRANSACTION_TYPES), direction: enumField(TRANSACTION_DIRECTIONS),
  amount: count(1), balanceAfter: count(), walletVersion: count(1),
  refType: { type: String, required: true, enum: ["TopupOrder", "Investment", "Property", "Payout", "Withdrawal"] },
  refId: text(1, 500, true),
  gatewayOrderId: { type: String }, gatewayPaymentId: { type: String }
}, { timestamps: { createdAt: true, updatedAt: false }, strict: "throw" });
transactionSchema.index({ userId: 1, createdAt: -1, _id: -1 });
transactionSchema.index({ userId: 1, walletVersion: 1 }, { unique: true });
for (const key of ["gatewayPaymentId", "gatewayOrderId"]) {
  transactionSchema.index({ [key]: 1 }, { unique: true, partialFilterExpression: { [key]: { $type: "string" } } });
}
transactionSchema.index({ userId: 1, type: 1, refType: 1, refId: 1 }, { unique: true });
appendOnly(transactionSchema);
