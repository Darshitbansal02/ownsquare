import { randomUUID } from "node:crypto";
import { fileTypeFromBuffer } from "file-type";
import { z } from "zod";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { requireActor, requireFeature } from "../utils/actors.js";
import { parse } from "../middlewares/validate.js";
import { media } from "../validators/common.schema.js";

const allowed = new Map([
  ["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"], ["application/pdf", "pdf"]
]);
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export async function detectFile(file) {
  if (!file || !Buffer.isBuffer(file.buffer)) throw new ApiError("VALIDATION_ERROR", "One file is required");
  if (file.buffer.length > MAX_UPLOAD_BYTES) throw new ApiError("UPLOAD_TOO_LARGE", "Files must not exceed 5 MB");
  let detected;
  try {
    detected = await fileTypeFromBuffer(file.buffer);
  } catch (error) {
    if (error.name !== "EndOfStreamError" && !(error instanceof RangeError)) throw error;
    throw new ApiError("UNSUPPORTED_MEDIA_TYPE", "File content is invalid");
  }
  if (!detected || !allowed.has(detected.mime) || file.mimetype !== detected.mime) {
    throw new ApiError("UNSUPPORTED_MEDIA_TYPE", "Only matching JPG, PNG, WebP or PDF content is permitted");
  }
  return { mime: detected.mime, extension: allowed.get(detected.mime), resourceType: detected.mime === "application/pdf" ? "raw" : "image" };
}

export function createUploadService({ models, features, mediaAdapter }) {
  if (!mediaAdapter || !["upload", "resource", "url"].every((key) => typeof mediaAdapter[key] === "function")) {
    throw new ApiError("SERVICE_UNAVAILABLE", "Cloudinary adapter is required");
  }
  async function upload(actorId, purpose, file) {
    if (!["property", "kyc"].includes(purpose)) throw new ApiError("VALIDATION_ERROR", "Invalid upload purpose");
    const actor = await requireActor(models, actorId, purpose === "property" ? ["ADMIN", "BROKER"] : ["INVESTOR"]);
    if (purpose === "property" && actor.role === "BROKER" && !actor.brokerApproved) {
      throw new ApiError("BROKER_NOT_APPROVED", "Broker approval required");
    }
    if (purpose === "kyc") requireFeature(features, "kyc");
    const detected = await detectFile(file);
    if (typeof file.originalname !== "string" || !file.originalname.trim()) throw new ApiError("VALIDATION_ERROR", "A file name is required");
    const name = file.originalname.split(/[\\/]/).at(-1).replace(/[^a-zA-Z0-9 ._-]/g, "_").trim().slice(0, 240);
    if (!name) throw new ApiError("VALIDATION_ERROR", "Invalid file name");
    const publicId = `ownsquare/${purpose}/${actor._id}/${randomUUID()}${detected.resourceType === "raw" ? ".pdf" : ""}`;
    let asset;
    try {
      asset = await mediaAdapter.upload(file.buffer, {
        public_id: publicId, resource_type: detected.resourceType,
        type: purpose === "kyc" ? "authenticated" : "upload", overwrite: false,
        context: { ownerId: String(actor._id), purpose, originalName: name, mimeType: detected.mime }
      });
    } catch (error) {
      throw new ApiError("SERVICE_UNAVAILABLE", "Media upload failed", [], { cause: error });
    }
    if (!asset || asset.public_id !== publicId || asset.type !== (purpose === "kyc" ? "authenticated" : "upload") ||
        asset.resource_type !== detected.resourceType || !Number.isSafeInteger(asset.version)) {
      throw new ApiError("SERVICE_UNAVAILABLE", "Media provider returned an invalid asset");
    }
    return parse(media, { url: mediaAdapter.url(asset), publicId, name });
  }
  async function verifyAttachments(ownerId, input, purpose, session) {
    if (!["property", "kyc"].includes(purpose)) throw new ApiError("VALIDATION_ERROR", "Invalid media purpose");
    if (purpose === "kyc") requireFeature(features, "kyc");
    const assets = parse(z.array(media), Array.isArray(input)
      ? input.map((item) => item instanceof mongoose.Document ? item.toObject() : item) : input);
    for (const item of assets) {
      if (!new RegExp(`^ownsquare/${purpose}/[0-9a-f]{24}/[0-9a-f-]{36}(?:\\.pdf)?$`).test(item.publicId)) {
        throw new ApiError("VALIDATION_ERROR", "Media must be a server-approved upload");
      }
      const resourceType = item.publicId.endsWith(".pdf") ? "raw" : "image";
      let asset;
      try {
        asset = await mediaAdapter.resource(item.publicId, {
          resource_type: resourceType, type: purpose === "kyc" ? "authenticated" : "upload"
        });
      } catch (error) {
        if (error.http_code === 404) throw new ApiError("VALIDATION_ERROR", "Uploaded asset not found");
        throw new ApiError("SERVICE_UNAVAILABLE", "Media verification failed", [], { cause: error });
      }
      const metadata = asset?.context?.custom;
      if (!metadata || metadata.purpose !== purpose || !/^[0-9a-f]{24}$/.test(metadata.ownerId) ||
          !item.publicId.startsWith(`ownsquare/${purpose}/${metadata.ownerId}/`)) {
        throw new ApiError("VALIDATION_ERROR", "Media ownership metadata is invalid");
      }
      if (metadata.ownerId !== String(ownerId)) {
        const adminAsset = purpose === "property" &&
          await models.User.exists({ _id: metadata.ownerId, role: "ADMIN" }).session(session || null);
        if (!adminAsset) throw new ApiError("VALIDATION_ERROR", "Media belongs to another owner");
      }
      if (asset.public_id !== item.publicId || asset.resource_type !== resourceType ||
          asset.type !== (purpose === "kyc" ? "authenticated" : "upload") ||
          !allowed.has(metadata.mimeType) || (metadata.mimeType === "application/pdf") !== (resourceType === "raw") ||
          metadata.originalName !== item.name || mediaAdapter.url(asset) !== item.url) {
        throw new ApiError("VALIDATION_ERROR", "Media does not match the approved asset");
      }
    }
  }
  return { upload, verifyAttachments };
}
