// src/components/cv/candidate/sectionscomponents/documents/documentssectioncontroller/docmanager/DocumentTitleBadge.js
import React from "react";

export default function DocumentTitleBadge({
  title,
  confidence,
  notes = [],
  onEdit,
  size = "md",
}) {
  const confPct =
    typeof confidence === "number" && confidence >= 0 && confidence <= 1
      ? Math.round(confidence * 100)
      : null;

  const small = size === "sm";

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span
        className="doc-title-badge"
        title={title}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          border: "1px solid rgba(0,0,0,.15)",
          background: "#fff",
          padding: small ? "4px 8px" : "6px 10px",
          borderRadius: 999,
          fontSize: small ? 12 : 13,
          lineHeight: 1,
        }}
      >
        <ShieldIcon />
        <span style={{ fontWeight: 600 }}>{title || "Untitled document"}</span>
        {confPct !== null ? (
          <span
            style={{
              fontSize: small ? 11 : 12,
              color: "#555",
              borderLeft: "1px solid rgba(0,0,0,.08)",
              paddingLeft: 6,
            }}
          >
            Confidence: {confPct}%
          </span>
        ) : null}
      </span>

      {Array.isArray(notes) && notes.length > 0 ? (
        <NotesTooltip notes={notes} small={small} />
      ) : null}

      {typeof onEdit === "function" ? (
        <button
          type="button"
          onClick={onEdit}
          className="doc-title-edit-btn"
          style={{
            border: "1px solid rgba(0,0,0,.15)",
            background: "#fff",
            padding: small ? "4px 8px" : "6px 10px",
            borderRadius: 8,
            fontSize: small ? 12 : 13,
            cursor: "pointer",
          }}
          title="Edit title"
        >
          Edit
        </button>
      ) : null}
    </div>
  );
}

function NotesTooltip({ notes = [], small }) {
  const text = notes.join(" • ");
  return (
    <span
      title={text}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: small ? 11 : 12,
        color: "#555",
      }}
    >
      <InfoIcon />
      <span style={{ maxWidth: 360, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {text}
      </span>
    </span>
  );
}

/* ------------------------- inline icons ------------------------- */

function ShieldIcon({ size = 14 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function InfoIcon({ size = 14 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 8.5h.01M11 11h2v6h-2z" fill="currentColor" />
    </svg>
  );
}