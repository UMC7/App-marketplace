// src/components/cv/candidate/sectionscomponents/aboutme/AboutMeEditor.js
import React, { useMemo } from "react";

export default function AboutMeEditor({ value = "", onChange, showRequiredMark = true, readOnly = false, isMissing = false }) {
  const MAX = 800;
  const length = useMemo(() => (value || "").length, [value]);

  return (
    <div
      className="field-group"
      style={{
        margin: "12px 0",
        padding: 0,
        display: "grid",
        gridTemplateColumns: "1fr",
        alignItems: "start",
      }}
    >
      <label
        className="field-label"
        style={{ display: "block", marginBottom: 6 }}
      >
        Short summary {showRequiredMark ? '*' : ''}
      </label>

      <textarea
        rows={4}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder="Write a concise summary about you (3–6 lines)."
        className={`input textarea cp-textarea ${isMissing ? 'cp-missing-input' : ''}`}
        maxLength={MAX}
        readOnly={readOnly}
        style={{
          width: "100%",
          boxSizing: "border-box",
          resize: "vertical",
          minHeight: 88,
          padding: 12,
          borderRadius: 8,
          margin: 0, // evita desplazamiento hacia la derecha
        }}
      />

      <div
        style={{
          textAlign: "right",
          fontSize: 12,
          color: "var(--muted, #94a3b8)",
          marginTop: 4,
        }}
      >
        {length} / {MAX} characters
      </div>
    </div>
  );
}
