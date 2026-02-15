// src/components/cv/candidate/sectionscomponents/references/ReferencesEditor.js
import React, { useEffect, useMemo, useState } from "react";
import ReferenceForm from "./ReferenceForm";
import ReferenceCard from "./ReferenceCard";

export default function ReferencesEditor({
  value = [],
  onChange,
  max = 5,
  onUpsert,
  onDelete,
  showRequiredMark = true,
  mode = 'professional',
  readOnly = false,
}) {
  const [items, setItems] = useState(Array.isArray(value) ? value : []);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [, setSaving] = useState(false);

  useEffect(() => {
    if (Array.isArray(value)) setItems(value);
  }, [value]);

  const commit = (next) => {
    setItems(next);
    onChange?.(next);
  };

  const canAdd = useMemo(
    () => !readOnly && items.length < max && editingIndex === -1,
    [items, max, editingIndex, readOnly]
  );

  const handleAdd = () => {
    if (readOnly) return;
    setEditingIndex(items.length);
  };
  const handleEdit = (i) => {
    if (readOnly) return;
    setEditingIndex(i);
  };
  const handleCancel = () => setEditingIndex(-1);

  const handleSave = async (refObj) => {
    if (readOnly) return;
    let persisted = refObj;

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
    if (readOnly) return;
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
      {!readOnly && editingIndex !== -1 ? (
        <ReferenceForm
          initialValue={items[editingIndex]}
          onCancel={handleCancel}
          onSave={handleSave}
          showRequiredMark={showRequiredMark}
        />
      ) : (
        <>
          <div className="cp-actions" style={{ marginBottom: 8 }}>
            <button className="btn primary" disabled={!canAdd} onClick={handleAdd}>
              Add reference
            </button>
            {mode === 'lite' && (
              <span className="cp-muted" style={{ marginLeft: 10 }}>
                Min 1 reference
              </span>
            )}
          </div>

          <div className="list">
            {items.length === 0 && (
              <div className={`empty ${mode === 'lite' ? 'cp-missing-input' : ''}`}>No references yet.</div>
            )}
            {items.map((it, i) => (
              <ReferenceCard
                key={i}
                item={it}
                onEdit={readOnly ? undefined : () => handleEdit(i)}
                onDelete={readOnly ? undefined : () => handleDelete(i)}
              />
            ))}
          </div>
        </>
      )}

      <style>{`
        /* Contenedor seguro y sin overflow */
        .cv-ref-editor{ max-width:100%; box-sizing:border-box; }
        .cv-ref-editor .list{ display:grid; gap:12px; max-width:100%; }

        /* Estado vacío: usa tokens para respetar light/dark */
        .cv-ref-editor .empty{
          border:1px dashed var(--line);
          padding:18px; text-align:center;
          color:var(--muted);
          border-radius:12px;
          background: linear-gradient(180deg, var(--card), var(--card-2));
          width: 100%;
          box-sizing: border-box;
          grid-column: 1 / -1;
        }

        /* Botones: heredan tokens del contenedor (light/dark) */
        .btn{
          border-radius:10px; padding:10px 14px;
          background: var(--btn-bg);
          color: var(--btn-tx);
          border: 1px solid var(--btn-bd);
          cursor:pointer;
          transition: border-color .15s ease, box-shadow .15s ease, background-color .15s ease, transform .05s ease;
        }
        .btn:hover{ border-color: var(--accent-2); box-shadow: var(--focus); }
        .btn:active{ transform: translateY(1px); }

        .btn.primary{
          background: var(--accent);
          color: #fff;
          border-color: var(--accent);
        }
        .btn.primary:disabled{ opacity:.5; cursor:not-allowed; }

        /* Desktop: 2 tarjetas por fila */
        @media (min-width:1024px){
          .cv-ref-editor .list{
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

      `}</style>
    </div>
  );
}
