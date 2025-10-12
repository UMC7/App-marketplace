// src/components/cv/analytics/OverviewStats.js
import React from 'react';
import { formatInt, formatDeltaLabel } from '../../../utils/analytics/formatters';

/**
 * OverviewStats (dark-mode friendly)
 * Usa variables CSS de analytics-widgets.css para colores.
 *
 * Props:
 * - overview: {
 *     views: number,
 *     unique_viewers: number,
 *     contact_opens: number,
 *     chat_starts: number,
 *     cv_downloads: number,
 *   }
 * - prevOverview?: mismo shape, para mostrar delta (opcional)
 * - loading?: boolean
 */
export default function OverviewStats({
  overview = {
    views: 0,
    unique_viewers: 0,
    contact_opens: 0,
    chat_starts: 0,
    cv_downloads: 0,
  },
  prevOverview = null,
  loading = false,
}) {
  const items = [
    {
      key: 'views',
      label: 'Views',
      value: overview?.views ?? 0,
      prev: prevOverview?.views ?? null,
    },
    {
      key: 'unique_viewers',
      label: 'Unique viewers',
      value: overview?.unique_viewers ?? 0,
      prev: prevOverview?.unique_viewers ?? null,
    },
    {
      key: 'contact_opens',
      label: 'Contact opens',
      value: overview?.contact_opens ?? 0,
      prev: prevOverview?.contact_opens ?? null,
    },
    {
      key: 'chat_starts',
      label: 'Chat starts',
      value: overview?.chat_starts ?? 0,
      prev: prevOverview?.chat_starts ?? null,
    },
    {
      key: 'cv_downloads',
      label: 'CV downloads',
      value: overview?.cv_downloads ?? 0,
      prev: prevOverview?.cv_downloads ?? null,
    },
  ];

  return (
    <section
      aria-label="Overview KPIs"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, minmax(120px, 1fr))',
        gap: 12,
        alignItems: 'stretch',
      }}
    >
      {items.map((it) => (
        <div
          key={it.key}
          role="group"
          aria-label={it.label}
          style={{
            border: '1px solid var(--ana-card-bd)',
            borderRadius: 12,
            padding: 12,
            background: 'var(--ana-card-bg)',
            minHeight: 84,
            display: 'grid',
            /* 🔧 Fijamos altura de fila para que TODOS los números queden alineados,
               sin importar si el label ocupa 1 o 2 líneas. */
            gridTemplateRows: '32px 1fr auto',
          }}
        >
          {/* Label con altura fija */}
          <div
            style={{
              fontSize: 12,
              letterSpacing: '.08em',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--ana-muted)',
              lineHeight: 1.1,
              /* asegura dos líneas máximas pero mantiene 32px de alto para alinear */
              minHeight: 32,
              display: 'flex',
              alignItems: 'flex-end',
            }}
          >
            {it.label}
          </div>

          {/* Valor */}
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              lineHeight: 1.1,
              color: 'var(--ana-text)',
              display: 'flex',
              alignItems: 'center',
            }}
            aria-live={loading ? 'polite' : 'off'}
          >
            {loading ? '—' : formatInt(it.value)}
          </div>

          {/* Delta opcional */}
          {prevOverview && (
            <div
              style={{
                fontSize: 12,
                marginTop: 6,
                color: 'var(--ana-muted)',
              }}
            >
              {formatDeltaLabel(it.value, it.prev ?? 0, { decimals: 1 })}
            </div>
          )}
        </div>
      ))}
    </section>
  );
}