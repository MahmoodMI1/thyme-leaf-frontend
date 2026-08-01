// Shared UI-state rules for the internal tools.
//
// Filters/search survive browser Back and Forward, clear when the user
// navigates with an in-app button, and reset on refresh.
//
// This is the only sessionStorage in the app. Sign-out and the 401 handler
// both call clearUi().

const PREFIX = 'ht.ui.';

const navType = () => {
  try {
    const e = performance.getEntriesByType('navigation')[0];
    return e ? e.type : 'navigate';
  } catch { return 'navigate'; }
};

export function clearUi() {
  try {
    Object.keys(sessionStorage)
      .filter(k => k.indexOf(PREFIX) === 0)
      .forEach(k => sessionStorage.removeItem(k));
  } catch { /* private mode — nothing to clear */ }
}

// Call once on mount. Returns the saved state, or null when it should start fresh.
export function loadUi(key) {
  if (navType() === 'reload') { clearUi(); return null; }
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveUi(key, value) {
  try { sessionStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch { /* private mode */ }
}

// Numeric limits, shared so every screen agrees. Mirrors the backend's ranges.
export const LIMITS = {
  qty: { min: 0.001, max: 100000 },
  price: { min: 0, max: 100000 },
  amount: { min: 0.001, max: 100000 },
  batch: { min: 1, max: 999 }
};

export function clampInt(v, { min, max }) {
  const n = parseInt(String(v).replace(/[^0-9]/g, ''), 10);
  if (!isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

export function parseAmount(v, { min, max }) {
  const n = parseFloat(v);
  if (!isFinite(n)) return null;
  if (n < min || n > max) return null;
  return Math.round(n * 1000) / 1000;
}
