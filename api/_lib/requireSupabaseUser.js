import { createClient } from "@supabase/supabase-js";

function getSupabaseConfig() {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.REACT_APP_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.REACT_APP_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase server authentication is not configured");
  }

  return { supabaseUrl, supabaseAnonKey };
}

/**
 * Validates the bearer token with Supabase Auth instead of trusting client input.
 * Keep this server-side: these endpoints spend the OpenAI API budget.
 */
export async function requireSupabaseUser(req, res) {
  const authorization = String(req.headers.authorization || "");
  const token = authorization.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }

  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ error: "Invalid or expired session" });
      return null;
    }

    return user;
  } catch (error) {
    console.error("Supabase authentication error:", error?.message || error);
    res.status(500).json({ error: "Server authentication is not configured" });
    return null;
  }
}

