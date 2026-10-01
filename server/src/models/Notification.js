import mongoose from "mongoose";
import { NOTIFICATION_TYPES } from "../../../shared/constants.js";
import { enumField, options, ref, text } from "./helpers.js";

export function isInternalLink(value) {
  return value === null || (typeof value === "string" &&
    /^\/(?:properties(?:\/[0-9a-f]{24})?|investor(?:\/(?:portfolio|wallet|kyc))?|broker(?:\/properties(?:\/[0-9a-f]{24})?)?|admin(?:\/(?:properties|users|kyc|withdrawals))?|notifications)$/.test(value));
}
export const notificationSchema = new mongoose.Schema({
  userId: ref("User", true), type: enumField(NOTIFICATION_TYPES),
  title: text(1, 150, true), body: text(1, 2000, true),
  link: { type: String, default: null, validate: isInternalLink },
  read: { type: Boolean, default: false, required: true }
}, options);
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
