// supabase/functions/chat_push/index.ts
// Acepta:
// 1) Payload directo: { receiver_id, title, body, data? }
// 2) Webhook de Supabase (INSERT): { type, table, record } → si table === 'yacht_work_messages' se construye title/body y data (target: "chat", offer_id, sender_id).
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type DirectPayload = {
  receiver_id: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

type WebhookRecord = {
  id?: string;
  offer_id?: string;
  sender_id?: string;
  receiver_id?: string;
  message?: string | null;
  file_url?: string | null;
  sent_at?: string;
  read?: boolean;
};

type WebhookPayload = {
  type?: string;
  table?: string;
  record?: WebhookRecord;
};

function buildFromWebhook(body: WebhookPayload): DirectPayload | null {
  if (body?.table !== "yacht_work_messages" || body?.type !== "INSERT") return null;
  const record = body.record as WebhookRecord | undefined;
  if (!record?.receiver_id || !record?.sender_id) return null;

  const text = record.message?.trim() || "";
  const hasFile = !!record.file_url;
  const bodyText = text
    ? (text.length > 80 ? text.slice(0, 77) + "…" : text)
    : hasFile
    ? "📎 Attachment"
    : "New message";

  return {
    receiver_id: record.receiver_id,
    title: "New message",
    body: bodyText,
    data: {
      target: "chat",
      offer_id: record.offer_id ?? "",
      sender_id: record.sender_id ?? "",
    },
  };
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiUrl = Deno.env.get("WEB_API_URL") || "";
  const internalKey = Deno.env.get("WEB_API_INTERNAL_KEY") || "";

  if (!apiUrl || !internalKey) {
    return new Response(
      JSON.stringify({
        error: "missing_secrets",
        hint: "Set WEB_API_URL and WEB_API_INTERNAL_KEY in Edge Function secrets (and after every deploy, ensure WEB_API_URL is the current app URL).",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: unknown;
  try {
    body = (await req.json()) as WebhookPayload & DirectPayload;
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const isWebhookFormat =
    typeof (body as WebhookPayload).table === "string" &&
    (body as WebhookPayload).record != null;
  if (!isWebhookFormat) {
    const incomingKey = req.headers.get("x-internal-key") || "";
    if (!incomingKey || incomingKey !== internalKey) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  const built = buildFromWebhook(body as WebhookPayload);
  const payload: DirectPayload = built
    ? built
    : (body as DirectPayload);

  if (!payload?.receiver_id || !payload?.title || !payload?.body) {
    return new Response(
      JSON.stringify({
        error: "missing_fields",
        hint: built
          ? "Webhook record missing receiver_id or sender_id."
          : "Send receiver_id, title, and body (or use Database Webhook on yacht_work_messages INSERT).",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const url = `${apiUrl.replace(/\/$/, "")}/api/notifyUser`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-key": internalKey,
    },
    body: JSON.stringify({
      userId: payload.receiver_id,
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error("notifyUser failed", res.status, text);
  }
  return new Response(text, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
});