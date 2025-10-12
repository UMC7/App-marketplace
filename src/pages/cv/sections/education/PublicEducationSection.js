// src/pages/cv/sections/education/PublicEducationSection.jsx
import React, { useMemo } from 'react';
import './PublicEducationSection.css';

function monthLabel(mm) {
  return (
    {
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
    }[mm] || mm
  );
}

function period(it = {}) {
  const s =
    it.start_month && it.start_year
      ? `${monthLabel(String(it.start_month).padStart(2, '0'))} ${it.start_year}`
      : '';
  const e = it.current
    ? 'Present'
    : it.end_month && it.end_year
    ? `${monthLabel(String(it.end_month).padStart(2, '0'))} ${it.end_year}`
    : '';
  if (s && e) return `${s} — ${e}`;
  return s || '';
}

export default function PublicEducationSection({ title = 'FORMAL STUDIES & DEGREES', items = [] }) {
  const list = useMemo(() => Array.isArray(items) ? items : [], [items]);

  return (
    <section className="ppv-section edu-section" aria-label="Education">
      <div className="ppv-sectionTitleWrap">
        <h3 className="ppv-sectionTitle">{title}</h3>
      </div>

      {list.length === 0 ? (
        <div className="edu-empty">No education added.</div>
      ) : (
        <div className="edu-list" role="list">
          {list.map((it) => (
            <article key={it.id} className="edu-card" role="listitem">
              <div className="edu-card-main">
                <div className="edu-card-title">{it.institution || '—'}</div>
                {(() => {
                  const parts = [];
                  if (it.program) parts.push(it.program);
                  if (it.level_type) parts.push(it.level_type);
                  if (it.country) parts.push(it.country);
                  const per = period(it);
                  if (per) parts.push(per);

                  return (
                    <div className="edu-card-line">
                      {parts.map((txt, i) => (
                        <React.Fragment key={i}>
                          {i > 0 && <span className="edu-dot" aria-hidden="true" />}
                          <span className="edu-part">{txt}</span>
                        </React.Fragment>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}