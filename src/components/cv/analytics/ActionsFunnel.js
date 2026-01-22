// src/components/cv/analytics/ActionsFunnel.js
import React, { useMemo } from 'react';
import { formatInt, formatPercent, clamp } from '../../../utils/analytics/formatters';

export default function ActionsFunnel({
  // Puede venir cv_downloads en el objeto, pero no se muestra
  funnel = { views: 0, profile_opens: 0, contact_opens: 0, chat_starts: 0, cv_downloads: 0 },
  loading = false,
  title = 'What people did',
}) {
  const base = useMemo(() => {
    const v = Number(funnel?.views || funnel?.profile_opens || 0);
    const contact = Number(funnel?.contact_opens || 0);
    const chat = Number(funnel?.chat_starts || 0);

    // Eliminamos la etapa "CV downloads"
    const steps = [
      { key: 'views', label: 'Views', value: v },
      { key: 'contact_opens', label: 'Contact opens', value: contact },
      { key: 'chat_starts', label: 'Chat starts', value: chat },
    ];

    const max = Math.max(1, ...steps.map((s) => s.value));
    return { steps, max, first: v || 0 };
  }, [funnel]);

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
        {/* Se quita el indicador "Conversion to CV" */}
      </header>

      <div style={{ padding: '8px 12px 12px', display: 'grid', gap: 10 }}>
        {loading && (
          <div style={{ fontSize: 12, color: 'var(--ana-muted)' }}>Loading…</div>
        )}
        {!loading &&
          base.steps.map((s, i) => {
            const pct = base.max ? clamp((s.value / base.max) * 100, 0, 100) : 0;
            const rel = base.first ? clamp((s.value / base.first) * 100, 0, 100) : 0;

            return (
              <div key={s.key} role="group" aria-label={s.label}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                    fontSize: 13,
                    color: 'var(--ana-text)',
                  }}
                >
                  <strong style={{ fontWeight: 700 }}>{s.label}</strong>
                  <span>
                    {formatInt(s.value)}{' '}
                    {i > 0 && (
                      <small style={{ opacity: 0.7, color: 'var(--ana-muted)' }}>
                        ({formatPercent(rel, 1)} of views)
                      </small>
                    )}
                  </span>
                </div>

                {/* barra proporcional al máximo del grupo para estética */}
                <div
                  aria-hidden="true"
                  style={{
                    height: 12,
                    width: '100%',
                    borderRadius: 999,
                    background: 'var(--ana-line-soft)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      borderRadius: 999,
                      background: barColor(i),
                      transition: 'width .3s ease',
                    }}
                  />
                </div>
              </div>
            );
          })}

        {!loading && base.steps.every((s) => !s.value) && (
          <div style={{ fontSize: 12, color: 'var(--ana-muted)' }}>
            No actions recorded for the selected range.
          </div>
        )}
      </div>
    </section>
  );
}

function barColor(index) {
  // Paleta suave y consistente (se mantiene en ambas skins)
  switch (index) {
    case 0:
      return '#0ea5e9'; // views
    case 1:
      return '#10b981'; // contact
    case 2:
      return '#a78bfa'; // chat
    default:
      return '#94a3b8';
  }
}
