// src/components/cv/analytics/GeographyBreakdown.js
import React, { useMemo } from 'react';
import { formatInt } from '../../../utils/analytics/formatters';

export default function GeographyBreakdown({
  data = { countries: [], cities: [] },
  loading = false,
  titleCountries = 'Top countries',
  titleCities = 'Top cities',
  limit = 10,
}) {
  const countries = useMemo(() => {
    const arr = Array.isArray(data?.countries) ? data.countries : [];
    return arr.slice(0, Math.max(1, limit));
  }, [data?.countries, limit]);

  const cities = useMemo(() => {
    const arr = Array.isArray(data?.cities) ? data.cities : [];
    return arr.slice(0, Math.max(1, limit));
  }, [data?.cities, limit]);

  return (
    <section
      aria-label="Geography"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
      }}
    >
      <Card title={titleCountries} loading={loading}>
        <GeoTable
          headers={['Country', 'Views']}
          rows={countries.map((c) => [c.country || '—', formatInt(c.views || 0)])}
          emptyLabel="No country data."
        />
      </Card>

      <Card title={titleCities} loading={loading}>
        <GeoTable
          headers={['City', 'Country', 'Views']}
          rows={cities.map((c) => [
            c.city || '—',
            c.country || '—',
            formatInt(c.views || 0),
          ])}
          emptyLabel="No city data."
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

function GeoTable({ headers = [], rows = [], emptyLabel = 'No data.' }) {
  return (
    <table
      role="table"
      style={{
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: 0,
        minWidth: 420,
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
                textAlign: 'left',
                padding: '10px 12px',
                fontSize: 12,
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
                padding: '12px',
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
                    padding: '10px 12px',
                    fontSize: 14,
                    color: 'var(--ana-text)',
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