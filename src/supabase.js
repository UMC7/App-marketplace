import { createClient } from '@supabase/supabase-js'; // Reemplaza con tu URL de Supabase y tu clave pública
const supabaseUrl = 'https://jswsyuaehfhjkwwhdjho.supabase.co'; // Cambia por la URL de tu proyecto
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzd3N5dWFlaGZoamt3d2hkamhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4MzQxNzgsImV4cCI6MjA2MTQxMDE3OH0.fr91hyA9BcS-qshPn2DTCdwk-luwmNhcWxIEUu2W47c'; // Cambia por tu clave pública

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;