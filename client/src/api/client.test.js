import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createApi} from './client.js';
test('old identity 401 cannot clear a newer login; current revocation clears, credential errors do not',async()=>{
  const pending=[];const api=createApi('http://localhost/api/v1',(url,options)=>new Promise(resolve=>pending.push({resolve,options})));let cleared=0;api.onUnauthorized(()=>cleared++);
  const failure=code=>({ok:false,status:401,json:async()=>({success:false,error:{code,message:'Denied',details:[]}})});
  api.setAccessToken('A');const old=api.auth.me();api.setAccessToken('B');pending[0].resolve(failure('UNAUTHORIZED'));await assert.rejects(old);assert.equal(cleared,0);
  const wrong=api.auth.changePassword({currentPassword:'bad'});pending[1].resolve(failure('INVALID_CREDENTIALS'));await assert.rejects(wrong);assert.equal(cleared,0);
  const current=api.auth.me();assert.equal(pending[2].options.headers.Authorization,'Bearer B');pending[2].resolve(failure('UNAUTHORIZED'));await assert.rejects(current);assert.equal(cleared,1);
  api.setAccessToken('C');const logout=api.auth.logout();api.setAccessToken(null);assert.equal(pending[3].options.headers.Authorization,'Bearer C');pending[3].resolve({ok:true,status:200,json:async()=>({success:true,data:{loggedOut:true}})});await logout;
});
