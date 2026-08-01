// /api/notifyUser.js
import admin from "firebase-admin";
import { createClient } from "@supabase/supabase-js";

function getFirebaseAdminApp() {
  if (admin.apps.length) return admin;

  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!encoded) {
    throw new Error("Falta FIREBASE_SERVICE_ACCOUNT_BASE64.");
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
  } catch (e) {
    throw new Error("No se pudo decodificar FIREBASE_SERVICE_ACCOUNT_BASE64: " + e.message);
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  return admin;
}

function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

function toStringMap(obj = {}) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = typeof v === "string" ? v : JSON.stringify(v);
  }
  return out;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo no permitido" });
  }

  const internalKey = process.env.WEB_API_INTERNAL_KEY;
  if (internalKey) {
    const incoming = req.headers["x-internal-key"];
    if (!incoming || incoming !== internalKey) {
      return res.status(401).json({
        error: "No autorizado",
        hint: "Incluye header x-internal-key.",
      });
    }
  }

  try {
    const adminApp = getFirebaseAdminApp();
    const sb = getSupabaseAdmin();
    const { userId, title, body, data } = req.body || {};

    if (!userId || !title || !body) {
      return res.status(400).json({ error: "Faltan parametros: userId, title, body" });
    }

    const { data: notif, error: insErr } = await sb
      .from("notifications")
      .insert({
        user_id: userId,
        title,
        body,
        data: data ?? {},
        is_read: false,
      })
      .select("id, created_at")
      .single();

    if (insErr) {
      return res.status(500).json({ error: "No se pudo guardar la notificacion." });
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
    const sendErrors = [];

    if (fcmTokens.length) {
      const response = await adminApp.messaging().sendEachForMulticast({
        notification: { title, body },
        data: toStringMap({ notification_id: notif.id, ...(data || {}) }),
        tokens: fcmTokens,
      });

      sent += response.successCount;
      failed += response.failureCount;

      response.responses.forEach((r, i) => {
        if (!r.success) {
          const code = r.error?.errorInfo?.code || r.error?.code || "";
          const message = r.error?.errorInfo?.message || r.error?.message || "";
          if (
            code.includes("registration-token-not-registered") ||
            code.includes("invalid-registration-token")
          ) {
            invalidTokens.push(fcmTokens[i]);
          }
          sendErrors.push({
            token: fcmTokens[i],
            provider: "fcm",
            code: code || undefined,
            message: message || undefined,
          });
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
        body,
        data: { notification_id: notif.id, ...(data || {}) },
        sound: "default",
        badge,
        priority: "high",
        channelId: "default",
      }));

      try {
        const expoRes = await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(expoPayload),
        });

        const expoJson = await expoRes.json();
        const raw = expoJson?.data;
        const tickets = Array.isArray(raw) ? raw : raw ? [raw] : [];

        tickets.forEach((t, i) => {
          if (t?.status === "ok") {
            sent += 1;
          } else {
            failed += 1;
            const msg = (t?.message || "").toLowerCase();
            const det = (t?.details?.error || "").toLowerCase();
            if (
              det.includes("device") ||
              msg.includes("not registered") ||
              det.includes("not registered")
            ) {
              if (expoTokens[i]) invalidTokens.push(expoTokens[i]);
            }
            sendErrors.push({
              token: expoTokens[i],
              provider: "expo",
              code: t?.details?.error || undefined,
              message: t?.message || undefined,
            });
          }
        });
      } catch (error) {
        failed += expoTokens.length;
        sendErrors.push({
          token: null,
          provider: "expo",
          code: "request_failed",
          message: error?.message || String(error),
        });
      }
    }

    if (invalidTokens.length) {
      await sb
        .from("device_tokens")
        .update({ is_valid: false, updated_at: new Date().toISOString() })
        .in("token", invalidTokens);
    }

    const payload = {
      success: true,
      notificationId: notif.id,
      sent,
      failed,
    };

    if (failed > 0 && sendErrors.length > 0) {
      payload.errors = sendErrors.slice(0, 3).map((e) => ({
        token: e.token,
        provider: e.provider,
        code: e.code,
        message: e.message,
      }));
    }

    return res.status(200).json(payload);
  } catch (err) {
    console.error("notifyUser error:", err?.message || err);
    return res.status(500).json({
      error: "Error interno al notificar",
      message: err?.message || String(err),
    });
  }
}
