// src/components/cv/candidate/sectionscomponents/personal/helpers.js

// Meses (para el selector de nacimiento)
export const MONTHS = [
  { v: 1, label: 'Jan' }, { v: 2, label: 'Feb' }, { v: 3, label: 'Mar' },
  { v: 4, label: 'Apr' }, { v: 5, label: 'May' }, { v: 6, label: 'Jun' },
  { v: 7, label: 'Jul' }, { v: 8, label: 'Aug' }, { v: 9, label: 'Sep' },
  { v: 10, label: 'Oct' }, { v: 11, label: 'Nov' }, { v: 12, label: 'Dec' }
];

// Preferencias de comunicación
export const COMM_PREFS = ['Email', 'Phone', 'WhatsApp'];

/** Años 1950 .. (año actual - 18) */
export function buildYears() {
  const thisYear = new Date().getFullYear();
  const max = thisYear - 18;
  const years = [];
  for (let y = 1950; y <= max; y++) years.push(y);
  return years;
}

/** Normaliza número en formato +<cc> y <number> (solo dígitos) */
export function normalizePhone(countryCodeRaw, numberRaw) {
  const cc = String(countryCodeRaw || '').replace(/[^\d]/g, '');
  const num = String(numberRaw || '').replace(/[^\d]/g, '');
  const ccOut = cc ? `+${cc}` : '';
  return { cc: ccOut, num };
}

/** Asegura esquema en URLs (https://) */
export function normalizeUrl(u) {
  const s = (u || '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
}

/** Calcula edad aprox por mes/año (string) */
export function calcAgeYears(month, year) {
  const m = Number(month);
  const y = Number(year);
  if (!m || !y) return '';
  const now = new Date();
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m) age -= 1;
  return age < 0 ? '' : String(age);
}

/* —— Helpers de layout usados por varios subcomponentes —— */
export const rowTwoCols = {
  display: 'grid',
  gridTemplateColumns: 'var(--row-2-cols, 1fr 1fr)',
  gap: 12,
};

export const labelNowrap = { whiteSpace: 'nowrap' };