// /api/login.js
// Login con email o nickname. El email asociado a un nickname nunca sale del servidor.
import { createClient } from "@supabase/supabase-js";
import { allowRequest } from "./_lib/rateLimit.js";

const GENERIC_ERROR = "Invalid login credentials";
const NICKNAME_RE = /^[A-Za-z0-9]{3,7}$/;
const WINDOW_MS = 10 * 60 * 1000;

function getConfig() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.REACT_APP_SUPABASE_URL;
  const anonKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.REACT_APP_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey) {
    throw new Error("Supabase login is not configured");
  }
  return { url, anonKey, serviceKey };
}

const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } };

function getClientIp(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded || req.socket?.remoteAddress || "unknown";
}

async function resolveEmailForNickname(admin, nickname) {
  const { data: rows, error } = await admin
    .from("users")
    .select("id")
    .ilike("nickname", nickname)
    .limit(2);
  if (error || !rows || rows.length !== 1) return null;

  const { data, error: userError } = await admin.auth.admin.getUserById(rows[0].id);
  if (userError) return null;
  return data?.user?.email || null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const identifier = String(req.body?.identifier || "").trim();
  const password = String(req.body?.password || "");
  if (!identifier || !password) {
    return res.status(400).json({ error: GENERIC_ERROR });
  }

  const ip = getClientIp(req);
  if (
    !allowRequest(`login:ip:${ip}`, { limit: 30, windowMs: WINDOW_MS }) ||
    !allowRequest(`login:id:${identifier.toLowerCase()}`, { limit: 10, windowMs: WINDOW_MS })
  ) {
    return res.status(429).json({ error: "Too many login attempts. Please try again in a few minutes." });
  }

  try {
    const { url, anonKey, serviceKey } = getConfig();

    let email = identifier;
    if (!identifier.includes("@")) {
      if (!NICKNAME_RE.test(identifier)) {
        return res.status(401).json({ error: GENERIC_ERROR });
      }
      const admin = createClient(url, serviceKey, clientOptions);
      email = await resolveEmailForNickname(admin, identifier);
      if (!email) {
        return res.status(401).json({ error: GENERIC_ERROR });
      }
    }

    const auth = createClient(url, anonKey, clientOptions);
    const { data, error } = await auth.auth.signInWithPassword({ email, password });

    if (error || !data?.session) {
      const notConfirmed = /email not confirmed/i.test(error?.message || "");
      return res.status(401).json({
        error: notConfirmed ? "Email not confirmed. Please check your inbox." : GENERIC_ERROR,
      });
    }

    return res.status(200).json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  } catch (err) {
    console.error("login error:", err?.message || err);
    return res.status(500).json({ error: "Login is temporarily unavailable. Please try again." });
  }
}
