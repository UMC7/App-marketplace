/**
 * Parsea un timestamp devuelto por el servidor (Supabase/Postgres) y devuelve un Date
 * que representa ese instante. Si la cadena no incluye zona horaria (Z o ±), se asume UTC,
 * para que toLocaleTimeString() / toLocaleString() muestren la hora local del usuario.
 * @param {string|number|Date|null|undefined} str
 * @returns {Date}
 */
export function parseServerDate(str) {
  if (str == null || str === '') return new Date(NaN);
  if (typeof str === 'number' || str instanceof Date) return new Date(str);
  const s = String(str).trim();
  if (/[Zz]$/.test(s) || /[+-]\d{2}:?\d{2}$/.test(s) || /[+-]\d{2}$/.test(s))
    return new Date(s);
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(s)) {
    const iso = s.replace(' ', 'T');
    return new Date(iso.endsWith('Z') ? iso : iso + 'Z');
  }
  return new Date(s);
}

/**
 * Formatea una fecha en hora local del usuario (solo hora:minuto).
 * @param {Date|string|number} date
 * @returns {string}
 */
export function formatTimeLocal(date) {
  const d = date instanceof Date ? date : parseServerDate(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

/**
 * Formatea fecha y hora en hora local del usuario.
 * @param {Date|string|number} date
 * @param {Intl.DateTimeFormatOptions} [options]
 * @returns {string}
 */
export function formatDateTimeLocal(date, options = {}) {
  const d = date instanceof Date ? date : parseServerDate(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  });
}
