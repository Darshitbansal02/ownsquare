import test from 'node:test';
import assert from 'node:assert/strict';
import { createInvestmentIntent } from './investmentIntent.mjs';
test('uncertain investment outcomes retain the key and lock the payload',()=>{
  let sequence=0;const tracker=createInvestmentIntent(()=>`key-${++sequence}`);const body={propertyId:'property-a',units:20};
  const first=tracker.prepare(body);tracker.settle(new Error('Network failed after commit'));
  assert.equal(tracker.prepare(body),first);assert.throws(()=>tracker.prepare({...body,units:21}));
  tracker.settle({status:503});assert.equal(tracker.prepare(body).key,'key-1');
  tracker.settle();assert.equal(tracker.prepare(body).key,'key-2');
});
test('a definite rejected request permits a corrected intent with a new key',()=>{
  let sequence=0;const tracker=createInvestmentIntent(()=>`key-${++sequence}`);tracker.prepare({propertyId:'a',units:2});tracker.settle({status:409,code:'INSUFFICIENT_UNITS'});
  assert.equal(tracker.prepare({propertyId:'a',units:1}).key,'key-2');
});
