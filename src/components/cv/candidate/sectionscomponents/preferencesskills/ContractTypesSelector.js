// src/components/cv/candidate/sectionscomponents/preferencesskills/ContractTypesSelector.js
import React, { useState } from 'react';

const CONTRACT_TYPES = [
  'Any',
  'Permanent',
  'Rotational',
  'Seasonal',
  'Temporary',
  'Relief',
  'Daywork',
];

const MAX = 2;

export default function ContractTypesSelector({
  value,
  onChange,
  label = 'Accepted contract types',
}) {
  const selected = Array.isArray(value) ? value : [];
  const [pick, setPick] = useState('');

  const add = () => {
    if (!pick) return;
    if (selected.length >= MAX) return; // respeta el límite
    const set = new Set(selected);
    set.add(pick);
    onChange && onChange(Array.from(set));
    setPick('');
  };

  const remove = (v) => {
    const set = new Set(selected);
    set.delete(v);
    onChange && onChange(Array.from(set));
  };

  const canAdd = !!pick && selected.length < MAX && !selected.includes(pick);

  return (
    <div>
      <label className="cp-label">{label}</label>

      <div className="cp-row-exp-c__regions" style={{ marginBottom: 6 }}>
        <select
          className="cp-input"
          value={pick}
          onChange={(e) => setPick(e.target.value)}
        >
          <option value="">Select…</option>
          {CONTRACT_TYPES.map((t) => (
            <option key={t} value={t} disabled={selected.includes(t)}>
              {t}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="cp-btn-add"
          onClick={add}
          disabled={!canAdd}
          title={selected.length >= MAX ? `Up to ${MAX} types` : 'Add'}
        >
          Add
        </button>
      </div>

      {selected.length > 0 && (
        <div className="cp-chips">
          {selected.map((t) => (
            <span key={t} className="cp-chip cp-chip--active">
              {t}
              <button
                type="button"
                className="cp-chip-x"
                onClick={() => remove(t)}
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