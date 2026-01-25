// src/components/cv/candidate/sectionscomponents/departmentsranks/TargetRankPicker.jsx
import React from "react";
import DepartmentSelect from "./DepartmentSelect";
import RankSelect from "./RankSelect";

export default function TargetRankPicker({
  dept,
  onDeptChange,
  rank,
  onRankChange,
  onAdd,
  maxReached = false,
  className = "",
  style,
}) {
  const canAdd = !!dept && !!rank && !maxReached;

  return (
    <div
      className={`cp-target-picker ${className}`.trim()}
      /* Wrap habilitado para móviles; en desktop no afecta porque todo cabe en una fila */
      style={{
        width: "100%",
        ...style,
      }}
    >
      <DepartmentSelect
        value={dept}
        onChange={onDeptChange}
        label={null}
        placeholder="Department…"
      />

      <RankSelect
        department={dept}
        value={rank}
        onChange={onRankChange}
        label={null}
        placeholder="Select rank…"
        style={{ minWidth: 0 }}
      />

      <button
        type="button"
        className="cp-btn-add"            // <- hook correcto para CSS móvil
        onClick={onAdd}
        disabled={!canAdd}
        style={{ padding: "10px 14px", flex: "0 0 auto" }} // no se estira en desktop
      >
        Add
      </button>
    </div>
  );
}
