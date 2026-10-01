import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { basisPoints, integer } from "../utils/money.js";

export const options = { timestamps: true, strict: "throw", strictQuery: true };
export const ref = (model, required = false) => ({
  type: mongoose.Schema.Types.ObjectId, ref: model, required, ...(required ? {} : { default: null })
});
export const text = (min, max, required = false) => ({
  type: String, trim: true, minlength: min, maxlength: max, required, ...(required ? {} : { default: null })
});
export const count = (minimum = 0, required = true, defaultValue) => ({
  type: Number, required, min: minimum,
  set(value) { return value === null && !required ? null : integer(value, "number", minimum); },
  validate: (value) => (value === null && !required) || Number.isSafeInteger(value),
  ...(defaultValue !== undefined ? { default: defaultValue } : required ? {} : { default: null })
});
export const rate = (defaultValue) => ({
  type: Number, required: true, default: defaultValue,
  validate(value) { basisPoints(value); return true; }
});
export const enumField = (values, defaultValue) => ({
  type: String, enum: Object.values(values), required: true, ...(defaultValue ? { default: defaultValue } : {})
});
export const mediaSchema = new mongoose.Schema({
  url: { ...text(1, 2048, true), match: /^https:\/\/[^/]+\/.+/ },
  publicId: text(1, 500, true), name: text(1, 255, true)
}, { _id: false, strict: "throw" });

export function appendOnly(schema) {
  for (const operation of ["updateOne", "updateMany", "findOneAndUpdate", "replaceOne", "findOneAndReplace", "deleteOne", "deleteMany", "findOneAndDelete"]) {
    schema.pre(operation, function () { throw new ApiError("CONFLICT", "Financial history is immutable"); });
  }
  schema.pre("save", function () {
    if (!this.isNew) throw new ApiError("CONFLICT", "Financial history is immutable");
  });
}
