// src/components/cv/candidate/sectionscomponents/documents/documentssectioncontroller/docmanager/doclist/doccard/DocCard.js
import React from "react";

export default function DocCard({ doc, onPreview, onDownload, rightSlot }) {
  if (!doc) return null;

  const handlePreview = () => {
    if (typeof onPreview === "function") onPreview(doc);
  };
  const handleDownload = () => {
    if (typeof onDownload === "function") onDownload(doc);
  };

  return (
    <div className="cv-doc-card">
      <div className="cv-doc-card__main">
        <div className="cv-doc-card__title">{doc.title || "Untitled document"}</div>
        <div className="cv-doc-card__meta">
          <span>{formatDateRange(doc.issuedOn, doc.expiresOn)}</span>
          {doc.visibility ? <span> • {humanVisibility(doc.visibility)}</span> : null}
          {doc.mimeType ? <span> • {doc.mimeType}</span> : null}
          {typeof doc.sizeBytes === "number" ? (
            <span> • {formatBytes(doc.sizeBytes)}</span>
          ) : null}
        </div>
      </div>

      <div className="cv-doc-card__actions">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={handlePreview}
          disabled={!onPreview}
          aria-label="Preview document"
        >
          Preview
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleDownload}
          disabled={!onDownload}
          aria-label="Download document"
        >
          Download
        </button>
        {rightSlot ? <div className="cv-doc-card__right">{rightSlot}</div> : null}
      </div>
    </div>
  );
}

/* -------------------- helpers -------------------- */

function formatDateRange(issuedOn, expiresOn) {
  const issued = toYmdString(issuedOn);
  const expires = toYmdString(expiresOn);
  if (!issued && !expires) return "No dates";
  if (issued && !expires) return `Issued: ${issued}`;
  if (!issued && expires) return `Expires: ${expires}`;
  return `Issued: ${issued} • Expires: ${expires}`;
}

function toYmdString(v) {
  if (!v) return "";
  try {
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    const d = v instanceof Date ? v : new Date(String(v));
    if (Number.isNaN(d.getTime())) return "";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return "";
  }
}

function humanVisibility(v) {
  switch (String(v || "").toLowerCase()) {
    case "public":
      return "Public";
    case "private":
      return "Private";
    case "unlisted":
      return "Unlisted";
    default:
      return "Visible";
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