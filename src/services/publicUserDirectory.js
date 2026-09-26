import supabase from '../supabase';

export async function fetchPublicUserSummaries(userIds) {
  const ids = [...new Set((userIds || []).filter(Boolean))].slice(0, 100);
  if (!ids.length) return { data: [], error: null };

  return supabase.rpc('rpc_public_user_summaries', { p_user_ids: ids });
}
