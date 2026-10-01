import mongoose from 'mongoose';
import Property from '../models/Property.js';
import {ROLES,PROPERTY_STATUS as S} from '../../../shared/constants.js';
import {describeProperty,deriveFinancials,assertCurrentCreator} from './property.service.js';
import ApiError from '../utils/ApiError.js';
import Investment from '../models/Investment.js';
import {inTransaction} from '../utils/transaction.js';
import {post} from './ledger.service.js';
import {postNotification} from './notification.service.js';
import {safeMoney} from '../utils/money.js';
import {propertyDTO} from '../utils/dto.js';

// All lifecycle transitions share the same property write guard as purchases.
export async function submitProperty(user,id,verifyMedia) {
  const initial = await Property.findOne({_id:id,...(user.role===ROLES.ADMIN ? {createdBy:user._id} : {brokerId:user._id})});
  if (!initial) throw new ApiError('NOT_FOUND','Property not found');
  await verifyMedia({images:initial.images,documents:initial.documents},user);
  let updated;
  await mongoose.connection.transaction(async session=>{
    await assertCurrentCreator(user,session);
    const p = await Property.findOne({_id:id,...(user.role===ROLES.ADMIN ? {createdBy:user._id} : {brokerId:user._id})}).session(session);
    if (!p) throw new ApiError('NOT_FOUND','Property not found');
    if (![S.DRAFT,S.REJECTED].includes(p.status)) throw new ApiError('INVALID_PROPERTY_STATUS','Only draft or rejected properties can be submitted');
    if (p.version!==initial.version) throw new ApiError('CONFLICT','Property changed during media verification. Reload and retry');
    const fields = ['title','description','type','address','city','state','pincode','areaSqft','valuation','totalUnits','minUnits','expectedAppreciationPct','rentalYieldPct','holdingPeriodMonths'];
    const details = fields.filter(k=>p[k]==null).map(field=>({field,message:'Required before submission'}));
    if (p.images.length<3) details.push({field:'images',message:'Upload at least three images'});
    if (details.length) throw new ApiError('VALIDATION_ERROR','Complete your listing before submitting',details);
    deriveFinancials(p.toObject());
    updated = await Property.findOneAndUpdate({_id:id,version:p.version,status:p.status},{$set:{status:S.PENDING_APPROVAL,rejectionReason:null},$inc:{version:1}},{session,returnDocument:'after',runValidators:true});
    if (!updated) throw new ApiError('CONFLICT','Property changed. Reload and retry');
  });
  return describeProperty(updated);
}
export const reviewProperty=(user,id,body,env)=>inTransaction(async session=>{
  const p=await Property.findById(id).session(session);
  if(!p)throw new ApiError('NOT_FOUND','Property not found');
  if(p.status!==S.PENDING_APPROVAL)throw new ApiError('INVALID_PROPERTY_STATUS','Only pending submissions can be reviewed');
  if(body.status===S.LIVE){
    const required=['title','description','type','address','city','state','pincode','areaSqft','valuation','totalUnits','minUnits','expectedAppreciationPct','rentalYieldPct','holdingPeriodMonths'];
    if(required.some(k=>p[k]==null)||p.images.length<3)throw new ApiError('VALIDATION_ERROR','Submission is incomplete');
    deriveFinancials(p.toObject());
  }
  const updated=await Property.findOneAndUpdate({_id:id,status:p.status,version:p.version},{$set:body.status===S.LIVE?{status:S.LIVE,approvedBy:user._id,liveAt:new Date(),rejectionReason:null}:{status:S.REJECTED,rejectionReason:body.reason},$inc:{version:1}},{session,returnDocument:'after'});
  if(!updated)throw new ApiError('CONFLICT','Property changed concurrently');
  if(env.NOTIFICATIONS_ENABLED&&p.brokerId)await postNotification({userId:p.brokerId,type:body.status===S.LIVE?'PROPERTY_APPROVED':'PROPERTY_REJECTED',title:body.status===S.LIVE?'Property approved':'Property rejected',body:body.reason??`${p.title} is now live.`,link:`/broker/properties/${id}`},session);
  return propertyDTO(updated);
});
export const changePropertyStatus=(id,status)=>inTransaction(async session=>{
  const p=await Property.findById(id).session(session);
  if(!p)throw new ApiError('NOT_FOUND','Property not found');
  const from=status===S.HOLDING?S.FUNDED:S.LIVE;
  if(p.status!==from)throw new ApiError('INVALID_PROPERTY_STATUS',`Only ${from} properties can become ${status}`);
  const updated=await Property.findOneAndUpdate({_id:id,status:from,version:p.version},{$set:{status,...(status===S.CANCELLED?{unitsSold:0}:{})},$inc:{version:1}},{session,returnDocument:'after'});
  if(!updated)throw new ApiError('CONFLICT','Property changed concurrently');
  let refundedAmount=0n,refundedInvestments=0;
  if(status===S.CANCELLED){
    const rows=await Investment.find({propertyId:id,status:'ACTIVE'}).sort({_id:1}).session(session);
    for(const row of rows){await post({userId:row.investorId,type:'REFUND',direction:'CREDIT',amount:row.amount,refType:'Investment',refId:row._id},session);row.status='REFUNDED';await row.save({session});refundedAmount+=BigInt(row.amount);refundedInvestments++;}
  }
  return {property:propertyDTO(updated),refundedAmount:safeMoney(refundedAmount),refundedInvestments};
});
