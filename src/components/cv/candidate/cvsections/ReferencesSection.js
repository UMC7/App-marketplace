// src/components/cv/candidate/cvsections/ReferencesSection.js
import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../../../context/AuthContext";
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
  mode = "professional",
  profileId,
  onCountChange,
  showRequiredMark = true,
  readOnly = false,
}) {
  const { currentUser } = useAuth();
  const [local, setLocal] = useState(Array.isArray(value) ? value : []);
  const controlled = typeof onChange === "function";
  const data = controlled ? value || [] : local;
  const enablePersistence = !!profileId && !controlled;

  useEffect(() => {
    if (Array.isArray(value)) setLocal(value);
  }, [value]);

  useEffect(() => {
    if (!enablePersistence) return;
    let cancelled = false;
    (async () => {
      try {
        const rows = await listReferencesByProfile(profileId);
        if (!cancelled) setLocal(Array.isArray(rows) ? rows : []);
      } catch (_e) {
        // no-op
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

  const handleUpsert = useCallback(
    async (ref) => {
      if (!enablePersistence) return null;
      if (!currentUser?.id) throw new Error("No hay sesión activa.");
      const saved = await upsertReference({
        ...ref,
        profile_id: profileId,
        authenticatedUserId: currentUser.id,
      });
      const rows = await listReferencesByProfile(profileId);
      setLocal(Array.isArray(rows) ? rows : []);
      return saved;
    },
    [enablePersistence, profileId, currentUser?.id]
  );

  const handleDelete = useCallback(
    async (id) => {
      if (!enablePersistence) return null;
      if (!currentUser?.id) throw new Error("No hay sesión activa.");
      await deleteReference(id);
      const rows = await listReferencesByProfile(profileId);
      setLocal(Array.isArray(rows) ? rows : []);
      return true;
    },
    [enablePersistence, profileId, currentUser?.id]
  );

  const dataLen = Array.isArray(data) ? data.length : 0;

  useEffect(() => {
    if (typeof onCountChange === "function") {
      try {
        onCountChange(dataLen);
      } catch (_e) {
        /* no-op */
      }
    }
    try {
      const evt = new CustomEvent("cv:references-changed", {
        detail: { count: dataLen, profileId: profileId || null },
      });
      window.dispatchEvent(evt);
    } catch (_e) {
      /* no-op */
    }
  }, [dataLen, onCountChange, profileId]);

  return (
    <ReferencesEditor
      value={data}
      onChange={handleChange}
      max={Number.MAX_SAFE_INTEGER}
      onUpsert={enablePersistence ? handleUpsert : undefined}
      onDelete={enablePersistence ? handleDelete : undefined}
      showRequiredMark={showRequiredMark}
      mode={mode}
      readOnly={readOnly}
    />
  );
}
