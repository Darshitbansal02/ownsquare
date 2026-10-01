import User from '../models/User.js';
import Property from '../models/Property.js';
import Investment from '../models/Investment.js';
import Withdrawal from '../models/Withdrawal.js';
import Transaction from '../models/Transaction.js';
import Settings from '../models/Settings.js';
import {settings} from './settings.service.js';
import {inTransaction} from '../utils/transaction.js';
import {safeMoney} from '../utils/money.js';
import {userDTO} from '../utils/dto.js';
import ApiError from '../utils/ApiError.js';
export const updateUser=(actor,id,body)=>inTransaction(async session=>{
  // Serialize all administrator role/activation edits to protect the last admin.
  const config=await settings(session);
  await Settings.updateOne({_id:config._id},{$inc:{version:1}},{session});
  const current=await User.findOne({_id:actor._id,isActive:true,role:'ADMIN',sessionVersion:actor.sessionVersion}).session(session);
  if(!current)throw new ApiError('UNAUTHORIZED','Administrator session changed');
  const target=await User.findById(id).session(session);if(!target)throw new ApiError('NOT_FOUND','User not found');
  const role=body.role??target.role,active=body.isActive??target.isActive;
  if(body.brokerApproved!==undefined&&role!=='BROKER')throw new ApiError('VALIDATION_ERROR','Only brokers have broker approval');
  if(target.role==='ADMIN'&&target.isActive&&(role!=='ADMIN'||!active)&&await User.countDocuments({role:'ADMIN',isActive:true}).session(session)<=1)throw new ApiError('CONFLICT','Keep at least one active administrator');
  if(String(config.feeAccountUserId)===id&&role!=='ADMIN')throw new ApiError('CONFLICT','The fee account must remain an administrator');
  if(role!==target.role){
    if(target.walletBalance!==0||await Investment.exists({investorId:id}).session(session)||await Withdrawal.exists({userId:id,status:'PENDING'}).session(session)||await Property.exists({$or:[{brokerId:id},{createdBy:id}]}).session(session))throw new ApiError('CONFLICT','Role change conflicts with account financial or property history');
    target.brokerApproved=false;
  }
  if(role!==target.role||active!==target.isActive)target.sessionVersion++;
  Object.assign(target,body);await target.save({session});return userDTO(target);
});
export const adminStats=(query,env)=>inTransaction(async session=>{
  const properties=await Property.find().select('status valuation').session(session),users=await User.find().select('role brokerApproved kyc.status').session(session);
  const ledger=await Transaction.find({type:{$in:['INVESTMENT','REFUND','FEE']}}).select('type amount createdAt').session(session);
  const now=new Date(),month=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),1));
  const signed=t=>t.type==='REFUND'?-BigInt(t.amount):BigInt(t.amount);
  const raised=ledger.filter(t=>t.type!=='FEE'),series=new Map();
  for(const t of raised){if(query.from&&t.createdAt<new Date(query.from)||query.to&&t.createdAt>=new Date(query.to))continue;const day=t.createdAt.toISOString().slice(0,10);series.set(day,(series.get(day)??0n)+signed(t));}
  const signedNumber=n=>{if(n>BigInt(Number.MAX_SAFE_INTEGER)||n< -BigInt(Number.MAX_SAFE_INTEGER))throw new ApiError('CONFLICT','Analytics exceed supported range');return Number(n);};
  const statuses=new Map();for(const p of properties)statuses.set(p.status,(statuses.get(p.status)??0)+1);
  return {aum:safeMoney(properties.filter(p=>['FUNDED','HOLDING'].includes(p.status)).reduce((s,p)=>s+BigInt(p.valuation),0n)),usersByRole:Object.fromEntries(['ADMIN','BROKER','INVESTOR'].map(role=>[role,users.filter(u=>u.role===role).length])),liveProperties:statuses.get('LIVE')??0,fundsRaisedThisMonth:signedNumber(raised.filter(t=>t.createdAt>=month).reduce((s,t)=>s+signed(t),0n)),platformFeesEarned:safeMoney(ledger.filter(t=>t.type==='FEE').reduce((s,t)=>s+BigInt(t.amount),0n)),fundsRaisedSeries:[...series].sort(([a],[b])=>a.localeCompare(b)).map(([date,amount])=>({date,amount:signedNumber(amount)})),propertiesByStatus:[...statuses].map(([status,count])=>({status,count})),approvalQueue:{properties:statuses.get('PENDING_APPROVAL')??0,brokers:users.filter(u=>u.role==='BROKER'&&!u.brokerApproved).length,kyc:env.KYC_ENABLED?users.filter(u=>u.kyc.status==='PENDING').length:0,withdrawals:env.WITHDRAWALS_ENABLED?await Withdrawal.countDocuments({status:'PENDING'}).session(session):0}};
});
