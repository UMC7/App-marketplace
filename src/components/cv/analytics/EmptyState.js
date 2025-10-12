// src/components/cv/analytics/EmptyState.jsx
import React from 'react';

export default function EmptyState({
  title = 'No data yet',
  message = 'Try expanding the date range or check back later.',
  action = null,
  style,
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        // Usa las variables de analytics para respetar claro/oscuro
        border: '1px dashed var(--ana-line, rgba(2,6,23,.15))',
        borderRadius: 12,
        padding: 24,
        background: 'var(--ana-card-bg, #ffffff)',
        textAlign: 'center',
        color: 'var(--ana-text, #334155)',
        // sombra ligera para integrarse con el resto de tarjetas
        boxShadow: 'var(--ana-shadow, 0 6px 18px rgba(2, 6, 23, 0.06))',
        ...style,
      }}
    >
      <div
        style={{
          fontWeight: 800,
          fontSize: 16,
          marginBottom: 6,
          color: 'var(--ana-text, #0f172a)',
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 13,
          opacity: 0.9,
          marginBottom: action ? 12 : 0,
          color: 'var(--ana-muted, #475569)',
        }}
      >
        {message}
      </div>

      {action}
    </div>
  );
}