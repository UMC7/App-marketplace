import React, { useEffect, useState } from 'react';
import Modal from '../Modal';
import '../../styles/JobDashboard.css';
import supabase from '../../supabase';

function JobDashboard({ offer, onClose }) {
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
        setMetrics({
          views: Number(data.views || 0),
          privateChats: Number(data.private_chats || 0),
          direct: Number(data.direct || 0),
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
        .select('id, candidate_user_id, candidate_profile_id, match_score, created_at')
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
          .select('id, first_name, last_name, primary_role, primary_department, city_port, country, availability, headline, hero_image_url')
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
      setAppsLoading(false);
    }
    fetchApplications();
    return () => {
      mounted = false;
    };
  }, [offer?.id]);

  if (!offer) return null;

  const postedDate = offer?.created_at
    ? new Date(offer.created_at).toLocaleDateString('en-GB')
    : '-';
  const location = [offer?.city, offer?.country].filter(Boolean).join(', ') || '-';
  const statusLabel = offer?.status === 'paused' ? 'Paused' : 'Active';
  const formatNum = (v) => (Number.isFinite(v) ? Math.round(v) : 0);
  const deltaLabel = (current, avg) => {
    if (!Number.isFinite(avg) || avg <= 0) return 'No benchmark yet';
    const diff = current - avg;
    const pct = Math.round((diff / avg) * 100);
    const sign = pct > 0 ? '+' : '';
    return `${sign}${pct}% vs avg`;
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
            ) : applications.length === 0 ? (
              <div className="jd-empty">No direct applications yet.</div>
            ) : (
              <div className="jd-apps">
                {applications.map((app) => {
                  const p = app.profile;
                  const name = p
                    ? `${p.first_name || ''} ${p.last_name || ''}`.trim()
                    : 'Candidate';
                  const role = p?.primary_role || '';
                  const loc = [p?.city_port, p?.country].filter(Boolean).join(', ');
                  return (
                    <div key={app.id} className="jd-app-row">
                      <div className="jd-app-main">
                        <div className="jd-app-name">{name || 'Candidate'}</div>
                        <div className="jd-app-sub">
                          {[role, loc].filter(Boolean).join(' • ') || '—'}
                        </div>
                      </div>
                      <div className="jd-app-score">
                        {Math.round(Number(app.match_score || 0))}%
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="jd-card">
            <div className="jd-card-title">Pipeline</div>
            <div className="jd-pipeline">
              <div className="jd-pipeline-row">
                <span>New</span>
                <span className="jd-pill">0</span>
              </div>
              <div className="jd-pipeline-row">
                <span>In Review</span>
                <span className="jd-pill">0</span>
              </div>
              <div className="jd-pipeline-row">
                <span>Shortlisted</span>
                <span className="jd-pill">0</span>
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
          .jd-apps { display:flex; flex-direction:column; gap:10px; }
          .jd-app-row { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px 12px; border-radius:10px; border:1px solid rgba(0,0,0,0.08); background:rgba(0,0,0,0.02); }
          .jd-app-name { font-weight:600; }
          .jd-app-sub { font-size:0.85rem; color:var(--muted-2, #6b7280); margin-top:2px; }
          .jd-app-score { min-width:54px; text-align:center; font-weight:700; background:rgba(0,0,0,0.12); border-radius:999px; padding:4px 10px; }
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
          }
          body.dark-mode .job-dashboard { color:#f5f5f5; }
          body.dark-mode .jd-header { border-bottom-color:rgba(255,255,255,0.1); }
          body.dark-mode .jd-card { background:#262626; border-color:rgba(255,255,255,0.08); box-shadow:none; }
          body.dark-mode .jd-metric,
          body.dark-mode .jd-empty,
          body.dark-mode .jd-pipeline-row,
          body.dark-mode .jd-benchmark-item,
          body.dark-mode .jd-benchmark-row,
          body.dark-mode .jd-salary-compare,
          body.dark-mode .jd-app-row { background:rgba(255,255,255,0.04); border-color:rgba(255,255,255,0.1); }
          body.dark-mode .jd-pill { background:rgba(255,255,255,0.18); }
          body.dark-mode .jd-app-score { background:rgba(255,255,255,0.18); }
        `}</style>
      </div>
    </Modal>
  );
}

export default JobDashboard;
