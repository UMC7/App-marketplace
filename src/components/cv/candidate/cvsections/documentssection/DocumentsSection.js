// src/components/cv/candidate/cvsections/documentssection/DocumentsSection.js
import React from "react";

export default function DocumentsSection({
  docs = [],
  onOpenManager,
  onEditDoc,
  onDeleteDoc,
  busyId,
  docFlags,
  onChangeDocFlag,
  onSaveDocFlags,
  savingDocFlags,
  docFlagsDirty = true,
  readOnly = false,
}) {
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

  const allFlagsSelected = quickItems.every(
    (it) => typeof (docFlags?.[it.key]) === "boolean"
  );

  const valOf = (v) => (v === true ? "yes" : "no");
  const parseVal = (s) => (s === "yes" ? true : s === "no" ? false : null);

  return (
    <>
      <header className="cv-section-head">
        {typeof onOpenManager === "function" ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onOpenManager}
              aria-label="Open Documents Manager"
            >
              Add Document
            </button>
            <span className="cp-muted">Min 3 documents with file upload</span>
          </div>
        ) : (
          <small className="cv-section-hint">
            {readOnly ? "Read-only view" : "Manager coming soon"}
          </small>
        )}
      </header>

      {/* 🔹 Bloque de 9 selectores: 3 columnas en desktop (CSS), 1 en móvil */}
      <div className="cv-docs-quickflags">
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
              border: "1px solid var(--line, #e2e8f0)",
              borderRadius: 10,
            }}
          >
            <span style={{ fontSize: 14 }}>
              {it.label}
            </span>
            <select
              value={valOf(docFlags?.[it.key])}
              onChange={(e) =>
                typeof onChangeDocFlag === "function"
                  ? onChangeDocFlag(it.key, parseVal(e.target.value))
                  : undefined
              }
              disabled={readOnly}
              style={{
                minWidth: 120,
                padding: "6px 8px",
                borderRadius: 8,
                border: "1px solid rgba(0,0,0,.18)",
                background: "var(--card, #fff)",
              }}
              aria-label={it.label}
              aria-required="true"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
        ))}
      </div>

      {/* Botón Save independiente para los 9 selectores */}
      <div className="cv-section-body" style={{ marginTop: 8, marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onSaveDocFlags}
            disabled={
              readOnly ||
              !!savingDocFlags ||
              typeof onSaveDocFlags !== "function" ||
              !docFlagsDirty
            }
            aria-label="Save document flags"
            title={
              !docFlagsDirty
                ? "No changes to save"
                : undefined
            }
            style={{
              cursor:
                readOnly || savingDocFlags || !docFlagsDirty
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {savingDocFlags ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <div className="cv-section-body" style={{ marginTop: 6 }}>
        {docs.length === 0 ? (
          <div className={`cv-empty-state ${docs.length < 3 ? 'cp-missing-block' : ''}`}>
            <p>No documents yet.</p>
          </div>
        ) : (
          <ul className={`cv-docs-list ${docs.length < 3 ? 'cp-missing-block' : ''}`}>
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
                      disabled={readOnly}
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
                      disabled={readOnly || !onDeleteDoc || String(busyId || "") === String(d.id)}
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
    const d = v instanceof Date ? v : new Date(String(v));
    if (Number.isNaN(d.getTime())) return String(v);
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
