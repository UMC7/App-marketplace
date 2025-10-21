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
  initialDocFlags,
  onDocFlagsChange,
  onSaveDocFlags,
  savingDocFlags,
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("bulk");
  const [editDoc, setEditDoc] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [docs, setDocs] = useState(() => (initialDocs || []).map(coerceDoc));
  const [docFlags, setDocFlags] = useState(() => ({
    ...DEFAULT_DOC_FLAGS,
    ...(initialDocFlags || {}),
  }));

  useEffect(() => {
    setDocs((initialDocs || []).map(coerceDoc));
  }, [initialDocs]);

  useEffect(() => {
    if (!initialDocFlags) return;
    setDocFlags((prev) => ({ ...prev, ...initialDocFlags }));
  }, [initialDocFlags]);

  const orderedDocs = useMemo(() => {
    const rank = { public: 0, unlisted: 1, private: 2 };
    return [...docs].sort((a, b) => {
      const ra = rank[(a.visibility || "unlisted").toLowerCase()] ?? 9;
      const rb = rank[(b.visibility || "unlisted").toLowerCase()] ?? 9;
      if (ra !== rb) return ra - rb;
      return (a.title || "").localeCompare(b.title || "");
    });
  }, [docs]);

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

  const handleSave = async (nextDocs, pendingFiles) => {
    const cleanedUi = (nextDocs || []).map(coerceDoc);

    if (mode === "single") {
      const updated = cleanedUi[0];
      if (!updated) return handleClose();

      try {
        await persistSingleUpdate(updated);
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

    const cleanedForDb = cleanedUi.map((d) => ({
      ...d,
      visibility: mapVisibilityForDB(d.visibility),
    }));

    setDocs(cleanedUi);
    if (typeof onSave === "function") onSave(cleanedForDb, pendingFiles);
    setOpen(false);
  };

  const handleEditDoc = (doc) => {
    setMode("single");
    setEditDoc(coerceDoc(doc));
    setOpen(true);
  };

  const handleDeleteDoc = async (doc) => {
    if (!doc?.id) return;
    const ok = window.confirm(
      `Delete "${doc.title || "document"}"?\nThis will remove it from your profile permanently.`
    );
    if (!ok) return;

    setBusyId(doc.id);
    try {
      const { data: row, error: selErr } = await supabase
        .from("public_documents")
        .select("id, profile_id, file_url")
        .eq("id", doc.id)
        .single();
      if (selErr) throw selErr;

      const fileUrl = row?.file_url || null;

      if (fileUrl) {
        await supabase.from("candidate_certificates").delete().eq("file_url", fileUrl);
      }

      await supabase.from("public_documents").delete().eq("id", doc.id);

      if (fileUrl && fileUrl.startsWith("cv-docs/")) {
        const relative = fileUrl.replace(/^cv-docs\//, "");
        await supabase.storage.from("cv-docs").remove([relative]);
      }

      setDocs((prev) => prev.filter((d) => String(d.id) !== String(doc.id)));
      toast.success("Document deleted");
    } catch (e) {
      console.warn("Delete doc error:", e);
      window.alert(e?.message || "Could not delete document.");
    } finally {
      setBusyId(null);
    }
  };

  const handleChangeDocFlag = (key, value) => {
    setDocFlags((prev) => {
      const next = { ...prev, [key]: value };
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
        docFlags={docFlags}
        onChangeDocFlag={handleChangeDocFlag}
        onSaveDocFlags={handleSaveDocFlagsClick}
        savingDocFlags={!!savingDocFlags}
      />
      <DocumentsManagerDialog
        open={open}
        onClose={handleClose}
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

async function persistSingleUpdate(doc) {
  const visDb = mapVisibilityForDB(doc.visibility);
  const issued = toYmdOrNull(doc.issuedOn);
  const expires = toYmdOrNull(doc.expiresOn);
  const { data: row, error: selErr } = await supabase
    .from("public_documents")
    .select("id, profile_id, file_url")
    .eq("id", doc.id)
    .single();
  if (selErr) throw selErr;

  const fileUrl = row?.file_url || null;
  const profileId = row?.profile_id || null;
  const { error: updErr } = await supabase
    .from("public_documents")
    .update({
      title: (doc.title || "").trim() || null,
      visibility: visDb,
    })
    .eq("id", doc.id);
  if (updErr) throw updErr;
  if (!fileUrl) return;

  if (!issued && !expires) {
    await supabase.from("candidate_certificates").delete().eq("file_url", fileUrl);
  } else {
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