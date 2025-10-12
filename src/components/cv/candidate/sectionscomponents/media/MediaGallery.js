// src/components/cv/candidate/sectionscomponents/media/MediaGallery.js
import React, { useCallback, useEffect, useMemo, useState } from "react";

export default function MediaGallery({
  items = [],
  onRemove,
  onMove,
  onSetCover,
  columns = 3,
  readOnly = false,
}) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [current, setCurrent] = useState(0);

  const gridColsClass = useMemo(() => {
    const cols = Math.max(1, Math.min(4, columns));
    return `cols-${cols}`;
  }, [columns]);

  const openViewer = (i) => {
    setCurrent(i);
    setViewerOpen(true);
  };
  const closeViewer = () => setViewerOpen(false);

  const next = useCallback(() => {
    setCurrent((i) => (i + 1) % Math.max(1, items.length));
  }, [items.length]);
  const prev = useCallback(() => {
    setCurrent((i) => (i - 1 + Math.max(1, items.length)) % Math.max(1, items.length));
  }, [items.length]);

  // Keyboard nav when viewer open
  useEffect(() => {
    if (!viewerOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeViewer();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewerOpen, next, prev]);

  const currentItem = items[current];

  return (
    <div className="media-gallery">
      <div className={`grid ${gridColsClass}`}>
        {items.map((m, i) => {
          const canShowActions = !readOnly && (onRemove || onMove || onSetCover);
          return (
            <figure
              key={`${m.url}-${i}`}
              className="tile"
              onClick={() => openViewer(i)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && openViewer(i)}
              title={m.name || ""}
            >
              {m.type === "video" ? (
                <video src={m.url} preload="metadata" />
              ) : (
                <img src={m.url} alt={m.name || `media-${i}`} loading="lazy" />
              )}

              {/* Toolbar (desktop: arriba; móvil: abajo sin la X) */}
              {canShowActions && (
                <div className="toolbar" onClick={(e) => e.stopPropagation()}>
                  {typeof onMove === "function" && (
                    <>
                      <button
                        className="tlb-btn"
                        title="Move up"
                        aria-label="Move up"
                        onClick={() => onMove(i, -1)}
                        disabled={i === 0}
                      >
                        ↑
                      </button>
                      <button
                        className="tlb-btn"
                        title="Move down"
                        aria-label="Move down"
                        onClick={() => onMove(i, +1)}
                        disabled={i === items.length - 1}
                      >
                        ↓
                      </button>
                    </>
                  )}

                  {typeof onSetCover === "function" && i !== 0 && (
                    <button
                      className="tlb-chip"
                      title="Set as cover"
                      aria-label="Set as cover"
                      onClick={() => onSetCover(i)}
                    >
                      Set cover
                    </button>
                  )}

                  {/* Close en toolbar (solo desktop). En móvil se oculta via CSS */}
                  {typeof onRemove === "function" && (
                    <button
                      className="tlb-close"
                      title="Remove"
                      aria-label="Remove"
                      onClick={() => onRemove(i)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}

              {/* Close flotante SOLO móvil (esquina superior derecha) */}
              {typeof onRemove === "function" && (
                <button
                  className="tlb-close-top"
                  title="Remove"
                  aria-label="Remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(i);
                  }}
                >
                  ✕
                </button>
              )}

              {i === 0 && <div className="cover-badge">Cover</div>}
              {m.name && <figcaption className="caption">{m.name}</figcaption>}
            </figure>
          );
        })}
      </div>

      {/* Lightbox */}
      {viewerOpen && currentItem && (
        <div className="lightbox" onClick={closeViewer}>
          <div className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <button className="lb-close" onClick={closeViewer} title="Close">
              ✕
            </button>
            <button className="lb-nav left" onClick={prev} title="Previous">
              ‹
            </button>
            <button className="lb-nav right" onClick={next} title="Next">
              ›
            </button>

            <div className="lb-content">
              {currentItem.type === "video" ? (
                <video src={currentItem.url} controls autoPlay />
              ) : (
                <img src={currentItem.url} alt={currentItem.name || "media"} />
              )}
              {currentItem.name && <div className="lb-caption">{currentItem.name}</div>}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .media-gallery { display:flex; flex-direction:column; gap:12px; }
        .grid { display:grid; gap:12px; }
        .grid.cols-1 { grid-template-columns: 1fr; }
        .grid.cols-2 { grid-template-columns: repeat(2, minmax(0,1fr)); }
        .grid.cols-3 { grid-template-columns: repeat(3, minmax(0,1fr)); }
        .grid.cols-4 { grid-template-columns: repeat(4, minmax(0,1fr)); }

        @media (max-width: 1024px) {
          .grid.cols-4 { grid-template-columns: repeat(3, minmax(0,1fr)); }
        }
        @media (max-width: 800px) {
          .grid.cols-3, .grid.cols-4 { grid-template-columns: repeat(2, minmax(0,1fr)); }
        }
        @media (max-width: 560px) {
          .grid { grid-template-columns: 1fr !important; }
        }

        .tile {
          position:relative; border:1px solid #273042; border-radius:12px; overflow:hidden;
          background:#0f172a; cursor:pointer; display:flex; flex-direction:column;
        }
        .tile img, .tile video { width:100%; height:220px; object-fit:cover; background:#0b1220; }

        .caption {
          padding:8px 10px; font-size:.9rem; color:#cbd5e1; white-space:nowrap;
          overflow:hidden; text-overflow:ellipsis; border-top:1px solid #223047;
          background:#0b1220;
        }

        /* ===== Toolbar desktop (arriba, hover/focus) ===== */
        .toolbar {
          position:absolute; top:8px; left:8px; right:8px;
          display:flex; align-items:center; gap:8px;
          padding:4px;
          background:rgba(2, 6, 23, .35);
          border:1px solid rgba(255,255,255,.18);
          border-radius:10px;
          backdrop-filter:saturate(120%) blur(4px);
          opacity:0; transform:translateY(-6px);
          transition:opacity .15s ease, transform .15s ease;
          pointer-events:auto;
          z-index:2;
        }
        .tile:hover .toolbar, .tile:focus-within .toolbar { opacity:1; transform:none; }

        .tlb-btn {
          background:rgba(0,0,0,.55);
          color:#fff;
          border:1px solid rgba(255,255,255,.25);
          border-radius:8px;
          padding:4px 8px;
          font-size:13px;
          cursor:pointer;
        }
        .tlb-btn:disabled { opacity:.5; cursor:not-allowed; }

        .tlb-chip {
          background:rgba(20, 184, 166, .9);
          color:#0b1220;
          border:1px solid rgba(255,255,255,.25);
          border-radius:999px;
          padding:4px 10px;
          font-size:13px;
          font-weight:600;
        }

        .tlb-close {
          margin-left:auto; /* desktop: close dentro de la toolbar */
          background:rgba(0,0,0,.55);
          color:#fff;
          border:1px solid rgba(255,255,255,.25);
          border-radius:8px;
          padding:4px 8px;
          font-size:14px;
          cursor:pointer;
        }

        /* Botón de cerrar flotante (por defecto oculto; móvil lo muestra y lo hace pequeño) */
        .tlb-close-top {
          display:none;
          position:absolute; top:8px; right:8px;
          width:32px; height:32px;
          align-items:center; justify-content:center;
          background:rgba(0,0,0,.55);
          color:#fff;
          border:1px solid rgba(255,255,255,.25);
          border-radius:10px;
          font-size:16px; line-height:0;
          cursor:pointer;
          z-index:3;
        }

        .cover-badge {
          position:absolute; bottom:8px; left:8px;
          background:#1f2f2d; border:1px solid #335e5a; color:#e5e7eb;
          padding:2px 8px; border-radius:8px; font-size:.75rem;
          z-index:1;
        }

        /* ===== Ajuste SOLO móvil ===== */
        @media (hover: none), (max-width: 560px) {
          .media-gallery { padding-bottom: 88px; } /* navbar inferior safe area */

          /* Toolbar abajo y centrada, sin la X dentro */
          .toolbar {
            top:auto; bottom:10px; 
            left:8px; right:8px;
            justify-content:center;
            opacity:1; transform:none; /* siempre visible en móvil */
            padding:4px 6px;
          }
          .tlb-close { display:none; }      /* ocultar la X de la toolbar en móvil */
          .tlb-close-top { display:inline-flex; } /* mostrar X pequeña en esquina */

          .tlb-btn { padding:4px 8px; font-size:12px; }

          /* Chip -> estrella: ocultamos texto y mostramos ★ con ::before */
          .tlb-chip {
            padding:0; width:32px; height:32px;
            border-radius:10px;
            font-size:0;                 /* oculta el texto sin afectar accesibilidad */
            display:inline-flex; align-items:center; justify-content:center;
          }
          .tlb-chip::before {
            content:"★";
            font-size:16px; line-height:1; color:#0b1220;
          }

          .tile { margin-bottom: 6px; }
        }

        /* ===== Lightbox ===== */
        .lightbox {
          position:fixed; inset:0; background:rgba(0,0,0,.7);
          display:flex; align-items:center; justify-content:center; z-index:1000;
        }
        .lightbox-inner {
          position:relative; width: min(92vw, 1100px); height: min(92vh, 720px);
          background:#0b1220; border:1px solid #223047; border-radius:12px; overflow:hidden;
          display:flex; align-items:center; justify-content:center;
        }
        .lb-content {
          width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap:8px; padding:16px;
        }
        .lb-content img, .lb-content video {
          max-width:100%; max-height: calc(100% - 40px);
          object-fit:contain; background:#0b1220;
        }
        .lb-caption { color:#cbd5e1; font-size:.95rem; text-align:center; }

        .lb-close, .lb-nav {
          position:absolute; top:10px; background:rgba(0,0,0,.55); color:#fff;
          border:1px solid rgba(255,255,255,.25); border-radius:8px; cursor:pointer;
          padding:6px 10px; font-size:16px;
        }
        .lb-close { right:10px; }
        .lb-nav.left { left:10px; top:50%; transform:translateY(-50%); font-size:22px; padding:6px 12px; }
        .lb-nav.right { right:10px; top:50%; transform:translateY(-50%); font-size:22px; padding:6px 12px; }
      `}</style>
    </div>
  );
}