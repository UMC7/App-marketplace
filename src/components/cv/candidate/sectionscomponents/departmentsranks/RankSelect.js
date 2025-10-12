// src/components/cv/candidate/sectionscomponents/departmentsranks/RankSelect.jsx
import React, { useMemo } from "react";
import { getRanksForDept } from "../../shared/rankData";

/**
 * RankSelect
 * Reusable select for choosing a rank given a department.
 *
 * Props:
 * - department: string      // determines available ranks
 * - value: string
 * - onChange: (rank: string) => void
 * - label?: string          // default "Primary rank"
 * - placeholder?: string    // default "Select…"
 * - disabled?: boolean
 * - className?, style?, id?, name?
 */
export default function RankSelect({
  department,
  value,
  onChange,
  label = "Primary rank",
  placeholder = "Select…",
  disabled = false,
  className = "",
  style,
  id,
  name,
}) {
  const ranks = useMemo(() => getRanksForDept(department), [department]);
  const isDisabled = disabled || !department;

  return (
    <div className={className} style={style}>
      {label && <label className="cp-label" htmlFor={id}>{label}</label>}
      <select
        id={id}
        name={name}
        className="cp-input"
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={isDisabled}
      >
        <option value="">{placeholder}</option>
        {ranks.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
    </div>
  );
}