// src/components/cv/candidate/sectionscomponents/preferencesskills/RegionsSeasonsPicker.jsx
import React, { useMemo, useState } from 'react';

// Regiones ordenadas alfabéticamente (sin “seasons”)
const REGIONS = [
  'Any',
  'Antarctic',
  'Arctic',
  'Atlantic',
  'Australia',
  'Bahamas',
  'Baltic',
  'Caribbean',
  'Central America',
  'Europe',
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
const ANY_REGION = 'Any';

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
    if (pick === ANY_REGION) {
      commit([ANY_REGION]);
      setPick('');
      return;
    }
    const set = new Set(selected);
    set.delete(ANY_REGION);
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

  const hasAnySelected = selected.includes(ANY_REGION);
  const canAdd =
    !!pick &&
    !selected.includes(pick) &&
    ((pick === ANY_REGION && selected.length === 0) ||
      (pick !== ANY_REGION && !hasAnySelected && selected.length < MAX));

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
            <option
              key={r}
              value={r}
              disabled={
                selected.includes(r) ||
                (hasAnySelected && r !== ANY_REGION) ||
                (!hasAnySelected && selected.length > 0 && r === ANY_REGION)
              }
            >
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
