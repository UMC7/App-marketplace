// src/utils/analytics/dateRanges.js

/**
 * Utilidades para rangos de fechas (frontend, sin librerías externas).
 * Fechas en local time; salida ISO YYYY-MM-DD (sin hora) para RPCs.
 */

function pad2(n) {
  return String(n).padStart(2, '0');
}

export function toISODate(d) {
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}

export function startOfDay(d = new Date()) {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

export function endOfDay(d = new Date()) {
  const dt = new Date(d);
  dt.setHours(23, 59, 59, 999);
  return dt;
}

export function addDays(d, days) {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + days);
  return dt;
}

function startOfMonth(d = new Date()) {
  const dt = new Date(d.getFullYear(), d.getMonth(), 1);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function startOfYear(d = new Date()) {
  const dt = new Date(d.getFullYear(), 0, 1);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

/**
 * Presets básicos para UI.
 * key: identificador estable
 * label: mostrar en UI
 * getRange(): { from: 'YYYY-MM-DD', to: 'YYYY-MM-DD' }
 */
export const DATE_RANGE_PRESETS = [
  {
    key: '7d',
    label: 'Last 7 days',
    getRange: () => {
      const today = startOfDay(new Date());
      const from = addDays(today, -6); // incluye hoy
      return { from: toISODate(from), to: toISODate(today) };
    },
  },
  {
    key: '30d',
    label: 'Last 30 days',
    getRange: () => {
      const today = startOfDay(new Date());
      const from = addDays(today, -29);
      return { from: toISODate(from), to: toISODate(today) };
    },
  },
  {
    key: '90d',
    label: 'Last 90 days',
    getRange: () => {
      const today = startOfDay(new Date());
      const from = addDays(today, -89);
      return { from: toISODate(from), to: toISODate(today) };
    },
  },
  {
    key: 'this_month',
    label: 'This month',
    getRange: () => {
      const from = startOfMonth(new Date());
      const to = endOfDay(new Date());
      return { from: toISODate(from), to: toISODate(to) };
    },
  },
  {
    key: 'last_month',
    label: 'Last month',
    getRange: () => {
      const now = new Date();
      const firstOfLast = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastOfLast = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: toISODate(startOfDay(firstOfLast)), to: toISODate(endOfDay(lastOfLast)) };
    },
  },
  {
    key: 'ytd',
    label: 'Year to date',
    getRange: () => {
      const from = startOfYear(new Date());
      const to = endOfDay(new Date());
      return { from: toISODate(from), to: toISODate(to) };
    },
  },
];

/**
 * Obtiene un rango por clave; fallback a 30d.
 */
export function getRangeByKey(key = '30d') {
  const preset = DATE_RANGE_PRESETS.find((p) => p.key === key) || DATE_RANGE_PRESETS[1]; // 30d
  return preset.getRange();
}

/**
 * Crea un rango custom validado.
 * Acepta Date o string parseable; normaliza a YYYY-MM-DD.
 * Si las fechas están invertidas, las corrige.
 */
export function makeCustomRange(fromInput, toInput) {
  const fromDate = startOfDay(fromInput ? new Date(fromInput) : new Date());
  const toDate = endOfDay(toInput ? new Date(toInput) : new Date());

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    // fallback: 30d
    return getRangeByKey('30d');
  }
  // corrige inversión
  if (fromDate > toDate) {
    return { from: toISODate(startOfDay(toDate)), to: toISODate(endOfDay(fromDate)) };
  }
  return { from: toISODate(fromDate), to: toISODate(toDate) };
}