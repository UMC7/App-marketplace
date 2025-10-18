// src/components/cv/candidate/sectionscomponents/references/AttachmentInput.js
import React, { useRef, useState } from "react";

export default function AttachmentInput({
  value = "",
  onChange,
  onUpload,
  label = "Attachment",
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [fileName, setFileName] = useState(value || "");
  const dropRef = useRef(null);
  const fileRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    try {
      setBusy(true);
      setErr("");
      let uploadedUrl = "";
      if (typeof onUpload === "function") {
        uploadedUrl = await onUpload(file);
      } else {
        uploadedUrl = file.name;
      }
      setFileName(uploadedUrl);
      onChange?.(uploadedUrl);
    } catch (e) {
      setErr(e?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const handleInputChange = (ev) => {
    const file = ev.target.files?.[0];
    ev.target.value = "";
    handleFile(file);
  };

  const handleDrop = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    const file = ev.dataTransfer.files?.[0];
    handleFile(file);
    if (dropRef.current) dropRef.current.classList.remove("drag-over");
  };

  const handleDragOver = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    if (dropRef.current) dropRef.current.classList.add("drag-over");
  };

  const handleDragLeave = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    if (dropRef.current) dropRef.current.classList.remove("drag-over");
  };

  return (
    <div className="att-input">
      <label className="att-label">{label}</label>

      <div
        ref={dropRef}
        className="drop-zone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <p className="drop-hint">
          {fileName ? `Selected: ${fileName}` : "Drag & drop file here or click to browse"}
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,image/*"
          style={{ display: "none" }}
          onChange={handleInputChange}
        />
        <button
          type="button"
          className="btn ghost"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
        >
          Browse…
        </button>
      </div>

      {err && <div className="att-error">{err}</div>}

      <style>{`
        .att-input { display:flex; flex-direction:column; gap:8px; }

        /* Etiqueta legible en ambos modos usando tokens del contenedor */
        .att-label {
          font-weight:500;
          color: var(--muted-2);
        }

        /* Zona de arrastre: colores por variables (light/dark) */
        .drop-zone {
          border: 2px dashed var(--line);
          border-radius: 8px;
          padding: 16px;
          text-align: center;
          color: var(--muted);
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: center;
          background: linear-gradient(180deg, var(--card), var(--card-2));
          transition: border-color .15s ease, box-shadow .15s ease, background-color .15s ease;
        }
        .drop-zone .drop-hint { color: var(--muted); }

        /* Estado drag-over: realce sutil con tokens del tema */
        .drop-zone.drag-over {
          border-color: var(--accent-2);
          box-shadow: var(--focus);
          background: var(--input-bg);
        }

        /* Botón "Browse…" conserva clase .btn.ghost pero hereda tokens */
        .btn {
          border-radius: 8px;
          padding: 6px 12px;
          cursor: pointer;
          transition: border-color .15s ease, box-shadow .15s ease, background-color .15s ease, transform .05s ease;
        }
        .btn.ghost {
          background: var(--btn-bg);
          border: 1px solid var(--btn-bd);
          color: var(--btn-tx);
        }
        .btn.ghost:hover { border-color: var(--accent-2); box-shadow: var(--focus); }
        .btn:active { transform: translateY(1px); }

        /* Errores */
        .att-error { color:#fca5a5; font-size:12px; }
      `}</style>
    </div>
  );
}