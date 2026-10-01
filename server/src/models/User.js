import mongoose from 'mongoose';
import { ROLES, KYC_STATUS } from '../../../shared/constants.js';
const media = new mongoose.Schema({url:String,publicId:String,name:String},{_id:false});
const schema = new mongoose.Schema({
  name:{type:String,required:true,trim:true,minlength:2,maxlength:100}, email:{type:String,required:true,trim:true,lowercase:true,maxlength:254},phone:{type:String,required:true,match:/^\+?\d{10,15}$/},passwordHash:{type:String,required:true,select:false},role:{type:String,enum:Object.values(ROLES),required:true},isActive:{type:Boolean,default:true},brokerApproved:{type:Boolean,default:false},
  kyc:{status:{type:String,enum:Object.values(KYC_STATUS),default:KYC_STATUS.NOT_SUBMITTED},docs:{type:[media],default:[]},selfie:{type:media,default:null},reason:{type:String,default:null},reviewedBy:{type:mongoose.Schema.Types.ObjectId,ref:'User',default:null},reviewedAt:{type:Date,default:null}},
  walletBalance:{type:Number,default:0,min:0,validate:Number.isSafeInteger},walletVersion:{type:Number,default:0,min:0,validate:Number.isSafeInteger},sessionVersion:{type:Number,default:0,min:0,validate:Number.isSafeInteger},resetTokenHash:{type:String,default:null,select:false},resetTokenExpiresAt:{type:Date,default:null,select:false}
},{timestamps:true,strict:'throw'});
schema.index({email:1},{unique:true}); schema.index({role:1,isActive:1}); schema.index({'kyc.status':1,createdAt:1}); schema.index({resetTokenHash:1},{sparse:true});
export default mongoose.model('User',schema);
