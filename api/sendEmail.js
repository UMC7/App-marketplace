// /api/sendEmail.js
// Requiere autenticación (Bearer Supabase) y throttling por IP para evitar abuso.
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);

// Throttle: máximo de envíos por IP en una ventana (in-memory; para multi-instance usar Redis).
const THROTTLE_WINDOW_MS = 15 * 60 * 1000; // 15 min
const THROTTLE_MAX_PER_IP = 20;
const countByIp = new Map();
function throttle(ip) {
  const now = Date.now();
  let list = countByIp.get(ip) || [];
  list = list.filter((t) => now - t < THROTTLE_WINDOW_MS);
  if (list.length >= THROTTLE_MAX_PER_IP) return false;
  list.push(now);
  countByIp.set(ip, list);
  return true;
}

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
}

function sanitizeHtmlContent(html) {
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/javascript:/gi, '');
}

/** Valida que el request venga de un usuario autenticado (Bearer Supabase JWT) o clave interna. */
async function assertAuth(req) {
  const internalKey = process.env.WEB_API_INTERNAL_KEY;
  const authHeader = req.headers.authorization;
  const internalHeader = req.headers['x-internal-key'];

  if (internalKey && internalHeader === internalKey) {
    return { ok: true, userId: 'internal' };
  }

  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.body?.access_token;
  if (!token) {
    return { ok: false, status: 401, error: 'Missing Authorization (Bearer token) or x-internal-key' };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return { ok: false, status: 500, error: 'Server auth not configured' };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return { ok: false, status: 401, error: 'Invalid or expired token' };
  }
  return { ok: true, userId: user.id };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const auth = await assertAuth(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const ip = getClientIp(req);
  if (!throttle(ip)) {
    return res.status(429).json({ error: 'Too many requests. Try again later.' });
  }

  const { to, subject, html } = req.body || {};

  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const toList = Array.isArray(to) ? to : [to];
  const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS?.split(',').map((d) => d.trim().toLowerCase()).filter(Boolean);
  if (allowedDomains.length) {
    const invalid = toList.filter((email) => {
      const domain = (email || '').split('@')[1]?.toLowerCase();
      return !domain || !allowedDomains.includes(domain);
    });
    if (invalid.length) {
      return res.status(400).json({ error: 'Some recipient domains are not allowed' });
    }
  }

  try {
    const data = await resend.emails.send({
      from: 'Yacht Daywork <info@yachtdaywork.com>',
      to: toList,
      subject,
      html: sanitizeHtmlContent(html),
    });

    if (process.env.NODE_ENV !== 'test') {
      console.info('[sendEmail]', { userId: auth.userId, toCount: toList.length, ip });
    }
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Resend error:', error?.message || 'unknown error');

    if (error?.response) {
      const { statusCode, message, name } = error.response;
      return res.status(500).json({
        error: 'Resend API error',
        statusCode,
        message,
        name,
      });
    }

    return res.status(500).json({
      error: 'Unexpected error',
      message: error?.message || 'Failed to send email',
    });
  }
}
