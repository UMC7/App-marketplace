import React, { useMemo } from 'react';

export default function BirthNationalityRow({
  months = [],
  years = [],
  nationalitiesOptions = [],
  birthMonth = '',
  onChangeBirthMonth,
  birthYear = '',
  onChangeBirthYear,
  natToAdd = '',
  onChangeNatToAdd,
  nationalities = [],
  onAddNationality,
  onRemoveNationality,
  ageLabel = '',
}) {
  // Evitamos keys duplicadas en el <select> de nacionalidades
  const uniqueNatOptions = useMemo(
    () => Array.from(new Set((nationalitiesOptions || []).map(String))),
    [nationalitiesOptions]
  );

  return (
    <>
      <div className="cp-row-birth-nat">
        <div>
          <label className="cp-label">Birth month</label>
          <select
            className="cp-input"
            value={birthMonth}
            onChange={(e) => onChangeBirthMonth && onChangeBirthMonth(e.target.value)}
          >
            <option value="">—</option>
            {months.map((m) => (
              <option key={m.v} value={m.v}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="cp-label">Birth year</label>
          <select
            className="cp-input"
            value={birthYear}
            onChange={(e) => onChangeBirthYear && onChangeBirthYear(e.target.value)}
          >
            <option value="">—</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="cp-label">Nationalities</label>
          <div className="cp-row-add">
            <select
              className="cp-input"
              value={natToAdd}
              onChange={(e) => onChangeNatToAdd && onChangeNatToAdd(e.target.value)}
            >
              <option value="">Select nationality…</option>
              {uniqueNatOptions.map((n, idx) => (
                <option key={`${n}-${idx}`} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <button type="button" className="cp-btn-add" onClick={onAddNationality}>
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Age auto (solo indicador) */}
      <div style={{ marginTop: 4 }}>
        <span className="cp-muted">Age (auto): {ageLabel || '—'}</span>
      </div>

      {/* Chips de nacionalidades (si hay) */}
      {Array.isArray(nationalities) && nationalities.length > 0 && (
        <div className="cp-chips">
          {nationalities.map((n, idx) => (
            <span key={`${n}-${idx}`} className="cp-chip cp-chip--active">
              {n}
              <button
                type="button"
                className="cp-chip-x"
                onClick={() => onRemoveNationality && onRemoveNationality(n)}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </>
  );
}