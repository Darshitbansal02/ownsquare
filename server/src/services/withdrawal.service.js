import Withdrawal from '../models/Withdrawal.js';
import {inTransaction} from '../utils/transaction.js';
import {walletState,walletDTO,serializeWallet,post} from './ledger.service.js';
import {postNotification} from './notification.service.js';
import ApiError from '../utils/ApiError.js';
import {currentInvestor} from '../utils/currentUser.js';
export const withdrawalDTO=w=>({_id:String(w._id),userId:String(w.userId),amount:w.amount,status:w.status,bankDetails:{accountHolder:w.bankDetails.accountHolder,accountNumber:`****${w.bankDetails.accountNumber.slice(-4)}`,ifsc:w.bankDetails.ifsc},reason:w.reason??null,processedBy:w.processedBy?String(w.processedBy):null,createdAt:w.createdAt,updatedAt:w.updatedAt});
export const requestWithdrawal=(user,body)=>inTransaction(async session=>{
  await currentInvestor(user,session);
  const state=await walletState(user._id,session);
  if(state.availableBalance<body.amount)throw new ApiError('INSUFFICIENT_BALANCE','Amount exceeds available balance');
  await serializeWallet(state,session);
  const [withdrawal]=await Withdrawal.create([{userId:user._id,...body}],{session});
  return {withdrawal:withdrawalDTO(withdrawal),wallet:walletDTO(await walletState(user._id,session))};
});
export const reviewWithdrawal=(user,id,body,env)=>inTransaction(async session=>{
  const w=await Withdrawal.findById(id).session(session);
  if(!w)throw new ApiError('NOT_FOUND','Withdrawal not found');
  if(w.status!=='PENDING')throw new ApiError('WITHDRAWAL_ALREADY_PROCESSED','Withdrawal has already been processed');
  const state=await walletState(w.userId,session);
  await serializeWallet(state,session);
  w.status=body.status;w.reason=body.status==='REJECTED'?body.reason:null;w.processedBy=user._id;w.processedAt=new Date();await w.save({session});
  if(body.status==='APPROVED')await post({userId:w.userId,type:'WITHDRAWAL',direction:'DEBIT',amount:w.amount,refType:'Withdrawal',refId:w._id},session);
  if(env.NOTIFICATIONS_ENABLED)await postNotification({userId:w.userId,type:`WITHDRAWAL_${body.status}`,title:`Withdrawal ${body.status.toLowerCase()}`,body:body.reason??'Your simulated withdrawal was processed. No bank transfer occurs.',link:'/investor/wallet'},session);
  return {withdrawal:withdrawalDTO(w),wallet:walletDTO(await walletState(w.userId,session))};
});
