// supabase/functions/chat_push/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type Payload = {
  receiver_id: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiUrl = Deno.env.get("WEB_API_URL") || "";
  const apiKey = Deno.env.get("WEB_API_INTERNAL_KEY") || "";

  if (!apiUrl || !apiKey) {
    return new Response(JSON.stringify({ error: "missing_secrets" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!payload?.receiver_id || !payload?.title || !payload?.body) {
    return new Response(JSON.stringify({ error: "missing_fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const res = await fetch(`${apiUrl.replace(/\/$/, "")}/api/notifyUser`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-key": apiKey,
    },
    body: JSON.stringify({
      userId: payload.receiver_id,
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
    }),
  });

  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
});