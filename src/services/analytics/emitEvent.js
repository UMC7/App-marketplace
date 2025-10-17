// src/services/analytics/emitEvent.js
// Lightweight client-side emitter for CV analytics events.
// - Fault-tolerant: never throws; returns { ok: boolean }.
// - Works for anon users (RLS allows INSERT).
// - Captures basic context (referrer, device, browser, lang, session).
// - Tries to send to Edge Function (geo/IP) and falls back to direct insert.

import supabase from '../../supabase';

/* ------------------------ Utilities ------------------------ */

function safeWindow() {
  return typeof window !== 'undefined' ? window : null;
}
function safeNavigator() {
  const w = safeWindow();
  return w && w.navigator ? w.navigator : null;
}
function safeDocument() {
  const w = safeWindow();
  return w && w.document ? w.document : null;
}

function uuidv4() {
  // RFC-4122 v4 using crypto if available; fallback to random.
  const w = safeWindow();
  if (w && w.crypto && w.crypto.getRandomValues) {
    const buf = new Uint8Array(16);
    w.crypto.getRandomValues(buf);
    // Set version and variant bits
    buf[6] = (buf[6] & 0x0f) | 0x40;
    buf[8] = (buf[8] & 0x3f) | 0x80;
    const hex = [...buf].map((b) => b.toString(16).padStart(2, '0')).join('');
    return (
      hex.slice(0, 8) +
      '-' +
      hex.slice(8, 12) +
      '-' +
      hex.slice(12, 16) +
      '-' +
      hex.slice(16, 20) +
      '-' +
      hex.slice(20)
    );
  }
  // Fallback (non-crypto)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getSessionId() {
  try {
    const w = safeWindow();
    if (!w || !w.sessionStorage) return null;
    const KEY = 'ydw_cv_session_id';
    let sid = w.sessionStorage.getItem(KEY);
    if (!sid) {
      sid = uuidv4();
      w.sessionStorage.setItem(KEY, sid);
    }
    return sid;
  } catch {
    return null;
  }
}

/* --- Persistent viewer_id (new) --- */
function getCookie(name) {
  try {
    const d = safeDocument();
    if (!d) return null;
    const value = `; ${d.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift() || null;
    return null;
  } catch {
    return null;
  }
}
function setCookie(name, value, days = 3650) {
  try {
    const d = safeDocument();
    if (!d) return;
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    d.cookie = `${name}=${value}; Expires=${expires}; Path=/; SameSite=Lax`;
  } catch {}
}
function getViewerId() {
  const KEY = 'ydw_cv_viewer_id';
  try {
    const w = safeWindow();
    // Try localStorage
    if (w && w.localStorage) {
      let vid = w.localStorage.getItem(KEY);
      if (!vid) {
        vid = uuidv4();
        w.localStorage.setItem(KEY, vid);
      }
      return vid;
    }
  } catch {}
  // Fallback to cookie
  try {
    let vid = getCookie(KEY);
    if (!vid) {
      vid = uuidv4();
      setCookie(KEY, vid);
    }
    return vid;
  } catch {
    // Last resort: ephemeral UUID (won't persist if storage is blocked)
    return uuidv4();
  }
}

function parseUA() {
  const n = safeNavigator();
  const ua = n?.userAgent || '';
  const platform = n?.platform || '';

  let device = 'Desktop';
  if (/Mobi|Android|iPhone/i.test(ua)) device = 'Mobile';
  else if (/iPad|Tablet/i.test(ua)) device = 'Tablet';

  let browser = 'Unknown';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/OPR\//i.test(ua)) browser = 'Opera';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/Chrome\//i.test(ua)) browser = 'Chrome';
  else if (/Safari\//i.test(ua)) browser = 'Safari';

  let os = 'Unknown';
  if (/Windows/i.test(ua) || /Win/i.test(platform)) os = 'Windows';
  else if (/Mac OS X|Macintosh/i.test(ua) || /Mac/i.test(platform)) os = 'macOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iOS/i.test(ua)) os = 'iOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  return { device, browser, os, userAgent: ua };
}

function getReferrer() {
  const d = safeDocument();
  const ref = d?.referrer || '';
  return ref && ref.trim() ? ref : 'Direct';
}

function getLanguage() {
  const n = safeNavigator();
  return n?.language || n?.languages?.[0] || '';
}

function edgeUrl() {
  // Public URL of the Edge Function (set in .env / hosting env)
  // Example: https://<project-ref>.functions.supabase.co/functions/v1/cv_analytics_event
  return (
    process.env.REACT_APP_EDGE_ANALYTICS_URL ||
    process.env.NEXT_PUBLIC_EDGE_ANALYTICS_URL ||
    ''
  );
}

async function postToEdge(payload) {
  const url = edgeUrl();
  if (!url) return { ok: false };
  try {
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = ctrl ? setTimeout(() => ctrl.abort(), 5000) : null;

    const res = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl?.signal,
    });

    if (timeoutId) clearTimeout(timeoutId);
    if (!res.ok) return { ok: false };
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

function sanitizeJson(obj) {
  try {
    // Ensure serializable shallow object
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return null;
  }
}

/* --- Geo helper (client-side fallback) --- */
async function getGeoFromBrowser() {
  try {
    const r = await fetch('https://ipapi.co/json/');
    if (!r.ok) return { country: null, city: null };
    const j = await r.json();
    return { country: j.country_name || null, city: j.city || null };
  } catch {
    return { country: null, city: null };
  }
}

/* ------------------------ Core emitter ------------------------ */

/**
 * Emits a single analytics event into public.cv_analytics_events.
 * Tries Edge Function first (better geo/referrer/IP), then falls back to direct insert.
 * @param {Object} opts
 * @param {string} opts.type                - 'view' | 'profile_open' | 'contact_open' | 'chat_start' | 'cv_download' | ...
 * @param {string} [opts.ownerUserId]       - UUID of CV owner (recommended)
 * @param {string} [opts.handle]            - Public handle of the CV (recommended)
 * @param {string} [opts.referrer]          - Override referrer; defaults to document.referrer or 'Direct'
 * @param {string} [opts.country]           - Optional geo (client-side only; Edge preferred)
 * @param {string} [opts.city]              - Optional geo (client-side only; Edge preferred)
 * @param {string} [opts.ipHash]            - Optional hashed IP (server/edge ideal)
 * @param {Object} [opts.extra]             - Extra JSON payload (will be stored in extra_data)
 * @returns {Promise<{ok: boolean}>}
 */
export async function emitEvent({
  type,
  ownerUserId = null,
  handle = null,
  referrer,
  country = null,
  city = null,
  ipHash = null,
  extra = null,
} = {}) {
  try {
    if (!type) return { ok: false };

    const ctx = parseUA();
    const sessionId = getSessionId();
    const viewerId = getViewerId(); // <-- persistent visitor id
    const lang = getLanguage();
    const ref = (referrer && String(referrer)) || getReferrer();

    // Try to enrich geo on the client if not provided
    const geo = await getGeoFromBrowser();
    const countryDetected = country ?? geo.country;
    const cityDetected = city ?? geo.city;

    // Payload for direct insert (keeps everything)
    const directPayload = {
      owner_user_id: ownerUserId || null,
      handle: handle || null,
      event_type: String(type),
      session_id: sessionId ? sessionId : null,
      viewer_id: viewerId || null, // <-- include persistent viewer_id
      referrer: ref,
      user_agent: ctx.userAgent || null,
      device: ctx.device || null,
      browser: ctx.browser || null,
      os: ctx.os || null,
      language: lang || null,
      country: countryDetected || null,
      city: cityDetected || null,
      ip_hash: ipHash || null,
      extra_data: extra ? sanitizeJson(extra) : null,
    };

    // Payload for Edge (server figures out geo/ip)
    const edgePayload = {
      event_type: String(type),
      handle: handle || null,
      user_id: ownerUserId || null,
      referrer: ref,
      user_agent: ctx.userAgent || null,
      // helpful context (optional)
      session_id: sessionId || null,
      viewer_id: viewerId || null, // <-- forward to edge as well
      language: lang || null,
      device: ctx.device || null,
      browser: ctx.browser || null,
      os: ctx.os || null,
      // pass along client-detected geo as a hint
      country: countryDetected || null,
      city: cityDetected || null,
      extra_data: extra ? sanitizeJson(extra) : null,
    };

    // Try Edge first
    const tryEdge = await postToEdge(edgePayload);
    if (tryEdge.ok) return { ok: true };

    // Fallback: direct insert (previous behavior)
    const { error } = await supabase.from('cv_analytics_events').insert(directPayload);
    return { ok: !error };
  } catch {
    return { ok: false };
  }
}

/* ------------------------ Convenience helpers ------------------------ */

export function emitView(args) {
  return emitEvent({ ...args, type: 'view' });
}
export function emitProfileOpen(args) {
  return emitEvent({ ...args, type: 'profile_open' });
}
export function emitContactOpen(args) {
  return emitEvent({ ...args, type: 'contact_open' });
}
export function emitChatStart(args) {
  return emitEvent({ ...args, type: 'chat_start' });
}
export function emitCvDownload(args) {
  return emitEvent({ ...args, type: 'cv_download' });
}
export function emitShareClick(args) {
  return emitEvent({ ...args, type: 'share_click' });
}
export function emitSectionView(args) {
  // Expect extra: { section: 'Experience' }
  return emitEvent({ ...args, type: 'section_view' });
}
export function emitMediaPlay(args) {
  // Expect extra: { mediaId, mediaType }
  return emitEvent({ ...args, type: 'media_play' });
}
export function emitLinkOut(args) {
  // Expect extra: { href, label }
  return emitEvent({ ...args, type: 'link_out' });
}
export function emitBookmarkProfile(args) {
  return emitEvent({ ...args, type: 'bookmark_profile' });
}
export function emitErrorEvent(args) {
  // Expect extra: { message, code, stack? }
  return emitEvent({ ...args, type: 'error' });
}

export default {
  emitEvent,
  emitView,
  emitProfileOpen,
  emitContactOpen,
  emitChatStart,
  emitCvDownload,
  emitShareClick,
  emitSectionView,
  emitMediaPlay,
  emitLinkOut,
  emitBookmarkProfile,
  emitErrorEvent,
};