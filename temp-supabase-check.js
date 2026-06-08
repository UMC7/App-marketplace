const { createClient } = require('@supabase/supabase-js');
const url = 'https://jswsyuaehfhjkwwhdjho.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzd3N5dWFlaGZoamt3c2hkamhvIiwicm9zZSI6ImFub24iLCJpYXQiOjE3NDU4MzQxNzgsImV4cCI6MjA2MTQxMDE3OH0.fr91hyA9BcS-qshPn2DTCdwk-luwmNhcWxIEUu2W47c';
const supabase = createClient(url, key, { auth: { persistSession: false } });
(async () => {
  try {
    const uid = 'dc3c4ca6-e892-4c25-891f-287f43f9c182';
    console.log('QUERY users');
    console.log(JSON.stringify(await supabase.from('users').select('id,nickname,first_name,last_name').eq('id', uid), null, 2));
    console.log('QUERY public_profiles by user_id');
    console.log(JSON.stringify(await supabase.from('public_profiles').select('id,user_id,owner_user_id,handle,share_ready,created_at').eq('user_id', uid), null, 2));
    console.log('QUERY public_profiles by owner_user_id');
    console.log(JSON.stringify(await supabase.from('public_profiles').select('id,user_id,owner_user_id,handle,share_ready,created_at').eq('owner_user_id', uid), null, 2));
  } catch (err) {
    console.error(err);
  }
})();
