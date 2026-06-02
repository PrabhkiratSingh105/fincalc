function addIndianCommas(num) {
  const isNegative = num < 0;
  const numStr = Math.abs(num).toString();
  const parts = numStr.split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  // First reverse to apply commas from the right
  const reversed = integerPart.split('').reverse().join('');
  
  // Apply Indian comma pattern: first 3 digits from right, then 2 after every 2 digits
  let formattedReversed = '';
  for (let i = 0; i < reversed.length; i++) {
    if (i === 3 || (i > 3 && (i - 3) % 2 === 0)) {
      formattedReversed += ',';
    }
    formattedReversed += reversed[i];
  }
  
  // Reverse back to normal
  const formatted = formattedReversed.split('').reverse().join('');
  
  let result = formatted;
  if (decimalPart) {
    result += '.' + decimalPart;
  }
  
  return (isNegative ? '-' : '') + result;
}

export function formatINR(value, { decimals = 0, compact = false } = {}) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '₹0';

  if (compact) {
    const abs = Math.abs(num);
    if (abs >= 1e7) return `₹${addIndianCommas((num / 1e7).toFixed(2))} Cr`;
    if (abs >= 1e5) return `₹${addIndianCommas((num / 1e5).toFixed(2))} L`;
    if (abs >= 1e3) return `₹${addIndianCommas((num / 1e3).toFixed(1))} K`;
  }

  // For non-compact format, format with decimals first then add commas
  const formattedNum = num.toFixed(decimals);
  return `₹${addIndianCommas(parseFloat(formattedNum))}`;
}

export function formatPercent(value, decimals = 2) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0%';
  return `${num.toFixed(decimals)}%`;
}

export function formatAxis(value) {
  if (value >= 1e7) return `₹${(value / 1e7).toFixed(1)}Cr`;
  if (value >= 1e5) return `₹${(value / 1e5).toFixed(0)}L`;
  if (value >= 1e3) return `₹${(value / 1e3).toFixed(0)}K`;
  return `₹${Math.round(value)}`;
}

export function parseNum(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}
