const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SEARCHABLE_TEXT_COLUMNS = ['nickname', 'email', 'first_name', 'last_name'];

/** Escape `%`, `_`, and `\` for use inside a SQL ILIKE pattern. */
export function escapeIlikePattern(raw) {
  return String(raw || '')
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
}

function quotePostgrestFilterValue(value) {
  const str = String(value);
  if (/[,()]/.test(str) || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Builds a PostgREST `.or()` filter for admin user search (case-insensitive partial match).
 * Returns null when the term is empty.
 */
export function buildAdminUserSearchOrFilter(rawSearch) {
  const trimmed = String(rawSearch || '').trim();
  if (!trimmed) return null;

  const parts = [];
  if (UUID_RE.test(trimmed)) {
    parts.push(`id.eq.${trimmed}`);
  }

  const pattern = quotePostgrestFilterValue(`%${escapeIlikePattern(trimmed)}%`);
  SEARCHABLE_TEXT_COLUMNS.forEach((column) => {
    parts.push(`${column}.ilike.${pattern}`);
  });

  return parts.join(',');
}

export function applyAdminUserSearchFilter(query, rawSearch) {
  const orFilter = buildAdminUserSearchOrFilter(rawSearch);
  if (!orFilter) return query;
  return query.or(orFilter);
}
