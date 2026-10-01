import { v2 as cloudinary } from "cloudinary";
import { ApiError } from "../utils/ApiError.js";

export function createCloudinaryAdapter({ cloudName, apiKey, apiSecret }) {
  if (![cloudName, apiKey, apiSecret].every((value) => typeof value === "string" && value.trim())) {
    throw new ApiError("SERVICE_UNAVAILABLE", "Cloudinary configuration is required");
  }
  const credentials = { cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, timeout: 10000 };
  return {
    upload(buffer, options) {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ ...credentials, ...options },
          (error, result) => error ? reject(error) : resolve(result));
        stream.end(buffer);
      });
    },
    resource(publicId, options) {
      return cloudinary.api.resource(publicId, { ...credentials, ...options, context: true });
    },
    url(asset) {
      return cloudinary.url(asset.public_id, {
        ...credentials, secure: true, resource_type: asset.resource_type,
        type: asset.type, version: asset.version, sign_url: asset.type === "authenticated"
      });
    }
  };
}
