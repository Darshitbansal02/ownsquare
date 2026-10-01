import mongoose from 'mongoose';
import Property from '../models/Property.js';
import Investment from '../models/Investment.js';
import Transaction from '../models/Transaction.js';
import {PROPERTY_STATUS as S,TRANSACTION_TYPES,INVESTMENT_STATUS} from '../../../shared/constants.js';
import {pageDTO,sortSpec,literalSearch} from '../utils/dto.js';
import {describeProperty} from './property.service.js';
import ApiError from '../utils/ApiError.js';
export async function brokerProperties(user,query) {
  const own = {brokerId:user._id},filter = {...own};
  if (query.status) filter.status=query.status;
  if (query.city) filter.city=query.city;
  if (query.search) filter.$or=['title','city','address'].map(k=>({[k]:{$regex:literalSearch(query.search),$options:'i'}}));
  const [items,total,properties,commission] = await Promise.all([Property.find(filter).sort(sortSpec(query.sort)).skip((query.page-1)*query.limit).limit(query.limit),Property.countDocuments(filter),Property.find(own).select('_id status'),Transaction.aggregate([{$match:{userId:new mongoose.Types.ObjectId(user._id),type:TRANSACTION_TYPES.COMMISSION}},{$group:{_id:null,total:{$sum:'$amount'}}}])]);
  const funding = await Investment.aggregate([{$match:{propertyId:{$in:properties.map(p=>p._id)},status:{$ne:INVESTMENT_STATUS.REFUNDED}}},{$group:{_id:{propertyId:'$propertyId',date:{$dateToString:{date:'$createdAt',format:'%Y-%m-%d',timezone:'UTC'}}},amount:{$sum:'$amount'}}},{$sort:{'_id.date':1}}]);
  const totalRaised=funding.reduce((sum,r)=>sum+r.amount,0),commissionEarned=commission[0]?.total??0;
  if (![totalRaised,commissionEarned].every(Number.isSafeInteger)) throw new ApiError('CONFLICT','Analytics totals exceed supported range');
  return {...pageDTO(await Promise.all(items.map(describeProperty)),total,query),stats:{propertiesListed:properties.length,liveProperties:properties.filter(p=>p.status===S.LIVE).length,fundedProperties:properties.filter(p=>[S.FUNDED,S.HOLDING,S.SOLD].includes(p.status)).length,totalRaised,commissionEarned},fundingSeries:properties.map(p=>({propertyId:String(p._id),points:funding.filter(r=>String(r._id.propertyId)===String(p._id)).map(r=>({date:r._id.date,amount:r.amount}))}))};
}
