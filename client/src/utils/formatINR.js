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

/**
 * Compact Indian Currency Display (e.g. ₹1.4 Cr, ₹50 L)
 */
export function formatCompactINR(paise) {
  if (paise === null || paise === undefined || isNaN(paise)) return '₹0';
  const rupees = paise / 100;
  if (rupees >= 10000000) {
    const cr = rupees / 10000000;
    return `₹${cr % 1 === 0 ? cr : cr.toFixed(2)} Cr`;
  }
  if (rupees >= 100000) {
    const l = rupees / 100000;
    return `₹${l % 1 === 0 ? l : l.toFixed(2)} L`;
  }
  if (rupees >= 1000) {
    const k = rupees / 1000;
    return `₹${k % 1 === 0 ? k : k.toFixed(1)} K`;
  }
  return formatINR(paise);
}

/**
 * Format ISO UTC timestamp to localized Indian format
 */
export function formatDateIN(dateString, includeTime = false) {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    const options = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      ...(includeTime ? { hour: '2-digit', minute: '2-digit', hour12: true } : {})
    };
    return new Intl.DateTimeFormat('en-IN', options).format(date);
  } catch {
    return '—';
  }
}
