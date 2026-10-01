/**
 * Indian Rupee (INR) currency display formatter
 * Takes integer paise and formats into Indian numbering format (e.g., ₹1,00,00,000)
 */
export function formatINR(paise) {
  if (paise === null || paise === undefined || isNaN(paise)) return '₹0';
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(rupees);
}

export function formatNumberIN(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return new Intl.NumberFormat('en-IN').format(num);
}
