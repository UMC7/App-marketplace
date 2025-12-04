// /api/notifyUser.js
// Inserta en public.notifications y envía push a los tokens del usuario.

import admin from "firebase-admin";
import { createClient } from "@supabase/supabase-js";

// --- Firebase Admin (service account en BASE64) ---
let serviceAccount;
try {
  serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8")
  );
} catch (e) {
  throw new Error("❌ No se pudo decodificar FIREBASE_SERVICE_ACCOUNT_BASE64: " + e.message);
}

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
} catch (error) {
  console.error("🛑 FIREBASE INIT ERROR:", error?.message || "initialization failed");
  throw new Error("Error al inicializar Firebase Admin SDK: " + error.message);
}

// --- Supabase (Service Role) ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("❌ Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
}
const sb = createClient(supabaseUrl, supabaseServiceRoleKey);

// FCM `data` debe ser string:string
function toStringMap(obj = {}) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = typeof v === "string" ? v : JSON.stringify(v);
  }
  return out;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  try {
    const { userId, title, body, data } = req.body || {};
    if (!userId || !title || !body)
      return res.status(400).json({ error: "Faltan parámetros: userId, title, body" });

    // 1) Guardar en historial (UI)
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
      console.error("DB insert notifications error:", insErr?.message || "insert failed");
      return res.status(500).json({ error: "No se pudo guardar la notificación." });
    }

    // 2) Tokens del usuario
    const { data: rows, error: tokErr } = await sb
      .from("device_tokens")
      .select("token")
      .eq("user_id", userId)
      .eq("is_valid", true);

    if (tokErr) {
      console.error("DB select device_tokens error:", tokErr?.message || "select failed");
      return res.status(500).json({ error: "No se pudieron obtener los tokens." });
    }

    const tokens = (rows || []).map((r) => r.token).filter(Boolean);

    // 3) Envío push (si hay tokens)
    let sent = 0;
    let failed = 0;

    if (tokens.length) {
      const response = await admin.messaging().sendEachForMulticast({
        notification: { title, body },
        data: toStringMap({ notification_id: notif.id, ...data }),
        tokens,
      });

      sent = response.successCount;
      failed = response.failureCount;

      // Limpieza de tokens inválidos
      const invalid = [];
      response.responses.forEach((r, i) => {
        if (!r.success) {
          const code = r.error?.errorInfo?.code || r.error?.code || "";
          if (
            code.includes("registration-token-not-registered") ||
            code.includes("invalid-registration-token")
          ) {
            invalid.push(tokens[i]);
          }
        }
      });
      if (invalid.length) {
        await sb
          .from("device_tokens")
          .update({ is_valid: false, updated_at: new Date().toISOString() })
          .in("token", invalid);
      }
    }

    return res.status(200).json({
      success: true,
      notificationId: notif.id,
      sent,
      failed,
    });
  } catch (err) {
    console.error("notifyUser ERROR:", err?.message || "unexpected failure");
    return res.status(500).json({ error: "Error interno al notificar", details: err.message });
  }
}
