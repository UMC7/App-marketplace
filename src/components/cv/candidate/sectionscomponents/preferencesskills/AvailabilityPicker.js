// src/components/cv/candidate/sectionscomponents/preferencesskills/AvailabilityPicker.js
import React from 'react';
import { parseAvailability } from '../../../../../utils/availability';

const DEFAULT_OPTIONS = [
  'Available now',
  'In 1 week',
  'In 2 weeks',
  'In 1 month',
  'Notice period: 1 month',
  'Date specific',
];

export default function AvailabilityPicker({
  value = '',
  onChange,
  options = DEFAULT_OPTIONS,
  showRequiredMark = true,
}) {
  const handleSelect = (e) => {
    const next = e.target.value;
    if (onChange) onChange(next);
  };

  const handleDate = (e) => {
    const d = e.target.value;
    if (onChange) onChange(d ? `Date specific: ${d}` : 'Date specific');
  };

  const today = new Date().toISOString().slice(0, 10);
  const parsed = parseAvailability(value);
  const selectedIsDate = parsed.isDateSpecific;
  const dateValue = parsed.date;

  return (
    <div>
      <label className="cp-label">Availability {showRequiredMark ? '*' : ''}</label>
      <select className="cp-input" value={selectedIsDate ? 'Date specific' : (value || '')} onChange={handleSelect}>
        <option value="">—</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>

      {selectedIsDate && (
        <div style={{ marginTop: 8 }}>
          <input
            type="date"
            className="cp-input"
            min={today}
            value={dateValue}
            onChange={handleDate}
          />
        </div>
      )}
    </div>
  );
}
