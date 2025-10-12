// src/components/cv/candidate/sectionscomponents/education/EducationItemCard.js
import React from 'react';

export default function EducationItemCard({ item, onEdit, onDelete }) {
  const monthLabel = (mm) =>
    ({
      '01': 'Jan',
      '02': 'Feb',
      '03': 'Mar',
      '04': 'Apr',
      '05': 'May',
      '06': 'Jun',
      '07': 'Jul',
      '08': 'Aug',
      '09': 'Sep',
      '10': 'Oct',
      '11': 'Nov',
      '12': 'Dec',
    }[mm] || mm);

  const period = (() => {
    const s =
      item?.startMonth && item?.startYear
        ? `${monthLabel(item.startMonth)} ${item.startYear}`
        : null;
    const e = item?.current
      ? 'Present'
      : item?.endMonth && item?.endYear
      ? `${monthLabel(item.endMonth)} ${item.endYear}`
      : null;
    if (s && e) return `${s} — ${e}`;
    if (s) return s;
    return '';
  })();

  return (
    <div className="cv-card education-card">
      <div className="cv-card-main">
        {/* Título (igual estilo que Experience) */}
        <div className="cv-card-title">
          <strong>{item?.institution || '-'}</strong>
        </div>

        {/* Subtítulo: programa · nivel */}
        <div className="cv-card-subtitle">
          {item?.program || '-'}
          {item?.levelType ? ` · ${item.levelType}` : ''}
        </div>

        {/* Meta: país · periodo */}
        <div className="cv-card-meta">
          {item?.country ? <span>{item.country}</span> : null}
          {period ? <span>{item?.country ? ' · ' : ''}{period}</span> : null}
        </div>
      </div>

      {/* Acciones: copiamos la idea de Experience (botón Edit ancho).
         Mantengo Delete sin eliminar funcionalidad. */}
      <div className="cv-card-actions" style={{ display: 'grid', gap: 8 }}>
        <button
          type="button"
          className="btn"
          style={{ width: '100%' }}
          onClick={() => onEdit && onEdit(item)}
          aria-label="Edit education item"
        >
          Edit
        </button>

        <button
          type="button"
          className="btn small danger"
          onClick={() => onDelete && onDelete(item)}
          aria-label="Delete education item"
        >
          Delete
        </button>
      </div>
    </div>
  );
}