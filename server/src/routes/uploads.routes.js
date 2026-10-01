import multer from "multer";
import { ApiError } from "../utils/ApiError.js";
import { protectedRouter } from "../utils/http.js";
import { createRateLimit } from "../middlewares/rateLimit.js";
import { validate } from "../middlewares/validate.js";
import { uploadInput } from "../validators/uploads.schema.js";
import { createUploadsController } from "../controllers/uploads.controller.js";
import { MAX_UPLOAD_BYTES } from "../services/upload.service.js";

export function createMultipartParser() {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 1, parts: 2, fieldSize: 20, fieldNameSize: 30 }
  }).single("file");
}
export function createUploadsRouter({ services, authenticate, requireRole }) {
  const router = protectedRouter(authenticate, requireRole, ["ADMIN", "BROKER", "INVESTOR"]);
  // Media hosting is optional infrastructure. Without it, uploads fail honestly with 503
  // rather than the whole application refusing to start.
  if (!services.uploads) {
    router.post("/", (_req, _res, next) => next(new ApiError("SERVICE_UNAVAILABLE", "Media hosting is not configured")));
    return router;
  }
  router.post("/", createRateLimit(10), (req, _res, next) => {
    if (!req.is("multipart/form-data")) return next(new ApiError("UNSUPPORTED_MEDIA_TYPE", "Multipart upload required"));
    next();
  }, createMultipartParser(), validate(uploadInput), createUploadsController(services));
  return router;
}
