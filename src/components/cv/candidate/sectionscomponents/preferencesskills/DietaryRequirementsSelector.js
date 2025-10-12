// src/components/cv/candidate/sectionscomponents/preferencesskills/DietaryRequirementsSelector.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';

const DIETARY_OPTIONS = ['None', 'Vegetarian', 'Vegan', 'Gluten-free', 'Allergies'];

export default function DietaryRequirementsSelector({
  value, // <- sin default para no forzar modo controlado
  onChange,
  label = 'Dietary requirements',
}) {
  // Controlado vs local (mismo fix que en ProgramTypePreferenceSelector)
  const [local, setLocal] = useState(Array.isArray(value) ? value : []);
  useEffect(() => {
    if (Array.isArray(value)) setLocal(value);
  }, [value]);

  const controlled = typeof onChange === 'function' && Array.isArray(value);
  const selected = Array.isArray(value) ? value : local;
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  // Dropdown
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  const commit = (arr) => (controlled ? onChange?.(arr) : setLocal(arr));

  const toggle = (name) => {
    const set = new Set(selected);
    if (set.has(name)) set.delete(name);
    else set.add(name);
    commit(Array.from(set));
  };

  const count = selected.length;
  const placeholder = count > 0 ? `${count} selected` : 'Select…';

  return (
    <div ref={wrapRef}>
      <label className="cp-label">{label}</label>

      <div style={{ position: 'relative' }}>
        <select
          className="cp-input"
          value="__placeholder"
          onChange={() => {}}
          onMouseDown={(e) => {
            e.preventDefault();
            setOpen((v) => !v);
          }}
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
            {DIETARY_OPTIONS.map((name) => {
              const checked = selectedSet.has(name);
              return (
                <label
                  key={name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 8px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
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