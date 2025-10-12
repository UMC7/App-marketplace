// src/components/cv/candidate/sectionscomponents/preferencesskills/PreferredPortsInput.js
import React, { useState } from 'react';

export default function PreferredPortsInput({
  value = [],              // array de strings
  onChange,                // fn(nextArray)
  placeholder = 'e.g., Antibes, Palma, Fort Lauderdale… (press Enter to add)',
  addLabel = 'Add',
}) {
  const [text, setText] = useState('');

  const addItem = () => {
    const t = text.trim();
    if (!t) return;
    const next = Array.from(new Set([...(value || []), t]));
    onChange && onChange(next);
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addItem();
    }
  };

  const remove = (item) => {
    const next = (value || []).filter((v) => v !== item);
    onChange && onChange(next);
  };

  return (
    <div>
      <label className="cp-label">Preferred ports / regions</label>
      <div className="cp-row">
        <input
          className="cp-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
        <button type="button" className="cp-btn-add" onClick={addItem}>{addLabel}</button>
      </div>

      {(value?.length ?? 0) > 0 && (
        <>
          <div className="cp-help" style={{ marginTop: 6 }}>
            Press the “×” to remove an item.
          </div>
          <div className="cp-chips" style={{ marginTop: 6 }}>
            {value.map((v) => (
              <span key={v} className="cp-chip cp-chip--active">
                {v}
                <button className="cp-chip-x" type="button" onClick={() => remove(v)} aria-label={`Remove ${v}`}>
                  ×
                </button>
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}