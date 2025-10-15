// src/components/cv/candidate/cvsections/documentssection/DocumentsSection.js
import React from "react";

export default function DocumentsSection({
  docs = [],
  onOpenManager,
  // nuevos (opcionales): permiten editar/eliminar por ítem sin romper nada existente
  onEditDoc,
  onDeleteDoc,
  busyId, // opcional: id que está en proceso de borrado para deshabilitar el botón

  // 🔹 NUEVO (opcionales): flags de “Sí/No” para documentos básicos
  docFlags,
  onChangeDocFlag,
}) {
  // Mapeo de los 9 campos que pediste
  const quickItems = [
    { key: "passport6m",     label: "Passport >6 months" },
    { key: "schengenVisa",   label: "SCHENGEN Visa" },
    { key: "stcwBasic",      label: "STCW Basic Safety" },
    { key: "seamansBook",    label: "Seaman’s Book" },
    { key: "eng1",           label: "ENG1" },
    { key: "usVisa",         label: "US VISA" },
    { key: "drivingLicense", label: "Driving License" },
    { key: "pdsd",           label: "PDSD Course" },
    { key: "covidVaccine",   label: "COVID Vaccine" },
  ];

  // Normaliza boolean/null -> valor del <select>
  const valOf = (v) => (v === true ? "yes" : v === false ? "no" : "");
  const parseVal = (s) => (s === "yes" ? true : s === "no" ? false : null);

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

      {/* 🔹 NUEVO: bloque de 9 selectores (responsive) — 3 columnas en desktop, 1 en móvil */}
      <div
        className="cv-docs-quickflags"
        style={{
          marginTop: 12,
          marginBottom: 12,
          display: "grid",
          // auto-fit + minmax hace que en pantallas estrechas caiga a 1 columna,
          // y en desktop quepan 2–3 sin tocar estilos globales.
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 12,
        }}
      >
        {quickItems.map((it) => (
          <label
            key={it.key}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              padding: "8px 10px",
              background: "var(--card, #fff)",
              border: "1px solid rgba(0,0,0,.12)",
              borderRadius: 10,
            }}
          >
            <span style={{ fontSize: 14 }}>{it.label}</span>
            <select
              value={valOf(docFlags?.[it.key])}
              onChange={(e) =>
                typeof onChangeDocFlag === "function"
                  ? onChangeDocFlag(it.key, parseVal(e.target.value))
                  : undefined
              }
              style={{
                minWidth: 120,
                padding: "6px 8px",
                borderRadius: 8,
                border: "1px solid rgba(0,0,0,.18)",
                background: "var(--card, #fff)",
              }}
              aria-label={it.label}
            >
              <option value="">Select...</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
        ))}
      </div>

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