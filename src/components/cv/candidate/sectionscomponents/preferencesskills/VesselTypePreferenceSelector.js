// src/components/cv/candidate/sectionscomponents/preferencesskills/VesselTypePreferenceSelector.js
import React, { useMemo, useState } from 'react';

const VESSEL_TYPES = [
  'Motor Yacht',
  'Sailing Yacht',
  'Catamaran',
  'Support / Shadow',
  'Expedition',
  'Chase Boat',
];

const MAX = 3;

export default function VesselTypePreferenceSelector({
  value,
  onChange,
  label = 'Preferred vessel types',
}) {
  const controlled = typeof onChange === 'function';
  const [local, setLocal] = useState(Array.isArray(value) ? value : []);
  const selected = useMemo(() => (Array.isArray(value) ? value : local), [value, local]);
  const [pick, setPick] = useState('');

  const commit = (arr) => (controlled ? onChange(arr) : setLocal(arr));

  const add = () => {
    if (!pick) return;
    if (selected.length >= MAX) return;
    const set = new Set(selected);
    set.add(pick);
    commit(Array.from(set));
    setPick('');
  };

  const remove = (v) => {
    const set = new Set(selected);
    set.delete(v);
    commit(Array.from(set));
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
          {VESSEL_TYPES.map((t) => (
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
              <button className="cp-chip-x" type="button" onClick={() => remove(t)}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}