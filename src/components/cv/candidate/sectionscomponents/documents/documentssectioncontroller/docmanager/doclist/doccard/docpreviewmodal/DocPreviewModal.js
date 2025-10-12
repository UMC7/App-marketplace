// src/components/cv/candidate/sectionscomponents/documents/documentssectioncontroller/docmanager/doclist/doccard/docpreviewmodal/DocPreviewModal.js
import React, { useEffect, useRef } from "react";

export default function DocPreviewModal({ open, onClose, src, mimeType, title }) {
  const panelRef = useRef(null);
  const lastFocusRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    // Save last focused element to restore on close
    lastFocusRef.current = document.activeElement;

    const handleKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (typeof onClose === "function") onClose();
      }
      // Basic focus trap
      if (e.key === "Tab") {
        const panel = panelRef.current;
        if (!panel) return;
        const focusables = panel.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKey);
    // Autofocus close button
    const btn = panelRef.current?.querySelector("[data-autofocus]");
    btn?.focus();

    return () => {
      document.removeEventListener("keydown", handleKey);
      // Restore focus
      if (lastFocusRef.current && typeof lastFocusRef.current.focus === "function") {
        lastFocusRef.current.focus();
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  const isImage = typeof mimeType === "string" && mimeType.startsWith("image/");
  const isPdf = mimeType === "application/pdf";

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && typeof onClose === "function") onClose();
  };

  return (
    <div
      className="cv-modal-backdrop"
      onClick={handleBackdropClick}
      aria-hidden="true"
      style={backdropStyle}
    >
      <div
        className="cv-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="doc-preview-title"
        ref={panelRef}
        style={panelStyle}
      >
        <header className="cv-modal-head" style={headStyle}>
          <h3 id="doc-preview-title" className="cv-modal-title" style={titleStyle}>
            {title || "Document preview"}
          </h3>
          <div className="cv-modal-actions" style={actionsStyle}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              data-autofocus
            >
              Close
            </button>
          </div>
        </header>

        <div className="cv-modal-body" style={bodyStyle}>
          {!src ? (
            <div className="cv-modal-empty" style={emptyStyle}>
              <p>No preview available.</p>
            </div>
          ) : isImage ? (
            <div className="cv-modal-image-wrap" style={imageWrapStyle}>
              {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
              <img
                src={src}
                alt={`${title || "Document"} image preview`}
                style={imageStyle}
              />
            </div>
          ) : isPdf ? (
            <iframe
              title={title || "PDF preview"}
              src={src}
              style={iframeStyle}
            />
          ) : (
            <div className="cv-modal-unsupported" style={emptyStyle}>
              <p>Preview not supported for this file type.</p>
              <p>
                MIME type: <code>{mimeType || "unknown"}</code>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* Inline minimal styles (replace with css later if desired) */
const backdropStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "16px",
  zIndex: 1000,
};

const panelStyle = {
  background: "var(--card-bg, #fff)",
  color: "var(--text-color, #111)",
  width: "100%",
  maxWidth: "900px",
  maxHeight: "90vh",
  display: "flex",
  flexDirection: "column",
  borderRadius: "12px",
  overflow: "hidden",
  boxShadow: "0 10px 30px rgba(0,0,0,.25)",
};

const headStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 16px",
  borderBottom: "1px solid rgba(0,0,0,.1)",
};

const titleStyle = {
  margin: 0,
  fontSize: "16px",
  fontWeight: 600,
};

const actionsStyle = { display: "flex", gap: "8px" };

const bodyStyle = {
  position: "relative",
  flex: 1,
  background: "var(--panel-bg, #f7f7f7)",
};

const emptyStyle = {
  padding: "24px",
  textAlign: "center",
  color: "#555",
};

const imageWrapStyle = {
  width: "100%",
  height: "100%",
  overflow: "auto",
  background: "#000",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const imageStyle = {
  display: "block",
  maxWidth: "100%",
  maxHeight: "88vh",
};

const iframeStyle = {
  width: "100%",
  height: "calc(90vh - 56px)", // header height safety
  border: "none",
  background: "#fff",
};