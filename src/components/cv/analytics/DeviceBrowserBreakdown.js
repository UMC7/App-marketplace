// src/components/cv/analytics/DeviceBrowserBreakdown.js
import React, { useEffect, useMemo, useState } from 'react';
import { formatInt } from '../../../utils/analytics/formatters';

export default function DeviceBrowserBreakdown({
  data = { devices: [], browsers: [] },
  loading = false,
  titleDevices = 'Devices',
  titleBrowsers = 'Browsers',
  limit = 10,
}) {
  const devices = useMemo(() => {
    const arr = Array.isArray(data?.devices) ? data.devices : [];
    return arr.slice(0, Math.max(1, limit));
  }, [data?.devices, limit]);

  const browsers = useMemo(() => {
    const arr = Array.isArray(data?.browsers) ? data.browsers : [];
    return arr.slice(0, Math.max(1, limit));
  }, [data?.browsers, limit]);

  // ===== Solo móviles (≤540px) sin tocar desktop =====
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 540px)');
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener?.('change', apply);
    return () => mq.removeEventListener?.('change', apply);
  }, []);

  return (
    <section
      aria-label="Devices & Browsers"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
      }}
    >
      <Card title={titleDevices} loading={loading}>
        <ListTable
          isMobile={isMobile}
          headers={['Device', 'Views']}
          rows={devices.map((d) => [normalizeDevice(d.device), formatInt(d.views || 0)])}
          emptyLabel="No device data."
        />
      </Card>

      <Card title={titleBrowsers} loading={loading}>
        <ListTable
          isMobile={isMobile}
          headers={['Browser', 'Views']}
          rows={browsers.map((b) => [normalizeBrowser(b.browser), formatInt(b.views || 0)])}
          emptyLabel="No browser data."
        />
      </Card>
    </section>
  );
}

/* ---------- Partials ---------- */

function Card({ title, loading, children }) {
  return (
    <div
      style={{
        border: '1px solid var(--ana-card-bd)',
        borderRadius: 12,
        background: 'var(--ana-card-bg)',
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px',
          background: 'var(--ana-head-bg)',
          borderBottom: '1px solid var(--ana-line)',
        }}
      >
        <div style={{ fontWeight: 700, color: 'var(--ana-text)' }}>{title}</div>
        {loading && <small style={{ color: 'var(--ana-muted)' }}>Loading…</small>}
      </header>
      <div style={{ overflowX: 'auto' }}>{children}</div>
    </div>
  );
}

function ListTable({ headers = [], rows = [], emptyLabel = 'No data.', isMobile = false }) {
  return (
    <table
      role="table"
      style={{
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: 0,
        minWidth: isMobile ? 'auto' : 420,
      }}
    >
      <thead>
        <tr
          role="row"
          style={{
            background: 'var(--ana-head-bg)',
            borderBottom: '1px solid var(--ana-line)',
          }}
        >
          {headers.map((h) => (
            <th
              key={h}
              role="columnheader"
              style={{
                textAlign: String(h).toLowerCase() === 'views' ? 'right' : 'left',
                padding: isMobile ? '8px 10px' : '10px 12px',
                fontSize: isMobile ? 11 : 12,
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                fontWeight: 700,
                color: 'var(--ana-muted)',
              }}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr role="row">
            <td
              role="cell"
              colSpan={headers.length}
              style={{
                textAlign: 'center',
                padding: isMobile ? '10px' : '12px',
                fontSize: 12,
                color: 'var(--ana-muted)',
              }}
            >
              {emptyLabel}
            </td>
          </tr>
        ) : (
          rows.map((r, i) => (
            <tr
              key={i}
              role="row"
              style={{
                borderBottom: '1px solid var(--ana-line-soft)',
              }}
            >
              {r.map((cell, j) => (
                <td
                  key={`${i}-${j}`}
                  role="cell"
                  style={{
                    textAlign: j === r.length - 1 ? 'right' : 'left',
                    padding: isMobile ? '8px 10px' : '10px 12px',
                    fontSize: isMobile ? 13 : 14,
                    color: 'var(--ana-text)',
                    // Evita recortes en móviles (nombres largos)
                    whiteSpace: j === 0 ? (isMobile ? 'normal' : 'nowrap') : 'nowrap',
                    overflow: j === 0 && !isMobile ? 'hidden' : 'visible',
                    textOverflow: j === 0 && !isMobile ? 'ellipsis' : 'clip',
                    lineHeight: 1.25,
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

/* ---------- Normalizadores simples ---------- */

function normalizeDevice(s) {
  const v = String(s || '').trim().toLowerCase();
  if (!v) return 'Unknown';
  if (/(desktop|pc|mac|windows|linux)/.test(v)) return 'Desktop';
  if (/(mobile|phone|iphone|android)/.test(v)) return 'Mobile';
  if (/(tablet|ipad)/.test(v)) return 'Tablet';
  return capitalize(s);
}

function normalizeBrowser(s) {
  const v = String(s || '').trim().toLowerCase();
  if (!v) return 'Unknown';
  if (/chrome/.test(v)) return 'Chrome';
  if (/safari/.test(v) && !/chrome/.test(v)) return 'Safari';
  if (/firefox/.test(v)) return 'Firefox';
  if (/edge/.test(v)) return 'Edge';
  if (/opera|opr/.test(v)) return 'Opera';
  return capitalize(s);
}

function capitalize(s) {
  const str = String(s || '').trim();
  if (!str) return 'Unknown';
  return str.charAt(0).toUpperCase() + str.slice(1);
}