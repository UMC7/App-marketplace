// src/components/cv/candidate/sectionscomponents/documents/documentssectioncontroller/DocManager.js
import React, { useMemo, useState } from "react";
import DocUploadDropzone from "./docmanager/DocUploadDropzone";
import { safeExtractIfPdf } from "./docmanager/pdfText";
import DocumentTitleField from "./docmanager/DocumentTitleField";

export default function DocManager({ initialDocs = [], onSave, onClose }) {
  const [docs, setDocs] = useState(() => (initialDocs || []).map(coerceDoc));
  const [pendingFiles, setPendingFiles] = useState(() => new Map());

  const stats = useMemo(() => {
    const total = docs.length;
    const withExpiry = docs.filter((d) => !!d.expiresOn).length;
    return { total, withExpiry };
  }, [docs]);

  const handleAddFromDropzone = (newDocs, fileMap) => {
    if (Array.isArray(newDocs) && newDocs.length) {
      setDocs((prev) => [...newDocs.map(coerceDoc), ...prev]);
    }
    if (fileMap instanceof Map) {
      setPendingFiles((prev) => {
        const next = new Map(prev);
        for (const [id, file] of fileMap.entries()) next.set(id, file);
        return next;
      });
    }
  };

  const handleChange = (id, patch) => {
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  };

  // ✅ CORREGIDO: permite alternar entre "sin expiry" y "con expiry"
  const handleToggleNoExpiry = (id, noExpiry) => {
    handleChange(id, { expiresOn: noExpiry ? "" : new Date().toISOString().slice(0, 10) });
  };

  const handleSave = () => {
    const cleaned = docs.map(normalizeDoc);
    if (typeof onSave === "function") onSave(cleaned, pendingFiles);
  };

  return (
    <div className="doc-manager">
      {/* HEADER */}
      <header className="doc-manager__head">
        <div className="doc-manager__titles">
          <h3 className="doc-manager__title">Documents Manager</h3>
          <p className="doc-manager__subtitle">
            Add your CV and certificates. Edit the detected fields before publishing.
          </p>
        </div>
      </header>

      {/* DROPZONE */}
      <section className="doc-manager__toolbar">
        <div className="doc-manager__left" style={{ flex: 1 }}>
          <DocUploadDropzone
            onAdd={handleAddFromDropzone}
            extractText={safeExtractIfPdf}
          />
          <span className="doc-manager__hint">
            Drag & drop or select PDF/images. Title, Issue and Expiry are auto-detected.
          </span>
        </div>
        <div className="doc-manager__right">
          <small className="doc-manager__stats">
            {stats.total} item{stats.total === 1 ? "" : "s"} • {stats.withExpiry} with expiry
          </small>
        </div>
      </section>

      {/* LIST */}
      <section className="doc-manager__list">
        {docs.length === 0 ? (
          <div className="doc-manager__empty">
            <p>No documents yet. Drop files above to start.</p>
          </div>
        ) : (
          <ul className="doc-list">
            {docs.map((d) => (
              <li key={d.id} className="doc-item">
                <div className="doc-item__main">
                  {/* Title */}
                  <div className="doc-field">
                    <label className="doc-label">Title (EN)</label>
                    <DocumentTitleField
                      value={d.title}
                      onChange={(v) => handleChange(d.id, { title: v })}
                      defaultMode="select"
                      allowSwitch={false}
                      placeholder="e.g., STCW Basic Safety Training"
                      name={`title-${d.id}`}
                    />
                  </div>

                  {/* Issue + Expiry + Visibility */}
                  <div className="doc-grid doc-grid--compact">
                    <div className="doc-dates">
                      <div className="doc-field">
                        <label className="doc-label">Issue date</label>
                        <input
                          type="date"
                          className="doc-input doc-input--date"
                          value={safeDateInputValue(d.issuedOn)}
                          onChange={(e) =>
                            handleChange(d.id, { issuedOn: e.target.value })
                          }
                        />
                      </div>

                      <div className="doc-field">
                        <label className="doc-label">Expiry date</label>
                        <input
                          type="date"
                          className="doc-input doc-input--date"
                          value={safeDateInputValue(d.expiresOn)}
                          onChange={(e) =>
                            handleChange(d.id, { expiresOn: e.target.value })
                          }
                          disabled={!d.expiresOn}
                        />
                        <div className="doc-checkbox">
                          <input
                            id={`noexp-${d.id}`}
                            type="checkbox"
                            checked={!d.expiresOn}
                            onChange={(e) =>
                              handleToggleNoExpiry(d.id, e.target.checked)
                            }
                          />
                          <label htmlFor={`noexp-${d.id}`}>No expiry</label>
                        </div>
                      </div>
                    </div>

                    <div className="doc-field">
                      <label className="doc-label">Visibility</label>
                      <select
                        className="doc-input"
                        value={d.visibility}
                        onChange={(e) =>
                          handleChange(d.id, { visibility: e.target.value })
                        }
                      >
                        <option value="public">Public</option>
                        <option value="unlisted">Unlisted</option>
                        <option value="private">Private</option>
                      </select>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="doc-meta">
                    <span className="doc-meta__pill">
                      {d.mimeType || "Unknown type"}
                    </span>
                    {typeof d.sizeBytes === "number" && (
                      <span className="doc-meta__pill">
                        {formatBytes(d.sizeBytes)}
                      </span>
                    )}
                    {d.originalTitle ? (
                      <span className="doc-meta__note">
                        Original: <em>{d.originalTitle}</em>
                      </span>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* FOOTER */}
      <footer className="doc-manager__footer">
        <div className="doc-manager__footer-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            Save changes
          </button>
        </div>
      </footer>
    </div>
  );
}

/* -------------------- helpers -------------------- */

function coerceDoc(raw) {
  const d = { ...(raw || {}) };
  d.id = String(d.id || `tmp-${Math.random().toString(36).slice(2)}`);
  d.title = String(d.title || "Untitled document");
  d.originalTitle = d.originalTitle ? String(d.originalTitle) : undefined;
  d.issuedOn = normalizeDateInput(d.issuedOn);
  d.expiresOn = normalizeDateInput(d.expiresOn);
  d.visibility = toVisibility(d.visibility);
  d.mimeType = d.mimeType ? String(d.mimeType) : undefined;
  d.sizeBytes = typeof d.sizeBytes === "number" ? d.sizeBytes : undefined;
  return d;
}

function normalizeDoc(d) {
  return {
    id: String(d.id),
    title: (d.title || "").trim(),
    originalTitle: d.originalTitle ? String(d.originalTitle).trim() : undefined,
    issuedOn: normalizeDateOutput(d.issuedOn),
    expiresOn: normalizeDateOutput(d.expiresOn),
    visibility: toVisibility(d.visibility),
    mimeType: d.mimeType ? String(d.mimeType) : undefined,
    sizeBytes: typeof d.sizeBytes === "number" ? d.sizeBytes : undefined,
  };
}

function toVisibility(v) {
  const s = String(v || "").toLowerCase();
  return s === "public" || s === "private" || s === "unlisted" ? s : "unlisted";
}

function safeDateInputValue(v) {
  const s = normalizeDateInput(v);
  return s || "";
}

function normalizeDateInput(v) {
  if (!v) return "";
  try {
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    const dt = v instanceof Date ? v : new Date(String(v));
    if (Number.isNaN(dt.getTime())) return "";
    return toYmd(dt);
  } catch {
    return "";
  }
}

function normalizeDateOutput(v) {
  const s = normalizeDateInput(v);
  return s || undefined;
}

function toYmd(dt) {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatBytes(bytes) {
  if (typeof bytes !== "number" || bytes < 0) return "";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}