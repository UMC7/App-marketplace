// /api/push/register.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
}

const sb = createClient(supabaseUrl, supabaseServiceRoleKey);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  try {
    const { user_id, token, platform } = req.body || {};

    if (!user_id || !token || !platform) {
      return res.status(400).json({ error: "Faltan parámetros: user_id, token, platform" });
    }

    const now = new Date().toISOString();

    const { data, error } = await sb
      .from("device_tokens")
      .upsert(
        [
          {
            user_id,
            token,
            platform,
            is_valid: true,
            updated_at: now,
          },
        ],
        { onConflict: "token" }
      )
      .select("token, user_id, platform, is_valid")
      .single();

    if (error) {
      return res.status(500).json({ error: "No se pudo registrar el token", details: error.message });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ error: "Error interno", details: err.message });
  }
}