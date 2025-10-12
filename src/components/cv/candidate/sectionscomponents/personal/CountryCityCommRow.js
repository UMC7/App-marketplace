// src/components/cv/candidate/sectionscomponents/personal/CountryCityCommRow.jsx
import React from 'react';

export default function CountryCityCommRow({
  countries = [],
  country = '',
  onChangeCountry,
  cityPort = '',
  onChangeCityPort,
  commPrefs = [],
  commPref = '',
  onChangeCommPref,
}) {
  return (
    <div className="cp-row-country">
      <div>
        <label className="cp-label">Country</label>
        <select
          className="cp-input"
          value={country}
          onChange={(e) => onChangeCountry && onChangeCountry(e.target.value)}
        >
          <option value="">Select…</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="cp-label">City / Port</label>
        <input
          className="cp-input"
          value={cityPort}
          onChange={(e) => onChangeCityPort && onChangeCityPort(e.target.value)}
          placeholder="Palma de Mallorca"
        />
      </div>

      <div>
        <label className="cp-label">Communication preference</label>
        <select
          className="cp-input"
          value={commPref}
          onChange={(e) => onChangeCommPref && onChangeCommPref(e.target.value)}
        >
          <option value="">—</option>
          {commPrefs.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}