// src/components/cv/analytics/FiltersBar.jsx
import React, { useMemo } from 'react';
import { DATE_RANGE_PRESETS, getRangeByKey } from '../../../utils/analytics/dateRanges';
import { formatRangeLabel } from '../../../utils/analytics/formatters';

export default function FiltersBar({
  rangeKey = '30d',
  onChangeRangeKey,
  bucket = 'day',
  onChangeBucket,
  rangeLabel,
  onRefresh,
  rightSlot = null,
  // Cuando es true (móvil), mostramos Back junto a Refresh en una fila aparte.
  showBackInline = false,
  onBack,
}) {
  const range = useMemo(() => getRangeByKey(rangeKey), [rangeKey]);
  const label = useMemo(
    () => rangeLabel || formatRangeLabel(range.from, range.to),
    [rangeLabel, range.from, range.to]
  );

  return (
    <section aria-label="Analytics filters" className="ana-filters">
      {/* Controles (si showBackInline=false, aquí también va Refresh para desktop) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Select
          label="Date range"
          value={rangeKey}
          onChange={(e) => onChangeRangeKey?.(e.target.value)}
          options={DATE_RANGE_PRESETS.map((p) => ({ value: p.key, label: p.label }))}
        />

        <Select
          label="Bucket"
          value={bucket}
          onChange={(e) => onChangeBucket?.(e.target.value)}
          options={[
            { value: 'day', label: 'Daily' },
            { value: 'week', label: 'Weekly' },
            { value: 'month', label: 'Monthly' },
          ]}
          width={120}
        />

        <span
          aria-live="polite"
          className="ana-muted"
          style={{ fontSize: 13, paddingLeft: 6 }}
        >
          {label}
        </span>

        {/* En desktop, mantenemos Refresh en la misma fila de los selectores */}
        {!showBackInline && onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="ana-btn"
            title="Refresh data"
          >
            Refresh
          </button>
        )}
      </div>

      {/* En móvil, fila dedicada para tener Refresh y Back uno al lado del otro */}
      {showBackInline && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="ana-btn"
              title="Refresh data"
            >
              Refresh
            </button>
          )}
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="ana-btn"
              title="Go back"
            >
              Back
            </button>
          )}
        </div>
      )}

      {/* Right: acciones adicionales (opcional) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {rightSlot}
      </div>
    </section>
  );
}

/* ---------- Partials ---------- */

function Select({ label, options = [], value, onChange, width = 180 }) {
  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 13,
        color: 'var(--ana-text)',
      }}
    >
      <span className="ana-muted">{label}</span>
      <select
        value={value}
        onChange={onChange}
        className="ana-select"
        style={{ minWidth: width }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}