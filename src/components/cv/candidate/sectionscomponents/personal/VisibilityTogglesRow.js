// src/components/cv/candidate/sectionscomponents/personal/VisibilityTogglesRow.js
import React from 'react';

export default function VisibilityTogglesRow({
  showAge = false,
  onChangeShowAge,
  showEmail = false,
  onChangeShowEmail,
  showPhone = false,
  onChangeShowPhone,
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 16,
        alignItems: 'center',
        flexWrap: 'wrap',
        marginTop: 12,
      }}
    >
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="checkbox"
          checked={!!showAge}
          onChange={(e) => onChangeShowAge && onChangeShowAge(e.target.checked)}
        />
        <span className="cp-muted">Show age on CV</span>
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="checkbox"
          checked={!!showEmail}
          onChange={(e) => onChangeShowEmail && onChangeShowEmail(e.target.checked)}
        />
        <span className="cp-muted">Show email on CV</span>
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="checkbox"
          checked={!!showPhone}
          onChange={(e) => onChangeShowPhone && onChangeShowPhone(e.target.checked)}
        />
        <span className="cp-muted">Show phone on CV</span>
      </label>
    </div>
  );
}