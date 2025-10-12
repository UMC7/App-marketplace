// src/components/cv/candidate/sectionscomponents/departmentsranks/SelectedTargetsList.jsx
import React from "react";

export default function SelectedTargetsList({
  items = [],
  onRemove,
  label = "Selected:",
  className = "",
  style,
}) {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <div className={className} style={{ marginTop: 10, ...style }}>
      <div className="cp-muted" style={{ marginBottom: 6 }}>
        {label}
      </div>

      {/* Usamos el mismo markup/clases que Preferences & Skills */}
      <div className="cp-chips">
        {items.map((t, idx) => (
          <span
            key={`sel-${t?.department}-${t?.rank}-${idx}`}
            className="cp-chip cp-chip--active"
          >
            {t?.rank}
            <button
              type="button"
              className="cp-chip-x"
              onClick={() => onRemove?.(idx)}
              title="Remove"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}