import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../../shared/errorCodes.js';

/**
 * Validation middleware supporting Zod or schema functions
 */
export const validate = (schema) => (req, res, next) => {
  try {
    if (!schema) return next();

    // If it's a Zod schema
    if (schema.parse) {
      const parsed = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
        headers: req.headers
      });

      if (!parsed.success) {
        const details = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.').replace(/^(body|query|params|headers)\./, ''),
          message: issue.message,
          value: issue.received
        }));
        return next(
          new ApiError(400, ERROR_CODES.VALIDATION_ERROR, 'Request validation failed', details)
        );
      }

      if (parsed.data.body) req.body = parsed.data.body;
      if (parsed.data.query) req.query = parsed.data.query;
      if (parsed.data.params) req.params = parsed.data.params;
      return next();
    }

    // Fallback if manual validator function
    if (typeof schema === 'function') {
      const result = schema(req);
      if (result && result.error) {
        return next(
          new ApiError(400, ERROR_CODES.VALIDATION_ERROR, result.error.message, result.error.details || [])
        );
      }
    }

    return next();
  } catch (err) {
    return next(err);
  }
};
