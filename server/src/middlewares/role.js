import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../../shared/errorCodes.js';

export const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, ERROR_CODES.UNAUTHORIZED, 'Authentication required'));
  }

  if (!req.user.isActive) {
    return next(new ApiError(401, ERROR_CODES.UNAUTHORIZED, 'Account is deactivated'));
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(new ApiError(403, ERROR_CODES.FORBIDDEN, `Role ${req.user.role} is not authorized to access this resource`));
  }

  next();
};
