// src/components/cv/candidate/sectionscomponents/departmentsranks/DepartmentSelect.js
import React from "react";
import { DEPARTMENTS } from "../../shared/rankData";

export default function DepartmentSelect({
  value,
  onChange,
  label = "Primary department",
  placeholder = "Select…",
  disabled = false,
  className = "",
  style,
  id,
  name,
  options,
  // Opcional: forzar que muestre el asterisco de requerido
  required,
}) {
  const items = Array.isArray(options) && options.length ? options : DEPARTMENTS;

  // Si no se pasó "required", se infiere automáticamente para "Primary department"
  const isRequired =
    typeof required === "boolean"
      ? required
      : (label && /primary\s+department/i.test(label));

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
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {items.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
    </div>
  );
}