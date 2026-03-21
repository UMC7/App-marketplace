export function parseAvailability(value) {
  const raw = String(value || '').trim();
  const match = /^Date specific:\s*(\d{4}-\d{2}-\d{2})$/.exec(raw);
  return {
    raw,
    isDateSpecific: raw === 'Date specific' || /^Date specific:\s*/.test(raw),
    date: match ? match[1] : '',
  };
}

export function hasValidAvailability(value) {
  const parsed = parseAvailability(value);
  if (!parsed.raw) return false;
  if (!parsed.isDateSpecific) return true;
  return !!parsed.date;
}

export function formatAvailability(value, locale = undefined) {
  const parsed = parseAvailability(value);
  if (!parsed.raw) return '';
  if (!parsed.isDateSpecific) return parsed.raw;
  if (!parsed.date) return '';

  const dt = new Date(`${parsed.date}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return `Date specific: ${parsed.date}`;
  return `Date specific: ${dt.toLocaleDateString(locale || undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })}`;
}
