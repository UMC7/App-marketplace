// src/components/cv/candidate/sectionscomponents/media/MediaUploader.js
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

export default function MediaUploader({
  value = [],
  onChange,
  onUpload,
  max = 9,
  accept = "image/*,video/*",
  showGrid = true,
}) {
  const [items, setItems] = useState(Array.isArray(value) ? value : []);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef(null);
  const dropRef = useRef(null);

  // Mantener sincronía con el valor controlado del padre
  useEffect(() => {
    if (Array.isArray(value)) setItems(value);
  }, [value]);

  const countVideos = (arr) => (arr || []).filter((m) => m?.type === "video").length;
  const hasVideo = countVideos(items) > 0;

  const remaining = Math.max(0, max - items.length);
  const canAddMore = remaining > 0;

  const commit = (next) => {
    setItems(next);
    onChange?.(next);
  };

  const inferType = (file) => {
    const mt = file?.type || "";
    if (mt.startsWith("image/")) return "image";
    if (mt.startsWith("video/")) return "video";
    const lower = (file?.name || "").toLowerCase();
    if (/\.(png|jpe?g|webp|gif|bmp|tiff|heic|avif)$/.test(lower)) return "image";
    if (/\.(mp4|webm|mov|m4v|avi|mkv)$/.test(lower)) return "video";
    return "image";
  };

  const toPreviewURL = (file) => URL.createObjectURL(file);

  const addFiles = useCallback(
    async (filesList) => {
      if (!filesList?.length || typeof onUpload !== "function") return;

      const MAX_TOTAL = max;
      const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB

      let nextErr = "";
      const alreadyHasVideo = countVideos(items) > 0;
      let videoTaken = alreadyHasVideo ? 1 : 0;

      const incoming = Array.from(filesList);
      const allowed = [];
      for (let i = 0; i < incoming.length; i++) {
        // Respetar el máximo total
        if (items.length + allowed.length >= MAX_TOTAL) break;

        const f = incoming[i];
        const kind = inferType(f);

        if (kind === "video") {
          if (videoTaken >= 1) {
            nextErr = nextErr || "Only one video is allowed.";
            continue;
          }
          if (Number.isFinite(f.size) && f.size > MAX_VIDEO_BYTES) {
            nextErr = nextErr || "Video exceeds the 50 MB limit.";
            continue;
          }
          videoTaken = 1;
        }

        allowed.push(f);
      }

      if (allowed.length === 0) {
        if (nextErr) setErr(nextErr);
        return;
      }

      setBusy(true);
      setErr(nextErr || "");

      // Pre-append con previews optimistas
      const tempItems = [...items];
      const tempMap = new Map();
      allowed.forEach((f, idx) => {
        const kind = inferType(f);
        const previewUrl = toPreviewURL(f);
        const temp = {
          url: previewUrl,
          type: kind,
          name: f.name,
          size: f.size,
          __local__: true,
          __uploading__: true,
        };
        tempItems.push(temp);
        tempMap.set(`${f.name}#${idx}`, tempItems.length - 1);
      });
      commit(tempItems);

      try {
        for (let i = 0; i < allowed.length; i++) {
          const f = allowed[i];
          const key = `${f.name}#${i}`;
          const idx = tempMap.get(key);
          if (idx == null) continue;

          let result = await onUpload(f);
          let uploaded = {};
          if (typeof result === "string") {
            uploaded.url = result;
          } else if (result && typeof result === "object") {
            uploaded = { ...result };
          }
          if (!uploaded.url) throw new Error("Upload handler did not return a URL.");

          if (!uploaded.type) uploaded.type = inferType(f);
          if (!uploaded.name) uploaded.name = f.name;
          if (uploaded.size == null) uploaded.size = f.size;

          const next = [...tempItems];
          next[idx] = {
            ...next[idx],
            ...uploaded,
            __local__: false,
            __uploading__: false,
          };
          tempItems[idx] = next[idx];
          commit(next);
        }
      } catch (e) {
        setErr(e?.message || "Some files could not be uploaded.");
        const cleaned = tempItems.map((it) =>
          it.__uploading__ ? { ...it, __error__: true, __uploading__: false } : it
        );
        commit(cleaned);
      } finally {
        setBusy(false);
        // Liberar blobs locales
        tempItems.forEach((it) => {
          if (it.__local__ && it.url?.startsWith("blob:")) {
            try {
              URL.revokeObjectURL(it.url);
            } catch {}
          }
        });
      }
    },
    [items, onUpload, max]
  );

  const handleFileInput = (ev) => {
    const chosen = ev.target.files;
    ev.target.value = "";
    addFiles(chosen);
  };

  const handleDrop = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    dropRef.current?.classList.remove("drag-over");
    addFiles(ev.dataTransfer.files);
  };

  const handleDragOver = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    dropRef.current?.classList.add("drag-over");
  };

  const handleDragLeave = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    dropRef.current?.classList.remove("drag-over");
  };

  const handleRemove = (i) => {
    const next = items.filter((_, idx) => idx !== i);
    commit(next);
  };

  const gridItems = useMemo(() => items || [], [items]);

  return (
    <div className="media-uploader">
      <div className="header">
        <div className="count">
          {items.length}/{max} • max 1 video
        </div>
      </div>

      {/* Zona de subida */}
      <div
        ref={dropRef}
        className={`dropzone ${!canAddMore ? "disabled" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !busy && canAddMore && fileRef.current?.click()}
        role="button"
        tabIndex={0}
        title={
          !canAddMore
            ? "Maximum number of media reached"
            : hasVideo
            ? "You can add up to 8 images (1 video already added)"
            : undefined
        }
      >
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          multiple
          style={{ display: "none" }}
          onChange={handleFileInput}
          disabled={!canAddMore || busy}
        />
        <div className="dz-text">
          <div className="dz-cta">
            {busy ? "Uploading..." : "Drag & drop files here"}
          </div>
          <div className="dz-sub">or click to browse • up to {remaining} more</div>
        </div>
      </div>

      {/* Grilla interna opcional */}
      {showGrid && (
        <div className="grid">
          {gridItems.map((m, i) => (
            <figure
              key={`${m.url}-${i}`}
              className={`tile ${m.__uploading__ ? "uploading" : ""} ${m.__error__ ? "error" : ""}`}
            >
              <button
                className="remove"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(i);
                }}
                title="Remove"
              >
                ✕
              </button>

              {m.type === "video" ? (
                <video src={m.url} controls preload="metadata" />
              ) : (
                <img src={m.url} alt={m.name || `media-${i}`} loading="lazy" />
              )}

              {/* Overlay con spinner mientras sube */}
              {m.__uploading__ && (
                <div className="overlay">
                  <div className="spinner" aria-label="Uploading" />
                </div>
              )}

              <figcaption className="caption" title={m.name || ""}>
                {m.name || ""}
              </figcaption>

              {m.__error__ && <div className="badge error">Failed</div>}
            </figure>
          ))}
        </div>
      )}

      {err && <div className="error">{err}</div>}

      <style>{`
        .media-uploader { display:flex; flex-direction:column; gap:12px; }
        .header { display:flex; align-items:center; justify-content:space-between; }
        .count { color:var(--muted-2); font-size:.9rem; }

        .dropzone {
          border:2px dashed var(--line); 
          border-radius:12px; 
          padding:18px;
          display:flex; 
          align-items:center; 
          justify-content:center; 
          text-align:center;
          color:var(--muted);
          cursor:pointer; 
          background:var(--card);
          transition:background .2s ease, border-color .2s ease;
        }
        .dropzone.disabled { opacity:.5; cursor:not-allowed; }
        .dropzone.drag-over { border-color:var(--accent); background:var(--card-2); }
        .dz-cta { color:var(--text); font-weight:500; }
        .dz-sub { color:var(--muted-2); font-size:.9rem; margin-top:2px; }

        .grid {
          display:grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap:12px;
        }
        @media (max-width: 900px) {
          .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 600px) {
          .grid { grid-template-columns: 1fr; }
        }

        .tile {
          position:relative; 
          border:1px solid var(--line); 
          border-radius:12px; 
          overflow:hidden;
          background:var(--card); 
          display:flex; 
          flex-direction:column;
          transition:background .2s ease, border-color .2s ease;
        }
        .tile img, .tile video { 
          width:100%; 
          height:220px; 
          object-fit:cover; 
          background:var(--card-2); 
        }
        .caption {
          padding:8px 10px; 
          font-size:.9rem; 
          color:var(--text); 
          white-space:nowrap;
          overflow:hidden; 
          text-overflow:ellipsis; 
          border-top:1px solid var(--line);
          background:var(--card-2);
        }
        .remove {
          position:absolute; 
          top:8px; 
          right:8px; 
          background:var(--btn-bg);
          color:var(--btn-tx); 
          border:1px solid var(--btn-bd); 
          border-radius:8px;
          padding:2px 8px; 
          font-size:14px; 
          cursor:pointer;
          z-index:3;
        }
        .badge {
          position:absolute; 
          top:8px; 
          left:8px; 
          background:var(--btn-bg); 
          color:var(--btn-tx);
          padding:2px 8px; 
          border-radius:8px; 
          font-size:12px; 
          border:1px solid var(--btn-bd);
          z-index:3;
        }
        .badge.error { background:#7f1d1d; border-color:#9f1239; color:#fff; }

        /* Overlay + spinner durante subida */
        .overlay {
          position:absolute;
          inset:0;
          background:rgba(0,0,0,.4);
          display:flex;
          align-items:center;
          justify-content:center;
          z-index:2;
        }
        .spinner {
          width:32px;
          height:32px;
          border:3px solid rgba(255,255,255,.35);
          border-top-color:#fff;
          border-radius:50%;
          animation:spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error { color:#f87171; font-size:.9rem; }
      `}</style>
    </div>
  );
}