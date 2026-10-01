import mongoose from 'mongoose';
import User from '../models/User.js';
import Property from '../models/Property.js';
import Investment from '../models/Investment.js';
import {post} from './ledger.service.js';
import {settings} from './settings.service.js';
import {postNotification} from './notification.service.js';
import {inTransaction} from '../utils/transaction.js';
import {safeMoney,percentageFee,basisPoints} from '../utils/money.js';
import ApiError from '../utils/ApiError.js';
export const investmentDTO=i=>({_id:String(i._id),investorId:String(i.investorId),propertyId:String(i.propertyId),units:i.units,amount:i.amount,status:i.status,payoutAmount:i.payoutAmount,ownershipPct:i.ownershipPct,createdAt:i.createdAt,updatedAt:i.updatedAt});
const replay=(row,body)=>{if(String(row.requestFingerprint.propertyId)!==body.propertyId || row.requestFingerprint.units!==body.units)throw new ApiError('IDEMPOTENCY_CONFLICT','This key was used for a different investment');return {data:row.responseSnapshot,replayed:true};};
export async function invest(user,body,key,env) {
  const existing=await Investment.findOne({investorId:user._id,idempotencyKey:key});if(existing)return replay(existing,body);
  const initial=await Property.findById(body.propertyId);if(!initial)throw new ApiError('NOT_FOUND','Property not found');
  const id=new mongoose.Types.ObjectId(),now=new Date();
  try {return await inTransaction(async session=>{
    const previous=await Investment.findOne({investorId:user._id,idempotencyKey:key}).session(session);if(previous)return replay(previous,body);
    const current=await User.findOne({_id:user._id,isActive:true,role:'INVESTOR',sessionVersion:user.sessionVersion}).session(session);
    if(!current)throw new ApiError('UNAUTHORIZED','Your session has changed');
    if(env.KYC_ENABLED && current.kyc.status!=='APPROVED')throw new ApiError('KYC_REQUIRED','KYC approval is required before investing');
    const p=await Property.findById(body.propertyId).session(session);
    if(p.status!=='LIVE') {
      if(p.status==='FUNDED')throw new ApiError(initial.status==='LIVE' ? 'INSUFFICIENT_UNITS' : 'ALREADY_FUNDED','No units remain',[{field:'remainingUnits',message:'Current availability',value:p.totalUnits-p.unitsSold}]);
      throw new ApiError('INVALID_PROPERTY_STATUS','Only live properties accept investments');
    }
    if(body.units<p.minUnits)throw new ApiError('VALIDATION_ERROR','Units are below the minimum',[{field:'units',message:`Buy at least ${p.minUnits} units`}]);
    const remaining=p.totalUnits-p.unitsSold;
    if(body.units>remaining)throw new ApiError('INSUFFICIENT_UNITS','Not enough units remain',[{field:'remainingUnits',message:'Current availability',value:remaining}]);
    const config=await settings(session);
    if(env.OWNERSHIP_CAP_ENABLED) {
      const rows=await Investment.find({investorId:user._id,propertyId:p._id,status:'ACTIVE'}).select('units').session(session);
      const owned=rows.reduce((sum,i)=>sum+BigInt(i.units),0n);
      const cap=BigInt(p.totalUnits)*basisPoints(config.maxOwnershipPct)/10000n;
      const allowed=p.maxUnitsPerInvestor ? (cap<BigInt(p.maxUnitsPerInvestor) ? cap : BigInt(p.maxUnitsPerInvestor)) : cap;
      if(owned+BigInt(body.units)>allowed)throw new ApiError('OWNERSHIP_LIMIT_EXCEEDED','This purchase exceeds your ownership limit');
    }
    const amount=safeMoney(BigInt(body.units)*BigInt(p.unitPrice));
    const updated=await Property.findOneAndUpdate({_id:p._id,status:'LIVE',version:p.version,unitsSold:{$lte:p.totalUnits-body.units}},{$inc:{unitsSold:body.units,version:1}},{session,returnDocument:'after'});
    if(!updated)throw new ApiError('CONFLICT','Property changed concurrently');
    const debit=await post({userId:user._id,type:'INVESTMENT',direction:'DEBIT',amount,refType:'Investment',refId:id},session);
    if(updated.unitsSold===updated.totalUnits) {
      updated.status='FUNDED';updated.fundedAt=now;await updated.save({session});
      if(updated.brokerId){const commission=percentageFee(updated.valuation,config.brokerCommissionPct);if(commission)await post({userId:updated.brokerId,type:'COMMISSION',direction:'CREDIT',amount:commission,refType:'Property',refId:p._id},session);}
      if(env.NOTIFICATIONS_ENABLED && updated.brokerId)await postNotification({userId:updated.brokerId,type:'FUNDING_COMPLETE',title:'Property fully funded',body:`${updated.title} is fully funded.`,link:`/broker/properties/${p._id}`},session);
    }
    const row={_id:id,investorId:user._id,propertyId:p._id,units:body.units,amount,status:'ACTIVE',payoutAmount:0,createdAt:now,updatedAt:now};
    const snapshot={investment:investmentDTO({...row,ownershipPct:body.units/p.totalUnits*100}),property:{_id:String(p._id),unitsSold:updated.unitsSold,fundingPct:updated.unitsSold/updated.totalUnits*100,status:updated.status},walletBalance:debit.balanceAfter};
    await Investment.create([{...row,idempotencyKey:key,requestFingerprint:{propertyId:p._id,units:body.units},responseSnapshot:snapshot}],{session});
    if(updated.status==='FUNDED'&&env.NOTIFICATIONS_ENABLED){const recipients=await Investment.distinct('investorId',{propertyId:p._id,status:'ACTIVE'}).session(session);for(const userId of recipients)await postNotification({userId,type:'FUNDING_COMPLETE',title:'Your property is fully funded',body:`${p.title} reached full funding.`,link:`/investor/portfolio/${p._id}`},session);}
    return {data:snapshot,replayed:false};
  });}catch(error){if(error.code===11000){const row=await Investment.findOne({investorId:user._id,idempotencyKey:key});if(row)return replay(row,body);}throw error;}
}
