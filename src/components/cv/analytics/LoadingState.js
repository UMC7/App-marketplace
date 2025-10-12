// src/components/cv/analytics/LoadingState.jsx
import React from 'react';

/**
 * LoadingState
 * Skeleton/placeholder genérico para bloques de analytics.
 *
 * Props:
 * - rows?: number        // líneas simuladas
 * - height?: number      // alto mínimo del contenedor
 * - title?: string       // título opcional arriba
 */
export default function LoadingState({ rows = 4, height = 120, title = 'Loading…' }) {
  const safeRows = Math.max(1, Math.min(10, rows));

  return (
    <section
      aria-busy="true"
      aria-live="polite"
      style={{
        border: '1px solid rgba(2,6,23,.08)',
        borderRadius: 12,
        background: '#ffffff',
        padding: '10px 12px',
        minHeight: height,
      }}
    >
      {title && (
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <div style={{ fontWeight: 700 }}>{title}</div>
          <small style={{ opacity: 0.7 }}>Please wait…</small>
        </header>
      )}

      <div style={{ display: 'grid', gap: 8 }}>
        {Array.from({ length: safeRows }).map((_, i) => (
          <SkeletonLine key={i} />
        ))}
      </div>
    </section>
  );
}

function SkeletonLine() {
  return (
    <div
      style={{
        width: '100%',
        height: 14,
        borderRadius: 6,
        background:
          'linear-gradient(90deg, rgba(226,232,240,0.7) 25%, rgba(226,232,240,0.35) 37%, rgba(226,232,240,0.7) 63%)',
        backgroundSize: '400% 100%',
        animation: 'analytics-skeleton 1.2s ease-in-out infinite',
      }}
    />
  );
}

/* Nota: la animación por CSS global se define aquí en línea para evitar dependencias. */
const style = document.createElement('style');
style.textContent = `
@keyframes analytics-skeleton {
  0%   { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}`;
if (typeof document !== 'undefined') {
  document.head.appendChild(style);
}