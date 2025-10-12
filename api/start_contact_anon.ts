// api/start_contact_anon.ts
// @ts-nocheck
// Anonymous contact starter (no email):
// - Validates hCaptcha
// - Finds candidate by /cv/:handle
// - Creates (or reuses) an external thread
// - Stores employer info (name, org, email, consent/ip)
// - Emits a short-lived JWT (2h) scoped to the thread
// - Returns { threadId, token, chatUrl }

import { createClient } from '@supabase/supabase-js';
import { SignJWT } from 'jose';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const EXT_JWT_SECRET = process.env.EXT_JWT_SECRET!; // set it equal to your Supabase JWT secret
const APP_ORIGIN = (process.env.APP_ORIGIN || '').replace(/\/+$/, '');
const HCAPTCHA_SECRET = process.env.HCAPTCHA_SECRET!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, authorization');
}

function getIp(req) {
  const xf = (req.headers['x-forwarded-for'] as string) || '';
  return xf.split(',')[0]?.trim() || (req.headers['cf-connecting-ip'] as string) || '';
}

async function verifyHCaptcha(token: string, remoteip: string) {
  const rsp = await fetch('https://hcaptcha.com/siteverify', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret: HCAPTCHA_SECRET, response: token, remoteip }).toString(),
  });
  if (!rsp.ok) return false;
  const data = await rsp.json().catch(() => ({}));
  return !!data.success;
}

async function signThreadToken(threadId: string, ttlSeconds = 2 * 60 * 60) {
  const key = new TextEncoder().encode(EXT_JWT_SECRET);
  const now = Math.floor(Date.now() / 1000);
  return await new SignJWT({
    ext_thread_id: threadId,
    scope: 'external_chat',
    iat: now,
    nbf: now,
    exp: now + ttlSeconds,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setAudience('external-chat')
    .setSubject(threadId)
    .sign(key);
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const ip = getIp(req);
    const {
      handle,
      email,
      full_name,
      organization,
      marketing_consent,
      captcha_token,
    } = (req.body || {}) as {
      handle?: string;
      email?: string;
      full_name?: string;
      organization?: string;
      marketing_consent?: boolean;
      captcha_token?: string;
    };

    const h = (handle || '').toLowerCase().trim();
    const em = (email || '').toLowerCase().trim();
    const name = (full_name || '').trim();
    const org = (organization || '').trim();
    const consent = !!marketing_consent;
    const captcha = (captcha_token || '').trim();

    if (!h) return res.status(400).json({ error: 'Missing handle' });
    if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return res.status(400).json({ error: 'Invalid email' });
    if (!captcha) return res.status(400).json({ error: 'Missing hCaptcha token' });

    // Verify hCaptcha
    const okCaptcha = await verifyHCaptcha(captcha, ip);
    if (!okCaptcha) return res.status(403).json({ error: 'hCaptcha verification failed' });

    // Find candidate by handle
    const { data: profile, error: pErr } = await supabase
      .from('public_profiles')
      .select('id,user_id,handle')
      .eq('handle', h)
      .single();
    if (pErr || !profile) return res.status(404).json({ error: 'Profile not found' });
    const candidateId = profile.user_id as string;

    // Reuse recent open thread (same candidate + email, last 24h)
    let threadId: string | null = null;
    const { data: recent, error: rErr } = await supabase
      .from('external_participants')
      .select(
        `id,email,role,thread_id,
         external_threads!inner(id,candidate_id,status,created_at)`
      )
      .eq('role', 'employer')
      .eq('email', em)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!rErr && Array.isArray(recent)) {
      for (const row of recent as any[]) {
        const t = row.external_threads;
        if (
          t &&
          t.candidate_id === candidateId &&
          t.status === 'open' &&
          Date.now() - new Date(t.created_at).getTime() < 24 * 60 * 60 * 1000
        ) {
          threadId = t.id;
          break;
        }
      }
    }

    // Create thread if none reused
    if (!threadId) {
      const { data: newThread, error: tErr } = await supabase
        .from('external_threads')
        .insert([{ candidate_id: candidateId, source: 'cv_link', status: 'open' }])
        .select('id')
        .single();
      if (tErr || !newThread) return res.status(500).json({ error: 'Failed to create thread' });
      threadId = newThread.id as string;

      // Candidate participant (owner)
      await supabase.from('external_participants').insert([{ thread_id: threadId, role: 'candidate' }]);
    }

    // Employer participant
    const nowIso = new Date().toISOString();
    const { error: partErr } = await supabase.from('external_participants').insert([
      {
        thread_id: threadId,
        role: 'employer',
        email: em,
        full_name: name || null,
        organization: org || null,
        marketing_consent: consent,
        consent_at: consent ? nowIso : null,
        consent_ip: consent ? ip : null,
      },
    ]);
    if (partErr) return res.status(500).json({ error: 'Failed to add participant' });

    // Track click
    await supabase.from('external_events').insert([
      { thread_id: threadId, type: 'contact_click', meta: { handle: h, email: em, ip, anon: true } },
    ]);

    // Ephemeral JWT (2h)
    const token = await signThreadToken(threadId, 2 * 60 * 60);

    const chatUrl = `${APP_ORIGIN}/cv/${h}/chat/${threadId}?token=${encodeURIComponent(token)}`;
    return res.status(200).json({ threadId, token, chatUrl });
  } catch (e: any) {
    console.error('start_contact_anon error:', e?.message || e);
    return res.status(500).json({ error: 'Internal error' });
  }
}