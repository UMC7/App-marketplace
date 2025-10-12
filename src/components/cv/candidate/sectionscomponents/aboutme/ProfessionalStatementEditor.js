// src/components/cv/candidate/sectionscomponents/aboutme/ProfessionalStatementEditor.js
import React, { useMemo } from "react";

export default function ProfessionalStatementEditor({ value = "", onChange }) {
  const length = useMemo(() => (value || "").length, [value]);

  return (
    <div className="field-group" style={{ marginBottom: 8 }}>
      <label className="field-label" style={{ display: "block", marginBottom: 6 }}>
        Professional statement
      </label>
      <textarea
        rows={8}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder="Describe your professional development, strengths, work style, and how you add value on board."
        className="input textarea"
        style={{
          width: "100%",
          resize: "vertical",
          minHeight: 160,
          padding: 12,
          borderRadius: 8,
        }}
      />
      <div style={{ textAlign: "right", fontSize: 12, color: "var(--muted, #94a3b8)" }}>
        {length} characters
      </div>
    </div>
  );
}