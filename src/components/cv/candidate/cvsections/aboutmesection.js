// src/components/cv/candidate/cvsections/aboutmesection.js
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import SectionCard from "../sectionscomponents/aboutme/SectionCard";
import AboutMeEditor from "../sectionscomponents/aboutme/AboutMeEditor";
import ProfessionalStatementEditor from "../sectionscomponents/aboutme/ProfessionalStatementEditor";

export default function AboutMeSection({ profile = {}, onSave, onSaved }) {
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
  const canSave = dirty && (about || "").trim().length > 0;

  const handleSave = async () => {
    if (!canSave || saving) return;

    const payload = {
      about_me: (about || "").trim(),
      professional_statement: (statement || "").trim(),
    };

    if (!payload.about_me) {
      // Doble verificación por si acaso (defensa en profundidad)
      toast?.error?.("Short summary is required.");
      return;
    }

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
      toast?.success?.("Saved.");
    } catch (err) {
      console.error(err);
      toast?.error?.("Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard
      subtitle="Write a brief summary and, if you wish, a longer professional statement describing your background."
    >
      <AboutMeEditor value={about} onChange={setAbout} />
      <ProfessionalStatementEditor value={statement} onChange={setStatement} />

      <div className="section-actions" style={{ marginTop: 16 }}>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!canSave || saving}
          onClick={handleSave}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </SectionCard>
  );
}