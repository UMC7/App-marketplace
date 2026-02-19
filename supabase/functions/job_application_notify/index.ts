// supabase/functions/job_application_notify/index.ts
// Webhook for INSERT on job_direct_applications.
// Builds an employer notification and calls /api/notifyUser.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type WebhookRecord = {
  id?: string;
  offer_id?: string;
  candidate_user_id?: string;
};

type WebhookPayload = {
  type?: string;
  table?: string;
  record?: WebhookRecord;
};

type DirectPayload = {
  offer_id: string;
  candidate_user_id: string;
};

type OfferRow = {
  id: string;
  user_id: string | null;
  title: string | null;
};

type ProfileRow = {
  first_name: string | null;
  last_name: string | null;
};

function buildCandidateName(profile: ProfileRow | null): string | null {
  if (!profile) return null;
  const first = (profile.first_name || "").trim();
  const last = (profile.last_name || "").trim();
  const full = [first, last].filter(Boolean).join(" ").trim();
  return full || null;
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
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  if (!apiUrl || !internalKey || !supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({
        error: "missing_secrets",
        hint:
          "Set WEB_API_URL, WEB_API_INTERNAL_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in Edge Function secrets.",
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

  const payload: DirectPayload = isWebhookFormat
    ? {
        offer_id: (body as WebhookPayload).record?.offer_id || "",
        candidate_user_id: (body as WebhookPayload).record?.candidate_user_id || "",
      }
    : (body as DirectPayload);

  if (!payload.offer_id || !payload.candidate_user_id) {
    return new Response(
      JSON.stringify({
        error: "missing_fields",
        hint: "Send offer_id and candidate_user_id (or use DB webhook on job_direct_applications).",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const sb = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: offer, error: offerErr } = await sb
    .from("yacht_work_offers")
    .select("id, user_id, title")
    .eq("id", payload.offer_id)
    .maybeSingle<OfferRow>();

  if (offerErr || !offer?.user_id) {
    return new Response(JSON.stringify({ error: "offer_not_found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Avoid notifying yourself.
  if (String(offer.user_id) === String(payload.candidate_user_id)) {
    return new Response(JSON.stringify({ success: true, skipped: true, reason: "self_apply" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: profile } = await sb
    .from("public_profiles")
    .select("first_name, last_name")
    .eq("user_id", payload.candidate_user_id)
    .maybeSingle<ProfileRow>();

  const candidateName = buildCandidateName(profile) || "A candidate";
  const offerTitle = offer.title?.trim() || "your job post";

  const notifyUrl = `${apiUrl.replace(/\/$/, "")}/api/notifyUser`;
  const res = await fetch(notifyUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-key": internalKey,
    },
    body: JSON.stringify({
      userId: offer.user_id,
      title: "New application",
      body: `${candidateName} applied to ${offerTitle}.`,
      data: {
        target: "seajobs",
        job_id: offer.id,
        offer_id: offer.id,
        candidate_user_id: payload.candidate_user_id,
        path: "/yacht-works",
      },
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
