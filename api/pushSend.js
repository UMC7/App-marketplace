// /api/pushSend.js – Envía push sin insertar en notifications (para webhooks, ej. job match)
import admin from "firebase-admin";
import { createClient } from "@supabase/supabase-js";

let serviceAccount;
try {
  serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8")
  );
} catch (e) {
  throw new Error("❌ No se pudo decodificar FIREBASE_SERVICE_ACCOUNT_BASE64: " + e.message);
}

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("❌ Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
}
const sb = createClient(supabaseUrl, supabaseServiceRoleKey);

function toStringMap(obj = {}) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = typeof v === "string" ? v : JSON.stringify(v);
  }
  return out;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    // Soporta payload directo o formato webhook de Supabase
    const body = req.body || {};
    const record = body.record || body;
    const userId = record.user_id || body.userId;
    const title = record.title || body.title;
    const bodyText = record.body ?? record.description ?? body.body ?? "";
    const data = record.data ?? body.data ?? {};
    const notificationId = record.id ?? body.notificationId;

    if (!userId || !title) {
      return res.status(400).json({ error: "Faltan userId o title" });
    }

    const target = data?.target || record?.target || body.target;
    if (target !== "seajobs") {
      return res.status(200).json({ success: true, skipped: true, reason: "solo job match" });
    }

    const { data: rows, error: tokErr } = await sb
      .from("device_tokens")
      .select("token, platform")
      .eq("user_id", userId)
      .eq("is_valid", true);

    if (tokErr) {
      return res.status(500).json({ error: "No se pudieron obtener los tokens." });
    }

    const allRows = rows || [];
    const fcmTokens = [];
    const expoTokens = [];

    for (const r of allRows) {
      const t = r.token;
      if (!t) continue;
      if (typeof t === "string" && t.startsWith("ExponentPushToken[")) {
        expoTokens.push(t);
      } else {
        fcmTokens.push(t);
      }
    }

    let sent = 0;
    let failed = 0;
    const invalidTokens = [];

    if (fcmTokens.length) {
      const response = await admin.messaging().sendEachForMulticast({
        notification: { title, body: String(bodyText) },
        data: toStringMap({ notification_id: String(notificationId || ""), ...data }),
        tokens: fcmTokens,
      });
      sent += response.successCount;
      failed += response.failureCount;
      response.responses.forEach((r, i) => {
        if (!r.success) {
          const code = r.error?.errorInfo?.code || r.error?.code || "";
          if (code.includes("registration-token-not-registered") || code.includes("invalid-registration-token")) {
            invalidTokens.push(fcmTokens[i]);
          }
        }
      });
    }

    if (expoTokens.length) {
      const { count: unreadCount } = await sb
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false);
      const badge = Math.min(99, Math.max(0, unreadCount ?? 1));
      const expoPayload = expoTokens.map((to) => ({
        to,
        title,
        body: String(bodyText),
        data: { notification_id: String(notificationId || ""), ...data },
        sound: "default",
        badge,
      }));

      try {
        const expoRes = await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(expoPayload),
        });
        const expoJson = await expoRes.json();
        const raw = expoJson?.data;
        const tickets = Array.isArray(raw) ? raw : raw ? [raw] : [];

        tickets.forEach((t, i) => {
          if (t?.status === "ok") sent += 1;
          else {
            failed += 1;
            const msg = (t?.message || "").toLowerCase();
            const det = (t?.details?.error || "").toLowerCase();
            if (det.includes("device") || msg.includes("not registered") || det.includes("not registered")) {
              if (expoTokens[i]) invalidTokens.push(expoTokens[i]);
            }
          }
        });
      } catch (err) {
        failed += expoTokens.length;
      }
    }

    if (invalidTokens.length) {
      await sb
        .from("device_tokens")
        .update({ is_valid: false, updated_at: new Date().toISOString() })
        .in("token", invalidTokens);
    }

    return res.status(200).json({ success: true, sent, failed });
  } catch (err) {
    console.error("pushSend error:", err);
    return res.status(500).json({ error: "Error interno" });
  }
}
