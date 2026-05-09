import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import supabase from '../../supabase';
import './PublicProfileView.css';

export default function PublicProfileQrRedirect() {
  const { qrId } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function resolveQr() {
      if (!qrId) {
        setError('Invalid QR link.');
        return;
      }

      try {
        const { data, error: rpcError } = await supabase.rpc('rpc_resolve_public_profile_qr', {
          qr_id_in: qrId,
        });
        if (rpcError) throw rpcError;

        const row = Array.isArray(data) ? data[0] : data;
        const nextHandle = String(row?.handle || '').trim();
        const isShareReady = row?.share_ready === true;

        if (!nextHandle || !isShareReady) {
          throw new Error('This CV link may be invalid, revoked, or not publicly previewable.');
        }

        if (!cancelled) {
          navigate(`/cv/${nextHandle}`, { replace: true });
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || 'This CV link may be invalid, revoked, or not publicly previewable.');
        }
      }
    }

    resolveQr();
    return () => {
      cancelled = true;
    };
  }, [navigate, qrId]);

  return (
    <main className="ppv-wrap">
      <section className="ppv-card">
        <h1 className="ppv-title">Digital CV</h1>
        {error ? <p>{error}</p> : <p>Opening candidate CV...</p>}
      </section>
    </main>
  );
}
