import mongoose from 'mongoose';
import {WITHDRAWAL_STATUS} from '../../../shared/constants.js';
const schema=new mongoose.Schema({userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},amount:{type:Number,required:true,min:1,validate:Number.isSafeInteger},status:{type:String,enum:Object.values(WITHDRAWAL_STATUS),default:WITHDRAWAL_STATUS.PENDING},bankDetails:{accountHolder:{type:String,required:true},accountNumber:{type:String,required:true},ifsc:{type:String,required:true}},reason:{type:String,default:null},processedBy:{type:mongoose.Schema.Types.ObjectId,ref:'User',default:null},processedAt:{type:Date,default:null}},{timestamps:true,strict:'throw'});
schema.index({status:1,createdAt:1});schema.index({userId:1,status:1});
export default mongoose.model('Withdrawal',schema);
