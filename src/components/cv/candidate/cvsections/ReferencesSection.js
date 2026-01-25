// src/components/cv/candidate/cvsections/ReferencesSection.js
import React, { useEffect, useState, useCallback } from "react";
// usar el barrel de /references (ruta correcta: subir 1 nivel desde cvsections/)
import {
  ReferencesEditor,
  listReferencesByProfile,
  upsertReference,
  deleteReference,
} from "../sectionscomponents/references";

export default function ReferencesSection({
  value,
  onChange,
  title = "References",
  // ⬇️ Eliminamos el límite práctico: no exponemos `max` y forzamos “sin límite”
  profileId,          // <- opcional: si viene, cargamos/guardamos en DB
  onCountChange,      // <- opcional: notificación de cantidad actual
  showRequiredMark = true,
}) {
  const [local, setLocal] = useState(Array.isArray(value) ? value : []);
  const controlled = typeof onChange === "function";
  const data = controlled ? value || [] : local;
  const enablePersistence = !!profileId && !controlled;

  // Sync cuando el padre cambia value
  useEffect(() => {
    if (Array.isArray(value)) setLocal(value);
  }, [value]);

  // Carga inicial desde DB si hay profileId (no afecta modo controlado)
  useEffect(() => {
    if (!enablePersistence) return;
    let cancelled = false;
    (async () => {
      try {
        const rows = await listReferencesByProfile(profileId);
        if (!cancelled) setLocal(Array.isArray(rows) ? rows : []);
      } catch (_e) {
        // silencioso para no introducir logs no deseados
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enablePersistence, profileId]);

  const handleChange = (next) => {
    if (controlled) onChange(next);
    else setLocal(next);
  };

  // Handlers opcionales de persistencia; se pasan al editor si hay profileId.
  const handleUpsert = useCallback(
    async (ref) => {
      if (!enablePersistence) return null;
      const saved = await upsertReference({ ...ref, profile_id: profileId });
      // refresca lista local tras guardar
      const rows = await listReferencesByProfile(profileId);
      setLocal(Array.isArray(rows) ? rows : []);
      return saved;
    },
    [enablePersistence, profileId]
  );

  const handleDelete = useCallback(
    async (id) => {
      if (!enablePersistence) return null;
      await deleteReference(id);
      const rows = await listReferencesByProfile(profileId);
      setLocal(Array.isArray(rows) ? rows : []);
      return true;
    },
    [enablePersistence, profileId]
  );

  // --- Notificar cantidad al padre (y vía CustomEvent global) para progreso ---
  const dataLen = Array.isArray(data) ? data.length : 0;

  useEffect(() => {
    // callback opcional del padre
    if (typeof onCountChange === "function") {
      try {
        onCountChange(dataLen);
      } catch (_e) {
        /* no-op */
      }
    }
    // evento global opcional (permite escuchar sin prop)
    try {
      const evt = new CustomEvent("cv:references-changed", {
        detail: { count: dataLen, profileId: profileId || null },
      });
      window.dispatchEvent(evt);
    } catch (_e) {
      /* no-op (SSR o CustomEvent no disponible) */
    }
  }, [dataLen, onCountChange, profileId]);

  return (
    <ReferencesEditor
      value={data}
      onChange={handleChange}
      // ⬇️ Sin límite práctico: pasamos un valor muy alto para anular cualquier tope interno
      max={Number.MAX_SAFE_INTEGER}
      // Estos props son opcionales; el editor puede ignorarlos si no los soporta.
      onUpsert={enablePersistence ? handleUpsert : undefined}
      onDelete={enablePersistence ? handleDelete : undefined}
      showRequiredMark={showRequiredMark}
    />
  );
}



