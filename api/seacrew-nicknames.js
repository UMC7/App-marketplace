const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.REACT_APP_SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MAX_USER_IDS = 100;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT = 60;
const requestsByIp = new Map();

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.socket?.remoteAddress
    || 'unknown';
}

function isRateLimited(ip) {
  const now = Date.now();
  const recent = (requestsByIp.get(ip) || []).filter((timestamp) => now - timestamp < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    requestsByIp.set(ip, recent);
    return true;
  }
  recent.push(now);
  requestsByIp.set(ip, recent);
  return false;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Missing Supabase server configuration' });
  }

  try {
    if (isRateLimited(getClientIp(req))) {
      return res.status(429).json({ error: 'Too many requests. Please try again shortly.' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const requestedIds = Array.isArray(body.userIds)
      ? [...new Set(body.userIds.map((id) => String(id || '').trim()).filter(Boolean))]
      : [];

    if (requestedIds.length > MAX_USER_IDS) {
      return res.status(400).json({ error: `A maximum of ${MAX_USER_IDS} user IDs is allowed.` });
    }

    const userIds = requestedIds.filter((id) => UUID_PATTERN.test(id));

    if (userIds.length === 0) {
      return res.status(200).json({ nicknames: {} });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase
      .from('users')
      .select('id, nickname')
      .in('id', userIds);

    if (error) {
      return res.status(500).json({ error: error.message || 'Failed to load nicknames' });
    }

    const nicknames = {};
    for (const row of data || []) {
      const id = String(row?.id || '').trim();
      const nickname = String(row?.nickname || '').trim();
      if (id) nicknames[id] = nickname;
    }

    return res.status(200).json({ nicknames });
  } catch (error) {
    console.error('[seacrew-nicknames] unexpected error:', error?.message || error);
    return res.status(500).json({ error: 'Unable to load nicknames.' });
  }
};
