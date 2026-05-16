// src/components/cv/candidate/ProfileProgress.js
import React, { useMemo } from 'react';
import { calculateProfileProgressPercent } from '../progress/profileProgress';

export default function ProfileProgress({ sections = {} }) {
  const percent = useMemo(() => calculateProfileProgressPercent(sections), [sections]);

  return (
    <div style={{ margin: '8px 0 12px' }}>
      <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>
        Profile completeness: <strong>{percent}%</strong>
      </div>
      <div style={{ height: 8, background: '#e5e7eb', borderRadius: 999 }}>
        <div
          style={{
            width: `${percent}%`,
            height: '100%',
            background: '#68ada8',
            borderRadius: 999,
            transition: 'width .25s ease',
          }}
        />
      </div>
    </div>
  );
}
