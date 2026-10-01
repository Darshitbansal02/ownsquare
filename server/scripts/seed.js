import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import {readEnv} from '../src/config/env.js';
import {connectDB} from '../src/config/db.js';
import User from '../src/models/User.js';
import Property from '../src/models/Property.js';
import Investment from '../src/models/Investment.js';
import Transaction from '../src/models/Transaction.js';
import Settings from '../src/models/Settings.js';
import Payout from '../src/models/Payout.js';
import {createUploadService,fileType} from '../src/services/upload.service.js';
import {createProperty,editProperty} from '../src/services/property.service.js';
import {submitProperty,reviewProperty,changePropertyStatus} from '../src/services/propertyLifecycle.service.js';
import {invest} from '../src/services/investment.service.js';
import {executePayout} from '../src/services/payout.service.js';
import {submitKyc,reviewKyc} from '../src/services/kyc.service.js';
import {updateUser} from '../src/services/admin.service.js';
import {post} from '../src/services/ledger.service.js';
import {inTransaction} from '../src/utils/transaction.js';
import {password} from '../src/validators/auth.schema.js';

// Repeatable owned fixtures only. Never drop collections or rewrite an existing ledger.
export async function seedDemo(env,source,{uploads=createUploadService(env),files}={}){
  if(env.NODE_ENV==='production')throw new Error('Demo seed refuses production');
  for(const key of ['SEED_ADMIN_PASSWORD','SEED_BROKER_PASSWORD','SEED_INVESTOR_PASSWORD'])password.parse(source[key]);
  if(!files){
    if(!source.SEED_MEDIA_DIR)throw new Error('Set SEED_MEDIA_DIR to a folder with at least three dummy JPG/PNG/WebP images');
    const names=(await fs.readdir(source.SEED_MEDIA_DIR)).filter(n=>/\.(jpg|jpeg|png|webp)$/i.test(n)).sort().slice(0,3);
    if(names.length<3)throw new Error('Seed requires three actual academic property/dummy images');
    files=await Promise.all(names.map(async originalname=>{const buffer=await fs.readFile(path.join(source.SEED_MEDIA_DIR,originalname)),mimetype=fileType(buffer);if(!mimetype?.startsWith('image/')||buffer.length>5*1024*1024)throw new Error('Invalid seed image');return {originalname,buffer,mimetype};}));
  }
  const accounts=[['admin','Demo Admin','ADMIN'],['rohit','Rohit Broker','BROKER'],['other-broker','Second Broker','BROKER'],['aman','Aman Investor','INVESTOR'],['priya','Priya Investor','INVESTOR'],['karan','Karan Investor','INVESTOR'],['isha','Isha Investor','INVESTOR'],['neha','Neha Investor','INVESTOR']];
  const people=[];
  for(const [prefix,name,role] of accounts){let user=await User.findOne({email:`${prefix}@demo.com`});if(!user)user=await User.create({name,email:`${prefix}@demo.com`,phone:'0000000000',role,passwordHash:await bcrypt.hash(source[`SEED_${role}_PASSWORD`],12)});if(user.role!==role||!user.isActive)throw new Error('Existing fixture account has incompatible role/activation; preserved without changes');people.push(user);}
  const [admin,...rest]=people,brokers=rest.slice(0,2),investors=rest.slice(2);
  await Settings.updateOne({singletonKey:'platform'},{$setOnInsert:{feeAccountUserId:admin._id,platformFeePct:env.PLATFORM_FEE_PCT??2,brokerCommissionPct:env.BROKER_COMMISSION_PCT??1,maxOwnershipPct:env.MAX_OWNERSHIP_PCT??49}},{upsert:true,runValidators:true});
  const config=await Settings.findOne({singletonKey:'platform'});if(config.maxOwnershipPct<40)throw new Error('Seed source holders need at least a 40% cap; existing settings preserved');
  for(const b of brokers)if(!b.brokerApproved){await updateUser(admin,String(b._id),{brokerApproved:true});b.brokerApproved=true;}
  for(const u of investors){
    if(['NOT_SUBMITTED','REJECTED'].includes(u.kyc.status)){const docs=[await uploads.upload(files[0],u,'kyc')],selfie=await uploads.upload(files[1],u,'kyc');await submitKyc(u,{docs,selfie},uploads);}
    const current=await User.findById(u._id);if(current.kyc.status==='PENDING')await reviewKyc(admin,String(u._id),{status:'APPROVED'},env);
    await inTransaction(async session=>{const refId=`academic_seed_v1_${u._id}`;if(!await Transaction.exists({userId:u._id,type:'TOPUP',refId}).session(session))await post({userId:u._id,type:'TOPUP',direction:'CREDIT',amount:4000000000,refType:'TopupOrder',refId,gatewayOrderId:refId,gatewayPaymentId:`${refId}_payment`},session);});
  }
  const targets=[['Sector 150, Noida','LIVE'],['Whitefield, Bengaluru','LIVE'],['Baner, Pune','FUNDED'],['Gachibowli, Hyderabad','HOLDING'],['Source example, Noida','SOLD'],['Alwarpet, Chennai','PENDING_APPROVAL'],['Bandra, Mumbai','REJECTED'],['Salt Lake, Kolkata','DRAFT']];
  const properties=[];
  for(let index=0;index<targets.length;index++){
    const [location,target]=targets[index],title=`OwnSquare demo ${index+1}: ${location}`,owner=brokers[index%2];
    let p=await Property.findOne({title,brokerId:owner._id});
    if(!p){p=await createProperty(owner,{title,description:'Academic demo property for fractional ownership. No real money, offering or securities are involved.',type:'APARTMENT',address:`Demo block ${index+1}`,city:location.split(', ').at(-1),state:'Demo state',pincode:'201310',areaSqft:1200,geo:{lat:28.41,lng:77.48},valuation:1000000000,totalUnits:1000,minUnits:1,expectedAppreciationPct:12,rentalYieldPct:3,holdingPeriodMonths:24},uploads.verifyMedia);}
    if(p.status==='DRAFT'&&target!=='DRAFT'){
      if(p.images.length<3){const images=[];for(const file of files)images.push(await uploads.upload(file,owner,'property'));p=await editProperty(owner,p._id,{images},uploads.verifyMedia);}
      p=await submitProperty(owner,p._id,uploads.verifyMedia);
    }
    if(p.status==='PENDING_APPROVAL'&&!['PENDING_APPROVAL','DRAFT'].includes(target))p=await reviewProperty(admin,String(p._id),target==='REJECTED'?{status:'REJECTED',reason:'Academic review: improve the dummy property description.'}:{status:'LIVE'},env);
    if(['LIVE','FUNDED','HOLDING','SOLD'].includes(target)){
      const quantities=target==='LIVE'?(index===0?[20,50,0,0,0]:[0,0,200,100,0]):[20,50,400,300,230];
      for(let i=0;i<investors.length;i++)if(quantities[i]){
        const hex=crypto.createHash('sha256').update(`ownsquare-seed-v1-${p._id}-${investors[i]._id}`).digest('hex');const key=`${hex.slice(0,8)}-${hex.slice(8,12)}-4${hex.slice(13,16)}-a${hex.slice(17,20)}-${hex.slice(20,32)}`;
        await invest(investors[i],{propertyId:String(p._id),units:quantities[i]},key,env);
      }
      p=await Property.findById(p._id);
      if(['HOLDING','SOLD'].includes(target)&&p.status==='FUNDED'){await changePropertyStatus(String(p._id),'HOLDING');p=await Property.findById(p._id);}
      if(target==='SOLD'&&p.status==='HOLDING')await executePayout(admin,String(p._id),{salePrice:1400000000,expectedPlatformFeePct:config.platformFeePct},env);
    }
    properties.push(await Property.findById(p._id));
  }
  for(const u of people){let balance=0n;for(const t of await Transaction.find({userId:u._id}).sort({walletVersion:1})){balance+=t.direction==='CREDIT'?BigInt(t.amount):-BigInt(t.amount);if(balance!==BigInt(t.balanceAfter))throw new Error('Seed ledger sequence does not reconcile');}if(balance!==BigInt((await User.findById(u._id)).walletBalance))throw new Error('Seed wallet does not reconcile');}
  for(const p of properties){const rows=await Investment.find({propertyId:p._id,status:{$ne:'REFUNDED'}});if(rows.reduce((s,i)=>s+i.units,0)!==p.unitsSold)throw new Error('Seed inventory does not reconcile');const payout=await Payout.findOne({propertyId:p._id});if(p.status==='SOLD'&&(!payout||payout.items.reduce((s,i)=>s+i.amount,0)+payout.platformFee!==payout.salePrice))throw new Error('Seed payout does not reconcile');}
  return {users:people.map(u=>({email:u.email,role:u.role})),properties:properties.map(p=>({_id:String(p._id),title:p.title,status:p.status}))};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  try{const env=readEnv();await connectDB(env.MONGO_URI);await Promise.all(Object.values(mongoose.models).map(m=>m.init()));console.log(JSON.stringify(await seedDemo(env,process.env),null,2));}
  catch(error){console.error(error.name==='ZodError'?'Check seed passwords and environment configuration':error.message);process.exitCode=1;}finally{await mongoose.disconnect();}
}
