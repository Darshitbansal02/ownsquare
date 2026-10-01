import {before,after,test} from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import {MongoMemoryReplSet} from 'mongodb-memory-server';
import {createApp} from '../app.js';
import User from '../models/User.js';
import Property from '../models/Property.js';
import Investment from '../models/Investment.js';
import Transaction from '../models/Transaction.js';
import Settings from '../models/Settings.js';
import Payout from '../models/Payout.js';
import Withdrawal from '../models/Withdrawal.js';
import {calculatePayout} from '../services/payout.service.js';
import {seedDemo} from '../../scripts/seed.js';
const env={NODE_ENV:'test',CLIENT_URL:'http://localhost:5173',JWT_SECRET:'integration-secret-only-123456789abcdefgh',MOCK_PAYMENT_SECRET:'separate-payment-secret-123456abcdefgh',PAYMENT_PROVIDER:'mock',KYC_ENABLED:true,WITHDRAWALS_ENABLED:true,OWNERSHIP_CAP_ENABLED:true,ENQUIRIES_ENABLED:true,NOTIFICATIONS_ENABLED:true,PASSWORD_RESET_ENABLED:false};
let db,app,admin,broker,users,hash;
const bearer=u=>`Bearer ${jwt.sign({role:u.role,sessionVersion:u.sessionVersion},env.JWT_SECRET,{subject:String(u._id),expiresIn:900,issuer:'ownsquare',audience:'ownsquare-web'})}`;
const call=(method,url,u,body={})=>request(app)[method]('/api/v1'+url).set('Authorization',bearer(u)).send(body);
const ok=(r,status=200)=>{assert.equal(r.status,status,JSON.stringify(r.body));return r.body.data;};
const buy=(u,p,units,key=crypto.randomUUID())=>call('post','/investments',u,{propertyId:String(p._id),units}).set('Idempotency-Key',key);
const topup=async(u,amount)=>{const o=ok(await call('post','/wallet/topup/order',u,{amount}),201);return ok(await call('post','/wallet/topup/verify',u,{gatewayOrderId:o.gatewayOrderId,...o.checkout}));};
const newInvestor=()=>User.create({name:'Isolated Investor',email:`${crypto.randomUUID()}@test.invalid`,phone:'0000000000',role:'INVESTOR',passwordHash:hash,kyc:{status:'APPROVED'}});
const images=[1,2,3].map(n=>({url:`https://res.cloudinary.com/test/image/upload/${n}.jpg`,publicId:String(n),name:`Test image ${n}`}));
async function property(totalUnits=1000,unitPrice=1000000){
  const p=ok(await call('post','/properties',broker,{title:'Noida academic apartment',description:'A complete test property for real transactional integration.',type:'APARTMENT',address:'Dummy block',city:'Noida',state:'UP',pincode:'201310',areaSqft:1200,valuation:totalUnits*unitPrice,totalUnits,minUnits:1,expectedAppreciationPct:12,rentalYieldPct:3,holdingPeriodMonths:24,images}),201);
  ok(await call('post',`/properties/${p._id}/submit`,broker));return ok(await call('post',`/properties/${p._id}/approve`,admin));
}
before(async()=>{
  db=await MongoMemoryReplSet.create({binary:{version:'8.0.13',downloadDir:path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../node_modules/.cache/mongodb')},replSet:{count:1}});await mongoose.connect(db.getUri());await Promise.all(Object.values(mongoose.models).map(m=>m.init()));
  // Only the external media transport is substituted. Authentication and DB are real.
  app=createApp(env,{uploadService:{verifyMedia:async()=>{},verifyKyc:async body=>body,privateMedia:async a=>a,upload:async()=>{throw new Error('Provider not exercised');}}});
  hash=await bcrypt.hash('Integration!23',12);
  admin=await User.create({name:'Admin',email:'admin@test.invalid',phone:'0000000000',role:'ADMIN',passwordHash:hash});
  broker=await User.create({name:'Broker',email:'broker@test.invalid',phone:'0000000000',role:'BROKER',passwordHash:hash,brokerApproved:true});
  users=await Promise.all([1,2,3,4,5].map(()=>newInvestor()));
  await Settings.create({feeAccountUserId:admin._id});
},{timeout:900000});
after(async()=>{await mongoose.disconnect();await db?.stop();});

test('signed orders bind owner and amount; concurrent verification credits once; validation and RBAC',async()=>{
  const u=users[0],order=ok(await call('post','/wallet/topup/order',u,{amount:50000000}),201),proof={gatewayOrderId:order.gatewayOrderId,...order.checkout};
  assert.equal(ok(await call('get','/wallet',u)).balance,0);
  assert.equal((await call('post','/wallet/topup/verify',users[1],proof)).body.error.code,'PAYMENT_VERIFICATION_FAILED');
  assert.equal((await call('post','/wallet/topup/verify',u,{...proof,mockOrderToken:proof.mockOrderToken+'x'})).status,400);
  const r=await Promise.all([1,2].map(()=>call('post','/wallet/topup/verify',u,proof)));assert.deepEqual(r.map(x=>x.status).sort(),[200,409]);assert.equal(r.find(x=>x.status===409).body.error.code,'DUPLICATE_PAYMENT');
  assert.equal(ok(await call('get','/wallet',u)).balance,50000000);
  for(const bad of [-1,1.5,Number.MAX_SAFE_INTEGER+1,'100'])assert.equal((await call('post','/wallet/topup/order',u,{amount:bad})).status,400);
  assert.equal((await call('post','/wallet/topup/order',broker,{amount:100})).status,403);
  assert.equal((await call('get','/admin/users',u)).status,403);
  assert.equal((await call('get',`/transactions?userId=${admin._id}`,u)).status,403);
});

test('source Noida investment, immutable replay, funding commission, payout, portfolio and duplicate sale',async()=>{
  const p=await property();const quantities=[20,50,400,300,230];
  for(let i=0;i<users.length;i++)await topup(users[i],quantities[i]*1000000);
  const key=crypto.randomUUID(),original=ok(await buy(users[0],p,20,key),201);
  assert.equal(original.investment.amount,20000000);assert.equal(original.investment.ownershipPct,2);
  assert.equal((await buy(users[0],p,21,key)).body.error.code,'IDEMPOTENCY_CONFLICT');
  for(let i=1;i<users.length;i++)ok(await buy(users[i],p,quantities[i]),201);
  assert.equal((await Property.findById(p._id)).status,'FUNDED');assert.equal(await Transaction.countDocuments({type:'COMMISSION',refId:p._id}),1);
  assert.equal((await buy(users[0],p,1)).body.error.code,'ALREADY_FUNDED');
  ok(await call('post',`/properties/${p._id}/status`,admin,{status:'HOLDING'}));
  const preview=ok(await call('get',`/properties/${p._id}/payout-preview?salePrice=1400000000`,admin));assert.equal(preview.platformFee,28000000);assert.equal(preview.distributable,1372000000);assert.equal(preview.items.find(i=>i.investorId===String(users[0]._id)).amount,27440000);
  assert.equal((await call('post',`/properties/${p._id}/sell`,admin,{salePrice:1400000000,expectedPlatformFeePct:1})).body.error.code,'PREVIEW_STALE');
  const sale=await Promise.all([1,2].map(()=>call('post',`/properties/${p._id}/sell`,admin,{salePrice:1400000000,expectedPlatformFeePct:2})));assert.deepEqual(sale.map(r=>r.status).sort(),[200,409]);assert.equal(sale.find(r=>r.status===409).body.error.code,'ALREADY_SOLD');
  const payout=await Payout.findOne({propertyId:p._id});assert.equal(payout.items.reduce((s,i)=>s+i.amount,0)+payout.platformFee,1400000000);
  assert.deepEqual(ok(await buy(users[0],p,20,key)),original);
  const summary=ok(await call('get','/portfolio/summary',users[0]));assert.equal(summary.holdings[0].roiPct,37.2);assert.equal(summary.totalPayouts,27440000);assert.equal(summary.allocation.length,0);
  assert.equal((await call('patch',`/admin/users/${users[0]._id}`,admin,{role:'BROKER'})).body.error.code,'CONFLICT');
});

test('final-block buyers race: one investment, one remainingUnits=0 conflict, one commission',async()=>{
  for(let run=0;run<3;run++){
    const p=await property(100,100),a=await newInvestor(),b=await newInvestor(),c=await newInvestor();
    await topup(a,10000);await topup(b,10000);await topup(c,10000);
    ok(await buy(a,p,45),201);ok(await buy(b,p,45),201);
    const d=await newInvestor();await topup(d,10000);
    const results=await Promise.all([buy(c,p,10),buy(d,p,10)]);assert.deepEqual(results.map(r=>r.status).sort(),[201,409]);
    const loser=results.find(r=>r.status===409);assert.equal(loser.body.error.code,'INSUFFICIENT_UNITS');assert.equal(loser.body.error.details.find(d=>d.field==='remainingUnits').value,0);
    assert.equal((await Property.findById(p._id)).unitsSold,100);assert.equal(await Investment.countDocuments({propertyId:p._id}),3);assert.equal(await Transaction.countDocuments({type:'COMMISSION',refId:p._id}),1);
  }
});

test('concurrent spending and reservations never overdraw; processing/release is once only',async()=>{
  const u=await newInvestor(),a=await property(100,100),b=await property(100,100);await topup(u,1000);
  const bankDetails={accountHolder:'Dummy Person',accountNumber:'0000000000',ifsc:'TEST0000000'};
  const results=await Promise.all([buy(u,a,8),call('post','/wallet/withdraw',u,{amount:800,bankDetails})]);assert.deepEqual(results.map(r=>r.status).sort(),[201,409]);
  assert.equal(results.find(r=>r.status===409).body.error.code,'INSUFFICIENT_BALANCE');
  const w=ok(await call('get','/wallet',u));assert.equal(w.availableBalance,200);
  assert.equal((await buy(u,b,3)).body.error.code,'INSUFFICIENT_BALANCE');assert.equal((await Property.findById(b._id)).unitsSold,0);
  const pending=await Withdrawal.findOne({userId:u._id,status:'PENDING'});
  if(pending){const reviews=await Promise.all([1,2].map(()=>call('patch',`/admin/withdrawals/${pending._id}`,admin,{status:'APPROVED'})));assert.deepEqual(reviews.map(r=>r.status).sort(),[200,409]);assert.equal(await Transaction.countDocuments({type:'WITHDRAWAL',refId:String(pending._id)}),1);}
  const next=ok(await call('post','/wallet/withdraw',u,{amount:100,bankDetails}),201);const before=ok(await call('get','/wallet',u));ok(await call('patch',`/admin/withdrawals/${next.withdrawal._id}`,admin,{status:'REJECTED',reason:'Dummy test rejection'}));const after=ok(await call('get','/wallet',u));assert.equal(after.balance,before.balance);assert.equal(after.availableBalance,before.availableBalance+100);
  const spare=await newInvestor();await topup(spare,1000);const buys=await Promise.all([buy(spare,a,8),buy(spare,b,8)]);assert.deepEqual(buys.map(r=>r.status).sort(),[201,409]);assert.equal(ok(await call('get','/wallet',spare)).balance,200);
});

test('cancellation rolls back all refunds on failure, then refunds once and preserves history',async()=>{
  const p=await property(100,100),u=await newInvestor(),v=await newInvestor();await topup(u,10000);await topup(v,10000);ok(await buy(u,p,10),201);ok(await buy(v,p,10),201);
  // Controlled failure on the second refund proves the first refund/inventory roll back.
  const create=Transaction.create;let refunds=0;Transaction.create=async function(docs,...args){if(docs[0]?.type==='REFUND'&&++refunds===2)throw new Error('Injected refund failure');return create.call(this,docs,...args);};
  try{assert.equal((await call('post',`/properties/${p._id}/status`,admin,{status:'CANCELLED'})).status,500);}finally{Transaction.create=create;}
  assert.equal((await Property.findById(p._id)).status,'LIVE');assert.equal(await Transaction.countDocuments({type:'REFUND',userId:{$in:[u._id,v._id]}}),0);assert.equal(ok(await call('get','/wallet',u)).balance,9000);
  const result=ok(await call('post',`/properties/${p._id}/status`,admin,{status:'CANCELLED'}));assert.equal(result.refundedAmount,2000);assert.equal(result.refundedInvestments,2);assert.equal(ok(await call('get','/wallet',u)).balance,10000);
  assert.equal((await call('post',`/properties/${p._id}/status`,admin,{status:'CANCELLED'})).status,409);assert.equal(ok(await call('get','/portfolio/summary',u)).holdings[0].roiPct,0);
});

test('KYC states, cumulative cap, last-admin and persisted revocation protections',async()=>{
  const u=await newInvestor(),p=await property(100,100);await User.updateOne({_id:u._id},{$set:{'kyc.status':'NOT_SUBMITTED'}});await topup(u,10000);
  assert.equal((await buy(u,p,1)).body.error.code,'KYC_REQUIRED');
  ok(await call('post','/kyc',u,{docs:[images[0]],selfie:images[1]}),201);assert.equal((await call('post','/kyc',u,{docs:[images[0]],selfie:images[1]})).body.error.code,'KYC_ALREADY_SUBMITTED');
  ok(await call('patch',`/admin/kyc/${u._id}`,admin,{status:'REJECTED',reason:'Use a clear dummy file'}));ok(await call('post','/kyc',u,{docs:[images[0]],selfie:images[1]}),201);ok(await call('patch',`/admin/kyc/${u._id}`,admin,{status:'APPROVED'}));
  ok(await buy(u,p,30),201);const cap=await Promise.all([buy(u,p,15),buy(u,p,15)]);assert.deepEqual(cap.map(r=>r.status).sort(),[201,409]);assert.equal(cap.find(r=>r.status===409).body.error.code,'OWNERSHIP_LIMIT_EXCEEDED');
  assert.equal((await call('patch',`/admin/users/${admin._id}`,admin,{isActive:false})).body.error.code,'CONFLICT');
  ok(await call('patch',`/admin/users/${u._id}`,admin,{isActive:false}));assert.equal((await call('get','/wallet',u)).status,401);
});

test('pure payout ties, tiny/loss sales, exact intermediates and immutable ledger reconciliation',async()=>{
  const a='000000000000000000000001',b='000000000000000000000002';
  const calc=(sale,rows)=>calculatePayout({_id:a,totalUnits:rows.reduce((s,r)=>s+r.units,0)},rows,sale,0);
  assert.deepEqual(calc(101,[{investorId:a,units:1},{investorId:b,units:2}]).items.map(i=>i.amount),[33,68]);
  assert.deepEqual(calc(101,[{investorId:b,units:1},{investorId:a,units:1}]).items.map(i=>i.amount),[51,50]);
  assert.equal(calc(Number.MAX_SAFE_INTEGER,[{investorId:a,units:1000},{investorId:b,units:1000}]).totalPayout,Number.MAX_SAFE_INTEGER);
  const p=await property(3,100),aUser=await newInvestor(),bUser=await newInvestor(),cUser=await newInvestor();
  for(const u of [aUser,bUser,cUser]){await topup(u,100);ok(await buy(u,p,1),201);}ok(await call('post',`/properties/${p._id}/status`,admin,{status:'HOLDING'}));
  const sold=ok(await call('post',`/properties/${p._id}/sell`,admin,{salePrice:1,expectedPlatformFeePct:2}));assert.equal(sold.payout.items.reduce((s,i)=>s+i.amount,0),1);assert.equal(await Transaction.countDocuments({type:'PAYOUT',refId:sold.payout._id}),1);
  for(const user of await User.find()){
    let balance=0n;for(const t of await Transaction.find({userId:user._id}).sort({walletVersion:1})){balance+=t.direction==='CREDIT'?BigInt(t.amount):-BigInt(t.amount);assert.equal(Number(balance),t.balanceAfter);assert.ok(balance>=0n);}assert.equal(Number(balance),user.walletBalance);
  }
  await assert.rejects(Transaction.updateOne({},{$set:{amount:1}}),/append-only/);
});

test('comprehensive seed reconciles eight property states and is repeatable without new financial posts',async()=>{
  const source={SEED_ADMIN_PASSWORD:'SeedAdmin!23',SEED_BROKER_PASSWORD:'SeedBroker!23',SEED_INVESTOR_PASSWORD:'SeedInvestor!23'};
  const uploads={upload:async(file,user,purpose)=>({url:`https://res.cloudinary.com/test/image/${purpose==='kyc'?'authenticated':'upload'}/${user._id}/${file.originalname}`,publicId:`${purpose}/${user._id}/${file.originalname}`,name:file.originalname}),verifyMedia:async()=>{},verifyKyc:async body=>body,privateMedia:async a=>a};
  const options={uploads,files:[1,2,3].map(n=>({originalname:`dummy-${n}.png`}))};
  const first=await seedDemo(env,source,options);assert.equal(first.users.length,8);assert.deepEqual(first.properties.map(p=>p.status),['LIVE','LIVE','FUNDED','HOLDING','SOLD','PENDING_APPROVAL','REJECTED','DRAFT']);
  const count=await Transaction.countDocuments(),investments=await Investment.countDocuments();
  const second=await seedDemo(env,source,options);assert.deepEqual(second,first);assert.equal(await Transaction.countDocuments(),count);assert.equal(await Investment.countDocuments(),investments);
});

test('investment, commission, payout and withdrawal failure injection leaves no partial financial writes',async()=>{
  const p=await property(100,100),a=await newInvestor(),b=await newInvestor(),c=await newInvestor();
  for(const u of [a,b,c])await topup(u,10000);
  ok(await buy(a,p,45),201);ok(await buy(b,p,45),201);
  const create=Transaction.create;
  Transaction.create=async function(docs,...args){const result=await create.call(this,docs,...args);if(docs[0]?.type==='COMMISSION')throw new Error('Injected failure after commission insert');return result;};
  try{assert.equal((await buy(c,p,10)).status,500);}finally{Transaction.create=create;}
  assert.equal((await Property.findById(p._id)).unitsSold,90);assert.equal((await Property.findById(p._id)).status,'LIVE');assert.equal(ok(await call('get','/wallet',c)).balance,10000);assert.equal(await Transaction.countDocuments({type:'COMMISSION',refId:p._id}),0);
  const key=crypto.randomUUID(),races=await Promise.all([buy(c,p,10,key),buy(c,p,10,key)]);assert.deepEqual(races.map(r=>r.status).sort(),[200,201]);assert.deepEqual(races[0].body.data,races[1].body.data);
  ok(await call('post',`/properties/${p._id}/status`,admin,{status:'HOLDING'}));
  Transaction.create=async function(docs,...args){const result=await create.call(this,docs,...args);if(docs[0]?.type==='PAYOUT')throw new Error('Injected failure after payout credit');return result;};
  try{assert.equal((await call('post',`/properties/${p._id}/sell`,admin,{salePrice:10001,expectedPlatformFeePct:2})).status,500);}finally{Transaction.create=create;}
  assert.equal(await Payout.countDocuments({propertyId:p._id}),0);assert.equal((await Property.findById(p._id)).status,'HOLDING');assert.equal(await Investment.countDocuments({propertyId:p._id,status:'EXITED'}),0);
  const w=ok(await call('post','/wallet/withdraw',c,{amount:100,bankDetails:{accountHolder:'Dummy Person',accountNumber:'0000000000',ifsc:'TEST0000000'}}),201);
  Transaction.create=async function(docs,...args){const result=await create.call(this,docs,...args);if(docs[0]?.type==='WITHDRAWAL')throw new Error('Injected failure after withdrawal debit');return result;};
  try{assert.equal((await call('patch',`/admin/withdrawals/${w.withdrawal._id}`,admin,{status:'APPROVED'})).status,500);}finally{Transaction.create=create;}
  assert.equal((await Withdrawal.findById(w.withdrawal._id)).status,'PENDING');assert.equal(await Transaction.countDocuments({type:'WITHDRAWAL',refId:w.withdrawal._id}),0);assert.equal(ok(await call('get','/wallet',c)).reservedBalance,100);
});
