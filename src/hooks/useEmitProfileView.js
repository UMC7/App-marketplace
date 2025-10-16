// src/hooks/useEmitProfileView.js
import { useEffect } from 'react';
import { emitView } from '../services/analytics/emitEvent';

/**
 * Hook que emite automáticamente un evento de "view"
 * cuando se monta la vista pública del CV.
 *
 * @param {Object} profile - Perfil público actual.
 * Debe incluir al menos { handle, user_id, owner_user_id }.
 */
export default function useEmitProfileView(profile) {
  useEffect(() => {
    if (!profile) return;

    const ownerUserId = profile?.user_id || profile?.owner_user_id || null;
    const handle = profile?.handle || null;

    if (!handle && !ownerUserId) return;

    try {
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
  }, [profile]);
}