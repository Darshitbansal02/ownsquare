import { invalid } from "./ApiError.js";

export function integer(value, field = "amount", minimum = 0) {
  if (!Number.isSafeInteger(value) || value < minimum) throw invalid(field, `Must be a safe integer >= ${minimum}`);
  return value;
}

export function safeNumber(value, field = "amount") {
  if (value < 0n || value > BigInt(Number.MAX_SAFE_INTEGER)) throw invalid(field, "Result exceeds safe integer range");
  return Number(value);
}

export function sum(values, field = "amount") {
  return safeNumber(values.reduce((total, value) => total + BigInt(integer(value, field)), 0n), field);
}

export function multiply(left, right, field = "amount") {
  return safeNumber(BigInt(integer(left, field)) * BigInt(integer(right, field)), field);
}

export function basisPoints(rate, field = "rate") {
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate < 0 || rate > 100) {
    throw invalid(field, "Must be a percentage between 0 and 100");
  }
  const text = String(rate);
  if (!/^\d+(\.\d{1,2})?$/.test(text)) throw invalid(field, "At most two decimal places are allowed");
  const [whole, fraction = ""] = text.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

export function percentageFloor(amount, rate) {
  return safeNumber(BigInt(integer(amount)) * BigInt(basisPoints(rate)) / 10000n);
}

export function unitPrice(valuation, totalUnits) {
  integer(valuation, "valuation", 1);
  integer(totalUnits, "totalUnits", 1);
  if (BigInt(valuation) % BigInt(totalUnits) !== 0n) throw invalid("totalUnits", "Valuation must divide exactly");
  const price = valuation / totalUnits;
  if (price % 100 !== 0) throw invalid("valuation", "Unit price must be a whole rupee");
  return price;
}

export function allocate(amount, rows, totalUnits) {
  integer(amount);
  integer(totalUnits, "totalUnits", 1);
  if (rows.length === 0 || new Set(rows.map((row) => String(row.id))).size !== rows.length) {
    throw invalid("items", "Unique nonempty allocation rows are required");
  }
  if (sum(rows.map((row) => integer(row.units, "units", 1)), "units") !== totalUnits) {
    throw invalid("units", "Allocation units do not reconcile");
  }
  const items = rows.map((row) => ({
    ...row, amount: safeNumber(BigInt(amount) * BigInt(row.units) / BigInt(totalUnits))
  }));
  const remainder = amount - sum(items.map((row) => row.amount));
  const largest = [...items].sort((a, b) => b.units - a.units || String(a.id).localeCompare(String(b.id)))[0];
  largest.amount += remainder;
  return { items, remainder, remainderId: remainder ? String(largest.id) : null };
}
