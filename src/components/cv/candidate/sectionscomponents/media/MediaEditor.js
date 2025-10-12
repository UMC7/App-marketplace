// src/components/cv/candidate/sectionscomponents/media/MediaEditor.js
import React, { useMemo } from "react";

/**
 * MediaEditor
 * Editor simple para gestionar la lista de media:
 * - Renombrar (name)
 * - Reordenar (mover arriba/abajo)
 * - Establecer portada (opcional): mueve el ítem al índice 0
 * - Eliminar
 *
 * Props:
 * - items: Array<MediaItem>
 *   MediaItem = { url: string, type: "image" | "video", name?: string, size?: number }
 * - onChange: (next: MediaItem[]) => void
 * - title?: string (default "Manage media")
 * - showSetCover?: boolean (default true)
 */
export default function MediaEditor({
  items = [],
  onChange,
  title = "Manage media",
  showSetCover = true,
}) {
  const list = useMemo(() => Array.isArray(items) ? items : [], [items]);

  const commit = (next) => onChange?.(next);

  const move = (index, dir) => {
    const next = [...list];
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= next.length) return;
    const [itm] = next.splice(index, 1);
    next.splice(newIndex, 0, itm);
    commit(next);
  };

  const removeAt = (index) => {
    const next = list.filter((_, i) => i !== index);
    commit(next);
  };

  const renameAt = (index, name) => {
    const next = [...list];
    next[index] = { ...next[index], name };
    commit(next);
  };

  const setAsCover = (index) => {
    if (!showSetCover || index === 0) return;
    const next = [...list];
    const [itm] = next.splice(index, 1);
    next.unshift(itm);
    commit(next);
  };

  return (
    <div className="media-editor">
      <div className="me-header">
        <h3>{title}</h3>
        <span className="me-count">{list.length}</span>
      </div>

      {list.length === 0 ? (
        <p className="me-empty">No media yet.</p>
      ) : (
        <ul className="me-list">
          {list.map((m, i) => (
            <li key={`${m.url}-${i}`} className="me-item">
              <div className="me-thumb">
                {m.type === "video" ? (
                  <video src={m.url} preload="metadata" />
                ) : (
                  <img src={m.url} alt={m.name || `media-${i}`} />
                )}
              </div>

              <div className="me-body">
                <input
                  className="me-name"
                  type="text"
                  value={m.name || ""}
                  onChange={(e) => renameAt(i, e.target.value)}
                  placeholder={m.type === "video" ? "Video name" : "Image name"}
                />

                <div className="me-meta">
                  <span className={`badge ${m.type}`}>{m.type}</span>
                  {i === 0 && <span className="badge cover">Cover</span>}
                  {m.size != null && (
                    <span className="dim">{formatSize(m.size)}</span>
                  )}
                </div>

                <div className="me-actions">
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => move(i, +1)}
                    disabled={i === list.length - 1}
                    title="Move down"
                  >
                    ↓
                  </button>
                  {showSetCover && i !== 0 && (
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => setAsCover(i)}
                      title="Set as cover (move to top)"
                    >
                      Set cover
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn danger"
                    onClick={() => removeAt(i)}
                    title="Remove"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <style>{`
        .media-editor { display:flex; flex-direction:column; gap:12px; }
        .me-header { display:flex; align-items:center; gap:8px; }
        .me-header h3 { margin:0; color:#e5e7eb; font-size:1.05rem; }
        .me-count { color:#94a3b8; font-size:.9rem; }
        .me-empty { color:#9ca3af; margin:6px 0 0; }

        .me-list { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:10px; }
        .me-item {
          display:grid; grid-template-columns: 120px 1fr; gap:12px;
          border:1px solid #273042; background:#0f172a; border-radius:12px; padding:10px;
        }
        @media (max-width: 560px) {
          .me-item { grid-template-columns: 1fr; }
        }

        .me-thumb { width:100%; height:90px; border-radius:8px; overflow:hidden; background:#0b1220; }
        .me-thumb img, .me-thumb video { width:100%; height:100%; object-fit:cover; }

        .me-body { display:flex; flex-direction:column; gap:8px; }
        .me-name {
          background:#1f2937; border:1px solid #374151; color:#e5e7eb;
          border-radius:8px; padding:8px 10px; width:100%;
        }

        .me-meta { display:flex; align-items:center; gap:8px; color:#9ca3af; font-size:.9rem; }
        .badge { border:1px solid #374151; background:#1f2937; color:#e5e7eb; padding:2px 8px; border-radius:999px; font-size:.75rem; }
        .badge.image { background:#14323a; border-color:#285b66; }
        .badge.video { background:#2a1b2b; border-color:#5b2f66; }
        .badge.cover { background:#1f2f2d; border-color:#335e5a; }
        .dim { opacity:.8; }

        .me-actions { display:flex; gap:8px; flex-wrap:wrap; }
        .btn { border-radius:8px; padding:6px 10px; border:1px solid transparent; cursor:pointer; }
        .btn.ghost { background:transparent; color:#e5e7eb; border-color:#4b5563; }
        .btn.danger { background:#7f1d1d; color:#fff; }
      `}</style>
    </div>
  );
}

function formatSize(bytes) {
  if (typeof bytes !== "number" || !isFinite(bytes)) return "";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}