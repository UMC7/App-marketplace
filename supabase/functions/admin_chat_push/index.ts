// supabase/functions/admin_chat_push/index.ts
// Webhook para admin_messages: crea notificación con offer_id=__admin__, sender_id, thread_id
// Así al hacer clic en Alerts se redirige a la conversación admin.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type WebhookRecord = {
  thread_id?: string;
  sender_id?: string;
  receiver_id?: string;
  message?: string | null;
};

type WebhookPayload = { type?: string; table?: string; record?: WebhookRecord };

function buildPayload(body: WebhookPayload): { receiver_id: string; title: string; body: string; data: Record<string, string> } | null {
  if (body?.table !== "admin_messages" || body?.type !== "INSERT") return null;
  const r = body.record;
  if (!r?.receiver_id || !r?.sender_id || !r?.thread_id) return null;
  const text = (r.message?.trim() || "").slice(0, 80);
  return {
    receiver_id: r.receiver_id,
    title: "Admin message",
    body: text || "New message",
    data: {
      target: "chat",
      offer_id: "__admin__",
      sender_id: r.sender_id,
      thread_id: r.thread_id,
    },
  };
}

async function fetchSenderNickname(supabaseUrl: string, serviceRoleKey: string, senderId: string): Promise<string> {
  if (!supabaseUrl || !serviceRoleKey || !senderId) return "User";
  try {
    const sb = createClient(supabaseUrl, serviceRoleKey);
    const { data } = await sb.from("users").select("nickname").eq("id", senderId).maybeSingle();
    const n = (data as { nickname?: string } | null)?.nickname?.trim();
    return n || "User";
  } catch {
    return "User";
  }
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers: { "Content-Type": "application/json" } });
  }
  const apiUrl = Deno.env.get("WEB_API_URL") || "";
  const internalKey = Deno.env.get("WEB_API_INTERNAL_KEY") || "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!apiUrl || !internalKey) {
    return new Response(JSON.stringify({ error: "missing_secrets" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
  let body: WebhookPayload;
  try {
    body = (await req.json()) as WebhookPayload;
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  let built = buildPayload(body);
  if (built && supabaseUrl && serviceRoleKey && built.data?.sender_id) {
    const nickname = await fetchSenderNickname(supabaseUrl, serviceRoleKey, built.data.sender_id);
    built = { ...built, title: `New message from ${nickname}` };
  }
  if (!built) {
    return new Response(JSON.stringify({ error: "invalid_payload" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  const res = await fetch(`${apiUrl.replace(/\/$/, "")}/api/notifyUser`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-internal-key": internalKey },
    body: JSON.stringify({ userId: built.receiver_id, title: built.title, body: built.body, data: built.data }),
  });
  const text = await res.text();
  if (!res.ok) console.error("notifyUser failed", res.status, text);
  return new Response(text, { status: res.status, headers: { "Content-Type": "application/json" } });
});
