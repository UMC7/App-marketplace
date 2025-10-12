// src/components/cv/candidate/sectionscomponents/personal/ResidenceCountryRow.jsx
import React from 'react';

/**
 * ResidenceCountryRow
 * Selector para el país de residencia permanente (no ubicación actual).
 *
 * Props:
 * - countries: string[]                  // lista de países a mostrar
 * - residenceCountry: string             // valor seleccionado
 * - onChangeResidenceCountry: (value) => void
 */
export default function ResidenceCountryRow({
  countries = [],
  residenceCountry = '',
  onChangeResidenceCountry,
}) {
  return (
    <div className="cp-row-country">
      <div>
        <label className="cp-label">Permanent residence (country)</label>
        <select
          className="cp-input"
          value={residenceCountry}
          onChange={(e) =>
            onChangeResidenceCountry && onChangeResidenceCountry(e.target.value)
          }
        >
          <option value="">Select…</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}