import mongoose from "mongoose";
import { INVESTMENT_STATUS, PROPERTY_STATUS } from "../../../shared/constants.js";
import { count, enumField, options, ref } from "./helpers.js";

const snapshotInvestment = new mongoose.Schema({
  _id: { type: String, required: true }, investorId: { type: String, required: true },
  propertyId: { type: String, required: true }, units: count(1), amount: count(1),
  status: enumField(INVESTMENT_STATUS), payoutAmount: count(),
  ownershipPct: { type: Number, required: true, min: 0, max: 100 },
  createdAt: { type: String, required: true }, updatedAt: { type: String, required: true }
}, { _id: false, strict: "throw" });
const snapshot = new mongoose.Schema({
  investment: { type: snapshotInvestment, required: true },
  property: {
    type: new mongoose.Schema({
      _id: { type: String, required: true }, unitsSold: count(),
      fundingPct: { type: Number, required: true, min: 0, max: 100 }, status: enumField(PROPERTY_STATUS)
    }, { _id: false, strict: "throw" }), required: true
  },
  walletBalance: count()
}, { _id: false, strict: "throw" });
export const investmentSchema = new mongoose.Schema({
  investorId: ref("User", true), propertyId: ref("Property", true),
  units: count(1), amount: count(1), status: enumField(INVESTMENT_STATUS, INVESTMENT_STATUS.ACTIVE),
  payoutAmount: count(0, true, 0),
  idempotencyKey: { type: String, required: true, immutable: true, match: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i },
  requestFingerprint: {
    type: new mongoose.Schema({ propertyId: ref("Property", true), units: count(1) }, { _id: false, strict: "throw" }),
    required: true, immutable: true
  },
  responseSnapshot: { type: snapshot, required: true, immutable: true }
}, options);
investmentSchema.index({ investorId: 1, propertyId: 1, status: 1 });
investmentSchema.index({ propertyId: 1, status: 1 });
investmentSchema.index({ investorId: 1, idempotencyKey: 1 }, { unique: true });
