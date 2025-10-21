// src/components/cv/candidate/sectionscomponents/preferencesskills/StatusPicker.js
import React from 'react';

const STATUS_OPTIONS = [
  'Employed (Onboard)',
  'Between Contracts',
  'Off Rotation',
  'Shore-based Employed',
  'On Leave / Training',
  'Freelance / Daywork',
  'Seasonal Break',
  'Sabbatical / Traveling',
  'Seeking First Yacht Role',
  'Not Available',
];

export default function StatusPicker({ value, onChange, disabled = false, className = '' }) {
  const handleChange = (e) => {
    const v = e.target.value;
    if (typeof onChange === 'function') onChange(v === '' ? null : v);
  };

  return (
    <div className={className}>
      <label className="cp-label">Status *</label>
      <select
        className="cp-input"
        value={value ?? ''}
        onChange={handleChange}
        disabled={disabled}
        aria-label="Status"
      >
        <option value="">—</option>
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}