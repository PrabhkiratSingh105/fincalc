export function formatINR(value, { decimals = 0, compact = false } = {}) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '₹0';

  if (compact) {
    const abs = Math.abs(num);
    if (abs >= 1e7) return `₹${(num / 1e7).toFixed(2)} Cr`;
    if (abs >= 1e5) return `₹${(num / 1e5).toFixed(2)} L`;
    if (abs >= 1e3) return `₹${(num / 1e3).toFixed(1)} K`;
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
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
