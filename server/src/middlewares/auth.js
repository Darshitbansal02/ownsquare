import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../../shared/errorCodes.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new ApiError(401, ERROR_CODES.UNAUTHORIZED, 'Missing or malformed authorization header'));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next(new ApiError(401, ERROR_CODES.UNAUTHORIZED, 'Token not provided'));
    }

    const secret = process.env.JWT_SECRET || 'dev_jwt_secret_key_12345';
    try {
      const decoded = jwt.verify(token, secret);
      // Attach authenticated user context
      req.user = decoded;
      return next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new ApiError(401, ERROR_CODES.UNAUTHORIZED, 'Token has expired'));
      }
      return next(new ApiError(401, ERROR_CODES.UNAUTHORIZED, 'Invalid token'));
    }
  } catch (err) {
    return next(err);
  }
};
