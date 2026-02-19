import React, { useEffect, useMemo, useState } from 'react';
import '../../styles/JobDashboard.css';
import JobDashboard from '../jobs/JobDashboard';
import supabase from '../../supabase';

const ProfileJobsTab = ({
  jobOffers,
  onTogglePause,
  onEdit,
  onDelete,
  openDashboardOfferId,
  onDashboardClosed,
}) => {
  const [dashboardOffer, setDashboardOffer] = useState(null);
  const [expandedDates, setExpandedDates] = useState({});
  const [offersWithNewApps, setOffersWithNewApps] = useState(new Set());

  const groupedByDate = useMemo(() => {
    const groups = new Map();
    (jobOffers || []).forEach((offer) => {
      const d = offer?.created_at ? new Date(offer.created_at) : null;
      const key = d ? d.toISOString().slice(0, 10) : 'unknown';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(offer);
    });
    const dates = Array.from(groups.keys()).sort((a, b) => b.localeCompare(a));
    return { groups, dates };
  }, [jobOffers]);

  useEffect(() => {
    const next = {};
    groupedByDate.dates.slice(0, 5).forEach((d) => {
      next[d] = true;
    });
    setExpandedDates(next);
  }, [groupedByDate.dates.join('|')]);

  useEffect(() => {
    let mounted = true;
    const fetchNewApps = async () => {
      const offerIds = (jobOffers || []).map((o) => o.id).filter(Boolean);
      if (!offerIds.length) {
        if (mounted) setOffersWithNewApps(new Set());
        return;
      }
      const next = new Set();
      const chunkSize = 50;
      for (let i = 0; i < offerIds.length; i += chunkSize) {
        const chunk = offerIds.slice(i, i + chunkSize);
        const { data, error } = await supabase
          .from('job_direct_applications')
          .select('offer_id, status')
          .in('offer_id', chunk)
          .neq('status', 'removed');
        if (error) {
          console.warn('Failed to load new applications', error);
          continue;
        }
        (data || []).forEach((row) => {
          const status = row?.status || 'new';
          if (status === 'new') next.add(row.offer_id);
        });
      }
      if (!mounted) return;
      setOffersWithNewApps(next);
    };

    fetchNewApps();
    return () => {
      mounted = false;
    };
  }, [jobOffers]);

  const refreshNewApplications = async () => {
    const offerIds = (jobOffers || []).map((o) => o.id).filter(Boolean);
    if (!offerIds.length) {
      setOffersWithNewApps(new Set());
      return;
    }
    const next = new Set();
    const chunkSize = 50;
    for (let i = 0; i < offerIds.length; i += chunkSize) {
      const chunk = offerIds.slice(i, i + chunkSize);
      const { data, error } = await supabase
        .from('job_direct_applications')
        .select('offer_id, status')
        .in('offer_id', chunk)
        .neq('status', 'removed');
      if (error) return;
      (data || []).forEach((row) => {
        const status = row?.status || 'new';
        if (status === 'new') next.add(row.offer_id);
      });
    }
    setOffersWithNewApps(next);
  };

  useEffect(() => {
    if (!openDashboardOfferId) return;
    if (dashboardOffer?.id === openDashboardOfferId) return;
    const match = (jobOffers || []).find(
      (offer) => String(offer.id) === String(openDashboardOfferId)
    );
    if (match) {
      setDashboardOffer(match);
    }
  }, [openDashboardOfferId, jobOffers, dashboardOffer?.id]);

  const toggleDate = (dateKey) => {
    setExpandedDates((prev) => ({
      ...prev,
      [dateKey]: !prev[dateKey],
    }));
  };

  return (
    <>
      <h2>My Posted Jobs</h2>
      {jobOffers.length === 0 ? (
        <p>You have not posted any job offers yet.</p>
      ) : (
        <div>
          {groupedByDate.dates.map((dateKey) => {
            const offers = groupedByDate.groups.get(dateKey) || [];
            const dateLabel = dateKey === 'unknown'
              ? 'Unknown date'
              : new Date(`${dateKey}T00:00:00Z`).toLocaleDateString('en-GB');
            const isOpen = !!expandedDates[dateKey];
            return (
              <div key={dateKey} style={{ marginBottom: 18 }}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleDate(dateKey)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') toggleDate(dateKey);
                  }}
                  className="jobs-date-toggle"
                >
                  <span className="jobs-date-caret">{isOpen ? '▼' : '►'}</span>
                  <span className="jobs-date-label">{dateLabel}</span>
                  <span className="jobs-date-count">({offers.length})</span>
                </div>
                {isOpen && (
                  <div className="profile-products-container">
                    {offers.map((offer) => (
                      <div
                        key={offer.id}
                        className={`profile-card${offersWithNewApps.has(offer.id) ? ' has-new-apps' : ''}`}
                      >
                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                          {offer.title}
                        </div>
                        {offer.teammate_rank && (
                          <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                            {offer.teammate_rank}
                          </div>
                        )}
                        <p style={{ margin: '4px 0' }}>
                          {offer.city}, {offer.country}
                        </p>
                        <p
                          style={{
                            margin: '4px 0',
                            fontWeight: '500',
                            fontSize: '0.95rem',
                            color: '#333',
                          }}
                        >
                          <strong>Posted:</strong>{' '}
                          {offer.created_at ? new Date(offer.created_at).toLocaleDateString('en-GB') : '—'}
                        </p>
                        <div className="profile-action-buttons">
                          <button
                            className="dashboard-btn"
                            onClick={() => setDashboardOffer(offer)}
                          >
                            Dashboard
                          </button>
                          <button
                            className="pause-btn"
                            onClick={() => onTogglePause(offer.id, offer.status)}
                          >
                            {offer.status === 'paused' ? 'Reactivate' : 'Pause'}
                          </button>
                          <button className="edit-btn" onClick={() => onEdit(offer.id)}>
                            Edit
                          </button>
                          <button className="delete-btn" onClick={() => onDelete(offer.id)}>
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <style>{`
        .jobs-date-toggle {
          display:inline-flex;
          align-items:center;
          gap:8px;
          color:inherit;
          cursor:pointer;
          font-weight:700;
          font-size:1.05rem;
          margin-bottom:10px;
          user-select:none;
        }
        .jobs-date-caret { font-size:1rem; }
        .jobs-date-count { font-weight:600; opacity:.7; }
      `}</style>
      {dashboardOffer && (
        <JobDashboard
          offer={dashboardOffer}
          onClose={() => {
            setDashboardOffer(null);
            refreshNewApplications();
            if (typeof onDashboardClosed === 'function') onDashboardClosed();
          }}
        />
      )}
    </>
  );
};

export default ProfileJobsTab;
