const CLOSED_VISIBILITY_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

function parseDate(value) {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const date = /[zZ]|[+-]\d\d:\d\d$/.test(raw) ? new Date(raw) : new Date(`${raw}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getOfferBoardDate(offer) {
  return parseDate(offer?.created_at);
}

export function isOfferClosed(offer, now = new Date()) {
  const status = String(offer?.status || '').toLowerCase();
  if (status === 'deleted') return !!parseDate(offer?.deleted_at);

  const expiresAt = parseDate(offer?.expires_at);
  return !!expiresAt && expiresAt.getTime() <= now.getTime();
}

export function isOfferCurrentlyAvailable(offer, now = new Date()) {
  const status = String(offer?.status || '').toLowerCase();
  return status === 'active' && !isOfferClosed(offer, now);
}

export function isOfferVisibleOnJobBoard(offer, now = new Date()) {
  const status = String(offer?.status || '').toLowerCase();
  if (status === 'deleted') {
    const deletedAt = parseDate(offer?.deleted_at);
    if (!deletedAt) return false;
    const hideAfter = deletedAt.getTime() + CLOSED_VISIBILITY_DAYS * DAY_MS;
    return now.getTime() <= hideAfter;
  }

  const expiresAt = parseDate(offer?.expires_at);

  // Active offers without expiration stay visible.
  if (status === 'active' && !expiresAt) return true;

  // Active or paused offers that reached expiration remain visible
  // for a limited "closed" window on SeaJobs.
  if ((status === 'active' || status === 'paused') && expiresAt) {
    const hideAfter = expiresAt.getTime() + CLOSED_VISIBILITY_DAYS * DAY_MS;
    return now.getTime() <= hideAfter;
  }

  return false;
}
