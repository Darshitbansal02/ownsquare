import ApiError from '../utils/ApiError.js';
import { ROLES } from '../../../shared/constants.js';
export const requireRole = (...roles) => (req,res,next) => {
  if (!req.user) throw new ApiError('UNAUTHORIZED','Sign in to continue');
  if (!roles.includes(req.user.role)) throw new ApiError('FORBIDDEN','You do not have access to this action');
  next();
};
export const requireApprovedBroker = (req,res,next) => {
  if (req.user.role === ROLES.BROKER && !req.user.brokerApproved) throw new ApiError('BROKER_NOT_APPROVED','Admin approval is required before listing');
  next();
};
