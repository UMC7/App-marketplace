// Progress must use the private progress RPC, never a public-document RPC.
// The RPC authorizes only the profile owner or an administrator and returns
// metadata required by the shared progress rules (not document contents).
export function mapProgressDocument(row = {}) {
  const visibility = String(row.visibility || '').toLowerCase();
  return {
    id: String(row.id || ''),
    title: row.title || 'Untitled document',
    issuedOn: row.issued_on || undefined,
    expiresOn: row.expires_on || undefined,
    visibility: visibility === 'public' || visibility === 'private'
      ? visibility
      : 'unlisted',
  };
}

export async function loadProfileDocumentsForProgress(supabase, profileId) {
  if (!profileId) return [];
  const { data, error } = await supabase.rpc('rpc_profile_documents_for_progress', {
    profile_uuid: profileId,
  });
  if (error) throw error;
  return (data || []).map(mapProgressDocument);
}

export function canUseProfessionalProfile(liteProgressPercent) {
  return Number(liteProgressPercent) === 100;
}
