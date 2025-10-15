// src/components/cv/candidate/sectionscomponents/personal/VisibilityTogglesRow.js
import React from 'react';

export default function VisibilityTogglesRow({
  showAge = false,          // compat: ignorado, siempre true visualmente
  onChangeShowAge,          // compat: ignorado
  showEmail = false,        // compat: ignorado, siempre true visualmente
  onChangeShowEmail,        // compat: ignorado
  showPhone = false,        // compat: ignorado, siempre true visualmente
  onChangeShowPhone,        // compat: ignorado
}) {
  const forcedChecked = true;

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
          checked={forcedChecked}
          disabled
          aria-disabled="true"
          title="This setting is enforced by the platform"
        />
        <span className="cp-muted">Show age on CV</span>
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="checkbox"
          checked={forcedChecked}
          disabled
          aria-disabled="true"
          title="This setting is enforced by the platform"
        />
        <span className="cp-muted">Show email on CV</span>
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="checkbox"
          checked={forcedChecked}
          disabled
          aria-disabled="true"
          title="This setting is enforced by the platform"
        />
        <span className="cp-muted">Show phone on CV</span>
      </label>
    </div>
  );
}