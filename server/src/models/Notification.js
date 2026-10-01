import mongoose from 'mongoose';
import { NOTIFICATION_TYPES } from '../../../shared/constants.js';
const schema = new mongoose.Schema({userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},type:{type:String,enum:Object.values(NOTIFICATION_TYPES),required:true},title:{type:String,required:true,maxlength:150},body:{type:String,required:true,maxlength:2000},link:{type:String,default:null,validate:v=>v===null || /^\/(broker|investor|admin|profile|notifications)(\/|$)/.test(v)},read:{type:Boolean,default:false}},{timestamps:true,strict:'throw'});
schema.index({userId:1,read:1,createdAt:-1});
export default mongoose.model('Notification',schema);
