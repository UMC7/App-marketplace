// src/components/cv/candidate/sectionscomponents/documents/documentssectioncontroller/docmanager/DocUploadDropzone.js
import React, { useCallback, useMemo, useRef, useState } from "react";
// Auto-extraction removed (manual entry only)

export default function DocUploadDropzone({
  onAdd,
  accept = [
    "application/pdf",
    "image/*",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
  ],
  maxFiles = 10,
  maxSizeBytes = 10 * 1024 * 1024,
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
          const id = `tmp-${Date.now().toString(36)}-${Math.random()
            .toString(36)
            .slice(2, 6)}`;

          const doc = {
            id,
            title: "",
            originalTitle: f.name || undefined,
            issuedOn: "",
            expiresOn: null,
            visibility: "",
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
    [onAdd, maxFiles, maxSizeBytes, acceptSet]
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
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptText}
          onChange={onInputChange}
          multiple
          hidden
        />
        <div className="doc-dropzone__content">
          <div className="doc-dropzone__title">Upload files</div>
          <div className="doc-dropzone__subtitle">Drop here or browse</div>
          <button type="button" className="btn" onClick={handleBrowse} disabled={busy}>
            Browse files
          </button>
          <div className="doc-dropzone__hint">
            PDF, images, Word • Max {formatBytes(maxSizeBytes)} • Up to {maxFiles} files
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

function isAcceptedFile(file, acceptArr) {
  if (!acceptArr || acceptArr.length === 0) return true;
  const type = String(file.type || "").toLowerCase();
  const name = String(file.name || "").toLowerCase();

  if (type) {
    const okByMime = acceptArr.some((pat) => {
      if (pat.endsWith("/*")) return type.startsWith(pat.slice(0, -2));
      return type === pat;
    });
    if (okByMime) return true;
  }

  const allowsPdf = acceptArr.includes("application/pdf");
  const allowsImages =
    acceptArr.includes("image/*") || acceptArr.some((p) => p.startsWith("image/"));
  const allowsWord =
    acceptArr.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document") ||
    acceptArr.includes("application/msword");

  if (allowsPdf && /\.pdf(\?.*)?$/i.test(name)) return true;
  if (allowsImages && /\.(png|jpe?g|webp|bmp|tiff?|gif)$/i.test(name)) return true;
  if (allowsWord && /\.(docx?|dotx?)$/i.test(name)) return true;

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


