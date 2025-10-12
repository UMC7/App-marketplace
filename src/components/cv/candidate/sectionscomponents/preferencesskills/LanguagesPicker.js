// src/components/cv/candidate/sectionscomponents/preferencesskills/LanguagesPicker.js
import React, { useMemo, useState } from 'react';

const SUGGESTED = [
  'English',
  'Spanish',
  'French',
  'Italian',
  'German',
  'Portuguese',
  'Dutch',
  'Russian',
  'Arabic',
  'Chinese',
  'Japanese',
];

export default function LanguagesPicker({
  value,               // array de strings (controlado)
  onChange,            // (nextArr) => void
  suggested = SUGGESTED,
  label = 'Languages',
}) {
  const controlled = typeof onChange === 'function';
  const [local, setLocal] = useState(Array.isArray(value) ? value : []);
  const selected = useMemo(() => (Array.isArray(value) ? value : local), [value, local]);

  const [pick, setPick] = useState('');
  const [custom, setCustom] = useState('');

  const commit = (arr) => (controlled ? onChange(arr) : setLocal(arr));

  const addPick = () => {
    if (!pick) return;
    const set = new Set(selected);
    set.add(pick);
    commit(Array.from(set));
    setPick('');
  };

  const addCustom = () => {
    const t = capitalize(custom.trim());
    if (!t) return;
    const set = new Set(selected);
    set.add(t);
    commit(Array.from(set));
    setCustom('');
  };

  const remove = (lang) => {
    const set = new Set(selected);
    set.delete(lang);
    commit(Array.from(set));
  };

  const onCustomKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustom();
    }
  };

  return (
    <div>
      <label className="cp-label">{label}</label>

      {/* Fila 1: Select + Add */}
      <div className="cp-row-exp-c__regions" style={{ marginBottom: 6 }}>
        <select
          className="cp-input"
          value={pick}
          onChange={(e) => setPick(e.target.value)}
        >
          <option value="">Select…</option>
          {suggested.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
        <button type="button" className="cp-btn-add" onClick={addPick}>
          Add
        </button>
      </div>

      {/* Fila 2 (opcional): Custom input + Add */}
      <div className="cp-row-exp-c__regions" style={{ marginBottom: 6 }}>
        <input
          className="cp-input"
          placeholder="Add custom language…"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={onCustomKeyDown}
        />
        <button type="button" className="cp-btn-add" onClick={addCustom}>
          Add
        </button>
      </div>

      {/* Chips seleccionados */}
      {selected.length > 0 && (
        <div className="cp-chips">
          {selected.map((lang) => (
            <span key={lang} className="cp-chip cp-chip--active">
              {lang}
              <button
                type="button"
                className="cp-chip-x"
                onClick={() => remove(lang)}
                title="Remove"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function capitalize(s) {
  return s
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ''))
    .join(' ')
    .trim();
}