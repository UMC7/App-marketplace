// src/admin/tabs/AnalyticsJobsTab.js
import React, { useEffect, useMemo, useState } from 'react';
import supabase from '../../supabase';

const TIME_ZONE = 'Europe/Madrid';
const LOCALE = 'en-US';

function parseTimestamp(value) {
  if (!value) return null;
  const raw = String(value);
  if (/[zZ]|[+-]\d\d:\d\d$/.test(raw)) return new Date(raw);
  return new Date(`${raw}Z`);
}

function getTzParts(date, timeZone = TIME_ZONE) {
  const fmt = new Intl.DateTimeFormat(LOCALE, {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(date).reduce((acc, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {});
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
  };
}

function getLocalDateUTC(date) {
  const p = getTzParts(date);
  return new Date(Date.UTC(p.year, p.month - 1, p.day));
}

function getWeekStartUTC(date) {
  const localDate = getLocalDateUTC(date);
  const dow = localDate.getUTCDay();
  const offset = (dow + 6) % 7; // Monday=0
  return new Date(localDate.getTime() - offset * 86400000);
}

function formatMonthKey(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function formatDayLabel(isoDate, timeZone = TIME_ZONE) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone }).format(date);
  const day = new Intl.DateTimeFormat('en-US', { day: 'numeric', timeZone }).format(date);
  const num = Number(day);
  const mod10 = num % 10;
  const mod100 = num % 100;
  const suffix = mod10 === 1 && mod100 !== 11 ? 'st'
    : mod10 === 2 && mod100 !== 12 ? 'nd'
    : mod10 === 3 && mod100 !== 13 ? 'rd'
    : 'th';
  return `${weekday} ${day}${suffix}`;
}

export default function AnalyticsJobsTab() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function fetchJobs() {
      setLoading(true);
      setError('');
      const { data, error: fetchError } = await supabase
        .from('yacht_work_offers')
        .select('id, created_at, country, work_location, work_environment, status, team, yacht_type, type, title');
      if (!isMounted) return;
      if (fetchError) {
        setError(fetchError.message || 'Failed to load jobs.');
        setJobs([]);
      } else {
        setJobs(data || []);
      }
      setLoading(false);
    }
    fetchJobs();
    return () => { isMounted = false; };
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const thisWeekStart = getWeekStartUTC(now);
    const nextWeekStart = new Date(thisWeekStart.getTime() + 7 * 86400000);
    const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * 86400000);
    const todayLocal = getLocalDateUTC(now);
    const last7Start = new Date(todayLocal.getTime() - 6 * 86400000);
    const last24Start = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const last7Days = [];
    const last7DayCounts = new Map();
    const last24HourCounts = new Map();
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(last7Start.getTime() + i * 86400000);
      const key = d.toISOString().slice(0, 10);
      last7Days.push({ key, date: d });
      last7DayCounts.set(key, 0);
    }
    for (let h = 0; h < 24; h += 1) last24HourCounts.set(h, 0);

    const monthCounts = new Map();
    const countryCounts = new Map();
    const regionCounts = new Map();
    const environmentCounts = new Map();
    const typeCounts = new Map();
    const rankCountsLast7 = new Map();
    const statusCounts = new Map();
    let teamYes = 0;
    let teamNo = 0;

    let totalJobs = 0;
    let thisWeekCount = 0;
    let lastWeekCount = 0;

    for (const j of jobs) {
      totalJobs += 1;

      if (j.team) teamYes += 1;
      else teamNo += 1;

      const status = String(j.status || 'unknown').trim() || 'unknown';
      statusCounts.set(status, (statusCounts.get(status) || 0) + 1);

      const env = String(j.work_environment || 'unknown').trim() || 'unknown';
      environmentCounts.set(env, (environmentCounts.get(env) || 0) + 1);

      const type = String(j.type || 'unknown').trim() || 'unknown';
      typeCounts.set(type, (typeCounts.get(type) || 0) + 1);

      const country = String(j.country || 'unknown').trim() || 'unknown';
      countryCounts.set(country, (countryCounts.get(country) || 0) + 1);

      const region = String(j.work_location || 'unknown').trim() || 'unknown';
      regionCounts.set(region, (regionCounts.get(region) || 0) + 1);

      const created = parseTimestamp(j.created_at);
      if (created) {
        const localDate = getLocalDateUTC(created);
        const weekStart = getWeekStartUTC(created);
        const dayKey = localDate.toISOString().slice(0, 10);

        if (weekStart >= thisWeekStart && weekStart < nextWeekStart) thisWeekCount += 1;
        else if (weekStart >= lastWeekStart && weekStart < thisWeekStart) lastWeekCount += 1;

        const parts = getTzParts(created);
        const monthKey = formatMonthKey(parts.year, parts.month);
        monthCounts.set(monthKey, (monthCounts.get(monthKey) || 0) + 1);

        const hour = parts.hour;
        if (localDate >= last7Start && localDate <= todayLocal) {
          last7DayCounts.set(dayKey, (last7DayCounts.get(dayKey) || 0) + 1);
          const title = String(j.title || '').trim() || 'Other';
          rankCountsLast7.set(title, (rankCountsLast7.get(title) || 0) + 1);
        }

        if (created >= last24Start && created <= now) {
          last24HourCounts.set(hour, (last24HourCounts.get(hour) || 0) + 1);
        }
      }
    }

    let weekChangePct = null;
    if (lastWeekCount > 0) {
      weekChangePct = ((thisWeekCount - lastWeekCount) / lastWeekCount) * 100;
    } else if (thisWeekCount > 0) {
      weekChangePct = 100;
    } else {
      weekChangePct = 0;
    }

    const monthsSorted = Array.from(monthCounts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const topCountries = Array.from(countryCounts.entries())
      .filter(([name]) => name && name !== 'unknown')
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    const topRegions = Array.from(regionCounts.entries())
      .filter(([name]) => name && name !== 'unknown')
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    const topEnvironments = Array.from(environmentCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    const topTypes = Array.from(typeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    const totalLast7 = Array.from(last7DayCounts.values()).reduce((a, b) => a + b, 0);
    const topRanksLast7 = Array.from(rankCountsLast7.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    const topStatuses = Array.from(statusCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return {
      totalJobs,
      thisWeekCount,
      lastWeekCount,
      weekChangePct,
      teamYes,
      teamNo,
      monthsSorted,
      last7Days,
      last7DayCounts,
      last24HourCounts,
      topCountries,
      topRegions,
      topEnvironments,
      topTypes,
      topRanksLast7,
      totalLast7,
      topStatuses,
    };
  }, [jobs]);

  const formatPercent = (count) => {
    const total = stats.totalJobs || 0;
    if (!total) return '0.0%';
    return `${((count / total) * 100).toFixed(1)}%`;
  };

  const formatPercentLast7 = (count) => {
    const total = stats.totalLast7 || 0;
    if (!total) return '0.0%';
    return `${((count / total) * 100).toFixed(1)}%`;
  };

  return (
    <div>
      <p style={{ marginTop: 4, color: '#777' }}>
        Time zone: {TIME_ZONE} (Mon-Sun)
      </p>

      {loading && <p>Loading analytics...</p>}
      {error && <p style={{ color: '#b00020' }}>Error: {error}</p>}

      {!loading && !error && (
        <>
          <div className="analytics-grid-cards">
            <div className="admin-card">
              <h4>Total jobs</h4>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.totalJobs}</div>
            </div>
            <div className="admin-card">
              <h4>This week</h4>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.thisWeekCount}</div>
              <div style={{ color: '#777' }}>Last week: {stats.lastWeekCount}</div>
              <div style={{ marginTop: 6, fontWeight: 600 }}>
                {stats.lastWeekCount === 0 && stats.thisWeekCount > 0
                  ? '+100% vs last week'
                  : `${stats.weekChangePct >= 0 ? '+' : ''}${stats.weekChangePct.toFixed(1)}% vs last week`}
              </div>
            </div>
            <div className="admin-card">
              <h4>Team jobs</h4>
              <div>Yes: {stats.teamYes}</div>
              <div>No: {stats.teamNo}</div>
            </div>
            <div className="admin-card">
              <h4>Status</h4>
              <div>{stats.topStatuses[0] ? `${stats.topStatuses[0][0]}: ${stats.topStatuses[0][1]}` : '?'}</div>
              <div>{stats.topStatuses[1] ? `${stats.topStatuses[1][0]}: ${stats.topStatuses[1][1]}` : ''}</div>
            </div>
          </div>

          <div className="analytics-block">
            <h4>Jobs by month</h4>
            <table className="admin-table analytics-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Jobs</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {stats.monthsSorted.map(([month, count]) => (
                  <tr key={month}>
                    <td>{month}</td>
                    <td>{count}</td>
                    <td>{formatPercent(count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="analytics-grid-two">
            <div className="analytics-block">
              <h4 className="analytics-chart-title">Jobs last 7 days</h4>
              <div className="analytics-chart">
                {(() => {
                  const values = stats.last7Days.map(({ key }) => stats.last7DayCounts.get(key) || 0);
                  const max = Math.max(1, ...values);
                  return stats.last7Days.map(({ key }) => {
                    const count = stats.last7DayCounts.get(key) || 0;
                    const pct = Math.round((count / max) * 100);
                    return (
                      <div key={key} className="analytics-bar-row">
                        <div className="analytics-bar-label">{formatDayLabel(key)}</div>
                        <div className="analytics-bar-track">
                          <div className="analytics-bar-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="analytics-bar-value">{count}</div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            <div className="analytics-block">
              <h4 className="analytics-chart-title">Jobs by hour (last 24 hours)</h4>
              <div className="analytics-chart">
                {(() => {
                  const hours = Array.from({ length: 24 }, (_, h) => h);
                  const values = hours.map((h) => stats.last24HourCounts.get(h) || 0);
                  const max = Math.max(1, ...values);
                  return hours.map((h) => {
                    const count = stats.last24HourCounts.get(h) || 0;
                    const pct = Math.round((count / max) * 100);
                    return (
                      <div key={h} className="analytics-bar-row">
                        <div className="analytics-bar-label">{String(h).padStart(2, '0')}:00</div>
                        <div className="analytics-bar-track">
                          <div className="analytics-bar-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="analytics-bar-value">{count}</div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>

          <div className="analytics-grid-two">
            <div className="analytics-block">
              <h4>Top countries</h4>
              <table className="admin-table analytics-table">
                <thead>
                  <tr>
                    <th>Country</th>
                    <th>Jobs</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topCountries.map(([name, count]) => (
                    <tr key={name}>
                      <td>{name}</td>
                      <td>{count}</td>
                      <td>{formatPercent(count)}</td>
                    </tr>
                  ))}
                  {stats.topCountries.length === 0 && (
                    <tr>
                      <td colSpan={3}>No country data available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="analytics-block">
              <h4>Top regions (work_location)</h4>
              <table className="admin-table analytics-table">
                <thead>
                  <tr>
                    <th>Region</th>
                    <th>Jobs</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topRegions.map(([name, count]) => (
                    <tr key={name}>
                      <td>{name}</td>
                      <td>{count}</td>
                      <td>{formatPercent(count)}</td>
                    </tr>
                  ))}
                  {stats.topRegions.length === 0 && (
                    <tr>
                      <td colSpan={3}>No region data available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="analytics-grid-two">
            <div className="analytics-block">
              <h4>Top environments</h4>
              <table className="admin-table analytics-table">
                <thead>
                  <tr>
                    <th>Environment</th>
                    <th>Jobs</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topEnvironments.map(([name, count]) => (
                    <tr key={name}>
                      <td>{name}</td>
                      <td>{count}</td>
                      <td>{formatPercent(count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="analytics-block">
              <h4>Top types</h4>
              <table className="admin-table analytics-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Jobs</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topTypes.map(([name, count]) => (
                    <tr key={name}>
                      <td>{name}</td>
                      <td>{count}</td>
                      <td>{formatPercent(count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="analytics-block">
            <h4>Top Ranks (7 days)</h4>
            <p style={{ fontSize: 12, color: '#777', marginBottom: 8 }}>Por offer.title, jobs creados en ?ltimos 7 d?as</p>
            <table className="admin-table analytics-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Jobs</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {stats.topRanksLast7.map(([name, count]) => (
                  <tr key={name}>
                    <td>{name}</td>
                    <td>{count}</td>
                    <td>{formatPercentLast7(count)}</td>
                  </tr>
                ))}
                {stats.topRanksLast7.length === 0 && (
                  <tr>
                    <td colSpan={3}>No rank data in last 7 days.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
