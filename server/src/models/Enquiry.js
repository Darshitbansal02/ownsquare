import mongoose from "mongoose";
import { ENQUIRY_STATUS } from "../../../shared/constants.js";
import { enumField, options, ref, text } from "./helpers.js";

const message = new mongoose.Schema({
  from: ref("User", true), text: text(1, 2000, true), at: { type: Date, required: true }
}, { _id: false, strict: "throw" });
export const enquirySchema = new mongoose.Schema({
  propertyId: ref("Property", true), investorId: ref("User", true), brokerId: ref("User", true),
  messages: { type: [message], required: true, validate: (value) => value.length > 0 },
  status: enumField(ENQUIRY_STATUS, ENQUIRY_STATUS.OPEN)
}, options);
enquirySchema.index({ investorId: 1, updatedAt: -1 });
enquirySchema.index({ brokerId: 1, propertyId: 1, updatedAt: -1 });
