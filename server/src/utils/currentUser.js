import User from '../models/User.js';
import ApiError from './ApiError.js';
export async function currentInvestor(user,session){const current=await User.findOne({_id:user._id,role:'INVESTOR',isActive:true,sessionVersion:user.sessionVersion}).session(session);if(!current)throw new ApiError('UNAUTHORIZED','Investor session has changed');return current;}
