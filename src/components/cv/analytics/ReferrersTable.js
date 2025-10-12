// src/components/cv/analytics/ReferrersTable.js
import React, { useMemo } from 'react';
import { formatInt, formatPercent } from '../../../utils/analytics/formatters';

/**
 * ReferrersTable (dark-mode friendly)
 * Usa variables CSS definidas en analytics-widgets.css
 *
 * Props:
 * - items: Array<{ source:string, views:number, unique_viewers?:number, pct?:number }>
 * - loading?: boolean
 * - title?: string (default "Top referrers")
 * - limit?: number (default 10) – corte visual (no muta props)
 */
export default function ReferrersTable({
  items = [],
  loading = false,
  title = 'Top referrers',
  limit = 10,
}) {
  const data = useMemo(() => {
    const arr = Array.isArray(items) ? items : [];
    return arr.slice(0, Math.max(1, limit));
  }, [items, limit]);

  const totalViews = useMemo(
    () => data.reduce((acc, it) => acc + (Number(it?.views) || 0), 0),
    [data]
  );

  return (
    <section
      aria-label={title}
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
        <small style={{ opacity: 0.85, color: 'var(--ana-muted)' }}>
          {totalViews ? `${formatInt(totalViews)} views` : '—'}
        </small>
      </header>

      <div style={{ overflowX: 'auto' }}>
        <table
          role="table"
          style={{
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: 0,
            minWidth: 520,
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
              <Th label="Source" align="left" />
              <Th label="Views" align="right" />
              <Th label="Unique" align="right" />
              <Th label="% of views" align="right" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr role="row">
                <Td colSpan={4} align="center">
                  <span style={{ fontSize: 12, color: 'var(--ana-muted)' }}>Loading…</span>
                </Td>
              </tr>
            )}

            {!loading && data.length === 0 && (
              <tr role="row">
                <Td colSpan={4} align="center">
                  <span style={{ fontSize: 12, color: 'var(--ana-muted)' }}>
                    No referrer data for the selected range.
                  </span>
                </Td>
              </tr>
            )}

            {!loading &&
              data.map((it, i) => {
                const pct =
                  typeof it?.pct === 'number'
                    ? it.pct
                    : totalViews
                    ? ((Number(it?.views) || 0) / totalViews) * 100
                    : 0;

                return (
                  <tr
                    key={`${it.source}-${i}`}
                    role="row"
                    style={{
                      borderBottom: '1px solid var(--ana-line-soft)',
                    }}
                  >
                    <Td align="left">
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          minWidth: 180,
                        }}
                      >
                        <Favicon source={it.source} />
                        <span
                          title={String(it.source || '')}
                          style={{
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            maxWidth: 320,
                            color: 'var(--ana-text)',
                          }}
                        >
                          {normalizeSource(it.source)}
                        </span>
                      </div>
                    </Td>
                    <Td align="right">{formatInt(it.views || 0)}</Td>
                    <Td align="right">{formatInt(it.unique_viewers || 0)}</Td>
                    <Td align="right">{formatPercent(pct, 1)}</Td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ---------- Partials ---------- */

function Th({ label, align = 'left' }) {
  return (
    <th
      role="columnheader"
      style={{
        textAlign: align,
        padding: '10px 12px',
        fontSize: 12,
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

function Td({ children, align = 'left', colSpan }) {
  return (
    <td
      role="cell"
      colSpan={colSpan}
      style={{
        textAlign: align,
        padding: '10px 12px',
        fontSize: 14,
        color: 'var(--ana-text)',
      }}
    >
      {children}
    </td>
  );
}

/**
 * Normaliza el nombre de la fuente para visualización.
 * - Si es URL → muestra dominio
 * - Si está vacío → "Direct"
 */
function normalizeSource(source) {
  const s = String(source || '').trim();
  if (!s) return 'Direct';
  try {
    const hasProto = /^https?:\/\//i.test(s);
    const url = new URL(hasProto ? s : `https://${s}`);
    return url.hostname.replace(/^www\./i, '');
  } catch {
    return s;
  }
}

/**
 * Favicon simple (opcional) usando el dominio.
 * Si no puede resolverse, muestra un punto.
 */
function Favicon({ source }) {
  const domain = useMemo(() => {
    const s = String(source || '').trim();
    if (!s) return '';
    try {
      const hasProto = /^https?:\/\//i.test(s);
      const url = new URL(hasProto ? s : `https://${s}`);
      return url.hostname.replace(/^www\./i, '');
    } catch {
      return '';
    }
  }, [source]);

  // Usamos Google s2 para favicon; si falla, mostramos un círculo.
  const src = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32` : null;

  return src ? (
    <img
      src={src}
      alt=""
      width={16}
      height={16}
      style={{ display: 'inline-block', borderRadius: 3 }}
      loading="lazy"
    />
  ) : (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: 999,
        background: 'var(--ana-muted)',
        opacity: 0.6,
      }}
    />
  );
}