import mongoose from 'mongoose';
const money={type:Number,min:0,validate:Number.isSafeInteger,required:true};
const schema=new mongoose.Schema({propertyId:{type:mongoose.Schema.Types.ObjectId,ref:'Property',required:true},salePrice:{...money,min:1},platformFeePct:{type:Number,required:true},platformFee:money,distributable:money,items:{type:[new mongoose.Schema({investorId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},units:{type:Number,min:1,validate:Number.isSafeInteger,required:true},amount:money},{_id:false})],required:true},executedBy:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},executedAt:{type:Date,required:true}},{timestamps:true,strict:'throw'});
schema.index({propertyId:1},{unique:true});schema.index({executedAt:-1});
schema.pre('save',function(){if(!this.isNew&&this.isModified())throw new Error('Payout records are immutable');const sum=this.items.reduce((s,i)=>s+BigInt(i.amount),0n);if(sum!==BigInt(this.distributable)||sum+BigInt(this.platformFee)!==BigInt(this.salePrice))throw new Error('Payout amounts do not reconcile');});
for(const action of ['updateOne','updateMany','findOneAndUpdate','replaceOne','deleteOne','deleteMany','findOneAndDelete'])schema.pre(action,function(){throw new Error('Payout records are immutable');});
export default mongoose.model('Payout',schema);
