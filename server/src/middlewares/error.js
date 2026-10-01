import { ApiError } from "../utils/ApiError.js";
import { isDatabaseUnavailable } from "../utils/transaction.js";

export function createErrorHandler(logger = console) {
  return (error, _req, res, _next) => {
    let safe = error;
    if (error.code === "LIMIT_FILE_SIZE") safe = new ApiError("UPLOAD_TOO_LARGE", "Files must not exceed 5 MB");
    else if (error.name === "MulterError") safe = new ApiError("VALIDATION_ERROR", "Invalid multipart upload");
    else if (error.type === "entity.parse.failed") safe = new ApiError("VALIDATION_ERROR", "Malformed JSON");
    else if (error.type === "entity.too.large") safe = new ApiError("VALIDATION_ERROR", "Request body is too large");
    else if (isDatabaseUnavailable(error)) safe = new ApiError("SERVICE_UNAVAILABLE", "Database operation unavailable");
    if (!(safe instanceof ApiError)) safe = new ApiError("INTERNAL_ERROR", "Unexpected server error");
    if (safe.status >= 500 || !(error instanceof ApiError)) {
      logger.error({ code: safe.code, category: error.name || "Error" }, "Request failed");
    }
    res.status(safe.status).json({
      success: false, error: { code: safe.code, message: safe.message, details: safe.details }
    });
  };
}
