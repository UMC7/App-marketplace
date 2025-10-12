// src/components/cv/candidate/sectionscomponents/preferencesskills/ProgramTypePreferenceSelector.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';

const PROGRAM_TYPES = [
  'Private','Charter','Mixed','Expedition','New build','Refit','Delivery',
];

export default function ProgramTypePreferenceSelector({
  value,                 // <- sin default
  onChange,
  label = 'Program type preference',
  max = 2,
}) {
  // Si el padre no pasa value, usamos local
  const [local, setLocal] = useState(Array.isArray(value) ? value : []);
  // Mantén local sincronizado si el padre luego pasa value
  useEffect(() => {
    if (Array.isArray(value)) setLocal(value);
  }, [value]);

  const controlled = typeof onChange === 'function' && Array.isArray(value);
  const selected   = Array.isArray(value) ? value : local;
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const onDocDown = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, []);

  const commit = (arr) => {
    if (controlled) onChange?.(arr);
    else setLocal(arr);
  };

  const toggle = (name) => {
    const set = new Set(selected);
    if (set.has(name)) set.delete(name);
    else {
      if (set.size >= max) return; // límite
      set.add(name);
    }
    commit(Array.from(set));
  };

  const count = selected.length;
  const placeholder = count > 0 ? `${count} selected` : 'Select type…';

  return (
    <div ref={wrapRef}>
      <label className="cp-label">{label}</label>

      <div style={{ position: 'relative' }}>
        <select
          className="cp-input"
          value="__placeholder"
          onChange={() => {}}
          onMouseDown={(e) => {
            e.preventDefault(); // evita menú nativo
            setOpen((v) => !v);
          }}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <option value="__placeholder">{placeholder}</option>
        </select>

        {open && (
          <div
            role="listbox"
            style={{
              position: 'absolute',
              zIndex: 20,
              top: '100%',
              left: 0,
              right: 0,
              marginTop: 4,
              background: 'var(--input-bg)',
              color: 'var(--text)',
              border: '1px solid var(--input-bd)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-soft)',
              maxHeight: 260,
              overflowY: 'auto',
              padding: 6,
            }}
          >
            {PROGRAM_TYPES.map((name) => {
              const checked = selectedSet.has(name);
              const disableNew = !checked && selected.length >= max;
              return (
                <label
                  key={name}
                  title={disableNew ? `Up to ${max} options` : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 8px',
                    cursor: disableNew ? 'not-allowed' : 'pointer',
                    opacity: disableNew ? 0.6 : 1,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disableNew}
                    onChange={() => toggle(name)}
                  />
                  <span>{name}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}