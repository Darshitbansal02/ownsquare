import mongoose from 'mongoose';
import Property from '../models/Property.js';
import Investment from '../models/Investment.js';
import User from '../models/User.js';
import {PROPERTY_STATUS as S, ROLES, INVESTMENT_STATUS} from '../../../shared/constants.js';
import {propertyDTO,pageDTO,sortSpec,literalSearch} from '../utils/dto.js';
import {propertyScope} from '../middlewares/ownership.js';
import ApiError from '../utils/ApiError.js';

export function deriveFinancials(data) {
  const result = {...data};
  if (result.valuation != null && result.totalUnits != null) {
    if (result.valuation % result.totalUnits !== 0 || (result.valuation / result.totalUnits) % 100 !== 0) throw new ApiError('VALIDATION_ERROR','Valuation must divide into whole-rupee units',[{field:'totalUnits',message:'Choose units that divide valuation exactly into whole rupees'}]);
    result.unitPrice = result.valuation / result.totalUnits;
  } else result.unitPrice = null;
  if ((result.valuation != null || result.totalUnits != null) && result.minUnits == null) result.minUnits = 1;
  for (const key of ['minUnits','maxUnitsPerInvestor']) if (result[key] != null && result.totalUnits != null && result[key] > result.totalUnits) throw new ApiError('VALIDATION_ERROR','Unit limits exceed total units',[{field:key,message:'Must not exceed totalUnits'}]);
  return result;
}
export async function assertCurrentCreator(user,session) {
  const current = await User.findOne({_id:user._id,isActive:true,sessionVersion:user.sessionVersion,role:user.role}).session(session ?? null);
  if (!current) throw new ApiError('UNAUTHORIZED','Your session has changed');
  if (current.role === ROLES.BROKER && !current.brokerApproved) throw new ApiError('BROKER_NOT_APPROVED','Admin approval is required before listing');
}
export async function describeProperty(p) {
  const investors = await Investment.distinct('investorId',{propertyId:p._id,status:{$ne:INVESTMENT_STATUS.REFUNDED}});
  return propertyDTO(p,investors.length);
}
export async function publicProperties(query) {
  const filter = {status:query.status ?? {$in:[S.LIVE,S.FUNDED]}};
  if (query.city) filter.city = query.city;
  if (query.type) filter.type = query.type;
  if (query.search) filter.$or = ['title','city','address'].map(k=>({[k]:{$regex:literalSearch(query.search),$options:'i'}}));
  if (query.minPrice != null || query.maxPrice != null) filter.unitPrice = {...(query.minPrice!=null && {$gte:query.minPrice}),...(query.maxPrice!=null && {$lte:query.maxPrice})};
  if (query.minFundingPct != null || query.maxFundingPct != null) {
    const pct = {$multiply:[{$divide:['$unitsSold','$totalUnits']},100]};
    filter.$expr = {$and:[...(query.minFundingPct!=null ? [{$gte:[pct,query.minFundingPct]}]:[]),...(query.maxFundingPct!=null ? [{$lte:[pct,query.maxFundingPct]}]:[])]};
  }
  const [rows,total] = await Promise.all([Property.find(filter).sort(sortSpec(query.sort)).skip((query.page-1)*query.limit).limit(query.limit),Property.countDocuments(filter)]);
  return pageDTO(await Promise.all(rows.map(describeProperty)),total,query);
}
export async function propertyDetail(id,user) {
  const p = await Property.findById(id);
  const published = p?.liveAt && [S.LIVE,S.FUNDED,S.HOLDING,S.SOLD,S.CANCELLED].includes(p.status);
  const privateAccess = user && (user.role===ROLES.ADMIN || (user.role===ROLES.BROKER && String(p?.brokerId)===String(user._id)));
  if (!p || (!published && !privateAccess)) throw new ApiError('NOT_FOUND','Property not found');
  return describeProperty(p);
}
export async function createProperty(user,body,verifyMedia) {
  await assertCurrentCreator(user);
  await verifyMedia(body,user);
  const p = await Property.create({...deriveFinancials(body),createdBy:user._id,brokerId:user.role===ROLES.BROKER ? user._id : null,status:S.DRAFT,unitsSold:0});
  return describeProperty(p);
}
export async function editProperty(user,id,body,verifyMedia) {
  await verifyMedia(body,user);
  let updated;
  await mongoose.connection.transaction(async session=>{
    await assertCurrentCreator(user,session);
    const p = await Property.findOne({_id:id,...propertyScope(user)}).session(session);
    if (!p) throw new ApiError('NOT_FOUND','Property not found');
    if ([S.PENDING_APPROVAL,S.SOLD,S.CANCELLED].includes(p.status)) throw new ApiError('INVALID_PROPERTY_STATUS','This property is locked for editing');
    const draft = [S.DRAFT,S.REJECTED].includes(p.status);
    if (!draft && (user.role!==ROLES.ADMIN || Object.keys(body).some(k=>!['description','images'].includes(k)))) throw new ApiError('PROPERTY_IMMUTABLE','Only admin description/image updates are allowed after publication');
    const financialChange = ['valuation','totalUnits','minUnits','maxUnitsPerInvestor'].some(k=>Object.hasOwn(body,k) && body[k]!==p[k]);
    if (financialChange && await Investment.exists({propertyId:p._id}).session(session)) throw new ApiError('PROPERTY_IMMUTABLE','Financial fields are locked after an investment');
    const combined = deriveFinancials({...p.toObject(),...body});
    const set = {...body,unitPrice:combined.unitPrice,minUnits:combined.minUnits};
    updated = await Property.findOneAndUpdate({_id:id,status:p.status,version:p.version},{$set:set,$inc:{version:1}},{returnDocument:'after',runValidators:true,session});
    if (!updated) throw new ApiError('CONFLICT','Property changed. Reload and retry');
  });
  return describeProperty(updated);
}
export async function propertyInvestors(user,id,query) {
  const p = await Property.findOne({_id:id,...propertyScope(user)});
  if (!p) throw new ApiError('NOT_FOUND','Property not found');
  const rows = await Investment.aggregate([{$match:{propertyId:p._id,status:{$ne:INVESTMENT_STATUS.REFUNDED}}},{$group:{_id:'$investorId',units:{$sum:'$units'},amount:{$sum:'$amount'},createdAt:{$min:'$createdAt'}}},{$sort:sortSpec(query.sort)},{$facet:{items:[{$skip:(query.page-1)*query.limit},{$limit:query.limit},{$lookup:{from:'users',localField:'_id',foreignField:'_id',as:'user'}},{$project:{_id:1,units:1,amount:1,name:{$arrayElemAt:['$user.name',0]}}}],total:[{$count:'count'}]}}]);
  return pageDTO(rows[0].items.map(r=>({investorId:String(r._id),displayName:user.role===ROLES.BROKER ? (r.name??'Investor').split(/\s+/).map(n=>n[0]+'.').join(' ') : r.name??'Investor',units:r.units,amount:r.amount,ownershipPct:r.units / p.totalUnits * 100})),rows[0].total[0]?.count??0,query);
}
