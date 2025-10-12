// src/components/cv/candidate/sectionscomponents/references/ReferencesEditor.jsx
import React, { useEffect, useMemo, useState } from "react";
import ReferenceForm from "./ReferenceForm";
import ReferenceCard from "./ReferenceCard";

export default function ReferencesEditor({
  value = [],
  onChange,
  max = 5,
  onUpsert,
  onDelete,
}) {
  const [items, setItems] = useState(Array.isArray(value) ? value : []);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [, setSaving] = useState(false); // setter usado en llamadas async; no necesitamos leer el estado

  // sync externo -> interno
  useEffect(() => {
    if (Array.isArray(value)) setItems(value);
  }, [value]);

  // Sync hacia el padre si se provee onChange
  const commit = (next) => {
    setItems(next);
    onChange?.(next);
  };

  const canAdd = useMemo(
    () => items.length < max && editingIndex === -1,
    [items, max, editingIndex]
  );

  const handleAdd = () => setEditingIndex(items.length);
  const handleEdit = (i) => setEditingIndex(i);
  const handleCancel = () => setEditingIndex(-1);

  const handleSave = async (refObj) => {
    let persisted = refObj;

    // Persistencia opcional (si el padre provee onUpsert)
    if (typeof onUpsert === "function") {
      try {
        setSaving(true);
        const saved = await onUpsert(refObj);
        if (saved && typeof saved === "object") persisted = saved;
      } catch {
        setSaving(false);
        return;
      } finally {
        setSaving(false);
      }
    }

    const next = [...items];
    if (editingIndex >= 0 && editingIndex < next.length) {
      next[editingIndex] = persisted;
    } else {
      next.push(persisted);
    }
    commit(next);
    setEditingIndex(-1);
  };

  const handleDelete = async (i) => {
    const target = items[i];
    if (!target) return;

    // Persistencia opcional
    if (typeof onDelete === "function" && target.id) {
      try {
        setSaving(true);
        await onDelete(target.id);
      } catch {
        setSaving(false);
        return;
      } finally {
        setSaving(false);
      }
    }

    const next = items.filter((_, idx) => idx !== i);
    commit(next);
  };

  return (
    <div className="cv-ref-editor">
      {editingIndex !== -1 ? (
        <ReferenceForm
          initialValue={items[editingIndex]}
          onCancel={handleCancel}
          onSave={handleSave}
        />
      ) : (
        <>
          <div className="list">
            {items.length === 0 && (
              <div className="empty">No references yet.</div>
            )}
            {items.map((it, i) => (
              <ReferenceCard
                key={i}
                item={it}
                onEdit={() => handleEdit(i)}
                onDelete={() => handleDelete(i)}
              />
            ))}
          </div>

          <div className="bar">
            <button className="btn primary" disabled={!canAdd} onClick={handleAdd}>
              Add reference
            </button>
          </div>
        </>
      )}

      <style>{`
        /* Contenedor seguro y sin overflow */
        .cv-ref-editor{ max-width:100%; box-sizing:border-box; }
        .cv-ref-editor .list{ display:grid; gap:12px; max-width:100%; }
        .cv-ref-editor .empty{
          border:1px dashed var(--line, #374151);
          padding:18px; text-align:center;
          color:var(--muted, #94a3b8);
          border-radius:12px;
          background: var(--card-2, #0b1220);
        }
        .cv-ref-editor .bar{
          margin-top:12px; display:flex; gap:10px; align-items:center; justify-content:flex-start;
          flex-wrap:wrap;
        }

        .btn{
          border-radius:10px; padding:10px 14px; border:1px solid var(--btn-bd, transparent);
          cursor:pointer; background:var(--btn-bg, #39797a); color:var(--btn-tx, #fff);
        }
        .btn.primary{ background:var(--accent, #39797a); color:#fff; }
        .btn.primary:disabled{ opacity:.5; cursor:not-allowed; }

        /* Desktop: 2 tarjetas por fila */
        @media (min-width:1024px){
          .cv-ref-editor .list{
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        /* Móvil: botón a ancho completo, 1 columna */
        @media (max-width:720px){
          .cv-ref-editor .bar .btn{ width:100%; }
          .cv-ref-editor .bar{ justify-content:space-between; }
        }
      `}</style>
    </div>
  );
}