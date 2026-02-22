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
      req.headers.get("x-real-ip") ||
      req.headers.get("x-forwarded-for") ||
      "unknown";

    // --- Geolocalización básica (usa API pública de ipapi.co) ---
    let country = (bodyCountry && String(bodyCountry).trim()) || "Unknown";
    let city = (bodyCity && String(bodyCity).trim()) || "Unknown";
    if (country === "Unknown" || city === "Unknown") {
      try {
        const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
        if (geoRes.ok) {
          const geo = await geoRes.json();
          country = country === "Unknown" ? (geo.country_name || "Unknown") : country;
          city = city === "Unknown" ? (geo.city || "Unknown") : city;
        }
      } catch {
        // no problem
      }
    }

    // Analiza user agent
    const ua = user_agent || "";
    const browserDetected = browser || (
      /chrome/i.test(ua) ? "Chrome"
      : /safari/i.test(ua) ? "Safari"
      : /firefox/i.test(ua) ? "Firefox"
      : /edge/i.test(ua) ? "Edge"
      : "Unknown"
    );

    const deviceDetected = device || (
      /mobile/i.test(ua)
      ? "Mobile"
      : /tablet/i.test(ua)
      ? "Tablet"
      : "Desktop"
    );

    const osDetected = os || "Unknown";

    const ipHash = await crypto.subtle
      .digest("SHA-256", new TextEncoder().encode(ip))
      .then((buf) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join(""))
      .catch(() => null);

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
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
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
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }
});
