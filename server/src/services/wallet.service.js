import crypto from 'node:crypto';
import Transaction from '../models/Transaction.js';
import {inTransaction} from '../utils/transaction.js';
import {post,walletState,walletDTO} from './ledger.service.js';
import ApiError from '../utils/ApiError.js';
import {transactionDTO} from '../utils/dto.js';
import {currentInvestor} from '../utils/currentUser.js';
export const getWallet=userId=>inTransaction(async session=>walletDTO(await walletState(userId,session)));
export function createWalletService(env) {
  const ready=()=>{if(!env.MOCK_PAYMENT_SECRET || env.PAYMENT_PROVIDER && env.PAYMENT_PROVIDER!=='mock')throw new ApiError('SERVICE_UNAVAILABLE','Configure the signed mock payment provider');};
  const sign=payload=>crypto.createHmac('sha256',env.MOCK_PAYMENT_SECRET).update(payload).digest('base64url');
  return {
    async order(user,{amount}) {ready();const proof={userId:String(user._id),gatewayOrderId:`mock_order_${crypto.randomUUID()}`,gatewayPaymentId:`mock_payment_${crypto.randomUUID()}`,amount,currency:'INR',expiresAt:Date.now()+15*60*1000};const payload=Buffer.from(JSON.stringify(proof)).toString('base64url');return {gatewayOrderId:proof.gatewayOrderId,amount,currency:'INR',provider:'mock',checkout:{gatewayPaymentId:proof.gatewayPaymentId,mockOrderToken:`${payload}.${sign(payload)}`}};},
    async verify(user,body) {
      ready();let proof;
      try {const [payload,signature,...rest]=body.mockOrderToken.split('.');const actual=Buffer.from(signature??'','base64url'),expected=Buffer.from(sign(payload),'base64url');if(rest.length || actual.length!==expected.length || !crypto.timingSafeEqual(actual,expected))throw new Error();proof=JSON.parse(Buffer.from(payload,'base64url'));if(proof.userId!==String(user._id) || proof.gatewayOrderId!==body.gatewayOrderId || proof.gatewayPaymentId!==body.gatewayPaymentId || proof.currency!=='INR' || proof.expiresAt<=Date.now() || !Number.isSafeInteger(proof.amount) || proof.amount<=0)throw new Error();}
      catch {throw new ApiError('PAYMENT_VERIFICATION_FAILED','Invalid or expired payment proof');}
      try {return await inTransaction(async session=>{
        await currentInvestor(user,session);
        if(await Transaction.exists({$or:[{gatewayOrderId:proof.gatewayOrderId},{gatewayPaymentId:proof.gatewayPaymentId}]}).session(session))throw new ApiError('DUPLICATE_PAYMENT','This order or payment has already been credited');
        const transaction=await post({userId:user._id,type:'TOPUP',direction:'CREDIT',amount:proof.amount,refType:'TopupOrder',refId:proof.gatewayOrderId,gatewayOrderId:proof.gatewayOrderId,gatewayPaymentId:proof.gatewayPaymentId},session);
        return {wallet:walletDTO(await walletState(user._id,session)),transaction:transactionDTO(transaction)};
      });}catch(error){if(error.code===11000)throw new ApiError('DUPLICATE_PAYMENT','This order or payment has already been credited');throw error;}
    }
  };
}
