import React, { useEffect, useMemo, useState } from 'react';
import '../../styles/JobDashboard.css';
import JobDashboard from '../jobs/JobDashboard';
import Modal from '../Modal';
import ChatPage from '../ChatPage';
import supabase from '../../supabase';
import { formatOfferDate } from '../yachtOfferForm.utils';
import { useAuth } from '../../context/AuthContext';

const ProfileJobsTab = ({
  jobOffers,
  isAdmin = false,
  onTogglePause,
  onEdit,
  onDelete,
  openDashboardOfferId,
  onDashboardClosed,
}) => {
  const { currentUser } = useAuth();
  const [dashboardOffer, setDashboardOffer] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [expandedDates, setExpandedDates] = useState({});
  const [offersWithNewApps, setOffersWithNewApps] = useState(new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({ startDate: '', rank: '', country: '' });

  const handleStartPrivateChat = async ({ offerId, candidateUserId }) => {
    if (!offerId || !candidateUserId) return;

    const actorId = currentUser?.id || null;
    const { error } = await supabase
      .from('job_offer_events')
      .insert([{ offer_id: offerId, event_type: 'private_chat', actor_id: actorId }]);

    if (error) {
      console.warn('private_chat log error', error);
    }

    setActiveChat({ offerId, receiverId: candidateUserId });
  };

  const formatStartDate = (offer) => {
    if (offer?.is_asap) return 'ASAP';
    if (!offer?.start_date) return null;
    return formatOfferDate(offer.start_date, {
      monthOnly: offer.start_date_month_only,
      dayRange: offer.start_day_range,
    });
  };

  const getStartDateFilterValue = (offer) => {
    if (offer?.is_asap) return 'asap';
    if (!offer?.start_date) return '';
    const date = new Date(offer.start_date);
    if (Number.isNaN(date.getTime())) return '';
    return `month:${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  };

  const getRankValues = (offer) =>
    [offer?.title, offer?.teammate_rank]
      .map((value) => String(value || '').trim())
      .filter(Boolean);

  const filterOptions = useMemo(() => {
    const startDates = new Map();
    const ranks = new Set();
    const countries = new Set();

    (jobOffers || []).forEach((offer) => {
      const startValue = getStartDateFilterValue(offer);
      const startLabel = offer?.is_asap
        ? 'ASAP'
        : offer?.start_date
        ? new Date(offer.start_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
        : null;

      if (startValue && startLabel && !startDates.has(startValue)) {
        startDates.set(startValue, startLabel);
      }

      getRankValues(offer).forEach((rank) => ranks.add(rank));

      const country = String(offer?.country || '').trim();
      if (country) countries.add(country);
    });

    return {
      startDates: Array.from(startDates.entries()).map(([value, label]) => ({ value, label })),
      ranks: Array.from(ranks).sort((a, b) => a.localeCompare(b)),
      countries: Array.from(countries).sort((a, b) => a.localeCompare(b)),
    };
  }, [jobOffers]);

  const filteredOffers = useMemo(() => {
    return (jobOffers || []).filter((offer) => {
      if (filters.startDate && getStartDateFilterValue(offer) !== filters.startDate) return false;

      if (filters.rank) {
        const query = filters.rank.trim().toLowerCase();
        const matchesRank = getRankValues(offer).some((rank) => rank.toLowerCase().includes(query));
        if (!matchesRank) return false;
      }

      if (filters.country) {
        const query = filters.country.trim().toLowerCase();
        const countryValue = String(offer?.country || '').trim().toLowerCase();
        if (!countryValue.includes(query)) return false;
      }

      return true;
    });
  }, [jobOffers, filters]);

  const groupedByDate = useMemo(() => {
    const groups = new Map();
    filteredOffers.forEach((offer) => {
      const d = offer?.created_at ? new Date(offer.created_at) : null;
      const key = d ? d.toISOString().slice(0, 10) : 'unknown';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(offer);
    });
    const dates = Array.from(groups.keys()).sort((a, b) => b.localeCompare(a));
    return { groups, dates };
  }, [filteredOffers]);

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

  const formatLocation = (offer) => {
    return [offer?.city, offer?.country].filter(Boolean).join(', ') || '-';
  };

  return (
    <>
      <h2>My Posted Jobs</h2>
      {isAdmin && jobOffers.length > 0 && (
        <div className="jobs-filters-panel">
          <h3
            className="jobs-filters-toggle"
            onClick={() => setFiltersOpen((prev) => !prev)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setFiltersOpen((prev) => !prev);
              }
            }}
            role="button"
            tabIndex={0}
            aria-expanded={filtersOpen}
          >
            {filtersOpen ? '▼ Filters' : '► Filters'}
          </h3>

          {filtersOpen && (
            <div className="jobs-admin-filters">
              <label className="jobs-filter-field">
                <span>Start date</span>
                <select
                  value={filters.startDate}
                  onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                >
                  <option value="">All start dates</option>
                  {filterOptions.startDates.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="jobs-filter-field">
                <span>Rank</span>
                <input
                  type="text"
                  value={filters.rank}
                  onChange={(e) => setFilters((prev) => ({ ...prev, rank: e.target.value }))}
                  placeholder="Type a rank..."
                  list="jobs-admin-ranks"
                />
                <datalist id="jobs-admin-ranks">
                  {filterOptions.ranks.map((rank) => (
                    <option key={rank} value={rank} />
                  ))}
                </datalist>
              </label>

              <label className="jobs-filter-field">
                <span>Country</span>
                <input
                  type="text"
                  value={filters.country}
                  onChange={(e) => setFilters((prev) => ({ ...prev, country: e.target.value }))}
                  placeholder="Type a country..."
                  list="jobs-admin-countries"
                />
                <datalist id="jobs-admin-countries">
                  {filterOptions.countries.map((country) => (
                    <option key={country} value={country} />
                  ))}
                </datalist>
              </label>

              <button
                type="button"
                className="jobs-filter-clear"
                onClick={() => setFilters({ startDate: '', rank: '', country: '' })}
                disabled={!filters.startDate && !filters.rank && !filters.country}
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}

      {jobOffers.length === 0 ? (
        <p>You have not posted any job offers yet.</p>
      ) : filteredOffers.length === 0 ? (
        <p>No jobs match the selected filters.</p>
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
                          {formatLocation(offer)}
                        </p>
                        <div
                          className="job-card-dates"
                          style={{
                            margin: '4px 0',
                            fontWeight: '500',
                            fontSize: '0.95rem',
                          }}
                        >
                          <div className="job-date-item">
                            <span className="job-date-label">Posted:</span>
                            <span className="job-date-value">
                              {offer.created_at ? new Date(offer.created_at).toLocaleDateString('en-GB') : '-'}
                            </span>
                          </div>
                          {formatStartDate(offer) && (
                            <div className="job-date-item">
                              <span className="job-date-label">Start:</span>
                              <span className="job-date-value">{formatStartDate(offer)}</span>
                            </div>
                          )}
                        </div>
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
        .jobs-filters-panel {
          margin: 12px 0 18px;
        }
        .jobs-filters-toggle {
          cursor: pointer;
          margin: 0;
          display: inline-block;
          user-select: none;
        }
        .jobs-admin-filters {
          display: grid;
          grid-template-columns: repeat(3, minmax(180px, 1fr)) auto;
          gap: 12px;
          align-items: end;
          margin-top: 12px;
        }
        .jobs-filter-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .jobs-filter-field span {
          font-size: 0.9rem;
          font-weight: 600;
        }
        .jobs-filter-field select {
          min-height: 38px;
          border-radius: 10px;
          border: 1px solid rgba(0,0,0,0.16);
          padding: 8px 10px;
          background: var(--card-bg, #fff);
          color: inherit;
        }
        .jobs-filter-field input {
          min-height: 38px;
          height: 38px;
          box-sizing: border-box;
          line-height: 1.2;
          border-radius: 10px;
          border: 1px solid rgba(0,0,0,0.16);
          padding: 8px 10px;
          background: var(--card-bg, #fff);
          color: inherit;
        }
        .jobs-filter-clear {
          min-height: 38px;
          border-radius: 10px;
          border: 1px solid rgba(0,0,0,0.16);
          padding: 8px 14px;
          background: transparent;
          color: inherit;
          cursor: pointer;
          font-weight: 600;
        }
        .jobs-filter-clear:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .jobs-date-toggle {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: inherit;
          cursor: pointer;
          font-weight: 700;
          font-size: 1.05rem;
          margin-bottom: 10px;
          user-select: none;
        }
        .jobs-date-caret { font-size: 1rem; }
        .jobs-date-count { font-weight: 600; opacity: .7; }
        .job-card-dates {
          display: flex;
          flex-wrap: wrap;
          gap: 16px 24px;
        }
        .job-date-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .job-date-label {
          font-weight: 600;
          font-size: 0.85rem;
          opacity: 0.9;
        }
        .job-date-value {
          font-weight: 500;
        }
        @media (max-width: 900px) {
          .jobs-admin-filters {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {dashboardOffer && (
        <JobDashboard
          offer={dashboardOffer}
          onStartPrivateChat={handleStartPrivateChat}
          onClose={() => {
            setDashboardOffer(null);
            refreshNewApplications();
            if (typeof onDashboardClosed === 'function') onDashboardClosed();
          }}
        />
      )}

      {activeChat && (
        <Modal onClose={() => setActiveChat(null)}>
          <ChatPage
            offerId={activeChat.offerId}
            receiverId={activeChat.receiverId}
            onBack={() => setActiveChat(null)}
            onClose={() => setActiveChat(null)}
          />
        </Modal>
      )}
    </>
  );
};

export default ProfileJobsTab;
