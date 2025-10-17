// src/components/cv/analytics/GeographyBreakdown.js
import React, { useEffect, useMemo, useState } from 'react';
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
      aria-label="Geography"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
      }}
    >
      <Card title={titleCountries} loading={loading}>
        <GeoTable
          isMobile={isMobile}
          headers={['Country', 'Views']}
          rows={countries.map((c) => [c.country || '—', formatInt(c.views || 0)])}
          emptyLabel="No country data."
        />
      </Card>

      <Card title={titleCities} loading={loading}>
        <GeoTable
          isMobile={isMobile}
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

function GeoTable({ headers = [], rows = [], emptyLabel = 'No data.', isMobile = false }) {
  // cityMode cuando hay 3 columnas: [City, Country, Views]
  const isCityMode = headers.length === 3;

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
          {isMobile && isCityMode ? (
            // En móvil para ciudades: encabezados compactos City / Views (Country irá debajo de City)
            <>
              <Th label="City" align="left" compact />
              <Th label="Views" align="right" compact />
            </>
          ) : (
            headers.map((h) => (
              <Th
                key={h}
                label={h}
                align={String(h).toLowerCase() === 'views' ? 'right' : 'left'}
                compact={isMobile}
              />
            ))
          )}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr role="row">
            <Td
              role="cell"
              colSpan={isMobile && isCityMode ? 2 : headers.length}
              align="center"
              compact={isMobile}
            >
              <span style={{ fontSize: 12, color: 'var(--ana-muted)' }}>{emptyLabel}</span>
            </Td>
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
              {isMobile && isCityMode ? (
                <>
                  {/* Primera celda apilada: City + Country en línea secundaria */}
                  <Td align="left" compact>
                    <div style={{ display: 'grid', gap: 2 }}>
                      <div style={{ color: 'var(--ana-text)' }}>{r[0]}</div>
                      <small style={{ color: 'var(--ana-muted)' }}>{r[1]}</small>
                    </div>
                  </Td>
                  {/* Segunda celda: Views a la derecha */}
                  <Td align="right" compact>
                    {r[2]}
                  </Td>
                </>
              ) : (
                r.map((cell, j) => (
                  <Td
                    key={`${i}-${j}`}
                    role="cell"
                    align={j === r.length - 1 ? 'right' : 'left'}
                    compact={isMobile}
                  >
                    {cell}
                  </Td>
                ))
              )}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

function Th({ label, align = 'left', compact = false }) {
  return (
    <th
      role="columnheader"
      style={{
        textAlign: align,
        padding: compact ? '8px 10px' : '10px 12px',
        fontSize: compact ? 11 : 12,
        letterSpacing: '.06em',
        textTransform: 'uppercase',
        fontWeight: 700,
        color: 'var(--ana-muted)',
      }}
    >
      {label}
    </th>
  );
}

function Td({ children, align = 'left', colSpan, compact = false }) {
  return (
    <td
      role="cell"
      colSpan={colSpan}
      style={{
        textAlign: align,
        padding: compact ? '8px 10px' : '10px 12px',
        fontSize: compact ? 13 : 14,
        color: 'var(--ana-text)',
      }}
    >
      {children}
    </td>
  );
}