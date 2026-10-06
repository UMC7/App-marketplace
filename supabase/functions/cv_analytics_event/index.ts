// Edge Function: cv_analytics_event
// Guarda eventos de visualización/contacto/chat en la tabla cv_analytics_events
// con geolocalización básica (país, ciudad, navegador, dispositivo)

import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

function normalizeIp(raw: string | null): string | null {
  if (!raw) return null;

  const first = raw
    .split(',')
    .map((value) => value.trim())
    .find(Boolean);

  if (!first) return null;

  const unwrapped = first.replace(/^\[|\]$/g, '').replace(/^::ffff:/i, '');
  if (!unwrapped || unwrapped.toLowerCase() === 'unknown') return null;

  // Ignore obvious loopback/private IPv4 addresses. These are not useful for geo lookup.
  if (
    /^127\./.test(unwrapped) ||
    /^10\./.test(unwrapped) ||
    /^192\.168\./.test(unwrapped) ||
    /^169\.254\./.test(unwrapped) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(unwrapped) ||
    unwrapped === '::1'
  ) {
    return null;
  }

  return unwrapped;
}

async function fetchJson(url: string, timeoutMs = 2500) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'YachtDayWork-CV-Analytics/1.0',
      },
    });
    if (!response.ok) return null;
    return await response.json().catch(() => null);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function resolveGeo(ip: string | null) {
  if (!ip) return { country: null, city: null };

  let country: string | null = null;
  let city: string | null = null;

  const ipapi = await fetchJson(`https://ipapi.co/${encodeURIComponent(ip)}/json/`);
  if (ipapi) {
    country = ipapi.country_name || ipapi.country || null;
    city = ipapi.city || null;
  }

  if (!country || !city) {
    const fallback = await fetchJson(`https://ipwho.is/${encodeURIComponent(ip)}`);
    if (fallback?.success !== false) {
      country = country || fallback?.country || fallback?.country_code || null;
      city = city || fallback?.city || null;
    }
  }

  return { country, city };
}

serve(async (req: Request) => {
  try {
    // CORS
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
        },
      });
    }

    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const body = await req.json().catch(() => ({}));

    const {
      event_type,   // view, contact_open, chat_start, cv_download
      handle,
      user_id,
      referrer,
      user_agent,
      session_id,
      viewer_id,
      language,
      device,
      browser,
      os,
      country: bodyCountry,
      city: bodyCity,
      extra_data,
    } = body;

    const ip =
      normalizeIp(req.headers.get("x-real-ip")) ||
      normalizeIp(req.headers.get("x-forwarded-for")) ||
      null;

    let country = (bodyCountry && String(bodyCountry).trim()) || "Unknown";
    let city = (bodyCity && String(bodyCity).trim()) || "Unknown";

    if (country === "Unknown" || city === "Unknown") {
      const geo = await resolveGeo(ip);
      if (country === "Unknown" && geo.country) country = String(geo.country).trim() || "Unknown";
      if (city === "Unknown" && geo.city) city = String(geo.city).trim() || "Unknown";
    }

    // Analiza user agent
    const ua = user_agent || "";
    const browserDetected = browser || (
      /edg\//i.test(ua) ? "Edge"
      : /opr\//i.test(ua) ? "Opera"
      : /chrome\//i.test(ua) ? "Chrome"
      : /firefox\//i.test(ua) ? "Firefox"
      : /safari\//i.test(ua) ? "Safari"
      : "Unknown"
    );

    const deviceDetected = device || (
      /mobile|android|iphone/i.test(ua)
      ? "Mobile"
      : /ipad|tablet/i.test(ua)
      ? "Tablet"
      : "Desktop"
    );

    const osDetected = os || "Unknown";

    const ipHash = ip
      ? await crypto.subtle
          .digest("SHA-256", new TextEncoder().encode(ip))
          .then((buf) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join(""))
          .catch(() => null)
      : null;

    const payload = {
      event_type,
      handle,
      owner_user_id: user_id || null,
      referrer: (referrer && String(referrer).trim()) || "Direct",
      country,
      city,
      user_agent: user_agent || null,
      browser: browserDetected,
      device: deviceDetected,
      os: osDetected,
      language: language || null,
      session_id: session_id || null,
      viewer_id: viewer_id || null,
      ip_hash: ipHash,
      extra_data: extra_data || null,
      created_at: new Date().toISOString(),
    };

    // Inserta en la tabla
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const res = await fetch(`${SUPABASE_URL}/rest/v1/cv_analytics_events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "unknown");
      console.error("Supabase insert error", errText);
      return new Response(
        JSON.stringify({ ok: false, error: errText }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, stored: payload }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (e) {
    console.error("Error in function:", e);
    return new Response(JSON.stringify({ ok: false, error: e?.message || String(e) }), {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }
});
