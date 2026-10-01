import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
export const authenticate = (env, {optional = false} = {}) => async (req,res,next) => {
  const header = req.get('authorization');
  if (!header && optional) return next();
  if (!/^Bearer [^\s]+$/.test(header ?? '')) throw new ApiError('UNAUTHORIZED','Sign in to continue');
  let claims;
  try { claims = jwt.verify(header.slice(7),env.JWT_SECRET,{algorithms:['HS256'],issuer:'ownsquare',audience:'ownsquare-web'}); } catch { throw new ApiError('UNAUTHORIZED','Your session has expired or been revoked'); }
  if (!/^[a-f0-9]{24}$/i.test(claims.sub ?? '') || !Number.isSafeInteger(claims.sessionVersion)) throw new ApiError('UNAUTHORIZED','Invalid session');
  const user = await User.findById(claims.sub);
  if (!user?.isActive || user.sessionVersion !== claims.sessionVersion) throw new ApiError('UNAUTHORIZED','Your session has expired or been revoked');
  req.user = user; next();
};
