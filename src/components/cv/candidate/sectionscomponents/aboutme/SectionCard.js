// src/components/cv/candidate/sectionscomponents/aboutme/SectionCard.js
import React from "react";

export default function SectionCard({ title, subtitle, children }) {
  return (
    <div
      className="cv-section-card"
      style={{
        borderRadius: 12,
        /* solo reducimos un poco el padding horizontal para ganar ancho útil */
        padding: "12px",
        background: "var(--card, #0f172a)",
      }}
    >
      <div className="section-header" style={{ marginBottom: 12 }}>
        {title ? <h3 style={{ margin: 0 }}>{title}</h3> : null}
        {subtitle ? (
          <p style={{ margin: "6px 0 0", color: "var(--muted, #94a3b8)", fontSize: 14 }}>
            {subtitle}
          </p>
        ) : null}
      </div>

      {/* sin márgenes negativos para evitar desbordes */}
      <div
        className="section-body"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 8,
          alignItems: "stretch",
          justifyItems: "stretch",
          width: "100%",
        }}
      >
        {children}
      </div>
    </div>
  );
}