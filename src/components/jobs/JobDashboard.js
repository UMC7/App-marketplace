import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../Modal';
import '../../styles/JobDashboard.css';
import supabase from '../../supabase';

function JobDashboard({ offer, onClose }) {
  const CandidateMarker = ({ className = '' }) => (
    <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="6" r="3.2" />
      <path d="M4.5 16.2c0-3.1 2.6-5.3 5.5-5.3s5.5 2.2 5.5 5.3" />
    </svg>
  );

  const PoolMarker = ({ className = '' }) => (
    <svg className={className} viewBox="0 0 24 20" aria-hidden="true">
      <circle cx="12" cy="5.8" r="2.9" />
      <circle cx="6.7" cy="7.2" r="2.3" />
      <circle cx="17.3" cy="7.2" r="2.3" />
      <path d="M7.4 16c.1-2.7 2.2-4.5 4.6-4.5s4.5 1.8 4.6 4.5" />
      <path d="M2.8 15.7c.1-2.1 1.7-3.6 3.5-3.6 1 0 1.9.3 2.7 1" />
      <path d="M21.2 15.7c-.1-2.1-1.7-3.6-3.5-3.6-1 0-1.9.3-2.7 1" />
    </svg>
  );

  const [metrics, setMetrics] = useState({
    views: 0,
    privateChats: 0,
    direct: 0,
  });
  const [loading, setLoading] = useState(false);
  const [benchmarks, setBenchmarks] = useState({
    similarCount: 0,
    avgViews: 0,
    avgDirect: 0,
    avgPrivateChats: 0,
    avgSalaryUsd: null,
    salaryUsdSampleCount: 0,
    avgSalaryEur: null,
    salaryEurSampleCount: 0,
  });
  const [benchLoading, setBenchLoading] = useState(false);
  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [expandedAppId, setExpandedAppId] = useState(null);
  const [benchmarkByAppId, setBenchmarkByAppId] = useState({});
  const [benchmarkLoadingByAppId, setBenchmarkLoadingByAppId] = useState({});
  const [benchmarkModalAppId, setBenchmarkModalAppId] = useState(null);
  const [appStatuses, setAppStatuses] = useState({
    newCount: 0,
    reviewedCount: 0,
    shortlistedCount: 0,
    removedCount: 0,
  });
  const [appsExpanded, setAppsExpanded] = useState({
    shortlisted: true,
    new: true,
    reviewed: true,
  });

  useEffect(() => {
    let mounted = true;
    async function fetchMetrics() {
      if (!offer?.id) return;
      setLoading(true);
      const { data, error } = await supabase.rpc('rpc_get_job_offer_metrics', {
        p_offer_id: offer.id,
      });
      if (!mounted) return;
      if (error) {
        console.warn('Failed to load job metrics', error);
      } else if (data) {
        const row = Array.isArray(data) ? data[0] : data;
        setMetrics({
          views: Number(row?.views || 0),
          privateChats: Number(row?.private_chats || 0),
          direct: Number(row?.direct || 0),
        });
      }
      setLoading(false);
    }
    fetchMetrics();
    return () => {
      mounted = false;
    };
  }, [offer?.id]);

  useEffect(() => {
    let mounted = true;
    async function fetchBenchmarks() {
      if (!offer?.id) return;
      setBenchLoading(true);
      const { data, error } = await supabase.rpc('rpc_get_job_offer_benchmarks', {
        p_offer_id: offer.id,
      });
      if (!mounted) return;
      if (error) {
        console.warn('Failed to load job benchmarks', error);
      } else if (data) {
        const row = Array.isArray(data) ? data[0] : data;
        setBenchmarks({
          similarCount: Number(row?.similar_count || 0),
          avgViews: Number(row?.avg_views || 0),
          avgDirect: Number(row?.avg_direct_apps || 0),
          avgPrivateChats: Number(row?.avg_private_chats || 0),
          avgSalaryUsd: row?.avg_salary_usd == null ? null : Number(row.avg_salary_usd),
          salaryUsdSampleCount: Number(row?.salary_usd_sample_count || 0),
          avgSalaryEur: row?.avg_salary_eur == null ? null : Number(row.avg_salary_eur),
          salaryEurSampleCount: Number(row?.salary_eur_sample_count || 0),
        });
      }
      setBenchLoading(false);
    }
    fetchBenchmarks();
    return () => {
      mounted = false;
    };
  }, [offer?.id]);

  useEffect(() => {
    let mounted = true;
    async function fetchApplications() {
      if (!offer?.id) return;
      setAppsLoading(true);
      const { data, error } = await supabase
        .from('job_direct_applications')
        .select('id, candidate_user_id, candidate_profile_id, match_score, created_at, status, reviewed_at')
        .eq('offer_id', offer.id)
        .order('match_score', { ascending: false })
        .order('created_at', { ascending: false });
      if (!mounted) return;
      if (error) {
        console.warn('Failed to load applications', error);
        setApplications([]);
        setAppsLoading(false);
        return;
      }
      const rows = data || [];
      const profileIds = rows.map((r) => r.candidate_profile_id).filter(Boolean);
      let profileMap = {};
      if (profileIds.length) {
        const { data: profiles, error: pErr } = await supabase
          .from('public_profiles')
          .select('id, handle, first_name, last_name, primary_role, primary_department, city_port, country, availability, headline, hero_image_url')
          .in('id', profileIds);
        if (!pErr && profiles) {
          profileMap = profiles.reduce((acc, p) => {
            acc[p.id] = p;
            return acc;
          }, {});
        }
      }
      const enriched = rows.map((r) => ({
        ...r,
        profile: r.candidate_profile_id ? profileMap[r.candidate_profile_id] : null,
      }));
      setApplications(enriched);
      const statusAgg = enriched.reduce(
        (acc, r) => {
          const raw = r.status || 'new';
          const status = raw === 'in_review' ? 'reviewed' : raw;
          if (status === 'shortlisted') acc.shortlistedCount += 1;
          else if (status === 'removed') acc.removedCount += 1;
          else if (status === 'reviewed') acc.reviewedCount += 1;
          else acc.newCount += 1;
          return acc;
        },
        { newCount: 0, reviewedCount: 0, shortlistedCount: 0, removedCount: 0 }
      );
      setAppStatuses(statusAgg);
      setAppsLoading(false);
    }
    fetchApplications();
    return () => {
      mounted = false;
    };
  }, [offer?.id]);

  const formatNum = (v) => (Number.isFinite(v) ? Math.round(v) : 0);
  const deltaLabel = (current, avg) => {
    if (!Number.isFinite(avg) || avg <= 0) return 'No benchmark yet';
    const diff = current - avg;
    const pct = Math.round((diff / avg) * 100);
    const sign = pct > 0 ? '+' : '';
    return `${sign}${pct}% vs avg`;
  };

  const groupedApplications = useMemo(() => {
    const groups = { shortlisted: [], new: [], reviewed: [] };
    applications.forEach((app) => {
      const rawStatus = app.status || 'new';
      if (rawStatus === 'removed') return;
      const status = rawStatus === 'in_review' ? 'reviewed' : rawStatus;
      if (status === 'shortlisted') groups.shortlisted.push(app);
      else if (status === 'reviewed') groups.reviewed.push(app);
      else groups.new.push(app);
    });
    return groups;
  }, [applications]);

  const toggleAppsGroup = (key) => {
    setAppsExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const loadApplicantBenchmark = async (app) => {
    if (!offer?.id || !app?.candidate_user_id || benchmarkByAppId[app.id] || benchmarkLoadingByAppId[app.id]) return;
    setBenchmarkLoadingByAppId((prev) => ({ ...prev, [app.id]: true }));
    const { data, error } = await supabase.rpc('rpc_get_job_applicant_benchmark', {
      p_offer_id: offer.id,
      p_candidate_user_id: app.candidate_user_id,
    });
    if (error) {
      console.warn('Failed to load applicant benchmark', error);
      setBenchmarkByAppId((prev) => ({ ...prev, [app.id]: { error: true } }));
    } else {
      const row = Array.isArray(data) ? data[0] : data;
      setBenchmarkByAppId((prev) => ({ ...prev, [app.id]: row || null }));
    }
    setBenchmarkLoadingByAppId((prev) => ({ ...prev, [app.id]: false }));
  };

  const toggleApplicationExpand = async (app) => {
    if (!app?.id) return;
    if (expandedAppId === app.id) {
      setExpandedAppId(null);
      return;
    }
    setExpandedAppId(app.id);
    await loadApplicantBenchmark(app);
  };

  const updateApplicationStatus = async (applicationId, status, opts = {}) => {
    const dbStatus = status === 'reviewed' ? 'in_review' : status;
    const uiStatus = dbStatus === 'in_review' ? 'reviewed' : dbStatus;
    const payload = { status: dbStatus };
    if (opts.setReviewedAt) payload.reviewed_at = new Date().toISOString();
    const { error } = await supabase
      .from('job_direct_applications')
      .update(payload)
      .eq('id', applicationId);
    if (error) {
      console.warn('Failed to update application status', error);
      return;
    }
    setApplications((prev) =>
      prev.map((app) => (
        app.id === applicationId
          ? {
              ...app,
              status: dbStatus,
              ...(opts.setReviewedAt ? { reviewed_at: new Date().toISOString() } : {}),
            }
          : app
      ))
    );
    setAppStatuses((prev) => {
      const counts = { ...prev };
      const updated = applications.find((a) => a.id === applicationId);
      const prevStatus = (updated?.status || 'new') === 'in_review' ? 'reviewed' : (updated?.status || 'new');
      if (prevStatus === 'shortlisted') counts.shortlistedCount -= 1;
      else if (prevStatus === 'removed') counts.removedCount -= 1;
      else if (prevStatus === 'reviewed') counts.reviewedCount -= 1;
      else counts.newCount -= 1;
      if (uiStatus === 'shortlisted') counts.shortlistedCount += 1;
      else if (uiStatus === 'removed') counts.removedCount += 1;
      else if (uiStatus === 'reviewed') counts.reviewedCount += 1;
      else counts.newCount += 1;
      return counts;
    });
  };

  if (!offer) return null;

  const postedDate = offer?.created_at
    ? new Date(offer.created_at).toLocaleDateString('en-GB')
    : '-';
  const location = [offer?.city, offer?.country].filter(Boolean).join(', ') || '-';
  const statusLabel = offer?.status === 'paused' ? 'Paused' : 'Active';
  const benchmarkModalApp = benchmarkModalAppId
    ? applications.find((app) => app.id === benchmarkModalAppId) || null
    : null;
  const describeAgainstAverage = (candidateValue, avgValue, { decimals = 1, unit = '', lowIsGood = false } = {}) => {
    if (!Number.isFinite(Number(candidateValue)) || !Number.isFinite(Number(avgValue))) return 'Not enough data';
    const c = Number(candidateValue);
    const a = Number(avgValue);
    const diff = c - a;
    if (Math.abs(diff) < 0.05) return `Equal to pool average${unit ? ` (${a.toFixed(decimals)}${unit})` : ''}`;
    const direction = diff > 0 ? (lowIsGood ? 'Below' : 'Above') : (lowIsGood ? 'Above' : 'Below');
    const sign = diff > 0 ? '+' : '';
    return `${direction} pool average (${sign}${diff.toFixed(decimals)}${unit})`;
  };
  const benchmarkTone = (candidateValue, avgValue) => {
    const c = Number(candidateValue);
    const a = Number(avgValue);
    if (!Number.isFinite(c) || !Number.isFinite(a) || Math.abs(c - a) < 0.05) return 'neutral';
    return c > a ? 'positive' : 'negative';
  };
  const benchmarkDelta = (candidateValue, avgValue, decimals = 1, suffix = '') => {
    const c = Number(candidateValue);
    const a = Number(avgValue);
    if (!Number.isFinite(c) || !Number.isFinite(a)) return 'No benchmark';
    const diff = c - a;
    if (Math.abs(diff) < 0.05) return 'On pool average';
    const sign = diff > 0 ? '+' : '';
    return `${sign}${diff.toFixed(decimals)}${suffix}`;
  };
  const benchmarkScaleMax = (candidateValue, avgValue) => {
    const c = Number(candidateValue);
    const a = Number(avgValue);
    const max = Math.max(c, a, 0);
    if (!Number.isFinite(max) || max <= 0) return 1;
    return max * 1.15;
  };
  const benchmarkScalePos = (value, max) => {
    const v = Number(value);
    if (!Number.isFinite(v) || !Number.isFinite(max) || max <= 0) return 0;
    return Math.min(100, Math.max(0, (v / max) * 100));
  };

  return (
    <Modal onClose={onClose} contentClassName="job-dashboard-modal">
      <div className="job-dashboard">
        <div className="jd-header">
          <div>
            <div className="jd-kicker">Job Dashboard</div>
            <h2 className="jd-title">
              {offer?.title || 'Job Offer'}
              {offer?.teammate_rank ? ` + ${offer.teammate_rank}` : ''}
            </h2>
            <div className="jd-sub">
              <span>{location}</span>
              <span className="jd-dot">-</span>
              <span>Posted: {postedDate}</span>
            </div>
          </div>
          <div className={`jd-status ${offer?.status === 'paused' ? 'is-paused' : ''}`}>
            {statusLabel}
          </div>
        </div>

        <div className="jd-grid">
          <section className="jd-card">
            <div className="jd-card-title">Overview</div>
            <div className="jd-metrics">
              <div className="jd-metric">
                <div className="jd-metric-value">{loading ? '-' : metrics.views}</div>
                <div className="jd-metric-label">Views</div>
              </div>
              <div className="jd-metric">
                <div className="jd-metric-value">{loading ? '-' : metrics.privateChats}</div>
                <div className="jd-metric-label">Private Chats</div>
              </div>
              <div className="jd-metric">
                <div className="jd-metric-value">{loading ? '-' : metrics.direct}</div>
                <div className="jd-metric-label">Direct</div>
              </div>
            </div>
            <div className="jd-note">Stats will appear once tracking is enabled.</div>
          </section>

          <section className="jd-card">
            <div className="jd-card-title">Direct Applications</div>
            {appsLoading ? (
              <div className="jd-empty">Loading applications...</div>
            ) : (applications.filter((a) => a.status !== 'removed').length === 0) ? (
              <div className="jd-empty">No direct applications yet.</div>
            ) : (
              <div className="jd-apps">
                {[
                  { key: 'shortlisted', label: 'Shortlisted', items: groupedApplications.shortlisted },
                  { key: 'new', label: 'New', items: groupedApplications.new },
                  { key: 'reviewed', label: 'Reviewed', items: groupedApplications.reviewed },
                ]
                  .filter((group) => group.items.length > 0)
                  .map((group) => (
                  <div key={group.key} className="jd-app-group">
                    <div
                      className="jd-app-group-header"
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleAppsGroup(group.key)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') toggleAppsGroup(group.key);
                      }}
                    >
                      <span className="jd-app-group-label">
                        <span className="jd-icon">{appsExpanded[group.key] ? '\u25BC' : '\u25B6'}</span>
                        <span>{group.label}</span>
                      </span>
                      <span className="jd-app-group-count">{group.items.length}</span>
                    </div>
                    {appsExpanded[group.key] && (
                      <div className="jd-app-group-list">
                        {group.items.map((app) => {
                          const p = app.profile;
                          const name = p
                            ? `${p.first_name || ''} ${p.last_name || ''}`.trim()
                            : 'Candidate';
                          const role = p?.primary_role || '';
                          const loc = [p?.city_port, p?.country].filter(Boolean).join(', ');
                          const handle = p?.handle;
                          const profileUrl = handle ? `/cv/${handle}` : '';
                          const rawStatus = app.status || 'new';
                          const status = rawStatus === 'in_review' ? 'reviewed' : rawStatus;
                          const isNew = status === 'new';
                          const isShortlisted = status === 'shortlisted';
                          const wasReviewed = !!app.reviewed_at || status === 'reviewed';
                          const isExpanded = expandedAppId === app.id;
                          return (
                            <div
                              key={app.id}
                              className={`jd-app-card${isExpanded ? ' is-expanded' : ''}${isNew ? ' is-new' : ''}${isShortlisted ? ' is-shortlisted' : ''}${status === 'removed' ? ' is-removed' : ''}`}
                            >
                              <div
                                className="jd-app-row"
                                role="button"
                                tabIndex={0}
                                onClick={() => {
                                  toggleApplicationExpand(app);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    toggleApplicationExpand(app);
                                  }
                                }}
                                title="Open applicant options"
                              >
                                <div className="jd-app-main">
                                  <div className="jd-app-name">{name || 'Candidate'}</div>
                                  <div className="jd-app-sub">
                                    {[role, loc].filter(Boolean).join(` \u2022 `) || '-'}
                                  </div>
                                </div>
                                <div className="jd-app-actions">
                                  <button
                                    type="button"
                                    className={`jd-app-btn jd-app-btn-shortlist${status === 'shortlisted' ? ' active' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (status === 'shortlisted') {
                                        updateApplicationStatus(app.id, wasReviewed ? 'in_review' : 'new');
                                        return;
                                      }
                                      if (status === 'removed') {
                                        updateApplicationStatus(app.id, wasReviewed ? 'in_review' : 'new');
                                        return;
                                      }
                                      updateApplicationStatus(app.id, 'shortlisted');
                                    }}
                                    title="Shortlist"
                                  >
                                    <span className="jd-icon">{isShortlisted ? '\u2713' : '\u2605'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="jd-app-btn jd-app-btn-remove"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (status === 'removed') {
                                        updateApplicationStatus(app.id, wasReviewed ? 'in_review' : 'new');
                                        return;
                                      }
                                      const ok = window.confirm('Remove this application?');
                                      if (!ok) return;
                                      updateApplicationStatus(app.id, 'removed');
                                    }}
                                    title="Remove"
                                  >
                                    <span className="jd-icon">{'\u2715'}</span>
                                  </button>
                                  <div className="jd-app-score">
                                    {Math.round(Number(app.match_score || 0))}%
                                  </div>
                                </div>
                              </div>
                              {isExpanded && (
                                <div className="jd-app-panel" onClick={(e) => e.stopPropagation()}>
                                  <div className="jd-app-tabs" aria-label="Applicant actions">
                                    <button
                                      type="button"
                                      className="jd-app-tab"
                                      onClick={async () => {
                                        await loadApplicantBenchmark(app);
                                        setBenchmarkModalAppId(app.id);
                                      }}
                                    >
                                      Benchmark
                                    </button>
                                    <button
                                      type="button"
                                      className="jd-app-tab"
                                      onClick={async () => {
                                        if (profileUrl) {
                                          window.open(profileUrl, '_blank', 'noopener,noreferrer');
                                        }
                                        if (status === 'new') {
                                          await updateApplicationStatus(app.id, 'in_review', { setReviewedAt: true });
                                        }
                                      }}
                                    >
                                      Digital CV
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="jd-card">
            <div className="jd-card-title">Pipeline</div>
            <div className="jd-pipeline">
              <div className="jd-pipeline-row">
                <span>New</span>
                <span className="jd-pill">{appStatuses.newCount}</span>
              </div>
              <div className="jd-pipeline-row">
                <span>Reviewed</span>
                <span className="jd-pill">{appStatuses.reviewedCount}</span>
              </div>
              <div className="jd-pipeline-row">
                <span>Shortlisted</span>
                <span className="jd-pill">{appStatuses.shortlistedCount}</span>
              </div>
              <div className="jd-pipeline-row">
                <span>Hired</span>
                <span className="jd-pill">0</span>
              </div>
            </div>
          </section>

          <section className="jd-card jd-wide">
            <div className="jd-card-title">Activity & Notes</div>
            <div className="jd-empty">
              Activity and notes will appear here once available.
            </div>
          </section>

          <section className="jd-card jd-wide">
            <div className="jd-card-title">Benchmarks (Similar Jobs)</div>
            <div className="jd-benchmark">
              <div className="jd-benchmark-row">
                <span>Similar jobs found</span>
                <span className="jd-pill">{benchLoading ? '-' : formatNum(benchmarks.similarCount)}</span>
              </div>
              <div className="jd-benchmark-grid">
                <div className="jd-benchmark-item">
                  <div className="jd-benchmark-label">Avg Views</div>
                  <div className="jd-benchmark-value">
                    {benchLoading ? '-' : formatNum(benchmarks.avgViews)}
                  </div>
                  <div className="jd-benchmark-sub">
                    {benchLoading ? '-' : deltaLabel(metrics.views, benchmarks.avgViews)}
                  </div>
                </div>
                <div className="jd-benchmark-item">
                  <div className="jd-benchmark-label">Avg Direct</div>
                  <div className="jd-benchmark-value">
                    {benchLoading ? '-' : formatNum(benchmarks.avgDirect)}
                  </div>
                  <div className="jd-benchmark-sub">
                    {benchLoading ? '-' : deltaLabel(metrics.direct, benchmarks.avgDirect)}
                  </div>
                </div>
                <div className="jd-benchmark-item">
                  <div className="jd-benchmark-label">Avg Private Chats</div>
                  <div className="jd-benchmark-value">
                    {benchLoading ? '-' : formatNum(benchmarks.avgPrivateChats)}
                  </div>
                  <div className="jd-benchmark-sub">
                    {benchLoading ? '-' : deltaLabel(metrics.privateChats, benchmarks.avgPrivateChats)}
                  </div>
                </div>
              </div>

              <div className="jd-salary-compare">
                <div className="jd-salary-title">Salary Comparison</div>
                <div className="jd-salary-row">
                  <span>Avg similar (USD)</span>
                  <span>
                    {benchmarks.avgSalaryUsd == null
                      ? 'N/A'
                      : `${Math.round(benchmarks.avgSalaryUsd)} USD`}
                  </span>
                </div>
                <div className="jd-salary-sub">
                  {benchmarks.salaryUsdSampleCount > 0
                    ? `Sample size (USD): ${benchmarks.salaryUsdSampleCount}`
                    : 'No USD salaries yet'}
                </div>
                <div className="jd-salary-row">
                  <span>Avg similar (EUR)</span>
                  <span>
                    {benchmarks.avgSalaryEur == null
                      ? 'N/A'
                      : `${Math.round(benchmarks.avgSalaryEur)} EUR`}
                  </span>
                </div>
                <div className="jd-salary-sub">
                  {benchmarks.salaryEurSampleCount > 0
                    ? `Sample size (EUR): ${benchmarks.salaryEurSampleCount}`
                    : 'No EUR salaries yet'}
                </div>
              </div>
            </div>
          </section>
        </div>
        {benchmarkModalApp && (
          <div className="jd-bench-modal-backdrop" onClick={() => setBenchmarkModalAppId(null)}>
            <div className="jd-bench-modal" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="jd-bench-modal-close"
                onClick={() => setBenchmarkModalAppId(null)}
                aria-label="Close benchmark"
              >
                ×
              </button>
              <div className="jd-bench-modal-kicker">Candidate Benchmark</div>
              <div className="jd-bench-modal-title">
                {`${benchmarkModalApp.profile?.first_name || ''} ${benchmarkModalApp.profile?.last_name || ''}`.trim() || 'Candidate'}
              </div>
              <div className="jd-bench-modal-sub">
                {[benchmarkModalApp.profile?.primary_role, benchmarkModalApp.profile?.city_port, benchmarkModalApp.profile?.country].filter(Boolean).join(' • ') || 'Applicant pool comparison'}
              </div>
              <div className="jd-bench-panel">
                {benchmarkLoadingByAppId[benchmarkModalApp.id] ? (
                  <div className="jd-empty">Loading benchmark...</div>
                ) : benchmarkByAppId[benchmarkModalApp.id]?.error ? (
                  <div className="jd-empty">Could not load benchmark.</div>
                ) : !benchmarkByAppId[benchmarkModalApp.id]?.has_enough_data ? (
                  <div className="jd-empty">Not enough data.</div>
                ) : (
                  <>
                    <div className="jd-bench-summary">
                      <div className="jd-bench-summary-card">
                        <div className="jd-bench-summary-kicker">Applicant rank</div>
                        <div className="jd-bench-summary-value">
                          #{benchmarkByAppId[benchmarkModalApp.id].match_rank}
                        </div>
                        <div className="jd-bench-summary-sub">
                          out of {benchmarkByAppId[benchmarkModalApp.id].applicants_count} applicants
                        </div>
                      </div>
                      <div className="jd-bench-summary-card">
                        <div className="jd-bench-summary-kicker">Match score</div>
                        <div className="jd-bench-summary-value">
                          {Math.round(Number(benchmarkByAppId[benchmarkModalApp.id].candidate_match_score || 0))}%
                        </div>
                        <div className="jd-bench-summary-sub">
                          avg {benchmarkByAppId[benchmarkModalApp.id].avg_match_score}%
                        </div>
                      </div>
                    </div>
                    <div className="jd-bench-grid">
                    <div className={`jd-bench-item is-${benchmarkTone(benchmarkByAppId[benchmarkModalApp.id].candidate_experience, benchmarkByAppId[benchmarkModalApp.id].avg_experience)}`}>
                      <div className="jd-bench-label">Experience</div>
                      <div className="jd-bench-value jd-bench-value-lg jd-bench-value-inline">
                        <span>
                          {describeAgainstAverage(benchmarkByAppId[benchmarkModalApp.id].candidate_experience, benchmarkByAppId[benchmarkModalApp.id].avg_experience, { decimals: 1, unit: 'y' }).replace(` (${benchmarkDelta(benchmarkByAppId[benchmarkModalApp.id].candidate_experience, benchmarkByAppId[benchmarkModalApp.id].avg_experience, 1, 'y')})`, '')}
                        </span>
                        <span className="jd-bench-chip">
                          {benchmarkDelta(benchmarkByAppId[benchmarkModalApp.id].candidate_experience, benchmarkByAppId[benchmarkModalApp.id].avg_experience, 1, 'y')}
                        </span>
                      </div>
                      <div className="jd-bench-sub jd-bench-sub-top">
                        {benchmarkByAppId[benchmarkModalApp.id].candidate_experience}y vs avg {benchmarkByAppId[benchmarkModalApp.id].avg_experience}y
                      </div>
                      <div className="jd-bench-scale">
                        <div className="jd-bench-scale-track" />
                        <div
                          className="jd-bench-scale-marker is-average"
                          style={{ left: `${benchmarkScalePos(benchmarkByAppId[benchmarkModalApp.id].avg_experience, benchmarkScaleMax(benchmarkByAppId[benchmarkModalApp.id].candidate_experience, benchmarkByAppId[benchmarkModalApp.id].avg_experience))}%` }}
                        >
                          <PoolMarker className="jd-bench-scale-icon is-average" />
                        </div>
                        <div
                          className="jd-bench-scale-marker is-candidate"
                          style={{ left: `${benchmarkScalePos(benchmarkByAppId[benchmarkModalApp.id].candidate_experience, benchmarkScaleMax(benchmarkByAppId[benchmarkModalApp.id].candidate_experience, benchmarkByAppId[benchmarkModalApp.id].avg_experience))}%` }}
                        >
                          <CandidateMarker className="jd-bench-scale-icon is-candidate" />
                        </div>
                        <div className="jd-bench-scale-legend">
                          <span><CandidateMarker className="jd-bench-icon is-candidate" /> Candidate</span>
                          <span><PoolMarker className="jd-bench-icon is-average" /> Pool avg</span>
                        </div>
                      </div>
                    </div>
                    <div className={`jd-bench-item is-${benchmarkTone(benchmarkByAppId[benchmarkModalApp.id].candidate_languages, benchmarkByAppId[benchmarkModalApp.id].avg_languages)}`}>
                      <div className="jd-bench-label">Languages</div>
                      <div className="jd-bench-value jd-bench-value-lg jd-bench-value-inline">
                        <span>
                          {describeAgainstAverage(benchmarkByAppId[benchmarkModalApp.id].candidate_languages, benchmarkByAppId[benchmarkModalApp.id].avg_languages, { decimals: 2 }).replace(` (${benchmarkDelta(benchmarkByAppId[benchmarkModalApp.id].candidate_languages, benchmarkByAppId[benchmarkModalApp.id].avg_languages, 2)})`, '')}
                        </span>
                        <span className="jd-bench-chip">
                          {benchmarkDelta(benchmarkByAppId[benchmarkModalApp.id].candidate_languages, benchmarkByAppId[benchmarkModalApp.id].avg_languages, 2)}
                        </span>
                      </div>
                      <div className="jd-bench-sub jd-bench-sub-top">
                        {benchmarkByAppId[benchmarkModalApp.id].candidate_languages} vs avg {benchmarkByAppId[benchmarkModalApp.id].avg_languages}
                      </div>
                      <div className="jd-bench-scale">
                        <div className="jd-bench-scale-track" />
                        <div
                          className="jd-bench-scale-marker is-average"
                          style={{ left: `${benchmarkScalePos(benchmarkByAppId[benchmarkModalApp.id].avg_languages, benchmarkScaleMax(benchmarkByAppId[benchmarkModalApp.id].candidate_languages, benchmarkByAppId[benchmarkModalApp.id].avg_languages))}%` }}
                        >
                          <PoolMarker className="jd-bench-scale-icon is-average" />
                        </div>
                        <div
                          className="jd-bench-scale-marker is-candidate"
                          style={{ left: `${benchmarkScalePos(benchmarkByAppId[benchmarkModalApp.id].candidate_languages, benchmarkScaleMax(benchmarkByAppId[benchmarkModalApp.id].candidate_languages, benchmarkByAppId[benchmarkModalApp.id].avg_languages))}%` }}
                        >
                          <CandidateMarker className="jd-bench-scale-icon is-candidate" />
                        </div>
                        <div className="jd-bench-scale-legend">
                          <span><CandidateMarker className="jd-bench-icon is-candidate" /> Candidate</span>
                          <span><PoolMarker className="jd-bench-icon is-average" /> Pool avg</span>
                        </div>
                      </div>
                    </div>
                    <div className={`jd-bench-item is-${benchmarkTone(benchmarkByAppId[benchmarkModalApp.id].candidate_certifications, benchmarkByAppId[benchmarkModalApp.id].avg_certifications)}`}>
                      <div className="jd-bench-label">Certifications</div>
                      <div className="jd-bench-value jd-bench-value-lg jd-bench-value-inline">
                        <span>
                          {describeAgainstAverage(benchmarkByAppId[benchmarkModalApp.id].candidate_certifications, benchmarkByAppId[benchmarkModalApp.id].avg_certifications, { decimals: 2 }).replace(` (${benchmarkDelta(benchmarkByAppId[benchmarkModalApp.id].candidate_certifications, benchmarkByAppId[benchmarkModalApp.id].avg_certifications, 2)})`, '')}
                        </span>
                        <span className="jd-bench-chip">
                          {benchmarkDelta(benchmarkByAppId[benchmarkModalApp.id].candidate_certifications, benchmarkByAppId[benchmarkModalApp.id].avg_certifications, 2)}
                        </span>
                      </div>
                      <div className="jd-bench-sub jd-bench-sub-top">
                        {benchmarkByAppId[benchmarkModalApp.id].candidate_certifications} vs avg {benchmarkByAppId[benchmarkModalApp.id].avg_certifications}
                      </div>
                      <div className="jd-bench-scale">
                        <div className="jd-bench-scale-track" />
                        <div
                          className="jd-bench-scale-marker is-average"
                          style={{ left: `${benchmarkScalePos(benchmarkByAppId[benchmarkModalApp.id].avg_certifications, benchmarkScaleMax(benchmarkByAppId[benchmarkModalApp.id].candidate_certifications, benchmarkByAppId[benchmarkModalApp.id].avg_certifications))}%` }}
                        >
                          <PoolMarker className="jd-bench-scale-icon is-average" />
                        </div>
                        <div
                          className="jd-bench-scale-marker is-candidate"
                          style={{ left: `${benchmarkScalePos(benchmarkByAppId[benchmarkModalApp.id].candidate_certifications, benchmarkScaleMax(benchmarkByAppId[benchmarkModalApp.id].candidate_certifications, benchmarkByAppId[benchmarkModalApp.id].avg_certifications))}%` }}
                        >
                          <CandidateMarker className="jd-bench-scale-icon is-candidate" />
                        </div>
                        <div className="jd-bench-scale-legend">
                          <span><CandidateMarker className="jd-bench-icon is-candidate" /> Candidate</span>
                          <span><PoolMarker className="jd-bench-icon is-average" /> Pool avg</span>
                        </div>
                      </div>
                    </div>
                    <div className={`jd-bench-item is-${benchmarkTone(benchmarkByAppId[benchmarkModalApp.id].candidate_match_score, benchmarkByAppId[benchmarkModalApp.id].avg_match_score)}`}>
                      <div className="jd-bench-label">Match score</div>
                      <div className="jd-bench-value jd-bench-value-lg jd-bench-value-inline">
                        <span>
                          Rank {benchmarkByAppId[benchmarkModalApp.id].match_rank} of {benchmarkByAppId[benchmarkModalApp.id].applicants_count}
                        </span>
                        <span className="jd-bench-chip">
                          {benchmarkDelta(benchmarkByAppId[benchmarkModalApp.id].candidate_match_score, benchmarkByAppId[benchmarkModalApp.id].avg_match_score, 2, '%')}
                        </span>
                      </div>
                      <div className="jd-bench-sub jd-bench-sub-top">
                        {benchmarkByAppId[benchmarkModalApp.id].candidate_match_score}% vs avg {benchmarkByAppId[benchmarkModalApp.id].avg_match_score}%
                      </div>
                      <div className="jd-bench-scale">
                        <div className="jd-bench-scale-track" />
                        <div
                          className="jd-bench-scale-marker is-average"
                          style={{ left: `${benchmarkScalePos(benchmarkByAppId[benchmarkModalApp.id].avg_match_score, benchmarkScaleMax(benchmarkByAppId[benchmarkModalApp.id].candidate_match_score, benchmarkByAppId[benchmarkModalApp.id].avg_match_score))}%` }}
                        >
                          <PoolMarker className="jd-bench-scale-icon is-average" />
                        </div>
                        <div
                          className="jd-bench-scale-marker is-candidate"
                          style={{ left: `${benchmarkScalePos(benchmarkByAppId[benchmarkModalApp.id].candidate_match_score, benchmarkScaleMax(benchmarkByAppId[benchmarkModalApp.id].candidate_match_score, benchmarkByAppId[benchmarkModalApp.id].avg_match_score))}%` }}
                        >
                          <CandidateMarker className="jd-bench-scale-icon is-candidate" />
                        </div>
                        <div className="jd-bench-scale-legend">
                          <span><CandidateMarker className="jd-bench-icon is-candidate" /> Candidate</span>
                          <span><PoolMarker className="jd-bench-icon is-average" /> Pool avg</span>
                        </div>
                      </div>
                    </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        <style>{`
          .job-dashboard { display:flex; flex-direction:column; gap:18px; min-width:min(1000px, 92vw); color:var(--text-color, #111); }
          .modal-content-wrapper.job-dashboard-modal { width:min(1100px, 96vw); max-width:96vw; overflow-x:hidden; }
          .jd-header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; border-bottom:1px solid rgba(0,0,0,0.08); padding-bottom:12px; }
          .jd-kicker { font-size:0.85rem; letter-spacing:0.08em; text-transform:uppercase; color:var(--muted-2, #6b7280); }
          .jd-title { margin:6px 0; font-size:1.6rem; font-weight:700; }
          .jd-sub { display:flex; align-items:center; gap:10px; color:var(--muted, #6b7280); font-size:0.95rem; }
          .jd-dot { opacity:0.6; }
          .jd-status { padding:6px 10px; border-radius:999px; font-size:0.85rem; font-weight:600; background:#e8f5e9; color:#1b5e20; border:1px solid #c8e6c9; }
          .jd-status.is-paused { background:#fff8e1; color:#aa7b00; border-color:#f4ca64; }
          .jd-grid { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:16px; }
          .jd-card { background:var(--card-bg, #fff); border:1px solid rgba(0,0,0,0.08); border-radius:12px; padding:16px; box-shadow:0 10px 24px rgba(0,0,0,0.06); }
          .jd-card.jd-wide { grid-column:span 2; }
          .jd-card-title { font-weight:600; margin-bottom:12px; }
          .jd-metrics { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:12px; }
          .jd-metric { border:1px solid rgba(0,0,0,0.08); border-radius:10px; padding:10px; text-align:center; background:rgba(0,0,0,0.02); }
          .jd-metric-value { font-size:1.4rem; font-weight:700; }
          .jd-metric-label { font-size:0.85rem; color:var(--muted-2, #6b7280); }
          .jd-note { margin-top:10px; font-size:0.9rem; color:var(--muted-2, #6b7280); }
          .jd-empty { padding:18px; border-radius:10px; border:1px dashed rgba(0,0,0,0.18); color:var(--muted-2, #6b7280); background:rgba(0,0,0,0.02); }
          .jd-pipeline { display:flex; flex-direction:column; gap:8px; }
          .jd-pipeline-row { display:flex; align-items:center; justify-content:space-between; padding:8px 10px; border-radius:8px; background:rgba(0,0,0,0.03); }
          .jd-pill { min-width:28px; text-align:center; padding:2px 8px; border-radius:999px; background:rgba(0,0,0,0.12); font-weight:600; font-size:0.8rem; }
          .jd-apps { display:flex; flex-direction:column; gap:14px; }
          .jd-app-group { display:flex; flex-direction:column; gap:8px; }
          .jd-app-group-header { display:flex; align-items:center; justify-content:space-between; font-weight:700; font-size:0.95rem; cursor:pointer; user-select:none; }
          .jd-app-group-label { display:inline-flex; align-items:center; gap:6px; }
          .jd-app-group-count { font-size:0.85rem; opacity:0.7; }
          .jd-app-group-list { display:flex; flex-direction:column; gap:10px; }
          .jd-app-card { border-radius:10px; border:1px solid transparent; }
          .jd-app-card.is-expanded { background:rgba(0,0,0,0.02); border-color:rgba(0,0,0,0.08); overflow:hidden; }
          .jd-app-row { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px 12px; border-radius:10px; border:1px solid rgba(0,0,0,0.08); background:rgba(0,0,0,0.02); cursor:pointer; }
          .jd-app-row:hover { background:rgba(0,0,0,0.05); }
          .jd-app-card.is-new .jd-app-row { border-color: #22c55e; box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.18); }
          .jd-app-card.is-shortlisted .jd-app-row { border-color: #f59e0b; box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.18); }
          .jd-app-card.is-removed { opacity: 0.6; }
          .jd-app-name { font-weight:600; }
          .jd-app-sub { font-size:0.85rem; color:var(--muted-2, #6b7280); margin-top:2px; }
          .jd-app-actions { display:flex; align-items:center; gap:8px; }
          .jd-icon { font-family:"Segoe UI Symbol","Noto Sans Symbols 2","Noto Sans Symbols","Segoe UI",system-ui,sans-serif; }
          .jd-app-btn { width:26px; height:26px; border-radius:8px; border:1px solid rgba(0,0,0,0.08); background:rgba(0,0,0,0.04); font-size:13px; line-height:1; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; transition:transform .12s ease, box-shadow .12s ease, background .12s ease, border-color .12s ease; }
          .jd-app-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 14px rgba(0,0,0,0.18); }
          .jd-app-btn-shortlist { color:#166534; }
          .jd-app-btn-shortlist.active { background:rgba(202, 138, 4, 0.18); border-color:rgba(202, 138, 4, 0.5); color:#a16207; }
          .jd-app-btn-remove { color:#b91c1c; }
          .jd-app-btn-remove:hover { background:rgba(239, 68, 68, 0.16); border-color:rgba(239, 68, 68, 0.5); }
          .jd-app-score { min-width:54px; text-align:center; font-weight:700; background:rgba(0,0,0,0.12); border-radius:999px; padding:4px 10px; }
          .jd-app-panel { margin-top:8px; border-top:1px solid rgba(0,0,0,0.08); padding:12px; display:flex; flex-direction:column; gap:12px; }
          .jd-app-tabs { display:flex; gap:8px; }
          .jd-app-tab { border:1px solid rgba(0,0,0,0.1); background:rgba(0,0,0,0.04); border-radius:999px; padding:8px 14px; font-weight:600; cursor:pointer; }
          .jd-bench-panel { min-height:220px; }
          .jd-bench-summary { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:12px; margin-bottom:14px; }
          .jd-bench-summary-card { position:relative; overflow:hidden; border:1px solid rgba(0,0,0,0.08); border-radius:16px; padding:16px; background:linear-gradient(135deg, rgba(118,212,210,0.18), rgba(255,255,255,0.92)); }
          .jd-bench-summary-card::after { content:''; position:absolute; inset:auto -20% -35% auto; width:140px; height:140px; border-radius:50%; background:rgba(118,212,210,0.12); filter:blur(4px); }
          .jd-bench-summary-kicker { position:relative; z-index:1; font-size:0.76rem; letter-spacing:0.08em; text-transform:uppercase; color:var(--muted-2, #6b7280); }
          .jd-bench-summary-value { position:relative; z-index:1; margin-top:6px; font-size:2rem; font-weight:800; line-height:1; }
          .jd-bench-summary-sub { position:relative; z-index:1; margin-top:8px; font-size:0.88rem; color:var(--muted-2, #6b7280); }
          .jd-bench-grid { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:12px; }
          .jd-bench-item { border:1px solid rgba(0,0,0,0.08); border-radius:14px; padding:14px; background:linear-gradient(180deg, rgba(255,255,255,0.98), rgba(245,247,250,0.98)); }
          .jd-bench-item.is-positive { box-shadow:inset 0 0 0 1px rgba(34,197,94,0.2); }
          .jd-bench-item.is-negative { box-shadow:inset 0 0 0 1px rgba(239,68,68,0.16); }
          .jd-bench-item.is-neutral { box-shadow:inset 0 0 0 1px rgba(148,163,184,0.14); }
          .jd-bench-label { font-size:0.82rem; color:var(--muted-2, #6b7280); text-transform:uppercase; letter-spacing:0.06em; }
          .jd-bench-value { margin-top:6px; font-size:1rem; font-weight:700; }
          .jd-bench-value-lg { min-height:52px; font-size:1.22rem; line-height:1.2; }
          .jd-bench-value-inline { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
          .jd-bench-chip { display:inline-flex; align-items:center; flex-shrink:0; padding:5px 10px; border-radius:999px; background:rgba(118,212,210,0.16); color:#0f766e; font-size:0.8rem; font-weight:700; }
          .jd-bench-item.is-negative .jd-bench-chip { background:rgba(239,68,68,0.12); color:#b91c1c; }
          .jd-bench-item.is-neutral .jd-bench-chip { background:rgba(148,163,184,0.14); color:#475569; }
          .jd-bench-sub-top { margin-top:6px; margin-bottom:12px; }
          .jd-bench-scale { margin-top:2px; }
          .jd-bench-scale-track { position:relative; height:8px; border-radius:999px; background:linear-gradient(90deg, rgba(148,163,184,0.22), rgba(118,212,210,0.32)); }
          .jd-bench-scale-marker { position:relative; top:-14px; margin-top:-22px; width:24px; height:24px; transform:translateX(-50%); color:inherit; }
          .jd-bench-scale-icon { width:24px; height:24px; display:block; overflow:visible; stroke:currentColor; fill:none; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; filter:drop-shadow(0 3px 6px rgba(0,0,0,0.15)); }
          .jd-bench-scale-marker.is-candidate { color:#35b9b7; }
          .jd-bench-scale-marker.is-average { color:#334155; }
          .jd-bench-scale-legend { display:flex; flex-direction:column; align-items:flex-start; gap:4px; margin-top:8px; font-size:0.76rem; color:var(--muted-2, #64748b); }
          .jd-bench-scale-legend span { display:inline-flex; align-items:center; gap:6px; }
          .jd-bench-icon { width:12px; height:12px; display:inline-block; overflow:visible; stroke:currentColor; fill:none; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
          .jd-bench-icon.is-candidate { color:#35b9b7; }
          .jd-bench-icon.is-average { color:#334155; }
          .jd-bench-sub { margin-top:6px; font-size:0.82rem; color:var(--muted-2, #6b7280); }
          .jd-bench-modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.58); display:flex; align-items:center; justify-content:center; padding:24px; z-index:1200; }
          .jd-bench-modal { position:relative; width:min(820px, 92vw); max-height:90vh; overflow:auto; border-radius:24px; border:1px solid rgba(0,0,0,0.08); background:radial-gradient(circle at top left, rgba(118,212,210,0.12), transparent 28%), linear-gradient(180deg, #ffffff, #f3f4f6); box-shadow:0 28px 70px rgba(0,0,0,0.25); padding:28px; color:#111827; }
          .jd-bench-modal-kicker { font-size:0.82rem; letter-spacing:0.12em; text-transform:uppercase; color:#64748b; }
          .jd-bench-modal-title { margin-top:6px; font-size:2rem; font-weight:800; line-height:1.05; }
          .jd-bench-modal-sub { margin-top:8px; color:#64748b; font-size:1rem; }
          .jd-bench-modal-close { position:absolute; top:12px; right:12px; width:auto; height:auto; border:none; border-radius:0; background:transparent !important; color:var(--primary-color, #081a3b) !important; cursor:pointer; font-size:1.6rem; font-weight:400; line-height:1; padding:0 !important; box-shadow:none !important; font-family:inherit; }
          .jd-benchmark { display:flex; flex-direction:column; gap:14px; }
          .jd-benchmark-row { display:flex; align-items:center; justify-content:space-between; padding:10px 12px; border-radius:10px; background:rgba(0,0,0,0.04); }
          .jd-benchmark-grid { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:12px; }
          .jd-benchmark-item { border:1px solid rgba(0,0,0,0.08); border-radius:10px; padding:12px; background:rgba(0,0,0,0.02); }
          .jd-benchmark-label { font-size:0.85rem; color:var(--muted-2, #6b7280); }
          .jd-benchmark-value { font-size:1.2rem; font-weight:700; margin-top:4px; }
          .jd-benchmark-sub { font-size:0.8rem; color:var(--muted-2, #6b7280); margin-top:4px; }
          .jd-salary-compare { border:1px dashed rgba(0,0,0,0.18); border-radius:10px; padding:12px; background:rgba(0,0,0,0.02); }
          .jd-salary-title { font-weight:600; margin-bottom:8px; }
          .jd-salary-row { display:flex; align-items:center; justify-content:space-between; padding:6px 0; }
          .jd-salary-sub { font-size:0.85rem; color:var(--muted-2, #6b7280); }
          .jd-salary-note { margin-top:4px; }
          @media (max-width: 900px) {
            .job-dashboard { min-width:auto; }
            .jd-grid { grid-template-columns:1fr; }
            .jd-card.jd-wide { grid-column:span 1; }
            .jd-benchmark-grid { grid-template-columns:1fr; }
            .jd-bench-summary { grid-template-columns:1fr; }
            .jd-bench-grid { grid-template-columns:1fr; }
            .jd-bench-modal { padding:22px; width:min(92vw, 820px); }
            .jd-bench-modal-title { font-size:1.7rem; }
            .jd-bench-value-inline { flex-direction:column; align-items:flex-start; }
          }
          body.dark-mode .job-dashboard { color:#f5f5f5; }
          body.dark-mode .jd-header { border-bottom-color:rgba(255,255,255,0.1); }
          body.dark-mode .jd-card { background:#262626; border-color:rgba(255,255,255,0.08); box-shadow:none; }
          body.dark-mode .jd-bench-modal { border-color:rgba(255,255,255,0.08); background:radial-gradient(circle at top left, rgba(118,212,210,0.14), transparent 28%), linear-gradient(180deg, #2b2b2b, #232323); box-shadow:0 28px 70px rgba(0,0,0,0.42); color:#f5f5f5; }
          body.dark-mode .jd-bench-modal-kicker { color:#8fa0bf; }
          body.dark-mode .jd-bench-modal-sub { color:#9ca3af; }
          body.dark-mode .jd-bench-modal-close { background:transparent !important; color:#ffffff !important; }
          body.dark-mode .jd-bench-summary-card { border-color:rgba(255,255,255,0.08); background:linear-gradient(135deg, rgba(118,212,210,0.18), rgba(255,255,255,0.04)); }
          body.dark-mode .jd-bench-summary-kicker,
          body.dark-mode .jd-bench-summary-sub { color:#94a3b8; }
          body.dark-mode .jd-bench-item { border-color:rgba(255,255,255,0.08); background:linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015)); }
          body.dark-mode .jd-bench-chip { background:rgba(118,212,210,0.14); color:#9ce7e5; }
          body.dark-mode .jd-bench-item.is-negative .jd-bench-chip { background:rgba(239,68,68,0.12); color:#fca5a5; }
          body.dark-mode .jd-bench-item.is-neutral .jd-bench-chip { background:rgba(148,163,184,0.14); color:#cbd5e1; }
          body.dark-mode .jd-bench-scale-track { background:linear-gradient(90deg, rgba(255,255,255,0.08), rgba(118,212,210,0.22)); }
          body.dark-mode .jd-bench-scale-icon { filter:drop-shadow(0 3px 6px rgba(0,0,0,0.28)); }
          body.dark-mode .jd-bench-scale-marker.is-candidate { color:#76d4d2; }
          body.dark-mode .jd-bench-scale-marker.is-average { color:#f8fafc; }
          body.dark-mode .jd-bench-scale-legend { color:#94a3b8; }
          body.dark-mode .jd-bench-icon.is-candidate { color:#76d4d2; }
          body.dark-mode .jd-bench-icon.is-average { color:#f8fafc; }
          body.dark-mode .jd-metric,
          body.dark-mode .jd-empty,
          body.dark-mode .jd-pipeline-row,
          body.dark-mode .jd-benchmark-item,
          body.dark-mode .jd-benchmark-row,
          body.dark-mode .jd-salary-compare,
          body.dark-mode .jd-app-card.is-expanded { background:rgba(255,255,255,0.04); border-color:rgba(255,255,255,0.1); }
          body.dark-mode .jd-app-row { background:rgba(255,255,255,0.04); border-color:rgba(255,255,255,0.1); }
          body.dark-mode .jd-pill { background:rgba(255,255,255,0.18); }
          body.dark-mode .jd-app-score { background:rgba(255,255,255,0.18); }
          body.dark-mode .jd-app-btn { background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.18); }
          body.dark-mode .jd-app-panel,
          body.dark-mode .jd-bench-item,
          body.dark-mode .jd-app-tab { border-color:rgba(255,255,255,0.1); }
          body.dark-mode .jd-app-tab { background:rgba(255,255,255,0.06); color:#f5f5f5; }
          body.dark-mode .jd-app-card.is-new .jd-app-row { border-color:#22c55e !important; box-shadow:0 0 0 2px rgba(34,197,94,0.28) !important; }
          body.dark-mode .jd-app-card.is-shortlisted .jd-app-row { border-color:#f59e0b !important; box-shadow:0 0 0 2px rgba(245,158,11,0.28) !important; }
          body.dark-mode .jd-app-btn-shortlist { color:#22c55e !important; background:rgba(34, 197, 94, 0.18) !important; border-color:rgba(34, 197, 94, 0.65) !important; }
          body.dark-mode .jd-app-btn-shortlist.active { background:rgba(202, 138, 4, 0.28) !important; border-color:rgba(202, 138, 4, 0.8) !important; color:#fbbf24 !important; }
          body.dark-mode .jd-app-btn-remove { color:#ef4444 !important; background:rgba(239, 68, 68, 0.18) !important; border-color:rgba(239, 68, 68, 0.6) !important; }
        `}</style>
      </div>
    </Modal>
  );
}

export default JobDashboard;
