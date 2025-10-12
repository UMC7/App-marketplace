// src/components/cv/candidate/sectionscomponents/documents/documentssectioncontroller/docmanager/DocMetadataForm.js
import React from "react";

export default function DocMetadataForm({ doc, onChange, onRemove, disabled = false }) {
  if (!doc) return null;

  const handle = (patch) => {
    if (typeof onChange === "function") onChange(patch);
  };

  const noExpiry = !doc.expiresOn;

  return (
    <div className="doc-form">
      <div className="doc-field">
        <label className="doc-label" htmlFor={`title-${doc.id}`}>Title (EN)</label>
        <input
          id={`title-${doc.id}`}
          type="text"
          className="doc-input"
          placeholder="e.g., STCW Basic Safety Training"
          value={doc.title || ""}
          onChange={(e) => handle({ title: e.target.value })}
          disabled={disabled}
        />
        {doc.originalTitle ? (
          <small className="doc-hint">
            Original: <em>{doc.originalTitle}</em>
          </small>
        ) : null}
      </div>

      <div className="doc-grid">
        <div className="doc-field">
          <label className="doc-label" htmlFor={`issued-${doc.id}`}>Issue date</label>
          <input
            id={`issued-${doc.id}`}
            type="date"
            className="doc-input"
            value={safeDateInputValue(doc.issuedOn)}
            onChange={(e) => handle({ issuedOn: e.target.value })}
            disabled={disabled}
          />
        </div>

        <div className="doc-field">
          <label className="doc-label" htmlFor={`expiry-${doc.id}`}>Expiry date</label>
          <input
            id={`expiry-${doc.id}`}
            type="date"
            className="doc-input"
            value={safeDateInputValue(doc.expiresOn)}
            onChange={(e) => handle({ expiresOn: e.target.value })}
            disabled={disabled || noExpiry}
          />
          <div className="doc-checkbox">
            <input
              id={`noexp-${doc.id}`}
              type="checkbox"
              checked={noExpiry}
              onChange={(e) => handle({ expiresOn: e.target.checked ? "" : "" })}
              disabled={disabled}
            />
            <label htmlFor={`noexp-${doc.id}`}>No expiry</label>
          </div>
        </div>

        <div className="doc-field">
          <label className="doc-label" htmlFor={`visibility-${doc.id}`}>Visibility</label>
          <select
            id={`visibility-${doc.id}`}
            className="doc-input"
            value={toVisibility(doc.visibility)}
            onChange={(e) => handle({ visibility: e.target.value })}
            disabled={disabled}
          >
            <option value="public">Public</option>
            <option value="unlisted">Unlisted</option>
            <option value="private">Private</option>
          </select>
        </div>
      </div>

      <div className="doc-meta">
        <span className="doc-meta__pill">{doc.mimeType || "Unknown type"}</span>
        {typeof doc.sizeBytes === "number" && (
          <span className="doc-meta__pill">{formatBytes(doc.sizeBytes)}</span>
        )}
      </div>

      <div className="doc-actions">
        <button
          type="button"
          className="btn btn-ghost"
          disabled
          title="Preview coming soon"
        >
          Preview (soon)
        </button>
        {typeof onRemove === "function" && (
          <button
            type="button"
            className="btn btn-danger"
            onClick={onRemove}
            disabled={disabled}
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

/* -------------------- helpers -------------------- */

function toVisibility(v) {
  const s = String(v || "").toLowerCase();
  return s === "public" || s === "private" || s === "unlisted" ? s : "unlisted";
}

function safeDateInputValue(v) {
  if (!v) return "";
  try {
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    const dt = v instanceof Date ? v : new Date(String(v));
    if (Number.isNaN(dt.getTime())) return "";
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const d = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  } catch {
    return "";
  }
}

function formatBytes(bytes) {
  if (typeof bytes !== "number" || bytes < 0) return "";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}