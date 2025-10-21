// src/components/cv/candidate/sectionscomponents/preferencesskills/AvailabilityPicker.js
import React from 'react';

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
}) {
  const isDateSpecific = (val) => String(val || '').startsWith('Date specific');
  const dateFromValue = (val) => {
    const m = /^Date specific:\s*(\d{4}-\d{2}-\d{2})$/.exec(String(val || ''));
    return m ? m[1] : '';
  };

  const handleSelect = (e) => {
    const next = e.target.value;
    if (onChange) onChange(next);
  };

  const handleDate = (e) => {
    const d = e.target.value;
    if (onChange) onChange(d ? `Date specific: ${d}` : 'Date specific');
  };

  const today = new Date().toISOString().slice(0, 10);
  const selectedIsDate = isDateSpecific(value);
  const dateValue = dateFromValue(value);

  return (
    <div>
      <label className="cp-label">Availability *</label>
      <select className="cp-input" value={value || ''} onChange={handleSelect}>
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