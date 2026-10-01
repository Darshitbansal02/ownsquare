import ApiError from './ApiError.js';
export function safeMoney(value) {
  if (typeof value === 'bigint') {
    if (value < 0n || value > BigInt(Number.MAX_SAFE_INTEGER)) throw new ApiError('VALIDATION_ERROR','Money exceeds supported range');
    return Number(value);
  }
  if (!Number.isSafeInteger(value) || value < 0) throw new ApiError('VALIDATION_ERROR','Money must be nonnegative safe integer paise');
  return value;
}
export function basisPoints(rate) {
  const text=String(rate);
  if (!/^\d+(\.\d{1,2})?$/.test(text) || rate>100) throw new ApiError('VALIDATION_ERROR','Rates must be 0–100 with at most two decimals');
  const [whole,fraction='']=text.split('.');return BigInt(whole)*100n+BigInt(fraction.padEnd(2,'0'));
}
export const percentageFee=(amount,rate)=>safeMoney(BigInt(safeMoney(amount))*basisPoints(rate)/10000n);
export function distribute(amount,holdings) {
  const total=holdings.reduce((sum,row)=>sum+BigInt(row.units),0n);
  if (total<=0n) throw new ApiError('CONFLICT','There are no units to distribute');
  const items=holdings.map(row=>({...row,amount:safeMoney(BigInt(safeMoney(amount))*BigInt(row.units)/total)}));
  const remainder=safeMoney(BigInt(amount)-items.reduce((sum,row)=>sum+BigInt(row.amount),0n));
  const largest=[...items].sort((a,b)=>b.units-a.units || String(a.investorId??a._id).localeCompare(String(b.investorId??b._id)))[0];
  largest.amount+=remainder;
  return {items,remainder,remainderInvestorId:remainder ? String(largest.investorId??largest._id) : null};
}
