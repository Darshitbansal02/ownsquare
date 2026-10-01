import bcrypt from 'bcrypt';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import {userDTO} from '../utils/dto.js';
import {revokeAllRefreshTokens} from './refreshToken.service.js';
export async function updateProfile(user,body) {
  const updated = await User.findOneAndUpdate({_id:user._id,isActive:true,sessionVersion:user.sessionVersion},{$set:body},{returnDocument:'after',runValidators:true});
  if (!updated) throw new ApiError('UNAUTHORIZED','Your session has changed');
  return userDTO(updated);
}
export async function changePassword(user,{currentPassword,password}) {
  const current = await User.findById(user._id).select('+passwordHash');
  if (!current || !(await bcrypt.compare(currentPassword,current.passwordHash))) throw new ApiError('INVALID_CREDENTIALS','Current password is incorrect');
  const passwordHash = await bcrypt.hash(password,12);
  const updated = await User.findOneAndUpdate({_id:user._id,isActive:true,sessionVersion:user.sessionVersion,passwordHash:current.passwordHash},{$set:{passwordHash,resetTokenHash:null,resetTokenExpiresAt:null},$inc:{sessionVersion:1}},{returnDocument:'after'});
  if (!updated) throw new ApiError('UNAUTHORIZED','Your session has changed. Sign in again');
  await revokeAllRefreshTokens(user._id);
  return {changed:true};
}
