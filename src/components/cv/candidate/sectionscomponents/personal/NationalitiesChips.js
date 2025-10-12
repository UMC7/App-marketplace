import React, { useMemo } from 'react';

export default function NationalitiesChips({ items = [], onRemove = () => {} }) {
  const list = useMemo(
    () => Array.from(new Set((items || []).map(String))),
    [items]
  );

  if (!list.length) return null;

  return (
    <div className="cp-chips">
      {list.map((n, idx) => (
        <span key={`${n}-${idx}`} className="cp-chip cp-chip--active">
          {n}
          <button
            type="button"
            className="cp-chip-x"
            onClick={() => onRemove(n)}
            title="Remove"
          >
            ✕
          </button>
        </span>
      ))}
    </div>
  );
}