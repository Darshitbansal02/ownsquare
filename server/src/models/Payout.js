import mongoose from "mongoose";
import { appendOnly, count, options, rate, ref } from "./helpers.js";
import { sum } from "../utils/money.js";

const item = new mongoose.Schema({ investorId: ref("User", true), units: count(1), amount: count() }, { _id: false, strict: "throw" });
export const payoutSchema = new mongoose.Schema({
  propertyId: ref("Property", true), salePrice: count(1), platformFeePct: rate(),
  platformFee: count(), distributable: count(),
  items: { type: [item], required: true, validate: (value) => value.length > 0 },
  executedBy: ref("User", true), executedAt: { type: Date, required: true }
}, options);
payoutSchema.pre("validate", function () {
  if (sum(this.items.map((row) => row.amount)) !== this.distributable ||
      sum([this.platformFee, this.distributable]) !== this.salePrice) {
    this.invalidate("items", "Payout amounts must reconcile exactly");
  }
});
payoutSchema.index({ propertyId: 1 }, { unique: true });
payoutSchema.index({ executedAt: -1 });
appendOnly(payoutSchema);
