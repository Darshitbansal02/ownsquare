export function parseRupees(value) {
  if (typeof value !== 'string' || !/^(0|[1-9]\d*)(\.\d{1,2})?$/.test(value.trim())) throw new Error('Enter rupees without commas, using at most two decimal places.');
  const [whole, fraction = ''] = value.trim().split('.');
  const paise = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  if (paise > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('This amount exceeds the safe monetary limit.');
  return Number(paise);
}
export function rupeeText(paise) {
  if (paise == null) return '';
  const amount = BigInt(paise);
  return `${amount / 100n}.${String(amount % 100n).padStart(2, '0')}`;
}
export function parsePositiveInteger(value, label = 'Value') {
  if (!/^[1-9]\d*$/.test(String(value).trim())) throw new Error(`${label} must be a positive whole number.`);
  const integer = BigInt(String(value).trim());
  if (integer > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error(`${label} exceeds the safe integer limit.`);
  return Number(integer);
}
export function provisionalUnitPrice(valuation, totalUnits) {
  if (valuation == null || totalUnits == null) return null;
  const amount = BigInt(valuation); const units = BigInt(totalUnits);
  if (amount <= 0n || units <= 0n || amount % units !== 0n || (amount / units) % 100n !== 0n) throw new Error('Valuation must divide exactly into units with a whole-rupee unit price.');
  return Number(amount / units);
}
