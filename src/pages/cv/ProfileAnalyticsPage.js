// src/pages/cv/ProfileAnalyticsPage.js
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import supabase from '../../supabase';

import './ProfileAnalyticsPage.css';
import '../../styles/analytics/analytics-widgets.css';

import useCandidateAnalytics from '../../hooks/useCandidateAnalytics';
import {
  FiltersBar,
  OverviewStats,
  TrafficTrendsChart,
  ReferrersTable,
  ActionsFunnel,
  GeographyBreakdown,
  DeviceBrowserBreakdown,
  EmptyState,
  LoadingState,
} from '../../components/cv/analytics';

function useQuery() {
  return new URLSearchParams(useLocation().search || '');
}

export default function ProfileAnalyticsPage() {
  const qs = useQuery();
  const handleFromQuery = qs.get('handle');

  const [resolvedHandle, setResolvedHandle] = useState(handleFromQuery || '');
  const [ownerUserId, setOwnerUserId] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Filtros UI
  const [rangeKey, setRangeKey] = useState('30d'); // 7d | 30d | 90d | this_month | last_month | ytd
  const [bucket, setBucket] = useState('day');     // day | week | month

  // ===== Detectar móvil (para mover el botón Back junto al Refresh) =====
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 540px)');
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener?.('change', apply);
    return () => mq.removeEventListener?.('change', apply);
  }, []);

  // 1) Resolver handle del dueño si no viene por query
  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      try {
        // Si ya vino por query, no buscamos nada
        if (handleFromQuery) {
          setResolvedHandle(handleFromQuery);
          setAuthChecked(true);
          return;
        }

        // Obtener usuario autenticado
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth?.user?.id || null;
        if (!uid) {
          // No autenticado → no mostrará datos
          if (!cancelled) {
            setOwnerUserId(null);
            setResolvedHandle('');
            setAuthChecked(true);
          }
          return;
        }
        if (!cancelled) setOwnerUserId(uid);

        // Buscar handle principal del perfil público del usuario
        const { data: pr } = await supabase
          .from('public_profiles')
          .select('handle')
          .eq('user_id', uid)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const h = pr?.handle || '';
        if (!cancelled) {
          setResolvedHandle(h);
          setAuthChecked(true);
        }
      } catch {
        if (!cancelled) {
          setResolvedHandle('');
          setAuthChecked(true);
        }
      }
    }

    resolve();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleFromQuery]);

  // 2) Hook de datos (fault-tolerant)
  const {
    loading,
    error,
    range,
    overview,
    trends,
    referrers,
    geography,
    devices,
    funnel,
    refetch,
  } = useCandidateAnalytics({
    handle: resolvedHandle || undefined,
    userId: ownerUserId || undefined,
    rangeKey,
    bucket,
  });

  // Mostrar subtítulo dinámico con el identificador
  const idLabel = useMemo(() => {
    if (resolvedHandle) return `Handle: ${resolvedHandle}`;
    if (ownerUserId) return `User ID: ${ownerUserId.slice(0, 6)}…`;
    return 'Not signed in';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedHandle, ownerUserId]);

  // Estados base para empty/guard
  if (!authChecked) {
    return (
      <div className="cv-analytics">
        <LoadingState title="Loading session…" rows={3} height={90} />
      </div>
    );
  }

  if (!resolvedHandle && !ownerUserId) {
    return (
      <div className="cv-analytics">
        <header className="cv-analytics__header">
          <div>
            <div className="cv-analytics__title">Analytics</div>
            <div className="cv-analytics__subtitle">Sign in to view your CV analytics</div>
          </div>
          <div className="cv-analytics__actions"></div>
          <button className="cv-analytics__back" onClick={() => window.history.back()}>Back</button>
        </header>

        <EmptyState
          title="No profile detected"
          message="You must be signed in or provide a ?handle= in the URL to view analytics."
        />
      </div>
    );
  }

  return (
    <div className="cv-analytics">
      {/* Header */}
      <header className="cv-analytics__header">
        <div>
          <div className="cv-analytics__title">Analytics</div>
          <div className="cv-analytics__subtitle">{idLabel}</div>
        </div>

        <div className="cv-analytics__actions">
          {/* (opcional) acciones extra */}
        </div>

        {/* En móvil el botón Back se mostrará junto a Refresh dentro de FiltersBar */}
        {!isMobile && (
          <button className="cv-analytics__back" onClick={() => window.history.back()}>
            Back
          </button>
        )}
      </header>

      {/* Filtros */}
      <div className="cv-analytics__content">
        <FiltersBar
          rangeKey={rangeKey}
          onChangeRangeKey={setRangeKey}
          bucket={bucket}
          onChangeBucket={setBucket}
          onRefresh={refetch}
          /* Para móvil: pedir al FiltersBar que pinte el botón Back a su lado */
          showBackInline={isMobile}
          onBack={() => window.history.back()}
        />

        {/* KPIs */}
        <div className="cv-analytics__row cv-analytics__row--kpis">
          {loading ? (
            <LoadingState title="Overview" rows={2} height={110} />
          ) : (
            <OverviewStats overview={overview} loading={loading} />
          )}
        </div>

        {/* Trends */}
        <div className="cv-analytics__row cv-analytics__row--1">
          {loading ? (
            <LoadingState title="Traffic trends" rows={4} height={240} />
          ) : (
            <TrafficTrendsChart
              data={trends}
              loading={loading}
              title="Traffic trends"
              bucket={bucket}
            />
          )}
        </div>

        {/* Referrers + Funnel */}
        <div className="cv-analytics__row cv-analytics__row--2">
          {loading ? (
            <LoadingState title="Top referrers" rows={6} height={220} />
          ) : (
            <ReferrersTable items={referrers} loading={loading} />
          )}

          {loading ? (
            <LoadingState title="Actions funnel" rows={6} height={220} />
          ) : (
            <ActionsFunnel funnel={funnel} loading={loading} />
          )}
        </div>

        {/* Geography */}
        <div className="cv-analytics__row cv-analytics__row--1">
          {loading ? (
            <LoadingState title="Geography" rows={6} height={220} />
          ) : (
            <GeographyBreakdown data={geography} loading={loading} />
          )}
        </div>

        {/* Devices & Browsers */}
        <div className="cv-analytics__row cv-analytics__row--1">
          {loading ? (
            <LoadingState title="Devices & Browsers" rows={6} height={220} />
          ) : (
            <DeviceBrowserBreakdown data={devices} loading={loading} />
          )}
        </div>

        {/* Error (no bloquea el render) */}
        {error && (
          <div className="ana-card" role="alert" style={{ padding: 12, borderRadius: 12 }}>
            <strong>Warning:</strong>{' '}
            <span className="ana-muted">{String(error)}</span>
          </div>
        )}

        {/* Sin datos en todo el rango */}
        {!loading &&
          !error &&
          overview?.views === 0 &&
          (Array.isArray(trends) ? trends.length === 0 : true) && (
            <EmptyState
              title="No data for the selected range"
              message="Try another date range or share your CV link to start receiving visits."
            />
          )}
      </div>
    </div>
  );
}