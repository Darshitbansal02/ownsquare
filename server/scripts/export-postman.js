import fs from 'node:fs/promises';
const specification=await fs.readFile(new URL('../../API_DESIGN.md',import.meta.url),'utf8');
const bodies={
  'POST /auth/register':{name:'Demo Investor',email:'{{email}}',phone:'0000000000',password:'{{password}}',role:'INVESTOR'},
  'POST /auth/login':{email:'{{email}}',password:'{{password}}'},
  'POST /auth/forgot-password':{email:'{{email}}'},'POST /auth/reset-password/:token':{password:'{{newPassword}}'},
  'PATCH /auth/me':{name:'Demo User',phone:'0000000000'},'POST /auth/change-password':{currentPassword:'{{password}}',password:'{{newPassword}}'},
  'POST /properties':{title:'Academic property draft'},'PATCH /properties/:id':{description:'Updated academic property description for review.'},
  'POST /properties/:id/reject':{reason:'Please clarify the academic disclosure.'},'POST /properties/:id/status':{status:'HOLDING'},
  'POST /properties/:id/sell':{salePrice:1400000000,expectedPlatformFeePct:2},'POST /investments':{propertyId:'{{propertyId}}',units:20},
  'POST /wallet/topup/order':{amount:50000000},'POST /wallet/topup/verify':{gatewayOrderId:'{{gatewayOrderId}}',gatewayPaymentId:'{{gatewayPaymentId}}',mockOrderToken:'{{mockOrderToken}}'},
  'POST /wallet/withdraw':{amount:10000,bankDetails:{accountHolder:'Dummy Person',accountNumber:'0000000000',ifsc:'TEST0000000'}},
  'PATCH /admin/users/:id':{brokerApproved:true},'PATCH /admin/kyc/:userId':{status:'APPROVED'},'PATCH /admin/withdrawals/:id':{status:'APPROVED'},
  'PATCH /admin/settings':{platformFeePct:2,brokerCommissionPct:1,maxOwnershipPct:49},
  'POST /enquiries':{propertyId:'{{propertyId}}',message:'Please explain the academic property disclosure.'},'POST /enquiries/:id/reply':{message:'Here is the clarification.'},
  'POST /kyc':{docs:[{url:'{{privateDocumentUrl}}',publicId:'{{privateDocumentId}}',name:'Dummy document'}],selfie:{url:'{{privateSelfieUrl}}',publicId:'{{privateSelfieId}}',name:'Dummy selfie'}}
};
const endpoints=[...specification.matchAll(/^### (GET|POST|PATCH) (\/[^\s]+) /gm)];
const items=endpoints.map(([,method,route])=>{
  const name=`${method} ${route}`,id=route.startsWith('/properties')?'propertyId':route.startsWith('/notifications')?'notificationId':route.startsWith('/enquiries')?'enquiryId':route.includes('/withdrawals')?'withdrawalId':'userId';
  let url=(route==='/health'?'{{origin}}':'{{baseUrl}}')+route.replace(':id',`{{${id}}}`).replace(':userId','{{userId}}').replace(':token','{{resetToken}}');
  if(route.endsWith('payout-preview'))url+='?salePrice=1400000000';
  const header=[{key:'Accept',value:'application/json'}];
  if(route==='/investments'&&method==='POST')header.push({key:'Idempotency-Key',value:'{{idempotencyKey}}'});
  let body;
  if(method!=='GET'){header.push({key:'Content-Type',value:'application/json'});body={mode:'raw',raw:JSON.stringify(bodies[name]??{},null,2),options:{raw:{language:'json'}}};}
  if(route==='/uploads'){header.pop();body={mode:'formdata',formdata:[{key:'purpose',value:'property',type:'text'},{key:'file',type:'file',src:''}]};}
  return {name,request:{method,url,header,...(body&&{body}),description:'Use the correct role token. See API_DESIGN.md for filters, validation and expected errors. Only dummy data and signed academic mock payments.'}};
});
await fs.writeFile(new URL('../../docs/OwnSquare.postman_collection.json',import.meta.url),JSON.stringify({info:{name:'OwnSquare P0/P1 API',schema:'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',description:'Set local variables; no secrets are included. Copy login accessToken to accessToken. Copy signed order proof to gateway variables. Generate one UUID per investment intent and retain it on retry.'},auth:{type:'bearer',bearer:[{key:'token',value:'{{accessToken}}',type:'string'}]},variable:[{key:'origin',value:'http://localhost:5000'},{key:'baseUrl',value:'http://localhost:5000/api/v1'},...['accessToken','email','password','newPassword','propertyId','userId','withdrawalId','enquiryId','notificationId','resetToken','idempotencyKey','gatewayOrderId','gatewayPaymentId','mockOrderToken','privateDocumentUrl','privateDocumentId','privateSelfieUrl','privateSelfieId'].map(key=>({key,value:''}))],item:items},null,2)+'\n');
console.log(`Exported ${items.length} documented endpoints`);
