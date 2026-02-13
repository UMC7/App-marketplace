// src/admin/tabs/AnalyticsUsersTab.js
import React, { useEffect, useMemo, useState } from 'react';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import supabase from '../../supabase';

const TIME_ZONE = 'Europe/Madrid';
const LOCALE = 'en-US';

const AGE_BUCKETS = [
  { label: '18-24', min: 18, max: 24 },
  { label: '25-34', min: 25, max: 34 },
  { label: '35-44', min: 35, max: 44 },
  { label: '45-54', min: 45, max: 54 },
  { label: '55+', min: 55, max: Infinity },
];

const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
    weekday: 'short',
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
    weekday: parts.weekday,
  };
}

function getLocalDateUTC(date) {
  const p = getTzParts(date);
  return new Date(Date.UTC(p.year, p.month - 1, p.day));
}

function getWeekStartUTC(date) {
  const localDate = getLocalDateUTC(date);
  const dow = localDate.getUTCDay(); // 0=Sun..6=Sat
  const offset = (dow + 6) % 7; // Monday=0
  return new Date(localDate.getTime() - offset * 86400000);
}

function inferCountryFromPhone({ phone, phone_code, phone_number }, displayNames) {
  const base = String(phone || '').trim();
  const fallback =
    String(phone_code || '').trim() && String(phone_number || '').trim()
      ? `+${String(phone_code).trim()}${String(phone_number).trim()}`
      : '';
  const value = base || fallback;
  if (!value) return 'Unknown';
  const parsed = parsePhoneNumberFromString(value);
  const iso = parsed?.country || '';
  if (!iso) return 'Unknown';
  if (!displayNames) return iso;
  return displayNames.of(iso) || iso;
}

function getAgeFromBirthYear(birthYear, nowYear) {
  if (!birthYear || !Number.isFinite(Number(birthYear))) return null;
  const age = nowYear - Number(birthYear);
  if (age < 0 || age > 120) return null;
  return age;
}

function bucketAge(age) {
  if (age == null) return 'Unknown';
  const bucket = AGE_BUCKETS.find((b) => age >= b.min && age <= b.max);
  return bucket ? bucket.label : 'Unknown';
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

export default function AnalyticsUsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function fetchUsers() {
      setLoading(true);
      setError('');
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('id, created_at, birth_year, is_candidate, cv_mode, phone, phone_code, phone_number');
      if (!isMounted) return;
      if (fetchError) {
        setError(fetchError.message || 'Failed to load users.');
        setUsers([]);
      } else {
        setUsers(data || []);
      }
      setLoading(false);
    }
    fetchUsers();
    return () => { isMounted = false; };
  }, []);

  const stats = useMemo(() => {
    const displayNames = typeof Intl.DisplayNames === 'function'
      ? new Intl.DisplayNames(LOCALE, { type: 'region' })
      : null;

    const now = new Date();
    const nowParts = getTzParts(now);
    const nowYear = nowParts.year;
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

    const cvModeCounts = { lite: 0, professional: 0, empty: 0 };
    const candidateCounts = { yes: 0, no: 0 };
    const ageBuckets = new Map();
    const monthCounts = new Map();
    const hourCounts = new Map();
    const weekdayCounts = new Map();
    const dayKeys = new Set();
    let minLocalDate = null;
    let maxLocalDate = null;
    const countryCounts = new Map();

    let totalUsers = 0;
    let thisWeekCount = 0;
    let lastWeekCount = 0;

    for (const u of users) {
      totalUsers += 1;

      if (u.is_candidate) candidateCounts.yes += 1;
      else candidateCounts.no += 1;

      const mode = String(u.cv_mode || '').toLowerCase();
      if (mode === 'lite') cvModeCounts.lite += 1;
      else if (mode === 'professional') cvModeCounts.professional += 1;
      else cvModeCounts.empty += 1;

      const age = getAgeFromBirthYear(u.birth_year, nowYear);
      const ageBucket = bucketAge(age);
      ageBuckets.set(ageBucket, (ageBuckets.get(ageBucket) || 0) + 1);

      const created = parseTimestamp(u.created_at);
      if (created) {
        const localDate = getLocalDateUTC(created);
        const weekStart = getWeekStartUTC(created);
        const dayKey = localDate.toISOString().slice(0, 10);
        dayKeys.add(dayKey);
        if (!minLocalDate || localDate < minLocalDate) minLocalDate = localDate;
        if (!maxLocalDate || localDate > maxLocalDate) maxLocalDate = localDate;

        if (weekStart >= thisWeekStart && weekStart < nextWeekStart) thisWeekCount += 1;
        else if (weekStart >= lastWeekStart && weekStart < thisWeekStart) lastWeekCount += 1;

        const parts = getTzParts(created);
        const monthKey = formatMonthKey(parts.year, parts.month);
        monthCounts.set(monthKey, (monthCounts.get(monthKey) || 0) + 1);

        const hour = parts.hour;
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);

        const dow = localDate.getUTCDay();
        weekdayCounts.set(dow, (weekdayCounts.get(dow) || 0) + 1);

        if (localDate >= last7Start && localDate <= todayLocal) {
          last7DayCounts.set(dayKey, (last7DayCounts.get(dayKey) || 0) + 1);
        }

        if (created >= last24Start && created <= now) {
          last24HourCounts.set(hour, (last24HourCounts.get(hour) || 0) + 1);
        }
      }

      const country = inferCountryFromPhone(u, displayNames);
      countryCounts.set(country, (countryCounts.get(country) || 0) + 1);
    }

    const monthsSorted = Array.from(monthCounts.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    const topCountries = Array.from(countryCounts.entries())
      .filter(([name]) => name && name !== 'Unknown')
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    let totalDays = 0;
    const weekdayDayCounts = new Map();
    if (minLocalDate && maxLocalDate) {
      const cursor = new Date(minLocalDate.getTime());
      while (cursor <= maxLocalDate) {
        totalDays += 1;
        const dow = cursor.getUTCDay();
        weekdayDayCounts.set(dow, (weekdayDayCounts.get(dow) || 0) + 1);
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
    }

    const hourAverages = Array.from(hourCounts.entries()).map(([hour, count]) => {
      const avg = totalDays > 0 ? count / totalDays : 0;
      return [hour, avg];
    });
    const weekdayAverages = Array.from(weekdayCounts.entries()).map(([dow, count]) => {
      const daysForDow = weekdayDayCounts.get(dow) || 0;
      const avg = daysForDow > 0 ? count / daysForDow : 0;
      return [dow, avg];
    });

    const busiestHour = hourAverages.sort((a, b) => b[1] - a[1])[0] || null;
    const slowestHour = hourAverages.sort((a, b) => a[1] - b[1])[0] || null;
    const busiestWeekday = weekdayAverages.sort((a, b) => b[1] - a[1])[0] || null;
    const slowestWeekday = weekdayAverages.sort((a, b) => a[1] - b[1])[0] || null;

    const ageRows = AGE_BUCKETS.map((b) => [b.label, ageBuckets.get(b.label) || 0]);
    const unknownAge = ageBuckets.get('Unknown') || 0;

    let weekChangePct = null;
    if (lastWeekCount > 0) {
      weekChangePct = ((thisWeekCount - lastWeekCount) / lastWeekCount) * 100;
    } else if (thisWeekCount > 0) {
      weekChangePct = 100;
    } else {
      weekChangePct = 0;
    }

    return {
      totalUsers,
      candidateCounts,
      cvModeCounts,
      thisWeekCount,
      lastWeekCount,
      weekChangePct,
      monthsSorted,
      busiestHour,
      slowestHour,
      busiestWeekday,
      slowestWeekday,
      topCountries,
      ageRows,
      unknownAge,
      last7Days,
      last7DayCounts,
      last24HourCounts,
    };
  }, [users]);

  const formatPercent = (count) => {
    const total = stats.totalUsers || 0;
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
              <h4>Total users</h4>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.totalUsers}</div>
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
              <h4>CV mode</h4>
              <div>Lite: {stats.cvModeCounts.lite}</div>
              <div>Professional: {stats.cvModeCounts.professional}</div>
              <div>Empty: {stats.cvModeCounts.empty}</div>
            </div>
            <div className="admin-card">
              <h4>Candidates</h4>
              <div>Yes: {stats.candidateCounts.yes}</div>
              <div>No: {stats.candidateCounts.no}</div>
            </div>
          </div>

          <div className="analytics-block">
            <h4>Registrations by month</h4>
            <table className="admin-table analytics-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Registrations</th>
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

          <div className="analytics-grid-four">
            <div className="admin-card">
              <h4>Busiest hour (avg)</h4>
              <div style={{ fontSize: 22, fontWeight: 600 }}>
                {stats.busiestHour ? `${stats.busiestHour[0]}:00` : '-'}
              </div>
              <div style={{ color: '#777' }}>
                {stats.busiestHour ? `${stats.busiestHour[1].toFixed(2)} avg/day` : 'No data'}
              </div>
            </div>
            <div className="admin-card">
              <h4>Slowest hour (avg)</h4>
              <div style={{ fontSize: 22, fontWeight: 600 }}>
                {stats.slowestHour ? `${stats.slowestHour[0]}:00` : '-'}
              </div>
              <div style={{ color: '#777' }}>
                {stats.slowestHour ? `${stats.slowestHour[1].toFixed(2)} avg/day` : 'No data'}
              </div>
            </div>
            <div className="admin-card">
              <h4>Busiest weekday (avg)</h4>
              <div style={{ fontSize: 22, fontWeight: 600 }}>
                {stats.busiestWeekday ? WEEKDAY_LABELS[stats.busiestWeekday[0]] : '-'}
              </div>
              <div style={{ color: '#777' }}>
                {stats.busiestWeekday ? `${stats.busiestWeekday[1].toFixed(2)} avg/day` : 'No data'}
              </div>
            </div>
            <div className="admin-card">
              <h4>Slowest weekday (avg)</h4>
              <div style={{ fontSize: 22, fontWeight: 600 }}>
                {stats.slowestWeekday ? WEEKDAY_LABELS[stats.slowestWeekday[0]] : '-'}
              </div>
              <div style={{ color: '#777' }}>
                {stats.slowestWeekday ? `${stats.slowestWeekday[1].toFixed(2)} avg/day` : 'No data'}
              </div>
            </div>
          </div>

          <div className="analytics-grid-two">
            <div className="analytics-block">
              <h4 className="analytics-chart-title">Registrations last 7 days</h4>
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
              <h4 className="analytics-chart-title">Registrations by hour (last 24 hours)</h4>
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
              <h4>Age distribution</h4>
              <table className="admin-table analytics-table">
                <thead>
                  <tr>
                    <th>Age range</th>
                    <th>Users</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.ageRows.map(([label, count]) => (
                    <tr key={label}>
                      <td>{label}</td>
                      <td>{count}</td>
                      <td>{formatPercent(count)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td>Unknown</td>
                    <td>{stats.unknownAge}</td>
                    <td>{formatPercent(stats.unknownAge)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="analytics-block">
              <h4>Top countries (from phone)</h4>
              <table className="admin-table analytics-table">
                <thead>
                  <tr>
                    <th>Country</th>
                    <th>Users</th>
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
          </div>
        </>
      )}
    </div>
  );
}
