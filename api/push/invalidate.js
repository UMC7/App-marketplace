// /api/push/invalidate.js
// Invalida todos los tokens Android para forzar re-registro con la app nueva.
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo no permitido" });
  }

  const internalKey = process.env.WEB_API_INTERNAL_KEY;
  if (!internalKey) {
    return res.status(500).json({
      error: "WEB_API_INTERNAL_KEY no configurada",
      hint: "Define la variable en el deploy para poder llamar este endpoint.",
    });
  }

  const incoming = req.headers["x-internal-key"];
  if (!incoming || incoming !== internalKey) {
    return res.status(401).json({
      error: "No autorizado",
      hint: "Header x-internal-key debe coincidir con WEB_API_INTERNAL_KEY.",
    });
  }

  try {
    const sb = getSupabaseAdmin();
    const { error } = await sb
      .from("device_tokens")
      .update({ is_valid: false, updated_at: new Date().toISOString() })
      .eq("platform", "android");

    if (error) {
      console.error("push/invalidate error:", error);
      return res.status(500).json({
        error: "No se pudieron invalidar los tokens",
        details: error.message,
      });
    }

    const { count, error: countErr } = await sb
      .from("device_tokens")
      .select("token", { count: "exact", head: true })
      .eq("platform", "android")
      .eq("is_valid", false);

    return res.status(200).json({
      success: true,
      invalidated_android_tokens: countErr ? null : count,
      message: "Tokens Android marcados como invalidos. Los usuarios se volveran a registrar al abrir la app.",
    });
  } catch (err) {
    console.error("push/invalidate error:", err);
    return res.status(500).json({
      error: "Error interno",
      message: err?.message || String(err),
    });
  }
}
