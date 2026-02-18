// src/components/cv/candidate/cvsections/aboutmesection.js
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import SectionCard from "../sectionscomponents/aboutme/SectionCard";
import AboutMeEditor from "../sectionscomponents/aboutme/AboutMeEditor";
import ProfessionalStatementEditor from "../sectionscomponents/aboutme/ProfessionalStatementEditor";

/**
 * Normaliza saltos de línea introducidos por móvil (wrapping estrecho o pegado desde otra app).
 * Solo sustituye \n simple por espacio cuando la línea siguiente continúa la frase (minúscula).
 * Mantiene \n\n (párrafos) y \n antes de mayúscula (nueva frase/intención).
 */
function normalizeLongText(text) {
  if (!text || typeof text !== "string") return text;
  return text.replace(/(\n)(?!\n)\s*(?=[a-záéíóúñü])/g, " ");
}

export default function AboutMeSection({ profile = {}, onSave, onSaved, mode = 'professional', readOnly = false }) {
  const isLite = mode === 'lite';
  const isProfessional = mode === 'professional';
  const showRequired = !isProfessional;
  const showOptional = !isLite;
  const initialAbout = useMemo(
    () => profile?.about_me || profile?.about || "",
    [profile]
  );
  const initialStatement = useMemo(
    () =>
      profile?.professional_statement ||
      profile?.career_narrative ||
      "",
    [profile]
  );

  const [about, setAbout] = useState(initialAbout);
  const [statement, setStatement] = useState(initialStatement);
  const [baseline, setBaseline] = useState({
    about: initialAbout,
    statement: initialStatement,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAbout(initialAbout);
    setStatement(initialStatement);
    setBaseline({ about: initialAbout, statement: initialStatement });
  }, [initialAbout, initialStatement]);

  const dirty =
    (about ?? "") !== (baseline.about ?? "") ||
    (statement ?? "") !== (baseline.statement ?? "");

  // ⬇️ Requisito: “Short summary” debe tener contenido para poder guardar
  const canSave = dirty;

  const handleSave = async () => {
    if (readOnly) return;
    if (!canSave || saving) return;

    const payload = {
      about_me: normalizeLongText((about || "").trim()),
      professional_statement: normalizeLongText((statement || "").trim()),
    };

    // allow partial saves even if minimums not met

    try {
      setSaving(true);
      if (typeof onSave === "function") {
        await onSave(payload);
      }
      if (typeof onSaved === "function") onSaved(payload);
      setBaseline({
        about: payload.about_me,
        statement: payload.professional_statement,
      });
    } catch (err) {
      console.error(err);
      toast?.error?.("Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const subtitle = showRequired
    ? "Write a brief summary of your experience."
    : "Add a professional statement to expand on your background.";

  return (
    <SectionCard subtitle={subtitle}>
      {showRequired ? (
        <AboutMeEditor
          value={about}
          onChange={setAbout}
          showRequiredMark={!isLite}
          readOnly={readOnly}
          isMissing={!readOnly && !(about || '').trim()}
        />
      ) : null}
      {showOptional ? (
        <ProfessionalStatementEditor value={statement} onChange={setStatement} readOnly={readOnly} />
      ) : null}

      <div className="section-actions" style={{ marginTop: 16 }}>
        <button
          type="button"
          className="btn btn-primary"
          disabled={readOnly || !canSave || saving}
          onClick={handleSave}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </SectionCard>
  );
}
