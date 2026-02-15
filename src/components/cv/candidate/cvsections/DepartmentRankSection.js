// src/components/cv/candidate/cvsections/DepartmentRankSection.js
import React, { useState, useEffect } from "react";
// Datos compartidos centralizados
import { DEPARTMENTS, getRanksForDept } from "../shared/rankData";
// Subcomponentes de la sección (UI reutilizable)
import {
  DepartmentSelect,
  RankSelect,
  TargetRankPicker,
  SelectedTargetsList,
} from "../sectionscomponents/departmentsranks";

export default function DepartmentRankSection({
  // nombres “nuevos”
  department,
  onDepartmentChange,
  primaryRole,
  onPrimaryRoleChange,
  targetRoles, // ⟵ sin valor por defecto
  onTargetRolesChange,
  maxTargets = 3,

  // alias por compatibilidad
  role,
  onRoleChange,
  primaryDepartment,
  onChangePrimaryDepartment,
  primaryRank,
  onChangePrimaryRank,
  targets,
  onTargetsChange,
  showTargets = true,
  showPrimary = true,
  showRequiredMark = true,
}) {
  // Normalizamos props por si vienen con los alias
  const currentDept = department ?? primaryDepartment ?? "";
  const emitDept =
    onDepartmentChange ??
    onChangePrimaryDepartment ??
    (() => {});

  const currentPrimaryRole = primaryRole ?? role ?? primaryRank ?? "";
  const emitPrimaryRole =
    onPrimaryRoleChange ?? onRoleChange ?? onChangePrimaryRank ?? (() => {});

  // ⚠️ Priorizar `targets` (alias usado en el padre) y solo si no existe usar `targetRoles`
  const currentTargets = Array.isArray(targets)
    ? targets
    : Array.isArray(targetRoles)
    ? targetRoles
    : [];

  const emitTargets = onTargetRolesChange ?? onTargetsChange ?? (() => {});

  // Controles del picker de target ranks
  const [targetDept, setTargetDept] = useState("Deck");
  const [targetRank, setTargetRank] = useState("");

  // Reset rank si cambia el dept y el rank actual no pertenece
  useEffect(() => {
    if (targetRank && !getRanksForDept(targetDept).includes(targetRank)) {
      setTargetRank("");
    }
  }, [targetDept, targetRank]);

  // Si cambia el department principal, validamos el primaryRole y los targets
  useEffect(() => {
    const allowed = new Set(getRanksForDept(currentDept));

    if (currentPrimaryRole && !allowed.has(currentPrimaryRole)) {
      emitPrimaryRole("");
    }

    if (currentTargets.length) {
      const next = currentTargets.filter((t) =>
        t?.department && t?.rank
          ? getRanksForDept(t.department).includes(t.rank)
          : false
      );
      if (next.length !== currentTargets.length) emitTargets(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDept]);

  function addTarget() {
    if (!targetDept || !targetRank) return;
    if (currentTargets.length >= maxTargets) return;

    const exists = currentTargets.some(
      (t) => t.department === targetDept && t.rank === targetRank
    );
    if (exists) return;

    emitTargets([...currentTargets, { department: targetDept, rank: targetRank }]);
    setTargetRank("");
  }

  function removeTarget(idx) {
    const next = [...currentTargets];
    next.splice(idx, 1);
    emitTargets(next);
  }

  return (
    <div className="cp-form">
      {showPrimary ? (
        <div
          className="cp-dept-row"
          style={{ display: "flex", gap: 8 }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <DepartmentSelect
              value={currentDept || ""}
              onChange={emitDept}
              required={showRequiredMark}
              className={!currentDept ? 'cp-missing' : ''}
            />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <RankSelect
              department={currentDept}
              value={currentPrimaryRole || ""}
              onChange={emitPrimaryRole}
              required={showRequiredMark}
              className={!currentPrimaryRole ? 'cp-missing' : ''}
            />
          </div>
        </div>
      ) : null}

      {showTargets ? (
        <>
          {/* Target ranks */}
          <div style={{ marginTop: 10 }} />

          {/* Contenedor “gancho” para mobile; no modifica desktop */}
          <div className="cp-target-row">
            <TargetRankPicker
              dept={targetDept}
              onDeptChange={setTargetDept}
              rank={targetRank}
              onRankChange={setTargetRank}
              onAdd={addTarget}
              maxReached={currentTargets.length >= maxTargets}
              style={{ marginTop: 4 }}
            />
          </div>

          {/* Listado de seleccionados (solo se añade hook para espaciar en mobile) */}
          <div className="cp-target-list">
            <SelectedTargetsList items={currentTargets} onRemove={removeTarget} />
          </div>
        </>
      ) : null}
    </div>
  );
}
