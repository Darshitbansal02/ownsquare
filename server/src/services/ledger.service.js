import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Withdrawal from '../models/Withdrawal.js';
import ApiError from '../utils/ApiError.js';
import {safeMoney} from '../utils/money.js';
export async function walletState(userId,session) {
  const user=await User.findById(userId).session(session);
  if(!user)throw new ApiError('NOT_FOUND','Account not found');
  const pending=await Withdrawal.find({userId,status:'PENDING'}).select('amount').session(session);
  const reservedBalance=safeMoney(pending.reduce((sum,row)=>sum+BigInt(row.amount),0n));
  if(user.walletBalance<reservedBalance)throw new ApiError('CONFLICT','Wallet reservations exceed balance');
  return {user,balance:user.walletBalance,reservedBalance,availableBalance:user.walletBalance-reservedBalance};
}
export const walletDTO=state=>({balance:state.balance,reservedBalance:state.reservedBalance,availableBalance:state.availableBalance});
export async function serializeWallet(state,session,balance=state.balance) {
  const updated=await User.findOneAndUpdate({_id:state.user._id,walletVersion:state.user.walletVersion},{$set:{walletBalance:safeMoney(balance)},$inc:{walletVersion:1}},{session,returnDocument:'after'});
  if(!updated)throw new ApiError('CONFLICT','Wallet changed concurrently');
  return updated;
}
export async function post({userId,type,direction,amount,refType,refId,gatewayOrderId,gatewayPaymentId},session) {
  if(!session?.inTransaction())throw new Error('Ledger posting requires a transaction');
  safeMoney(amount);if(amount===0)throw new ApiError('VALIDATION_ERROR','Ledger amount must be positive');
  const state=await walletState(userId,session);
  if(direction==='DEBIT' && state.availableBalance<amount)throw new ApiError('INSUFFICIENT_BALANCE','Available wallet balance is too low',[{field:'availableBalance',message:'Available balance',value:state.availableBalance},{field:'requiredAmount',message:'Required amount',value:amount}]);
  const balance=safeMoney(BigInt(state.balance)+(direction==='CREDIT' ? BigInt(amount) : -BigInt(amount)));
  const updated=await serializeWallet(state,session,balance);
  return (await Transaction.create([{userId,type,direction,amount,balanceAfter:balance,walletVersion:updated.walletVersion,refType,refId:String(refId),...(gatewayOrderId && {gatewayOrderId}),...(gatewayPaymentId && {gatewayPaymentId})}],{session}))[0];
}
