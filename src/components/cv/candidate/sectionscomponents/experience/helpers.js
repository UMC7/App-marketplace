// src/components/cv/candidate/sectionscomponents/experience/helpers.js

/* =========================
   Fecha: YYYY-MM helpers
========================= */

/** Devuelve solo dígitos (YYYYMM), máx 6 chars */
export const ymOnlyDigits = (s = '') => String(s).replace(/\D/g, '').slice(0, 6);

/** OnChange: deja tipear libre y agrega el guion al pasar 4 dígitos */
export function ymFormatOnChange(value) {
  const d = ymOnlyDigits(value); // YYYYMM (parcial)
  if (d.length <= 4) return d;               // "2024"
  return `${d.slice(0, 4)}-${d.slice(4)}`;   // "2024-0" / "2024-05"
}

/** Normaliza a "YYYY-MM" (clamp mes 1..12) o '' si inválido */
export function ymNormalize(value) {
  if (!value) return '';
  const m = String(value).match(/^(\d{4})(?:-?)(\d{1,2})$/);
  if (!m) return '';
  const year = m[1];
  const mmNum = Math.min(12, Math.max(1, Number(m[2] || 0)));
  const mm = String(mmNum).padStart(2, '0');
  return `${year}-${mm}`;
}

/* =========================
   Notas / metadatos (tags)
========================= */

/**
 * Construye tags para notas de experiencia en yates
 * (idéntico al original: use, propulsion, potencia, cruces, astillero, crew bucket)
 */
export function buildNoteTags({
  use,
  propulsion,
  powerValue,
  powerUnit,
  crossings,
  yardPeriod,
  crewBucket,
}) {
  const tags = [];
  if (use) tags.push(`use:${use}`);
  if (propulsion) tags.push(`propulsion:${propulsion}`);
  if (powerValue && powerUnit) tags.push(`power_${String(powerUnit).toLowerCase()}:${powerValue}`);
  if (crossings) tags.push(`crossings:${crossings}`);
  if (yardPeriod) tags.push(`yard:${yardPeriod}`);
  if (crewBucket && !['1', '2', '3', '4'].includes(crewBucket))
    tags.push(`crew_bucket:${crewBucket}`);
  return tags.length ? `[${tags.join('|')}]` : null;
}

/**
 * Construye tags para notas de experiencia shore (supervisión)
 */
export function buildShoreTags({ supervised }) {
  const tags = [];
  if (supervised) tags.push(`supervised:${supervised}`);
  return tags.length ? `[${tags.join('|')}]` : null;
}

/* =========================
   Otras utilidades
========================= */

/**
 * Oculta/inhabilita campos técnicos (GT, Engine power, Propulsion Type, Engine brand)
 * para departamentos no técnicos: Interior, Galley y Others.
 */
export function hideTechForRole(department) {
  const d = String(department || '').toLowerCase();
  return d === 'interior' || d === 'galley' || d === 'others' || d === 'other';
}