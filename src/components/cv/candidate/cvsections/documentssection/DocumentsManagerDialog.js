// src/components/cv/candidate/cvsections/documentssection/DocumentsManagerDialog.js
import React, { useEffect, useRef } from "react";
import DocManager from "../../sectionscomponents/documents/documentssectioncontroller/DocManager";

export default function DocumentsManagerDialog({
  open,
  onClose,
  initialDocs = [],
  onSave,
}) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (typeof onClose === "function") onClose();
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget && typeof onClose === "function") onClose();
  };

  return (
    <div
      className="cv-modal-backdrop doc-modal-backdrop"
      role="presentation"
      onClick={handleBackdrop}
      style={backdropStyle}
    >
      <div
        className="cv-modal-panel doc-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Documents manager"
        ref={panelRef}
        style={panelStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* DocManager already renders its own header (title, Close, Save) */}
        <div style={bodyStyle}>
          <DocManager
            initialDocs={initialDocs}
            onSave={onSave}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
}

/* Minimal inline styles (scoped)
   Usamos los tokens ya definidos en CandidateProfileTab.css:
   --card, --card-2 y --text, que cambian correctamente con [data-theme='dark'].
*/
const backdropStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "16px",
  zIndex: 4000, // por encima del navbar
};

const panelStyle = {
  background: "var(--card, #fff)",
  color: "var(--text, #111)",
  width: "100%",
  maxWidth: "980px",
  maxHeight: "calc(100vh - 32px)",
  display: "flex",
  flexDirection: "column",
  borderRadius: "12px",
  overflow: "hidden",
  boxShadow: "0 10px 30px rgba(0,0,0,.25)",
};

const bodyStyle = {
  position: "relative",
  flex: "0 1 auto",
  overflow: "auto",
  padding: "12px 12px 8px",
  background: "var(--card-2, #f7f7f7)",
};
