// src/components/cv/candidate/sectionscomponents/preferencesskills/RotationPreferencePicker.js
import React, { useMemo, useState } from 'react';

const ROTATION_CYCLES = ['1:1', '2:2', '2:1', '3:1', '3:3', '4:2', '5:1', '10:10']; // removed "None"
const MAX = 2;

export default function RotationPreferencePicker({
  value,
  onChange,
  label = 'Preferred rotation cycles',
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
          {ROTATION_CYCLES.map((c) => (
            <option key={c} value={c} disabled={selected.includes(c)}>
              {c}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="cp-btn-add"
          onClick={add}
          disabled={!canAdd}
          title={selected.length >= MAX ? `Up to ${MAX} cycles` : 'Add'}
        >
          Add
        </button>
      </div>

      {selected.length > 0 && (
        <div className="cp-chips">
          {selected.map((c) => (
            <span key={c} className="cp-chip cp-chip--active">
              {c}
              <button className="cp-chip-x" type="button" onClick={() => remove(c)}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}