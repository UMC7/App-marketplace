// src/pages/cv/ProfileAnalyticsPage.js
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import supabase from '../../supabase';
import { useAuth } from '../../context/AuthContext';

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
  const navigate = useNavigate();
  const qs = useQuery();
  const { currentUser, loading: authLoading } = useAuth();
  const handleFromQuery = qs.get('handle');

  const [resolvedHandle, setResolvedHandle] = useState(handleFromQuery || '');
  const [ownerUserId, setOwnerUserId] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [rangeKey, setRangeKey] = useState('30d');
  const [bucket, setBucket] = useState('day');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 540px)');
    const updateMobileState = () => setIsMobile(mediaQuery.matches);
    updateMobileState();
    mediaQuery.addEventListener?.('change', updateMobileState);
    return () => mediaQuery.removeEventListener?.('change', updateMobileState);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      if (authLoading) return;
      try {
        if (handleFromQuery) {
          setResolvedHandle(handleFromQuery);
          setAuthChecked(true);
          return;
        }

        const uid = currentUser?.id || null;
        if (!uid) {
          if (!cancelled) {
            setOwnerUserId(null);
            setResolvedHandle('');
            setAuthChecked(true);
          }
          return;
        }
        if (!cancelled) setOwnerUserId(uid);

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
  }, [handleFromQuery, currentUser?.id, authLoading]);

  const {
    loading,
    error,
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

  const idLabel = useMemo(() => {
    if (resolvedHandle) return `Handle: ${resolvedHandle}`;
    if (ownerUserId) return `User ID: ${ownerUserId.slice(0, 6)}…`;
    return 'Not signed in';
  }, [resolvedHandle, ownerUserId]);

  const handleBack = () => {
    navigate('/profile?tab=cv');
  };

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
            <button className="cv-analytics__back" onClick={handleBack} aria-label="Back to Candidate Profile">
              <span aria-hidden="true">&larr;</span> Back
            </button>
          </div>
          <div className="cv-analytics__actions"></div>
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
      <header className="cv-analytics__header">
        <div>
          <div className="cv-analytics__title">Analytics</div>
          <div className="cv-analytics__subtitle">{idLabel}</div>
          {isMobile ? (
            <div className="cv-analytics__mobile-actions">
              <button className="cv-analytics__back" onClick={handleBack} aria-label="Back to Candidate Profile">
                <span aria-hidden="true">&larr;</span> Back
              </button>
              <button className="ana-btn cv-analytics__refresh" onClick={refetch}>
                Refresh
              </button>
            </div>
          ) : (
            <button className="cv-analytics__back" onClick={handleBack} aria-label="Back to Candidate Profile">
              <span aria-hidden="true">&larr;</span> Back
            </button>
          )}
        </div>

        <div className="cv-analytics__actions"></div>
      </header>

      <div className="cv-analytics__content">
        <FiltersBar
          rangeKey={rangeKey}
          onChangeRangeKey={setRangeKey}
          bucket={bucket}
          onChangeBucket={setBucket}
          onRefresh={refetch}
          showRefresh={!isMobile}
        />

        <div className="cv-analytics__row cv-analytics__row--kpis">
          {loading ? (
            <LoadingState title="Overview" rows={2} height={110} />
          ) : (
            <OverviewStats overview={overview} loading={loading} />
          )}
        </div>

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

        <div className="cv-analytics__row cv-analytics__row--2">
          {loading ? (
            <LoadingState title="Top referrers" rows={6} height={220} />
          ) : (
            <ReferrersTable items={referrers} loading={loading} />
          )}

          {loading ? (
            <LoadingState title="What people did" rows={6} height={220} />
          ) : (
            <ActionsFunnel funnel={funnel} loading={loading} />
          )}
        </div>

        <div className="cv-analytics__row cv-analytics__row--1">
          {loading ? (
            <LoadingState title="Geography" rows={6} height={220} />
          ) : (
            <GeographyBreakdown data={geography} loading={loading} />
          )}
        </div>

        <div className="cv-analytics__row cv-analytics__row--1">
          {loading ? (
            <LoadingState title="Devices & Browsers" rows={6} height={220} />
          ) : (
            <DeviceBrowserBreakdown data={devices} loading={loading} />
          )}
        </div>

        {error && (
          <div className="ana-card" role="alert" style={{ padding: 12, borderRadius: 12 }}>
            <strong>Warning:</strong>{' '}
            <span className="ana-muted">{String(error)}</span>
          </div>
        )}

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
