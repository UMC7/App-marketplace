const { createClient } = require('@supabase/supabase-js');

const url = process.env.REACT_APP_SUPABASE_URL || 'https://jswsyuaehfhjkwwhdjho.supabase.co';
const key = process.env.REACT_APP_SUPABASE_ANON_KEY || 'missing-key';
const supabase = createClient(url, key, { auth: { persistSession: false } });

(async () => {
  try {
    const result = await supabase.storage
      .from('cv-docs')
      .list('a4917a3b-121b-4095-a83d-864d0b0531ac/docs', { limit: 100, sortBy: { column: 'name', order: 'asc' } });

    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(err);
  }
})();
