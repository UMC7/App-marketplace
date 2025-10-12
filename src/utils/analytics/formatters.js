// src/utils/analytics/formatters.js

/** ---------- Helpers base ---------- */
export function toNumber(v, decimals = 0) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  const p = 10 ** decimals;
  return Math.round(n * p) / p;
}

export function clamp(n, min, max) {
  const x = Number(n);
  if (!Number.isFinite(x)) return min;
  return Math.max(min, Math.min(max, x));
}

/** ---------- Números ---------- */
export function formatInt(n, locale) {
  const x = toNumber(n, 0);
  return x.toLocaleString(locale || undefined, { maximumFractionDigits: 0 });
}

export function formatFloat(n, decimals = 1, locale) {
  const x = toNumber(n, decimals);
  return x.toLocaleString(locale || undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPercent(value, decimals = 1, locale) {
  const x = toNumber(value, decimals);
  return `${formatFloat(x, decimals, locale)}%`;
}

export function formatCompact(n, locale) {
  const x = toNumber(n, 0);
  try {
    return x.toLocaleString(locale || undefined, { notation: 'compact', maximumFractionDigits: 1 });
  } catch {
    // Fallback simple
    if (x >= 1_000_000) return `${toNumber(x / 1_000_000, 1)}M`;
    if (x >= 1_000) return `${toNumber(x / 1_000, 1)}K`;
    return String(x);
  }
}

/** ---------- Deltas / variaciones ---------- */
export function computeDelta(current, previous) {
  const curr = Number(current) || 0;
  const prev = Number(previous) || 0;
  const diff = curr - prev;
  const pct = prev === 0 ? (curr === 0 ? 0 : 100) : (diff / prev) * 100;
  const sign = diff === 0 ? 0 : diff > 0 ? 1 : -1;
  return { curr, prev, diff, pct, sign };
}

export function formatDeltaLabel(current, previous, { decimals = 1, locale } = {}) {
  const { diff, pct, sign } = computeDelta(current, previous);
  const arrow = sign > 0 ? '▲' : sign < 0 ? '▼' : '—';
  const pctStr = formatPercent(Math.abs(pct), decimals, locale);
  return `${arrow} ${formatInt(Math.abs(diff), locale)} (${pctStr})`;
}

/** ---------- Fechas ---------- */
function pad2(n) {
  return String(n).padStart(2, '0');
}

export function formatDateISO(iso, locale) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  try {
    return d.toLocaleDateString(locale || undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }
}

export function formatDateShort(iso, locale) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  try {
    return d.toLocaleDateString(locale || undefined, { month: 'short', day: 'numeric' });
  } catch {
    return `${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}`;
  }
}

export function formatRangeLabel(fromISO, toISO, locale) {
  if (!fromISO || !toISO) return '';
  const from = new Date(fromISO);
  const to = new Date(toISO);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return '';
  const sameYear = from.getFullYear() === to.getFullYear();
  const sameMonth = sameYear && from.getMonth() === to.getMonth();

  if (sameMonth) {
    const m = from.toLocaleString(locale || undefined, { month: 'short' });
    return `${m} ${from.getDate()}–${to.getDate()}, ${to.getFullYear()}`;
  }
  if (sameYear) {
    const left = from.toLocaleString(locale || undefined, { month: 'short', day: 'numeric' });
    const right = to.toLocaleString(locale || undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    return `${left} – ${right}`;
  }
  const left = from.toLocaleString(locale || undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const right = to.toLocaleString(locale || undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  return `${left} – ${right}`;
}

/** ---------- Arrays ---------- */
export function safeSum(arr, key) {
  if (!Array.isArray(arr) || !key) return 0;
  return arr.reduce((acc, it) => acc + (Number(it?.[key]) || 0), 0);
}

export function sortDescBy(arr, key) {
  const a = Array.isArray(arr) ? [...arr] : [];
  return a.sort((x, y) => (Number(y?.[key]) || 0) - (Number(x?.[key]) || 0));
}