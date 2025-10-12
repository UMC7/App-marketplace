// src/components/cv/candidate/sectionscomponents/documents/documentssectioncontroller/docmanager/DocUploadDropzone.js
import React, { useCallback, useMemo, useRef, useState } from "react";
import { extractMetadataFromText } from "./docExtraction";

export default function DocUploadDropzone({
  onAdd,
  accept = ["application/pdf", "image/*"],
  maxFiles = 10,
  maxSizeBytes = 10 * 1024 * 1024,
  extractText,
}) {
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState([]);
  const inputRef = useRef(null);

  const acceptSet = useMemo(() => toAcceptArray(accept), [accept]);
  const acceptText = useMemo(() => acceptSet.join(", "), [acceptSet]);

  const handleBrowse = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFiles = useCallback(
    async (fileList) => {
      if (!fileList || fileList.length === 0) return;
      if (typeof onAdd !== "function") {
        console.warn("DocUploadDropzone: onAdd prop is required.");
        return;
      }

      const files = Array.from(fileList);
      const limited = files.slice(0, maxFiles);

      const errs = [];
      const ok = [];

      // Filtro por tamaño y tipo (con fallback a extensión cuando MIME viene vacío)
      for (const f of limited) {
        if (f.size > maxSizeBytes) {
          errs.push(
            `“${f.name}” is too large (${formatBytes(f.size)}). Limit: ${formatBytes(
              maxSizeBytes
            )}.`
          );
          continue;
        }
        if (!isAcceptedFile(f, acceptSet)) {
          const typ = f.type || "unknown";
          errs.push(`“${f.name}” type not allowed (${typ}).`);
          continue;
        }
        ok.push(f);
      }

      if (errs.length) setMessages((prev) => [...prev, ...errs]);
      if (ok.length === 0) return;

      setBusy(true);
      try {
        const docs = [];
        const fileMap = new Map();

        for (const f of ok) {
          let text = "";
          try {
            if (typeof extractText === "function") {
              text = await safeExtractText(extractText, f);
            }
          } catch {
            setMessages((prev) => [
              ...prev,
              `Could not read text from “${f.name}”. Using filename only.`,
            ]);
          }

          const meta = extractMetadataFromText(text, { filename: f.name }) || {};
          const id = `tmp-${Date.now().toString(36)}-${Math.random()
            .toString(36)
            .slice(2, 6)}`;

          const doc = {
            id,
            title: (meta.title || "Untitled document").trim(),
            originalTitle: meta.originalTitle || undefined,
            issuedOn: meta.issuedOn || "",
            expiresOn: meta.expiresOn || "",
            visibility: "unlisted",
            mimeType: f.type || undefined,
            sizeBytes: typeof f.size === "number" ? f.size : undefined,
          };

          docs.push(doc);
          fileMap.set(id, f);
        }

        if (docs.length) {
          onAdd(docs, fileMap);
          setMessages((prev) => [
            ...prev,
            `Added ${docs.length} file${docs.length > 1 ? "s" : ""}.`,
          ]);
        }
      } finally {
        setBusy(false);
      }
    },
    [onAdd, maxFiles, maxSizeBytes, acceptSet, extractText]
  );

  const onInputChange = useCallback(
    (e) => {
      const files = e.target?.files;
      handleFiles(files);
      if (e.target) e.target.value = "";
    },
    [handleFiles]
  );

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      const dt = e.dataTransfer;
      if (!dt) return;
      handleFiles(dt.files);
    },
    [handleFiles]
  );

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  return (
    <div className="doc-uploader">
      <div
        className={`doc-dropzone${dragOver ? " is-over" : ""}${busy ? " is-busy" : ""}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleBrowse();
          }
        }}
        aria-label="Upload documents"
        style={dropzoneStyle}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptText}
          onChange={onInputChange}
          multiple
          hidden
        />
        <div className="doc-dropzone__content" style={contentStyle}>
          <div className="doc-dropzone__title">Drop files here</div>
          <div className="doc-dropzone__subtitle">or</div>
          <button type="button" className="btn" onClick={handleBrowse} disabled={busy}>
            Select files
          </button>
          <div className="doc-dropzone__hint">
            Accepted: {acceptText}. Max size: {formatBytes(maxSizeBytes)}. Up to {maxFiles} files.
          </div>
          {busy && <div className="doc-dropzone__status">Reading files...</div>}
        </div>
      </div>

      {messages.length > 0 && (
        <ul className="doc-uploader__messages">
          {messages.map((m, i) => (
            <li key={`${i}-${m}`}>{m}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------------- helpers ---------------- */

async function safeExtractText(extractTextFn, file) {
  try {
    const out = await extractTextFn(file);
    if (typeof out !== "string") return "";
    return out.replace(/\u0000/g, " ").slice(0, 2_000_000);
  } catch {
    return "";
  }
}

/**
 * Acepta por MIME cuando existe, y por extensión cuando MIME viene vacío.
 */
function isAcceptedFile(file, acceptArr) {
  if (!acceptArr || acceptArr.length === 0) return true;
  const type = String(file.type || "").toLowerCase();
  const name = String(file.name || "").toLowerCase();

  // 1) match por MIME
  if (type) {
    const okByMime = acceptArr.some((pat) => {
      if (pat.endsWith("/*")) return type.startsWith(pat.slice(0, -2));
      return type === pat;
    });
    if (okByMime) return true;
  }

  // 2) fallback por extensión cuando no hay MIME o no coincide
  const allowsPdf = acceptArr.includes("application/pdf");
  const allowsImages =
    acceptArr.includes("image/*") || acceptArr.some((p) => p.startsWith("image/"));

  if (allowsPdf && /\.pdf(\?.*)?$/i.test(name)) return true;
  if (
    allowsImages &&
    /\.(png|jpe?g|webp|bmp|tiff?|gif)$/i.test(name)
  )
    return true;

  return false;
}

function toAcceptArray(accept) {
  if (Array.isArray(accept)) return accept.map((x) => String(x).toLowerCase());
  if (typeof accept === "string") {
    return accept
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }
  return ["application/pdf", "image/*"];
}

function formatBytes(bytes) {
  if (typeof bytes !== "number" || bytes < 0) return "";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/* -------------- minimal inline styles (optional) -------------- */

const dropzoneStyle = {
  border: "2px dashed rgba(0,0,0,.2)",
  borderRadius: "12px",
  padding: "18px",
  background: "var(--card-bg, #fafafa)",
};

const contentStyle = {
  display: "grid",
  gap: "6px",
  justifyItems: "center",
  textAlign: "center",
};