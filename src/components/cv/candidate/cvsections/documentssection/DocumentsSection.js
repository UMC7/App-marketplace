// src/components/cv/candidate/cvsections/documentssection/DocumentsSection.js
import React from "react";

export default function DocumentsSection({
  docs = [],
  onOpenManager,
  // nuevos (opcionales): permiten editar/eliminar por ítem sin romper nada existente
  onEditDoc,
  onDeleteDoc,
  busyId, // opcional: id que está en proceso de borrado para deshabilitar el botón
}) {
  return (
    <>
      <header className="cv-section-head">
        {typeof onOpenManager === "function" ? (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onOpenManager}
            aria-label="Open Documents Manager"
          >
            Add Document
          </button>
        ) : (
          <small className="cv-section-hint">Manager coming soon</small>
        )}
      </header>

      <div className="cv-section-body">
        {docs.length === 0 ? (
          <div className="cv-empty-state">
            <p>No documents yet.</p>
          </div>
        ) : (
          <ul className="cv-docs-list">
            {docs.map((d) => {
              const issued = d.issuedOn ? safeDate(d.issuedOn) : null;
              const expires = d.expiresOn ? safeDate(d.expiresOn) : null;

              return (
                <li key={d.id} className="cv-docs-item">
                  <div className="cv-docs-item-main">
                    <span className="cv-docs-title">
                      {d.title || "Untitled document"}
                    </span>

                    {/* Meta en dos líneas:
                        1) Issued
                        2) Expires • Visibility (cuando existan) */}
                    <span className="cv-docs-meta">
                      {issued ? `Issued: ${issued}` : "No dates"}
                      <br />
                      {expires ? `Expires: ${expires}` : ""}
                      {d.visibility
                        ? `${expires ? " • " : ""}${humanVisibility(
                            d.visibility
                          )}`
                        : ""}
                    </span>
                  </div>

                  {/* Acciones por documento (opcionales) */}
                  <div
                    className="cv-docs-item-actions"
                    style={{ display: "flex", gap: 8 }}
                  >
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() =>
                        typeof onEditDoc === "function"
                          ? onEditDoc(d)
                          : typeof onOpenManager === "function"
                          ? onOpenManager()
                          : undefined
                      }
                      aria-label={`Edit ${d.title || "document"}`}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="btn"
                      style={{ border: "1px solid #b91c1c", color: "#b91c1c" }}
                      onClick={() =>
                        typeof onDeleteDoc === "function" ? onDeleteDoc(d) : undefined
                      }
                      disabled={!onDeleteDoc || String(busyId || "") === String(d.id)}
                      aria-label={`Delete ${d.title || "document"}`}
                    >
                      {String(busyId || "") === String(d.id) ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}

/* ---------------- Helpers (pure, no dependencies) ---------------- */

function formatDateRange(issuedOn, expiresOn) {
  const issued = issuedOn ? safeDate(issuedOn) : null;
  const expires = expiresOn ? safeDate(expiresOn) : null;
  if (!issued && !expires) return "No dates";
  if (issued && !expires) return `Issued: ${issued}`;
  if (!issued && expires) return `Expires: ${expires}`;
  return `Issued: ${issued} • Expires: ${expires}`;
}

function safeDate(v) {
  try {
    // Accepts Date, ISO string, or YYYY-MM-DD
    const d = v instanceof Date ? v : new Date(String(v));
    if (Number.isNaN(d.getTime())) return String(v);
    // Render as YYYY-MM-DD
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return String(v);
  }
}

function humanVisibility(v) {
  switch (String(v).toLowerCase()) {
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