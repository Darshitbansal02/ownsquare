import { ERROR_CODES } from "../../../shared/errorCodes.js";

export class ApiError extends Error {
  constructor(code, message, details = [], options) {
    super(message, options);
    if (!Object.hasOwn(ERROR_CODES, code)) throw new TypeError(`Unknown error code: ${code}`);
    this.code = code;
    this.status = ERROR_CODES[code];
    this.details = details;
  }
}

export function invalid(field, message) {
  return new ApiError("VALIDATION_ERROR", "Validation failed", [{ field, message }]);
}
