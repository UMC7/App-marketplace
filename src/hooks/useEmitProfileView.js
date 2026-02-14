// src/hooks/useEmitProfileView.js
import { useEffect } from 'react';
import { emitView } from '../services/analytics/emitEvent';
import supabase from '../supabase';

/**
 * Hook que emite automáticamente un evento de "view"
 * cuando se monta la vista pública del CV.
 *
 * @param {Object} profile - Perfil público actual.
 * Debe incluir al menos { handle, user_id, owner_user_id }.
 */
export default function useEmitProfileView(profile) {
  useEffect(() => {
    let cancelled = false;
    if (!profile) return () => {};

    const ownerUserId = profile?.user_id || profile?.owner_user_id || null;
    const handle = profile?.handle || null;

    if (!handle && !ownerUserId) return () => {};

    const run = async () => {
      try {
        const search = window?.location?.search || '';
        const isPreview = /\bpreview(=|%3D)?(1|true)?/i.test(search);
        if (isPreview) return;

        const { data } = await supabase.auth.getUser();
        const currentUserId = data?.user?.id || null;
        const role =
          data?.user?.user_metadata?.app_metadata?.role ||
          data?.user?.app_metadata?.role ||
          null;
        if (role === 'admin') return;
        if (currentUserId && ownerUserId && currentUserId === ownerUserId) return;
        if (cancelled) return;

        emitView({
          ownerUserId,
          handle,
          extra: {
            source: window?.document?.referrer || null,
            pathname: window?.location?.pathname || null,
            ts: new Date().toISOString(),
          },
        });
      } catch {
        /* no-op */
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [profile]);
}
