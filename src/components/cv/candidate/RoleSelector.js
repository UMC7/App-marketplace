import React from 'react';
import formConfig from './formConfig';

export default function RoleSelector({ value, onChange }) {
  const roles = Object.keys(formConfig.roles);

  return (
    <div>
      <label className="cp-label">Primary department / role</label>
      <select
        className="cp-input"
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
      >
        <option value="">Select…</option>
        {roles.map((r) => (
          <option key={r} value={r}>{formConfig.roles[r].label}</option>
        ))}
      </select>
      <p className="cp-muted" style={{ marginTop: 6 }}>
        We’ll tailor fields based on your department.
      </p>
    </div>
  );
}