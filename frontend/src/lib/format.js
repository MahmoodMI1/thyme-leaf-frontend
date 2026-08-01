// Display formatting.
//
// The server sends numbers with trailing decimals (qty 5.000, amount 0.500,
// unitPrice 4.290000). They are numbers — parse as numbers, format here, never
// store a formatted value.

/** Money, always two decimals: 24.3 -> "$24.30". */
export const money = (v) => '$' + Number(v).toFixed(2);

/**
 * Derived unit price: two decimals from a dollar up, three below, so
 * cheap-per-unit ingredients keep their precision.
 */
export function unitPriceLabel(unitPrice, unit) {
  const v = Number(unitPrice);
  if (!isFinite(v)) return '—';
  return '$' + (v >= 1 ? v.toFixed(2) : v.toFixed(3)) + ' / ' + (unit || 'unit');
}

/** unitPrice from a food record, or null when it can't be derived. */
export function unitPriceOf(food) {
  if (!food) return null;
  if (food.unitPrice != null) return Number(food.unitPrice);
  const q = Number(food.qty), p = Number(food.price);
  return isFinite(q) && isFinite(p) && q > 0 ? p / q : null;
}

/**
 * A bare number for display: trims trailing zeros, keeps up to three decimals.
 * 4.000 -> "4", 0.500 -> "0.5", 0.125 -> "0.125".
 */
export function num(v) {
  const n = Number(v);
  if (!isFinite(n)) return '—';
  return String(Math.round(n * 1000) / 1000);
}

/** An ingredient amount with its unit: "0.5 lb". */
export const amountLabel = (amount, unit) => num(amount) + (unit ? ' ' + unit : '');
