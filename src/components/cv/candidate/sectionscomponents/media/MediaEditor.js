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
        .me-header h3 { margin:0; color:var(--text, #1c1c1c); font-size:1.05rem; }
        .me-count { color:var(--muted, #6b7280); font-size:.9rem; }
        .me-empty { color:var(--muted-2, #6b7280); margin:6px 0 0; }

        .me-list { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:10px; }
        .me-item {
          display:grid; grid-template-columns: 120px 1fr; gap:12px;
          border:1px solid var(--line, #e2e8f0); background:var(--card, #ffffff); border-radius:12px; padding:10px;
        }
        @media (max-width: 560px) {
          .me-item { grid-template-columns: 1fr; }
        }

        .me-thumb { width:100%; height:90px; border-radius:8px; overflow:hidden; background:var(--card-2, #f8fafc); }
        .me-thumb img, .me-thumb video { width:100%; height:100%; object-fit:cover; }

        .me-body { display:flex; flex-direction:column; gap:8px; }
        .me-name {
          background:var(--input-bg, #ffffff); border:1px solid var(--input-bd, #cbd5e1); color:var(--text, #111);
          border-radius:8px; padding:8px 10px; width:100%;
        }

        .me-meta { display:flex; align-items:center; gap:8px; color:var(--muted-2, #6b7280); font-size:.9rem; }
        .badge { border:1px solid var(--line, #e2e8f0); background:var(--card-2, #f8fafc); color:var(--text, #111); padding:2px 8px; border-radius:999px; font-size:.75rem; }
        .badge.image { background:rgba(104, 173, 168, 0.18); border-color:rgba(104, 173, 168, 0.45); }
        .badge.video { background:rgba(8, 26, 59, 0.12); border-color:rgba(8, 26, 59, 0.25); }
        .badge.cover { background:rgba(104, 173, 168, 0.18); border-color:rgba(104, 173, 168, 0.45); }
        .dim { opacity:.8; }

        .me-actions { display:flex; gap:8px; flex-wrap:wrap; }
        .btn { border-radius:8px; padding:6px 10px; border:1px solid var(--btn-bd, #cbd5e1); background:var(--btn-bg, #fff); color:var(--btn-tx, #111); cursor:pointer; }
        .btn.ghost { background:transparent; color:var(--text, #111); border-color:var(--btn-bd, #cbd5e1); }
        .btn.danger { background:#7f1d1d; color:#fff; border-color:#7f1d1d; }
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
