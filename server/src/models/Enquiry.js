import mongoose from 'mongoose';
import { ENQUIRY_STATUS } from '../../../shared/constants.js';
const schema = new mongoose.Schema({propertyId:{type:mongoose.Schema.Types.ObjectId,ref:'Property',required:true},investorId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},brokerId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},messages:{type:[new mongoose.Schema({from:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},text:{type:String,required:true,minlength:1,maxlength:2000},at:{type:Date,required:true}},{_id:false})],required:true,validate:v=>v.length>0},status:{type:String,enum:Object.values(ENQUIRY_STATUS),default:ENQUIRY_STATUS.OPEN}},{timestamps:true,strict:'throw'});
schema.index({investorId:1,updatedAt:-1});schema.index({brokerId:1,propertyId:1,updatedAt:-1});
export default mongoose.model('Enquiry',schema);
