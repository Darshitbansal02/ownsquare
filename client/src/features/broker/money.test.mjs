import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRupees, rupeeText, parsePositiveInteger, provisionalUnitPrice } from './money.mjs';
import { createSessionFence, safeReturnPath } from '../../pages/auth/sessionFence.mjs';

test('decimal input is exact and safe at the integer boundary', () => {
  assert.equal(parseRupees('10000000.01'), 1000000001);
  assert.equal(parseRupees('90071992547409.91'), Number.MAX_SAFE_INTEGER);
  assert.equal(rupeeText(Number.MAX_SAFE_INTEGER), '90071992547409.91');
  for (const value of ['90071992547409.92', '1.001', '-1', '1e3', '1,000', '.1', '', '01', 'Infinity']) assert.throws(() => parseRupees(value));
});
test('draft financials may be partial but paired financials need whole-rupee division', () => {
  assert.equal(provisionalUnitPrice(null, 1000), null);
  assert.equal(provisionalUnitPrice(1000000000, null), null);
  assert.equal(provisionalUnitPrice(1000000000, 1000), 1000000);
  assert.throws(() => provisionalUnitPrice(100001, 100));
  assert.throws(() => provisionalUnitPrice(100000, 3));
  assert.throws(() => parsePositiveInteger('1.5'));
  assert.throws(() => parsePositiveInteger('9007199254740992'));
});
test('responses begun before logout or another sign-in cannot commit', async () => {
  const fence = createSessionFence();
  const firstAccountRequest = fence.next();
  const response = Promise.resolve('private account A data');
  fence.next(); // logout
  const secondAccountRequest = fence.next();
  assert.equal(fence.accepts(firstAccountRequest), false);
  assert.equal(fence.accepts(secondAccountRequest), true);
  assert.equal(fence.accepts(firstAccountRequest) ? await response : null, null);
});
test('post-login return paths remain internal and within persisted role', () => {
  assert.equal(safeReturnPath('/broker/properties?a=1', 'BROKER'), '/broker/properties?a=1');
  for (const path of ['//evil.example', '/brokerish', '/admin', '/broker\\evil', '/broker/../admin', '/broker/%2e%2e/admin', 'https://evil.example']) assert.equal(safeReturnPath(path, 'BROKER'), '/broker');
  assert.equal(safeReturnPath('/profile', 'INVESTOR'), '/profile');
});
