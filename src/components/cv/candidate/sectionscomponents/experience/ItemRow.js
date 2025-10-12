// src/components/cv/candidate/sectionscomponents/experience/ItemRow.jsx
import React from 'react';

export default function ItemRow({ it, onEdit, onDelete }) {
  // ===== helpers =====
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const mm = (m) => (Number.isFinite(m) && m >= 1 && m <= 12 ? MONTHS[m - 1] : '');

  const fmtYM = (y, m) => {
    const hasY = Number.isFinite(y);
    const hasM = Number.isFinite(m);
    if (!hasY && !hasM) return '';
    if (hasY && hasM) return `${mm(m)} ${y}`;
    if (hasY) return String(y);
    return hasM ? mm(m) : '';
  };

  const dateLine = it?.is_current
    ? `${fmtYM(it?.start_year, it?.start_month)} — Present`
    : `${fmtYM(it?.start_year, it?.start_month)} — ${fmtYM(it?.end_year, it?.end_month)}`.trim();

  // 1) Nombre embarcación / empresa
  const vesselEmployer = (it?.vessel_or_employer || it?.vessel_name || '').trim();

  // 2) Rank / Role
  const role = (it?.role || '').trim();

  // Solo DESKTOP (>=1024px): 3 tarjetas por fila
  const isDesktop =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(min-width: 1024px)').matches;

  return (
    <div
      style={{
        position: 'relative',            // necesario para posicionar la “X”
        boxSizing: 'border-box',
        border: '1px solid var(--line)', // <- usa variables del tema
        borderRadius: 10,
        padding: 10,
        marginTop: 8,
        background: 'linear-gradient(180deg, var(--card), var(--card-2))', // <- claro/oscuro
        // 👉 Solo desktop: 3 por fila (no tocamos móviles)
        ...(isDesktop
          ? {
              display: 'inline-block',
              width: 'calc(33.333% - 12px)', // tres columnas con pequeño gap
              marginRight: 12,
              verticalAlign: 'top',
            }
          : null),
      }}
    >
      {/* Botón eliminar (X) en la esquina superior derecha, solo si el padre pasa onDelete */}
      {typeof onDelete === 'function' && (
        <button
          type="button"
          aria-label="Delete experience"
          title="Delete experience"
          onClick={() => onDelete(it)}
          style={{
            position: 'absolute',
            top: 6,
            right: 6,               // lado derecho
            width: 24,
            height: 24,
            lineHeight: '22px',
            textAlign: 'center',
            borderRadius: 9999,
            border: '1px solid var(--line)', // <- tema
            background: 'var(--input-bg)',   // contraste en ambos modos
            color: 'inherit',
            cursor: 'pointer',
            padding: 0,
            fontSize: 14,
            userSelect: 'none',
          }}
        >
          ×
        </button>
      )}

      {/* Título */}
      <div style={{ fontWeight: 700 }}>
        {vesselEmployer || '—'}
      </div>

      {/* Rank */}
      <div style={{ marginTop: 4, fontSize: 14, fontWeight: 600, opacity: 0.95 }}>
        {role || '—'}
      </div>

      {/* Fechas */}
      <div style={{ marginTop: 2, fontSize: 13, opacity: 0.85 }}>
        {dateLine || '—'}
      </div>

      {/* Botón Edit debajo de las fechas */}
      {typeof onEdit === 'function' && (
        <button
          type="button"
          onClick={() => onEdit(it)}
          title="Edit experience"
          style={{
            marginTop: 10,
            padding: '7px 12px',
            fontSize: 12,
            borderRadius: 8,
            border: '1px solid var(--line)', // <- tema
            background: 'transparent',
            color: 'inherit',
            cursor: 'pointer',
            // En desktop ocupa todo el ancho de la tarjeta; en móvil no tocamos nada
            ...(isDesktop ? { width: '100%' } : null),
          }}
        >
          Edit
        </button>
      )}
    </div>
  );
}