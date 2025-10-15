// src/components/cv/candidate/cvsections/documentssection/DocumentsSectionController.js
import React, { useEffect, useMemo, useState } from "react";
import DocumentsSection from "./DocumentsSection";
import DocumentsManagerDialog from "./DocumentsManagerDialog";
import supabase from "../../../../../supabase";
import { toast } from "react-toastify";
import "../../../../../styles/cv/docs.css";

const DEFAULT_DOC_FLAGS = {
  passport6m: null,
  schengenVisa: null,
  stcwBasic: null,
  seamansBook: null,
  eng1: null,
  usVisa: null,
  drivingLicense: null,
  pdsd: null,
  covidVaccine: null,
};

export default function DocumentsSectionController({
  initialDocs = [],
  onSave,
  /** opcionales: si el padre quiere hidratar/escuchar los flags */
  initialDocFlags,
  onDocFlagsChange,

  /** 🔹 NUEVO (opcionales): guardado independiente del bloque de 9 selectores */
  onSaveDocFlags,     // (flags) => Promise<void> | void
  savingDocFlags,     // boolean
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("bulk"); // 'add' | 'single' | 'bulk'
  const [editDoc, setEditDoc] = useState(null); // doc activo en modo 'single'
  const [busyId, setBusyId] = useState(null);   // doc en proceso (delete)
  const [docs, setDocs] = useState(() => (initialDocs || []).map(coerceDoc));

  // 🔹 Nuevo: estado local para los 9 selectores (No/Yes -> null/false/true)
  const [docFlags, setDocFlags] = useState(() => ({
    ...DEFAULT_DOC_FLAGS,
    ...(initialDocFlags || {}),
  }));

  // ⬅️ Sincroniza con los docs del padre (sin pisar al cerrar el modal)
  useEffect(() => {
    setDocs((initialDocs || []).map(coerceDoc));
  }, [initialDocs]);

  // ⬅️ Sincroniza flags si el padre los cambia externamente
  useEffect(() => {
    if (!initialDocFlags) return;
    setDocFlags((prev) => ({ ...prev, ...initialDocFlags }));
  }, [initialDocFlags]);

  const orderedDocs = useMemo(() => {
    // Basic sort: public → unlisted → private, then by title
    const rank = { public: 0, unlisted: 1, private: 2 };
    return [...docs].sort((a, b) => {
      const ra = rank[(a.visibility || "unlisted").toLowerCase()] ?? 9;
      const rb = rank[(b.visibility || "unlisted").toLowerCase()] ?? 9;
      if (ra !== rb) return ra - rb;
      return (a.title || "").localeCompare(b.title || "");
    });
  }, [docs]);

  // Abrir en modo "Add document": NO cargar la lista existente en el modal
  const handleOpen = () => {
    setMode("add");
    setEditDoc(null);
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
    setEditDoc(null);
    setMode("bulk");
  };

  // ⬇️ Guardado desde el modal
  const handleSave = async (nextDocs, pendingFiles) => {
    const cleanedUi = (nextDocs || []).map(coerceDoc);

    if (mode === "single") {
      // Guardar SOLO este doc con persistencia directa
      const updated = cleanedUi[0];
      if (!updated) return handleClose();

      try {
        await persistSingleUpdate(updated);
        // actualiza en UI local
        setDocs((prev) =>
          prev.map((d) => (String(d.id) === String(updated.id) ? coerceDoc(updated) : d))
        );
        toast.success("Document updated");
      } catch (e) {
        console.warn("Persist single update error:", e);
        window.alert(e?.message || "Could not save changes.");
      } finally {
        handleClose();
      }
      return;
    }

    if (mode === "add") {
      // Solo se añadieron nuevos documentos. Mezclamos con los existentes.
      const mergedUi = [...cleanedUi, ...docs].map(coerceDoc);
      const cleanedForDb = mergedUi.map((d) => ({
        ...d,
        visibility: mapVisibilityForDB(d.visibility),
      }));

      setDocs(mergedUi);
      if (typeof onSave === "function") onSave(cleanedForDb, pendingFiles);
      setOpen(false);
      return;
    }

    // --- Modo 'bulk' (flujo existente) ---
    const cleanedForDb = cleanedUi.map((d) => ({
      ...d,
      visibility: mapVisibilityForDB(d.visibility),
    }));

    setDocs(cleanedUi);
    if (typeof onSave === "function") onSave(cleanedForDb, pendingFiles);
    setOpen(false);
  };

  /* -------- Acciones por documento -------- */

  // Editar: abre el modal SOLO con ese documento
  const handleEditDoc = (doc) => {
    setMode("single");
    setEditDoc(coerceDoc(doc));
    setOpen(true);
  };

  // Eliminar: borra BD + certificado vinculado + archivo en storage
  const handleDeleteDoc = async (doc) => {
    if (!doc?.id) return;
    const ok = window.confirm(
      `Delete "${doc.title || "document"}"?\nThis will remove it from your profile permanently.`
    );
    if (!ok) return;

    setBusyId(doc.id);
    try {
      // 1) obtener file_url y profile_id
      const { data: row, error: selErr } = await supabase
        .from("public_documents")
        .select("id, profile_id, file_url")
        .eq("id", doc.id)
        .single();
      if (selErr) throw selErr;

      const fileUrl = row?.file_url || null;

      // 2) borrar certificado asociado (si existe)
      if (fileUrl) {
        await supabase.from("candidate_certificates").delete().eq("file_url", fileUrl);
      }

      // 3) borrar documento
      await supabase.from("public_documents").delete().eq("id", doc.id);

      // 4) borrar archivo en storage
      if (fileUrl && fileUrl.startsWith("cv-docs/")) {
        const relative = fileUrl.replace(/^cv-docs\//, "");
        await supabase.storage.from("cv-docs").remove([relative]);
      }

      // 5) actualizar UI local
      setDocs((prev) => prev.filter((d) => String(d.id) !== String(doc.id)));
      toast.success("Document deleted");
    } catch (e) {
      console.warn("Delete doc error:", e);
      window.alert(e?.message || "Could not delete document.");
    } finally {
      setBusyId(null);
    }
  };

  /* -------- Flags (9 selectores) -------- */

  const handleChangeDocFlag = (key, value) => {
    setDocFlags((prev) => {
      const next = { ...prev, [key]: value };
      // ⚠️ Para evitar la advertencia de React “Cannot update a component while rendering
      // a different component”, notificamos al padre en un microtask (fuera del render actual).
      if (typeof onDocFlagsChange === "function") {
        if (typeof queueMicrotask === "function") {
          queueMicrotask(() => {
            try { onDocFlagsChange(next); } catch {}
          });
        } else {
          setTimeout(() => {
            try { onDocFlagsChange(next); } catch {}
          }, 0);
        }
      }
      return next;
    });
  };

  const handleSaveDocFlagsClick = async () => {
    if (typeof onSaveDocFlags === "function") {
      await onSaveDocFlags(docFlags);
    }
  };

  return (
    <>
      <DocumentsSection
        docs={orderedDocs}
        onOpenManager={handleOpen}
        onEditDoc={handleEditDoc}
        onDeleteDoc={handleDeleteDoc}
        busyId={busyId}
        // 🔹 Nuevo: pasamos flags + updater para que se rendericen arriba de la lista
        docFlags={docFlags}
        onChangeDocFlag={handleChangeDocFlag}
        // 🔹 Nuevo: botón Save independiente
        onSaveDocFlags={handleSaveDocFlagsClick}
        savingDocFlags={!!savingDocFlags}
      />
      <DocumentsManagerDialog
        open={open}
        onClose={handleClose}
        // Modo 'single' → solo ese doc; modo 'add' → lista vacía; otro → lista completa
        initialDocs={
          mode === "single" && editDoc
            ? [editDoc]
            : mode === "add"
            ? []
            : docs
        }
        onSave={handleSave}
      />
    </>
  );
}

/* ---------- helpers ---------- */

function coerceDoc(raw) {
  const d = { ...(raw || {}) };
  d.id = String(d.id || `tmp-${Math.random().toString(36).slice(2)}`);
  d.title = String(d.title || "Untitled document");
  d.originalTitle = d.originalTitle ? String(d.originalTitle) : undefined;
  d.issuedOn = normalizeYmd(d.issuedOn);
  d.expiresOn = normalizeYmd(d.expiresOn);
  d.visibility = toVisibility(d.visibility);
  d.mimeType = d.mimeType ? String(d.mimeType) : undefined;
  d.sizeBytes = typeof d.sizeBytes === "number" ? d.sizeBytes : undefined;
  return d;
}

function toVisibility(v) {
  const s = String(v || "").toLowerCase();
  return s === "public" || s === "private" || s === "unlisted" ? s : "unlisted";
}

function normalizeYmd(v) {
  if (!v) return "";
  try {
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    const dt = v instanceof Date ? v : new Date(String(v));
    if (Number.isNaN(dt.getTime())) return "";
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const d = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  } catch {
    return "";
  }
}

function mapVisibilityForDB(v) {
  const s = String(v || "").toLowerCase();
  if (s === "unlisted") return "after_contact";
  if (s === "public" || s === "private") return s;
  return "after_contact";
}

/* Persistencia para edición individual */
async function persistSingleUpdate(doc) {
  const visDb = mapVisibilityForDB(doc.visibility);
  const issued = toYmdOrNull(doc.issuedOn);
  const expires = toYmdOrNull(doc.expiresOn);

  // 1) ubicamos file_url + profile_id del documento
  const { data: row, error: selErr } = await supabase
    .from("public_documents")
    .select("id, profile_id, file_url")
    .eq("id", doc.id)
    .single();
  if (selErr) throw selErr;

  const fileUrl = row?.file_url || null;
  const profileId = row?.profile_id || null;

  // 2) actualizar public_documents (título/visibilidad)
  const { error: updErr } = await supabase
    .from("public_documents")
    .update({
      title: (doc.title || "").trim() || null,
      visibility: visDb,
    })
    .eq("id", doc.id);
  if (updErr) throw updErr;

  // 3) sincronizar candidate_certificates según fechas
  if (!fileUrl) return; // nada más que hacer si no tenemos file_url

  if (!issued && !expires) {
    // si no hay fechas -> eliminar certificado si existía
    await supabase.from("candidate_certificates").delete().eq("file_url", fileUrl);
  } else {
    // upsert por file_url
    const { data: exists, error: cSelErr } = await supabase
      .from("candidate_certificates")
      .select("id")
      .eq("file_url", fileUrl)
      .limit(1);
    if (cSelErr) throw cSelErr;

    if (exists && exists.length) {
      await supabase
        .from("candidate_certificates")
        .update({
          title: (doc.title || "").trim() || null,
          issued_on: issued,
          expires_on: expires,
        })
        .eq("file_url", fileUrl);
    } else {
      await supabase.from("candidate_certificates").insert([
        {
          profile_id: profileId,
          title: (doc.title || "").trim() || null,
          issuer: null,
          number: null,
          issued_on: issued,
          expires_on: expires,
          file_url: fileUrl,
        },
      ]);
    }
  }
}

function toYmdOrNull(v) {
  if (!v) return null;
  try {
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    const dt = v instanceof Date ? v : new Date(String(v));
    if (Number.isNaN(dt.getTime())) return null;
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const d = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  } catch {
    return null;
  }
}