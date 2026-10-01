import User from '../models/User.js';
import {inTransaction} from '../utils/transaction.js';
import {postNotification} from './notification.service.js';
import {userDTO} from '../utils/dto.js';
import ApiError from '../utils/ApiError.js';
export async function submitKyc(user,body,uploads){
  body=await uploads.verifyKyc(body,user);
  const result=await User.findOneAndUpdate({_id:user._id,isActive:true,role:'INVESTOR',sessionVersion:user.sessionVersion,'kyc.status':{$in:['NOT_SUBMITTED','REJECTED']}},{$set:{kyc:{status:'PENDING',docs:body.docs,selfie:body.selfie,reason:null,reviewedBy:null,reviewedAt:null}}},{returnDocument:'after',runValidators:true});
  if(!result)throw new ApiError('KYC_ALREADY_SUBMITTED','KYC is already pending or approved, or the account changed');
  return {status:'PENDING',docs:await Promise.all(result.kyc.docs.map(a=>uploads.privateMedia(a))),selfie:await uploads.privateMedia(result.kyc.selfie),reason:null};
}
export const reviewKyc=(user,id,body,env)=>inTransaction(async session=>{
  const target=await User.findById(id).session(session);if(!target)throw new ApiError('NOT_FOUND','User not found');
  if(target.role!=='INVESTOR')throw new ApiError('VALIDATION_ERROR','Only investors submit KYC');
  if(target.kyc.status!=='PENDING')throw new ApiError('INVALID_KYC_STATUS','Only pending KYC can be reviewed');
  target.kyc.status=body.status;target.kyc.reason=body.status==='REJECTED'?body.reason:null;target.kyc.reviewedBy=user._id;target.kyc.reviewedAt=new Date();await target.save({session});
  if(env.NOTIFICATIONS_ENABLED)await postNotification({userId:id,type:`KYC_${body.status}`,title:`KYC ${body.status.toLowerCase()}`,body:body.reason??'Your dummy KYC was approved.',link:'/investor/kyc'},session);
  return userDTO(target);
});
