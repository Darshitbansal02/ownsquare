import mongoose from 'mongoose';
import { TRANSACTION_TYPES, TRANSACTION_DIRECTIONS } from '../../../shared/constants.js';
const schema = new mongoose.Schema({userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},type:{type:String,enum:Object.values(TRANSACTION_TYPES),required:true},direction:{type:String,enum:Object.values(TRANSACTION_DIRECTIONS),required:true},amount:{type:Number,required:true,min:1,validate:Number.isSafeInteger},balanceAfter:{type:Number,required:true,min:0,validate:Number.isSafeInteger},walletVersion:{type:Number,required:true,min:1,validate:Number.isSafeInteger},refType:{type:String,enum:['TopupOrder','Investment','Property','Payout','Withdrawal'],required:true},refId:{type:String,required:true},gatewayOrderId:String,gatewayPaymentId:String},{timestamps:{createdAt:true,updatedAt:false},strict:'throw'});
schema.index({userId:1,createdAt:-1,_id:-1});schema.index({userId:1,walletVersion:1},{unique:true});
for (const key of ['gatewayOrderId','gatewayPaymentId']) schema.index({[key]:1},{unique:true,partialFilterExpression:{[key]:{$type:'string'}}});
schema.index({userId:1,type:1,refType:1,refId:1},{unique:true});
for (const action of ['updateOne','updateMany','findOneAndUpdate','replaceOne','deleteOne','deleteMany','findOneAndDelete']) schema.pre(action,function(){throw new Error('Ledger entries are append-only');});
schema.pre('save',function(){if(!this.isNew && this.isModified())throw new Error('Ledger entries are append-only');});
export default mongoose.model('Transaction',schema);
