export function toNumber(value, fallback = 0) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  const cleaned = String(value ?? '')
    .replace(/[₹,\s]/g, '')
    .replace(/[^\d.-]/g, '');
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : fallback;
}

export function addIndianCommas(value) {
  const raw = String(value ?? '').replace(/,/g, '');
  if (!raw) return '';

  const isNegative = raw.startsWith('-');
  const [integer = '0', decimal] = raw.replace(/^-/, '').split('.');
  const formattedInteger =
    integer.length > 3
      ? `${integer.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${integer.slice(-3)}`
      : integer;

  return `${isNegative ? '-' : ''}${formattedInteger}${decimal != null ? `.${decimal}` : ''}`;
}

function trimTrailingZeros(value) {
  return String(value).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
}

export function formatIndianNumberInput(value) {
  const raw = String(value ?? '').replace(/[₹,\s]/g, '').replace(/[^\d.-]/g, '');
  if (!raw || raw === '-' || raw === '.') return raw;

  const [integer, decimal] = raw.split('.');
  return addIndianCommas(`${integer}${decimal != null ? `.${decimal}` : ''}`);
}

export function formatINR(value, { decimals = 0, compact = 'auto' } = {}) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '₹0';

  const abs = Math.abs(num);
  const shouldCompact = compact === true || (compact === 'auto' && abs >= 100000);
  if (shouldCompact) {
    if (abs >= 1e7) return `₹${trimTrailingZeros((num / 1e7).toFixed(2))} Cr`;
    if (abs >= 1e5) return `₹${trimTrailingZeros((num / 1e5).toFixed(2))} Lakh`;
  }

  return `₹${addIndianCommas(trimTrailingZeros(num.toFixed(decimals)))}`;
}

export function formatPercent(value, decimals = 2) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0%';
  return `${trimTrailingZeros(num.toFixed(decimals))}%`;
}

export function formatAxis(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '₹0';

  const abs = Math.abs(num);
  if (abs >= 1e7) return `₹${trimTrailingZeros((num / 1e7).toFixed(1))} Cr`;
  if (abs >= 1e5) return `₹${trimTrailingZeros((num / 1e5).toFixed(1))} L`;
  if (abs >= 1e3) return `₹${trimTrailingZeros((num / 1e3).toFixed(0))}K`;
  return `₹${Math.round(num)}`;
}

export function parseNum(value, fallback = 0) {
  return toNumber(value, fallback);
}
