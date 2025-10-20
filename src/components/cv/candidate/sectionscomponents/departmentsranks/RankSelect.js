// src/components/cv/candidate/sectionscomponents/departmentsranks/RankSelect.jsx
import React, { useMemo } from "react";
import { getRanksForDept } from "../../shared/rankData";

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
  // Opcional: permite forzar el asterisco desde el padre
  required,
}) {
  const ranks = useMemo(() => getRanksForDept(department), [department]);
  const isDisabled = disabled || !department;

  // Si no se pasó "required", inferimos para "Primary rank"
  const isRequired =
    typeof required === "boolean"
      ? required
      : (label && /primary\s+rank/i.test(label));

  return (
    <div className={className} style={style}>
      {label && (
        <label className="cp-label" htmlFor={id}>
          {label} {isRequired ? <span className="cp-req">*</span> : null}
        </label>
      )}
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