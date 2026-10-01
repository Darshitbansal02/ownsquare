import mongoose from 'mongoose';
import { PROPERTY_STATUS, PROPERTY_TYPES } from '../../shared/constants.js';

const mediaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    name: { type: String, required: true }
  },
  { _id: false }
);

const propertySchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 10000 },
    type: { type: String, enum: Object.values(PROPERTY_TYPES) },
    address: { type: String, trim: true, maxlength: 300 },
    city: { type: String, trim: true, maxlength: 100 },
    state: { type: String, trim: true, maxlength: 100 },
    pincode: { type: String, trim: true, maxlength: 6 },
    geo: {
      lat: { type: Number, min: -90, max: 90 },
      lng: { type: Number, min: -180, max: 180 }
    },
    areaSqft: { type: Number, min: 0 },
    images: { type: [mediaSchema], default: [] },
    documents: { type: [mediaSchema], default: [] },
    valuation: { type: Number, min: 0 }, // Integer paise
    totalUnits: { type: Number, min: 1 },
    unitPrice: { type: Number, min: 0 }, // Integer paise
    minUnits: { type: Number, default: 1, min: 1 },
    maxUnitsPerInvestor: { type: Number, default: null },
    unitsSold: { type: Number, default: 0, min: 0 },
    expectedAppreciationPct: { type: Number, min: 0, max: 100 },
    rentalYieldPct: { type: Number, min: 0, max: 100 },
    holdingPeriodMonths: { type: Number, min: 1 },
    status: {
      type: String,
      enum: Object.values(PROPERTY_STATUS),
      default: PROPERTY_STATUS.DRAFT
    },
    rejectionReason: { type: String, default: null },
    brokerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    salePrice: { type: Number, default: null }, // Integer paise
    liveAt: { type: Date, default: null },
    fundedAt: { type: Date, default: null },
    soldAt: { type: Date, default: null },
    version: { type: Number, default: 0 }
  },
  {
    timestamps: true
  }
);

propertySchema.index({ status: 1, createdAt: -1, _id: -1 });
propertySchema.index({ brokerId: 1, status: 1 });
propertySchema.index({ city: 1, type: 1, status: 1 });
propertySchema.index({ unitPrice: 1 });

export const Property = mongoose.models.Property || mongoose.model('Property', propertySchema);
