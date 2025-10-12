// src/components/cv/candidate/sectionscomponents/preferencesskills/RegionsSeasonsPicker.jsx
import React, { useMemo, useState } from 'react';

// Regiones ordenadas alfabéticamente (sin “seasons”)
const REGIONS = [
  'Antarctic',
  'Arctic',
  'Atlantic',
  'Australia',
  'Bahamas',
  'Baltic',
  'Caribbean',
  'Central America',
  'Indian Ocean',
  'Mediterranean',
  'Middle East',
  'New Zealand',
  'North Sea',
  'Pacific',
  'Red Sea',
  'South America',
  'South Pacific',
  'Southeast Asia',
  'US East Coast',
  'US West Coast',
  'Worldwide',
];

const MAX = 3;

export default function RegionsSeasonsPicker({
  value,
  onChange,
  label = 'Preferred regions',
}) {
  const controlled = typeof onChange === 'function';
  const [local, setLocal] = useState(Array.isArray(value) ? value : []);
  const selected = useMemo(() => (Array.isArray(value) ? value : local), [value, local]);
  const [pick, setPick] = useState('');

  const commit = (arr) => (controlled ? onChange(arr) : setLocal(arr));

  const add = () => {
    if (!pick) return;
    const set = new Set(selected);
    if (set.size >= MAX) return; // límite
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
          {REGIONS.map((r) => (
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
          title={selected.length >= MAX ? `Up to ${MAX} regions` : undefined}
        >
          Add
        </button>
      </div>

      {selected.length > 0 && (
        <div className="cp-chips">
          {selected.map((r) => (
            <span key={r} className="cp-chip cp-chip--active">
              {r}
              <button
                className="cp-chip-x"
                type="button"
                onClick={() => remove(r)}
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