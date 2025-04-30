// src/supabase.js

import { createClient } from '@supabase/supabase-js';

// ⚠️ IMPORTANTE:
// Estos valores deberían moverse a variables de entorno (.env) en producción
const supabaseUrl = 'https://jswsyuaehfhjkwwhdjho.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzd3N5dWFlaGZoamt3d2hkamhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4MzQxNzgsImV4cCI6MjA2MTQxMDE3OH0.fr91hyA9BcS-qshPn2DTCdwk-luwmNhcWxIEUu2W47c';

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;