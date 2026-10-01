import { ERROR_CODES } from '../../shared/errorCodes.js';

export class ApiError extends Error {
  constructor(statusCode, code, message, details = []) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || ERROR_CODES.INTERNAL_ERROR;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, code = ERROR_CODES.VALIDATION_ERROR, details = []) {
    return new ApiError(400, code, message, details);
  }

  static unauthorized(message = 'Authentication required', code = ERROR_CODES.UNAUTHORIZED) {
    return new ApiError(401, code, message);
  }

  static forbidden(message = 'Access forbidden', code = ERROR_CODES.FORBIDDEN) {
    return new ApiError(403, code, message);
  }

  static notFound(message = 'Resource not found', code = ERROR_CODES.NOT_FOUND) {
    return new ApiError(404, code, message);
  }

  static conflict(message, code = ERROR_CODES.CONFLICT, details = []) {
    return new ApiError(409, code, message, details);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, ERROR_CODES.INTERNAL_ERROR, message);
  }
}
