// src/hooks/useCandidateAnalytics.js
import { useCallback, useEffect, useMemo, useState } from 'react';
import client from '../services/analytics/candidateAnalyticsClient';
import { getRangeByKey } from '../utils/analytics/dateRanges';

/**
 * Hook único para obtener todas las métricas de Analytics del CV.
 * - Fault-tolerant: nunca lanza; arma estructuras seguras.
 * - Controla rango (presets) y bucket (day|week|month).
 *
 * @param {Object} opts
 * @param {string} [opts.handle]  - handle del perfil (preferido)
 * @param {string} [opts.userId]  - user_id del dueño (fallback)
 * @param {string} [opts.rangeKey='30d'] - 7d | 30d | 90d | this_month | last_month | ytd
 * @param {('day'|'week'|'month')} [opts.bucket='day'] - agrupación temporal para tendencias
 */
export default function useCandidateAnalytics({
  handle,
  userId,
  rangeKey = '30d',
  bucket = 'day',
} = {}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [overview, setOverview] = useState({
    views: 0,
    unique_viewers: 0,
    contact_opens: 0,
    chat_starts: 0,
    cv_downloads: 0,
  });

  const [trends, setTrends] = useState([]); // [{date, views, unique_viewers}]
  const [referrers, setReferrers] = useState([]); // [{source, views, unique_viewers, pct}]
  const [geography, setGeography] = useState({ countries: [], cities: [] });
  const [devices, setDevices] = useState({ devices: [], browsers: [] });
  const [funnel, setFunnel] = useState({
    views: 0,
    profile_opens: 0,
    contact_opens: 0,
    chat_starts: 0,
    cv_downloads: 0,
  });

  const range = useMemo(() => getRangeByKey(rangeKey), [rangeKey]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = { handle, userId, from: range.from, to: range.to };

    let cancelled = false;
    try {
      const [
        ov,
        tr,
        rf,
        geo,
        dev,
        fn,
      ] = await Promise.all([
        client.fetchOverview(params),
        client.fetchTrends({ ...params, bucket }),
        client.fetchReferrers(params),
        client.fetchGeography(params),
        client.fetchDevices(params),
        client.fetchFunnel(params),
      ]);

      if (cancelled) return;

      setOverview(ov || overview);
      setTrends(Array.isArray(tr) ? tr : []);
      setReferrers(Array.isArray(rf) ? rf : []);
      setGeography(geo || { countries: [], cities: [] });
      setDevices(dev || { devices: [], browsers: [] });
      setFunnel(fn || funnel);
    } catch (e) {
      if (!cancelled) setError(e?.message || 'Failed to load analytics.');
    } finally {
      if (!cancelled) setLoading(false);
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle, userId, range.from, range.to, bucket]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    loading,
    error,
    range,        // { from, to }
    rangeKey,
    setRangeKey: (k) => {
      // Evita valores inesperados
      if (typeof k === 'string' && k.trim()) {
        // trigger re-fetch via range memo
        // Nota: el setter real lo maneja el consumidor manteniendo rangeKey en su estado,
        // este helper es para cuando el hook maneje estado interno en una futura versión.
        console.warn('setRangeKey called but rangeKey is external; handle it in the caller state.');
      }
    },
    bucket,
    setBucket: () => {
      console.warn('setBucket called but bucket is external; handle it in the caller state.');
    },

    // Data
    overview,
    trends,
    referrers,
    geography,
    devices,
    funnel,

    // Actions
    refetch: fetchAll,
  };
}