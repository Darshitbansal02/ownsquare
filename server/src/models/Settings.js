import mongoose from 'mongoose';
const rate={type:Number,min:0,max:100,validate:v=>/^\d+(\.\d{1,2})?$/.test(String(v)),required:true};
const schema=new mongoose.Schema({singletonKey:{type:String,enum:['platform'],default:'platform'},platformFeePct:{...rate,default:2},brokerCommissionPct:{...rate,default:1},maxOwnershipPct:{...rate,min:0.01,default:49},feeAccountUserId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true}},{timestamps:true,strict:'throw'});
schema.add({version:{type:Number,default:0,min:0,validate:Number.isSafeInteger}});
schema.index({singletonKey:1},{unique:true});
export default mongoose.model('Settings',schema);
