// src/components/cv/candidate/sectionscomponents/preferencesskills/VesselSizeRangeSelector.jsx
import React, { useMemo, useState } from 'react';

const VESSEL_SIZE_RANGES = ['0 - 30m', '31 - 40m', '41 - 50m', '51 - 70m', '71 - 100m', '>100m'];
const MAX = 2;

export default function VesselSizeRangeSelector({
  value,
  onChange,
  label = 'Desired LOA range',
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
          {VESSEL_SIZE_RANGES.map((r) => (
            <option key={r} value={r} disabled={selected.includes(r)}>
              {r}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="cp-btn-add"
          onClick={add}
          disabled={!canAdd}
          title={selected.length >= MAX ? `Up to ${MAX} ranges` : 'Add'}
        >
          Add
        </button>
      </div>

      {selected.length > 0 && (
        <div className="cp-chips">
          {selected.map((r) => (
            <span key={r} className="cp-chip cp-chip--active">
              {r}
              <button className="cp-chip-x" type="button" onClick={() => remove(r)}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}