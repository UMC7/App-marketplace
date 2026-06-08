const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.REACT_APP_SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Missing Supabase server configuration' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const userIds = Array.isArray(body.userIds)
      ? [...new Set(body.userIds.map((id) => String(id || '').trim()).filter(Boolean))]
      : [];

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
    return res.status(500).json({ error: error.message || 'Unexpected error' });
  }
};
