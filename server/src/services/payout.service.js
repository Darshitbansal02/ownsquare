import Property from '../models/Property.js';
import Investment from '../models/Investment.js';
import Payout from '../models/Payout.js';
import User from '../models/User.js';
import {settings} from './settings.service.js';
import {post} from './ledger.service.js';
import {postNotification} from './notification.service.js';
import {inTransaction} from '../utils/transaction.js';
import {safeMoney,percentageFee,distribute} from '../utils/money.js';
import {propertyDTO} from '../utils/dto.js';
import ApiError from '../utils/ApiError.js';
export function calculatePayout(property,rows,salePrice,platformFeePct) {
  const holders=new Map();
  for(const row of rows){const id=String(row.investorId);holders.set(id,safeMoney(BigInt(holders.get(id)??0)+BigInt(row.units)));}
  if([...holders.values()].reduce((sum,n)=>sum+BigInt(n),0n)!==BigInt(property.totalUnits))throw new ApiError('CONFLICT','Active holdings do not match property units');
  const platformFee=percentageFee(salePrice,platformFeePct),distributable=salePrice-platformFee;
  const allocation=distribute(distributable,[...holders].sort(([a],[b])=>a.localeCompare(b)).map(([investorId,units])=>({investorId,units})));
  return {propertyId:String(property._id),salePrice,platformFeePct,platformFee,distributable,...allocation,totalPayout:safeMoney(allocation.items.reduce((s,i)=>s+BigInt(i.amount),0n))};
}
async function inputs(id,session) {
  const p=await Property.findById(id).session(session);
  if(!p)throw new ApiError('NOT_FOUND','Property not found');
  if(p.status==='SOLD')throw new ApiError('ALREADY_SOLD','Property was already sold');
  if(p.status!=='HOLDING')throw new ApiError('INVALID_PROPERTY_STATUS','Acquire a fully funded property before selling');
  const rows=await Investment.find({propertyId:id,status:'ACTIVE'}).session(session);
  return {p,rows,config:await settings(session)};
}
export const previewPayout=(id,salePrice)=>inTransaction(async session=>{const {p,rows,config}=await inputs(id,session);return calculatePayout(p,rows,salePrice,config.platformFeePct);});
export const payoutDTO=p=>({_id:String(p._id),propertyId:String(p.propertyId),salePrice:p.salePrice,platformFeePct:p.platformFeePct,platformFee:p.platformFee,distributable:p.distributable,items:p.items.map(i=>({investorId:String(i.investorId),units:i.units,amount:i.amount})),executedBy:String(p.executedBy),executedAt:p.executedAt});
export async function executePayout(user,id,body,env) {
  try{return await inTransaction(async session=>{
    const {p,rows,config}=await inputs(id,session);
    if(config.platformFeePct!==body.expectedPlatformFeePct)throw new ApiError('PREVIEW_STALE','Fee changed. Refresh the preview and confirm again');
    const preview=calculatePayout(p,rows,body.salePrice,config.platformFeePct);
    if(!await User.exists({_id:config.feeAccountUserId,role:'ADMIN'}).session(session))throw new ApiError('CONFLICT','Platform accounting account must be an administrator');
    const updated=await Property.findOneAndUpdate({_id:id,status:'HOLDING',version:p.version},{$set:{status:'SOLD',salePrice:body.salePrice,soldAt:new Date()},$inc:{version:1}},{session,returnDocument:'after'});
    if(!updated)throw new ApiError('CONFLICT','Property changed concurrently');
    const [payout]=await Payout.create([{propertyId:id,salePrice:preview.salePrice,platformFeePct:preview.platformFeePct,platformFee:preview.platformFee,distributable:preview.distributable,items:preview.items,executedBy:user._id,executedAt:updated.soldAt}],{session});
    for(const item of preview.items){
      if(item.amount)await post({userId:item.investorId,type:'PAYOUT',direction:'CREDIT',amount:item.amount,refType:'Payout',refId:payout._id},session);
      const allocation=distribute(item.amount,rows.filter(r=>String(r.investorId)===item.investorId).map(r=>({_id:r._id,units:r.units})));
      for(const row of allocation.items)await Investment.updateOne({_id:row._id,status:'ACTIVE'},{$set:{status:'EXITED',payoutAmount:row.amount}},{session});
      if(env.NOTIFICATIONS_ENABLED)await postNotification({userId:item.investorId,type:'PAYOUT_CREDITED',title:'Property sale completed',body:`${p.title} sold. Your payout is ${item.amount} paise.`,link:`/investor/portfolio/${id}`},session);
    }
    if(preview.platformFee)await post({userId:config.feeAccountUserId,type:'FEE',direction:'CREDIT',amount:preview.platformFee,refType:'Payout',refId:payout._id},session);
    return {property:propertyDTO(updated,preview.items.length),payout:payoutDTO(payout)};
  });}catch(error){if(error.code===11000 && await Payout.exists({propertyId:id}))throw new ApiError('ALREADY_SOLD','Property was already sold');throw error;}
}
