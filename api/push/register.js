// /api/push/register.js
// Solo acepta registro si el user_id coincide con el usuario autenticado (JWT/Supabase).
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
}

const sbAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

/** Obtiene el user_id del token (Supabase JWT). Si no hay token o es inválido, devuelve null. */
async function getAuthenticatedUserId(req) {
  const token =
    req.headers.authorization?.replace(/^Bearer\s+/i, "") || req.body?.access_token;
  if (!token) return null;

  if (!supabaseAnonKey) return null;
  const sbAuth = createClient(supabaseUrl, supabaseAnonKey);
  const {
    data: { user },
    error,
  } = await sbAuth.auth.getUser(token);
  if (error || !user) return null;
  return user.id;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  try {
    const { user_id, token, platform } = req.body || {};

    if (!user_id || !token || !platform) {
      return res.status(400).json({ error: "Faltan parámetros: user_id, token, platform" });
    }

    const authenticatedId = await getAuthenticatedUserId(req);
    if (authenticatedId === null) {
      return res.status(401).json({ error: "No autorizado. Envía Authorization: Bearer <token> o access_token en el body." });
    }
    if (authenticatedId !== user_id) {
      return res.status(403).json({ error: "user_id no coincide con el usuario autenticado." });
    }

    const now = new Date().toISOString();

    const { data, error } = await sbAdmin
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
    return res.status(500).json({ error: "Error interno", details: err?.message });
  }
}
