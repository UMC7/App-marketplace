// Edge Function: cv_analytics_event
// Guarda eventos de visualización/contacto/chat en la tabla cv_analytics_events
// con geolocalización básica (país, ciudad, navegador, dispositivo)

import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

serve(async (req: Request) => {
  try {
    // CORS
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
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
    } = body;

    const ip =
      req.headers.get("x-real-ip") ||
      req.headers.get("x-forwarded-for") ||
      "unknown";

    // --- Geolocalización básica (usa API pública de ipapi.co) ---
    let country = "Unknown";
    let city = "Unknown";
    try {
      const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
      if (geoRes.ok) {
        const geo = await geoRes.json();
        country = geo.country_name || "Unknown";
        city = geo.city || "Unknown";
      }
    } catch {
      // no problem
    }

    // Analiza user agent
    const ua = user_agent || "";
    const browser =
      /chrome/i.test(ua) ? "Chrome"
      : /safari/i.test(ua) ? "Safari"
      : /firefox/i.test(ua) ? "Firefox"
      : /edge/i.test(ua) ? "Edge"
      : "Unknown";

    const device = /mobile/i.test(ua)
      ? "Mobile"
      : /tablet/i.test(ua)
      ? "Tablet"
      : "Desktop";

    const payload = {
      event_type,
      handle,
      user_id,
      referrer: referrer || "direct",
      ip,
      country,
      city,
      browser,
      device,
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
      console.error("Supabase insert error", await res.text());
      return new Response("Insert failed", { status: 500 });
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
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }
});