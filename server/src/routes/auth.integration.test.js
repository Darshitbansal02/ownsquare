import {before,after,test} from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import {MongoMemoryReplSet} from 'mongodb-memory-server';
import {createApp} from '../app.js';
import {connectDB} from '../config/db.js';
import User from '../models/User.js';
import Property from '../models/Property.js';
import Investment from '../models/Investment.js';
import Transaction from '../models/Transaction.js';
import Enquiry from '../models/Enquiry.js';
import Notification from '../models/Notification.js';
import RefreshToken from '../models/RefreshToken.js';
const env={NODE_ENV:'test',JWT_SECRET:'test-only-secret-629f812dde80422dad0c13906098c73f',CLIENT_URL:'http://localhost:5173',ENQUIRIES_ENABLED:true,NOTIFICATIONS_ENABLED:true,PASSWORD_RESET_ENABLED:true,MAIL_FROM:'test@example.com'};
const mail=[];
let db,app,investor,broker,foreign,admin;
const password='TestPassword!23';
const token=user=>jwt.sign({role:user.role,sessionVersion:user.sessionVersion},env.JWT_SECRET,{subject:String(user._id),expiresIn:900,issuer:'ownsquare',audience:'ownsquare-web'});
const get=(url,user)=>request(app).get('/api/v1'+url).set('Authorization',`Bearer ${token(user)}`);
const post=(url,user,body={})=>request(app).post('/api/v1'+url).set('Authorization',`Bearer ${token(user)}`).send(body);
const patch=(url,user,body={})=>request(app).patch('/api/v1'+url).set('Authorization',`Bearer ${token(user)}`).send(body);
const complete={title:'Noida apartment',description:'A complete academic property listing in Noida.',type:'APARTMENT',address:'Demo block A',city:'Noida',state:'Uttar Pradesh',pincode:'201310',areaSqft:1200,valuation:1000000000,totalUnits:1000,minUnits:1,expectedAppreciationPct:12,rentalYieldPct:3,holdingPeriodMonths:24,images:[1,2,3].map(n=>({url:`https://res.cloudinary.com/test/image/upload/${n}.jpg`,publicId:String(n),name:`Image ${n}`}))};
before(async()=>{
  db=await MongoMemoryReplSet.create({binary:{version:'8.0.13',downloadDir:path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../node_modules/.cache/mongodb')},replSet:{count:1}});
  await connectDB(db.getUri());await Promise.all(Object.values(mongoose.models).map(m=>m.init()));
  app=createApp(env,{mailer:{sendMail:async m=>mail.push(m)},uploadService:{verifyMedia:async()=>{},upload:async()=>{throw new Error('Not exercised by integration test');}}});
  const hash=await bcrypt.hash(password,12);
  [investor,broker,foreign,admin]=await User.create([
    {name:'Aman Investor',email:'aman@test.com',phone:'0000000000',role:'INVESTOR',passwordHash:hash},
    {name:'Rohit Broker',email:'rohit@test.com',phone:'0000000000',role:'BROKER',brokerApproved:true,passwordHash:hash},
    {name:'Other Broker',email:'other@test.com',phone:'0000000000',role:'BROKER',brokerApproved:true,passwordHash:hash},
    {name:'Admin',email:'admin@test.com',phone:'0000000000',role:'ADMIN',passwordHash:hash}
  ]);
}, {timeout:900000});
after(async()=>{await mongoose.disconnect();await db?.stop();});

test('signup normalizes email, hashes passwords, forbids admin/mass assignment, and handles duplicate races',async()=>{
  const body={name:'New User',email:'  NEW@TEST.COM  ',phone:'0000000000',password,role:'BROKER'};
  const registered=await request(app).post('/api/v1/auth/register').send(body);assert.equal(registered.status,201);assert.equal(registered.body.data.expiresIn,900);assert.equal(registered.body.data.user.email,'new@test.com');assert.equal(registered.body.data.user.brokerApproved,false);assert.equal(registered.body.data.user.passwordHash,undefined);
  const stored=await User.findOne({email:'new@test.com'}).select('+passwordHash');assert.notEqual(stored.passwordHash,password);assert.equal(await bcrypt.compare(password,stored.passwordHash),true);
  assert.equal((await request(app).post('/api/v1/auth/register').send(body)).body.error.code,'EMAIL_ALREADY_EXISTS');
  for(const override of [{role:'ADMIN'},{brokerApproved:true},{password:'weak'}]) assert.equal((await request(app).post('/api/v1/auth/register').send({...body,...override})).status,400);
  const unapproved=await post('/properties',stored,{});assert.equal(unapproved.body.error.code,'BROKER_NOT_APPROVED');
  assert.equal((await get('/broker/properties',stored)).status,200);
  const races=await Promise.all([1,2].map(()=>request(app).post('/api/v1/auth/register').send({...body,email:'race@test.com'})));
  assert.deepEqual(races.map(r=>r.status).sort(),[201,409]);
});
test('current persisted role/active/session controls access; logout, password changes and stale claims revoke correctly',async()=>{
  const login=await request(app).post('/api/v1/auth/login').send({email:investor.email,password});assert.equal(login.status,200);
  const access=login.body.data.accessToken;
  assert.equal((await request(app).get('/api/v1/auth/me').set('Authorization',`Bearer ${access}`)).status,200);
  assert.equal((await request(app).post('/api/v1/auth/login').send({email:investor.email,password:'wrong'})).body.error.code,'INVALID_CREDENTIALS');
  assert.equal((await post('/properties',investor,{})).status,403);
  assert.equal((await get('/broker/properties',investor)).status,403);
  await User.updateOne({_id:investor._id},{$set:{isActive:false}});assert.equal((await get('/auth/me',investor)).status,401);await User.updateOne({_id:investor._id},{$set:{isActive:true}});
  const stale=jwt.sign({role:'ADMIN',sessionVersion:investor.sessionVersion},env.JWT_SECRET,{subject:String(investor._id),expiresIn:900,issuer:'ownsquare',audience:'ownsquare-web'});
  assert.equal((await request(app).post('/api/v1/properties').set('Authorization',`Bearer ${stale}`).send({})).status,403);
  assert.equal((await patch('/auth/me',investor,{role:'ADMIN'})).status,400);
  assert.equal((await post('/auth/logout',investor)).status,200);assert.equal((await request(app).get('/api/v1/auth/me').set('Authorization',`Bearer ${access}`)).status,401);
  investor=await User.findById(investor._id);
  assert.equal((await post('/auth/change-password',investor,{currentPassword:'wrong',password:'ChangedPassword!23'})).status,401);
  const old=token(investor);assert.equal((await post('/auth/change-password',investor,{currentPassword:password,password:'ChangedPassword!23'})).status,200);assert.equal((await request(app).get('/api/v1/auth/me').set('Authorization',`Bearer ${old}`)).status,401);investor=await User.findById(investor._id);
  const expired=jwt.sign({role:investor.role,sessionVersion:investor.sessionVersion},env.JWT_SECRET,{subject:String(investor._id),expiresIn:-1,issuer:'ownsquare',audience:'ownsquare-web'});assert.equal((await request(app).get('/api/v1/properties').set('Authorization',`Bearer ${expired}`)).status,401);
});
test('reset tokens are hashed, private, expiring, atomically one-use and invalidate sessions',async()=>{
  const response=await request(app).post('/api/v1/auth/forgot-password').send({email:foreign.email});assert.equal(response.status,200);assert.equal(response.body.data.requested,true);
  const missing=await request(app).post('/api/v1/auth/forgot-password').send({email:'missing@test.com'});assert.deepEqual(response.body,missing.body);
  const reset=mail.at(-1).text.match(/\/reset\/([a-f0-9]{64})/)[1];const stored=await User.findById(foreign._id).select('+resetTokenHash');assert.notEqual(stored.resetTokenHash,reset);
  const old=token(foreign);const results=await Promise.all([1,2].map(()=>request(app).post(`/api/v1/auth/reset-password/${reset}`).send({password:'NewPassword!23'})));assert.deepEqual(results.map(r=>r.status).sort(),[200,400]);
  assert.equal((await request(app).get('/api/v1/auth/me').set('Authorization',`Bearer ${old}`)).status,401);foreign=await User.findById(foreign._id);
  await request(app).post('/api/v1/auth/forgot-password').send({email:foreign.email});const expired=mail.at(-1).text.match(/\/reset\/([a-f0-9]{64})/)[1];await User.updateOne({_id:foreign._id},{$set:{resetTokenExpiresAt:new Date(0)}});assert.equal((await request(app).post(`/api/v1/auth/reset-password/${expired}`).send({password:'NewPassword!23'})).body.error.code,'INVALID_RESET_TOKEN');
});
test('drafts are partial, financials authoritative, submissions complete, rejection resubmits, and private owners are isolated',async()=>{
  const draft=await post('/properties',broker,{});assert.equal(draft.status,201);const id=draft.body.data._id;assert.equal(draft.body.data.unitPrice,null);assert.equal(draft.body.data.fundingPct,0);
  assert.equal((await get(`/properties/${id}`,foreign)).status,404);assert.equal((await patch(`/properties/${id}`,foreign,{title:'Foreign edit'})).status,404);assert.equal((await post(`/properties/${id}/submit`,foreign)).status,404);assert.equal((await get(`/properties/${id}/investors`,foreign)).status,404);
  const incomplete=await post(`/properties/${id}/submit`,broker);assert.equal(incomplete.status,400);assert.ok(incomplete.body.error.details.some(d=>d.field==='images'));
  assert.equal((await patch(`/properties/${id}`,broker,{unitPrice:1})).status,400);
  assert.equal((await patch(`/properties/${id}`,broker,{valuation:10100,totalUnits:3})).status,400);
  const updated=await patch(`/properties/${id}`,broker,complete);assert.equal(updated.status,200);assert.equal(updated.body.data.unitPrice,1000000);
  const submitted=await post(`/properties/${id}/submit`,broker);assert.equal(submitted.body.data.status,'PENDING_APPROVAL');assert.equal((await patch(`/properties/${id}`,broker,{title:'Locked edit'})).status,409);
  await Property.updateOne({_id:id},{$set:{status:'REJECTED',rejectionReason:'Replace document'}});const resubmit=await post(`/properties/${id}/submit`,broker);assert.equal(resubmit.body.data.status,'PENDING_APPROVAL');assert.equal(resubmit.body.data.rejectionReason,null);
  assert.equal((await request(app).get(`/api/v1/properties/${id}`)).status,404);
  const adminDraft=await post('/properties',admin,{});assert.equal(adminDraft.body.data.brokerId,null);
});
test('marketplace filters, historical detail, immutable published edits and real broker analytics',async()=>{
  const p=await Property.create({...complete,unitPrice:1000000,status:'LIVE',unitsSold:20,liveAt:new Date(),brokerId:broker._id,createdBy:broker._id});
  const another=await Property.create({...complete,title:'Other broker property',unitPrice:1000000,status:'LIVE',liveAt:new Date(),brokerId:foreign._id,createdBy:foreign._id});
  const fixtureId=new mongoose.Types.ObjectId(),fixtureAt=new Date();
  await Investment.create({_id:fixtureId,propertyId:p._id,investorId:investor._id,units:20,amount:20000000,idempotencyKey:crypto.randomUUID(),requestFingerprint:{propertyId:p._id,units:20},responseSnapshot:{investment:{_id:String(fixtureId),investorId:String(investor._id),propertyId:String(p._id),units:20,amount:20000000,status:'ACTIVE',payoutAmount:0,ownershipPct:2,createdAt:fixtureAt,updatedAt:fixtureAt},property:{_id:String(p._id),unitsSold:20,fundingPct:2,status:'LIVE'},walletBalance:0}});
  await Transaction.create({userId:broker._id,type:'COMMISSION',direction:'CREDIT',amount:10000000,balanceAfter:10000000,walletVersion:1,refType:'Property',refId:String(p._id)});
  const filtered=await request(app).get('/api/v1/properties?city=Noida&type=APARTMENT&minPrice=1000000&maxFundingPct=5&minFundingPct=1');assert.equal(filtered.status,200);assert.deepEqual(filtered.body.data.items.map(i=>i._id),[String(p._id)]);
  assert.equal((await request(app).get('/api/v1/properties?status=DRAFT')).status,400);assert.equal((await request(app).get('/api/v1/properties?sort=passwordHash')).status,400);assert.equal((await request(app).get('/api/v1/properties?page=0')).status,400);assert.equal((await request(app).get('/api/v1/properties?search=%5B')).status,200);
  const analytics=await get('/broker/properties',broker);assert.equal(analytics.body.data.stats.totalRaised,20000000);assert.equal(analytics.body.data.stats.commissionEarned,10000000);assert.ok(analytics.body.data.items.every(i=>i.brokerId===String(broker._id)));assert.ok(!analytics.body.data.items.some(i=>i._id===String(another._id)));
  const holders=await get(`/properties/${p._id}/investors`,broker);assert.equal(holders.body.data.items[0].displayName,'A. I.');assert.equal(holders.body.data.items[0].email,undefined);
  assert.equal((await patch(`/properties/${p._id}`,broker,{description:'An otherwise valid broker edit of a live property.'})).status,403);
  assert.equal((await patch(`/properties/${p._id}`,admin,{valuation:2000000000})).status,403);assert.equal((await patch(`/properties/${p._id}`,admin,{description:'An updated public property description from admin.'})).status,200);
  await Property.updateOne({_id:p._id},{$set:{status:'SOLD'}});assert.equal((await request(app).get(`/api/v1/properties/${p._id}`)).status,200);
});
test('enquiry participants, author integrity, notifications and capability gates',async()=>{
  const p=await Property.findOne({brokerId:broker._id,liveAt:{$ne:null}});
  const created=await post('/enquiries',investor,{propertyId:String(p._id),message:'Please share details'});assert.equal(created.status,201);const id=created.body.data._id;
  assert.equal((await post(`/enquiries/${id}/reply`,foreign,{message:'Foreign reply'})).status,404);assert.equal((await get('/enquiries',admin)).status,403);assert.equal((await post(`/enquiries/${id}/reply`,broker,{message:'Reply',from:foreign._id})).status,400);
  assert.equal((await post(`/enquiries/${id}/reply`,broker,{message:'Here are the details'})).status,200);
  const notifications=await get('/notifications',investor);assert.equal(notifications.body.data.total,1);const notification=notifications.body.data.items[0];assert.equal((await patch(`/notifications/${notification._id}/read`,foreign)).status,404);assert.equal((await patch(`/notifications/${notification._id}/read`,investor)).status,200);assert.equal((await patch(`/notifications/${notification._id}/read`,investor)).status,200);
  await Enquiry.updateOne({_id:id},{$set:{status:'CLOSED'}});assert.equal((await post(`/enquiries/${id}/reply`,broker,{message:'Closed reply'})).body.error.code,'ENQUIRY_CLOSED');
  assert.equal(await Notification.countDocuments({userId:investor._id}),1);
  const disabled=createApp({...env,ENQUIRIES_ENABLED:false,NOTIFICATIONS_ENABLED:false,PASSWORD_RESET_ENABLED:false});assert.equal((await request(disabled).get('/api/v1/enquiries').set('Authorization',`Bearer ${token(broker)}`)).body.error.code,'FEATURE_DISABLED');
  assert.equal((await request(disabled).post('/api/v1/auth/forgot-password').send({email:investor.email})).status,503);
  assert.equal((await request(app).get('/health')).status,200);
});
test('property upload enforces role, approval, size, MIME content and provider availability',async()=>{
  const realUploads=createApp(env);
  const upload=(user,buffer,type)=>request(realUploads).post('/api/v1/uploads').set('Authorization',`Bearer ${token(user)}`).field('purpose','property').attach('file',buffer,{filename:'test.jpg',contentType:type});
  assert.equal((await upload(investor,Buffer.from([255,216,255]),'image/jpeg')).status,403);
  const pending=await User.findOne({email:'new@test.com'});assert.equal((await upload(pending,Buffer.from([255,216,255]),'image/jpeg')).body.error.code,'BROKER_NOT_APPROVED');
  assert.equal((await upload(broker,Buffer.alloc(5*1024*1024+1),'image/jpeg')).status,413);
  assert.equal((await upload(broker,Buffer.from('<script>fake image</script>'),'image/jpeg')).status,415);
  assert.equal((await upload(broker,Buffer.from([255,216,255]),'image/jpeg')).body.error.code,'SERVICE_UNAVAILABLE');
});

test('refresh token rotation, reuse detection, family revocation, concurrency, lifecycle revocation, and CSRF protection', async () => {
  const refreshPassword = 'RefreshPassword!23';
  const refreshHash = await bcrypt.hash(refreshPassword, 12);
  const testUser = await User.create({
    name: 'Refresh Tester',
    email: 'refreshtester@example.com',
    phone: '0000000000',
    role: 'INVESTOR',
    passwordHash: refreshHash
  });

  // 1. Login issues access token and httpOnly refresh cookie; no raw refresh token in body
  const loginRes = await request(app).post('/api/v1/auth/login').send({ email: testUser.email, password: refreshPassword });
  assert.equal(loginRes.status, 200);
  assert.ok(loginRes.body.data.accessToken);
  assert.equal(loginRes.body.data._refreshRaw, undefined);
  const setCookies = loginRes.headers['set-cookie'];
  assert.ok(setCookies);
  const cookie1 = setCookies.find(c => c.startsWith('ownsquare_refresh='));
  assert.ok(cookie1);
  assert.ok(cookie1.includes('HttpOnly'));
  assert.ok(cookie1.includes('Path=/api/v1/auth'));

  // Database contains hashed refresh token
  const dbToken1 = await RefreshToken.findOne({ userId: testUser._id, revokedAt: null });
  assert.ok(dbToken1);
  assert.ok(dbToken1.family);
  assert.equal(dbToken1.usedAt, null);

  // 2. Refresh rotates token atomically and sets new cookie
  const refreshRes = await request(app)
    .post('/api/v1/auth/refresh')
    .set('Cookie', cookie1);
  assert.equal(refreshRes.status, 200);
  assert.ok(refreshRes.body.data.accessToken);
  assert.equal(refreshRes.body.data._refreshRaw, undefined);
  const cookie2 = refreshRes.headers['set-cookie'].find(c => c.startsWith('ownsquare_refresh='));
  assert.ok(cookie2);
  assert.notEqual(cookie1, cookie2);

  // Access token works to access protected route
  const meRes = await request(app)
    .get('/api/v1/auth/me')
    .set('Authorization', `Bearer ${refreshRes.body.data.accessToken}`);
  assert.equal(meRes.status, 200);
  assert.equal(meRes.body.data.email, testUser.email);

  // 3. Atomic one-use rotation & reuse detection: presenting already-used cookie1 triggers family revocation
  const reuseRes = await request(app)
    .post('/api/v1/auth/refresh')
    .set('Cookie', cookie1);
  assert.equal(reuseRes.status, 401);

  // Descendant cookie2 is now revoked because the family was revoked on reuse!
  const postReuseRes = await request(app)
    .post('/api/v1/auth/refresh')
    .set('Cookie', cookie2);
  assert.equal(postReuseRes.status, 401);

  // Verify all tokens in the family are marked revoked in database
  const familyTokens = await RefreshToken.find({ family: dbToken1.family });
  assert.ok(familyTokens.length >= 2);
  assert.ok(familyTokens.every(t => t.revokedAt !== null));

  // 4. Concurrent refresh attempts: exactly one wins the race
  const freshLogin = await request(app).post('/api/v1/auth/login').send({ email: testUser.email, password: refreshPassword });
  const freshCookie = freshLogin.headers['set-cookie'].find(c => c.startsWith('ownsquare_refresh='));
  const [r1, r2] = await Promise.all([
    request(app).post('/api/v1/auth/refresh').set('Cookie', freshCookie),
    request(app).post('/api/v1/auth/refresh').set('Cookie', freshCookie)
  ]);
  assert.deepEqual([r1.status, r2.status].sort(), [200, 401]);
  const winner = r1.status === 200 ? r1 : r2;
  const winningCookie = winner.headers['set-cookie'].find(c => c.startsWith('ownsquare_refresh='));
  // Winning cookie is valid and can rotate again
  const rotateAgain = await request(app).post('/api/v1/auth/refresh').set('Cookie', winningCookie);
  assert.equal(rotateAgain.status, 200);

  // 5. Inactive user rejection
  const activeCookie = rotateAgain.headers['set-cookie'].find(c => c.startsWith('ownsquare_refresh='));
  await User.updateOne({ _id: testUser._id }, { $set: { isActive: false } });
  const inactiveRefresh = await request(app).post('/api/v1/auth/refresh').set('Cookie', activeCookie);
  assert.equal(inactiveRefresh.status, 401);
  await User.updateOne({ _id: testUser._id }, { $set: { isActive: true } });

  // 6. CSRF / origin rejection
  const loginForCsrf = await request(app).post('/api/v1/auth/login').send({ email: testUser.email, password: refreshPassword });
  const csrfCookie = loginForCsrf.headers['set-cookie'].find(c => c.startsWith('ownsquare_refresh='));
  // Mismatched origin rejected with 403
  const badOrigin = await request(app)
    .post('/api/v1/auth/refresh')
    .set('Origin', 'https://malicious-site.example')
    .set('Cookie', csrfCookie);
  assert.equal(badOrigin.status, 403);
  // Allowed origin succeeds
  const goodOrigin = await request(app)
    .post('/api/v1/auth/refresh')
    .set('Origin', env.CLIENT_URL)
    .set('Cookie', csrfCookie);
  assert.equal(goodOrigin.status, 200);

  // 7. Logout revokes refresh tokens and clears cookie
  const loginForLogout = await request(app).post('/api/v1/auth/login').send({ email: testUser.email, password: refreshPassword });
  const logoutCookie = loginForLogout.headers['set-cookie'].find(c => c.startsWith('ownsquare_refresh='));
  const logoutRes = await request(app)
    .post('/api/v1/auth/logout')
    .set('Authorization', `Bearer ${loginForLogout.body.data.accessToken}`)
    .set('Cookie', logoutCookie);
  assert.equal(logoutRes.status, 200);
  const clearedCookie = logoutRes.headers['set-cookie']?.find(c => c.startsWith('ownsquare_refresh='));
  assert.ok(clearedCookie);
  // Attempting to refresh with the logged-out cookie fails
  assert.equal((await request(app).post('/api/v1/auth/refresh').set('Cookie', logoutCookie)).status, 401);

  // 8. Password reset revokes refresh tokens
  const loginForReset = await request(app).post('/api/v1/auth/login').send({ email: testUser.email, password: refreshPassword });
  const resetCookie = loginForReset.headers['set-cookie'].find(c => c.startsWith('ownsquare_refresh='));
  await request(app).post('/api/v1/auth/forgot-password').send({ email: testUser.email });
  const mailItem = mail.pop();
  const resetToken = mailItem.text.match(/\/reset\/([a-f0-9]{64})/)[1];
  await request(app).post(`/api/v1/auth/reset-password/${resetToken}`).send({ password: 'BrandNewPassword!23' });
  assert.equal((await request(app).post('/api/v1/auth/refresh').set('Cookie', resetCookie)).status, 401);
});

