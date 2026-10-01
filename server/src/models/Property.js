import mongoose from "mongoose";
import { PROPERTY_STATUS, PROPERTY_TYPES } from "../../../shared/constants.js";
import { count, enumField, mediaSchema, options, ref, text } from "./helpers.js";
import { unitPrice } from "../utils/money.js";

const percent = { type: Number, min: 0, max: 100, default: null, validate: (value) => value === null || Number.isFinite(value) };
export const propertySchema = new mongoose.Schema({
  title: text(3, 150), description: text(20, 10000),
  type: { type: String, enum: Object.values(PROPERTY_TYPES), default: null },
  address: text(1, 300), city: text(1, 100), state: text(1, 100),
  pincode: { type: String, match: /^\d{6}$/, default: null },
  geo: {
    type: new mongoose.Schema({
      lat: { type: Number, required: true, min: -90, max: 90 },
      lng: { type: Number, required: true, min: -180, max: 180 }
    }, { _id: false, strict: "throw" }), default: null
  },
  areaSqft: { type: Number, default: null, validate: (value) => value === null || (Number.isFinite(value) && value > 0) },
  images: { type: [mediaSchema], default: [] }, documents: { type: [mediaSchema], default: [] },
  valuation: count(1, false), totalUnits: count(1, false), unitPrice: count(1, false),
  minUnits: count(1, false), maxUnitsPerInvestor: count(1, false), unitsSold: count(0, true, 0),
  expectedAppreciationPct: percent, rentalYieldPct: percent, holdingPeriodMonths: count(1, false),
  status: enumField(PROPERTY_STATUS, PROPERTY_STATUS.DRAFT), rejectionReason: text(1, 2000),
  brokerId: ref("User"), createdBy: ref("User", true), approvedBy: ref("User"),
  salePrice: count(1, false),
  liveAt: { type: Date, default: null }, fundedAt: { type: Date, default: null }, soldAt: { type: Date, default: null },
  version: count(0, true, 0)
}, options);
propertySchema.pre("validate", function () {
  if (this.valuation !== null && this.totalUnits !== null) {
    if (this.unitPrice !== unitPrice(this.valuation, this.totalUnits)) this.invalidate("unitPrice", "Unit price must match financials");
  }
  if (this.totalUnits !== null) {
    for (const field of ["unitsSold", "minUnits", "maxUnitsPerInvestor"]) {
      if (this[field] !== null && this[field] > this.totalUnits) this.invalidate(field, "Cannot exceed totalUnits");
    }
  }
});
propertySchema.index({ status: 1, createdAt: -1, _id: -1 });
propertySchema.index({ brokerId: 1, status: 1 });
propertySchema.index({ city: 1, type: 1, status: 1 });
propertySchema.index({ unitPrice: 1 });
