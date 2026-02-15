// src/components/cv/candidate/sectionscomponents/education/EducationItemForm.js
import React, { useMemo, useState } from "react";
import { COUNTRIES } from "../../shared/countriesData";

export default function EducationItemForm({ initialValue, onSubmit, onCancel, showRequiredMark = true }) {
  const [institution, setInstitution] = useState(initialValue?.institution || "");
  const [program, setProgram] = useState(initialValue?.program || "");
  const [levelType, setLevelType] = useState(initialValue?.levelType || "");
  const [country, setCountry] = useState(initialValue?.country || "");
  const [startMonth, setStartMonth] = useState(initialValue?.startMonth || "");
  const [startYear, setStartYear] = useState(initialValue?.startYear || "");
  const [current, setCurrent] = useState(!!initialValue?.current);
  const [endMonth, setEndMonth] = useState(
    initialValue?.endMonth && !initialValue?.current ? initialValue.endMonth : ""
  );
  const [endYear, setEndYear] = useState(
    initialValue?.endYear && !initialValue?.current ? initialValue.endYear : ""
  );
  const [errors, setErrors] = useState({});
  const reqLabel = (text) => (showRequiredMark ? `${text} *` : text);

  const MONTHS = useMemo(
    () => [
      { v: "01", l: "Jan" },
      { v: "02", l: "Feb" },
      { v: "03", l: "Mar" },
      { v: "04", l: "Apr" },
      { v: "05", l: "May" },
      { v: "06", l: "Jun" },
      { v: "07", l: "Jul" },
      { v: "08", l: "Aug" },
      { v: "09", l: "Sep" },
      { v: "10", l: "Oct" },
      { v: "11", l: "Nov" },
      { v: "12", l: "Dec" },
    ],
    []
  );

  const LEVEL_OPTIONS = useMemo(
    () => [
      "High School / Secondary",
      "Associate Degree",
      "Bachelor’s Degree",
      "Master’s Degree",
      "Doctorate / PhD",
      "Postgraduate Diploma / Certificate",
      "Vocational / Trade Certificate",
      "Maritime Academy",
      "Culinary School",
      "Technical / Vocational School",
      "Other",
    ],
    []
  );

  const COUNTRY_OPTIONS = useMemo(
    () => [...(Array.isArray(COUNTRIES) ? COUNTRIES : [])].sort((a, b) => a.localeCompare(b)),
    []
  );

  const YEARS = useMemo(() => {
    const now = new Date().getFullYear();
    const years = [];
    for (let y = now + 1; y >= 1970; y--) years.push(String(y));
    return years;
  }, []);

  function validate() {
    const e = {};
    if (!institution.trim()) e.institution = "Required";
    if (!program.trim()) e.program = "Required";
    if (!levelType.trim()) e.levelType = "Required";
    if (!country.trim()) e.country = "Required";
    if (!startMonth) e.startMonth = "Required";
    if (!startYear) e.startYear = "Required";
    if (!current) {
      if (!endMonth) e.endMonth = "Required";
      if (!endYear) e.endYear = "Required";
    }

    if (!e.startMonth && !e.startYear && !current && !e.endMonth && !e.endYear) {
      const s = new Date(Number(startYear), Number(startMonth) - 1, 1).getTime();
      const eTime = new Date(Number(endYear), Number(endMonth) - 1, 1).getTime();
      if (eTime < s) {
        e.endMonth = "End must be ≥ Start";
        e.endYear = "End must be ≥ Start";
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const canSave = useMemo(() => {
    const hasStart = !!startMonth && !!startYear;
    const hasEndOrCurrent = current || (!!endMonth && !!endYear);
    return (
      institution.trim() &&
      program.trim() &&
      levelType.trim() &&
      country.trim() &&
      hasStart &&
      hasEndOrCurrent
    );
  }, [institution, program, levelType, country, startMonth, startYear, endMonth, endYear, current]);

  const miss = {
    institution: !institution.trim(),
    program: !program.trim(),
    levelType: !levelType.trim(),
    country: !country.trim(),
    startMonth: !startMonth,
    startYear: !startYear,
    endMonth: !current && !endMonth,
    endYear: !current && !endYear,
  };

  function handleSubmit(ev) {
    ev.preventDefault();
    if (!validate()) return;

    const payload = {
      institution: institution.trim(),
      program: program.trim(),
      levelType: levelType.trim(),
      country: country.trim(),
      startMonth,
      startYear,
      current: !!current,
      endMonth: current ? null : endMonth,
      endYear: current ? null : endYear,
    };
    onSubmit && onSubmit(payload);
  }

  return (
    <form className="cv-form education-form cp-form" onSubmit={handleSubmit} noValidate>
      <div className="cp-grid cp-grid-2 education-form-grid">
        <div className={`field ${miss.institution ? 'cp-missing' : ''}`}>
          <label className="cp-label">{reqLabel('Institution')}</label>
          <input
            className="cp-input"
            type="text"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            placeholder="e.g., Warsash Maritime School"
          />
          {errors.institution && <p className="field-error">{errors.institution}</p>}
        </div>

        <div className={`field ${miss.program ? 'cp-missing' : ''}`}>
          <label className="cp-label">{reqLabel('Program / Degree')}</label>
          <input
            className="cp-input"
            type="text"
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            placeholder="e.g., Marine Engineering Diploma"
          />
          {errors.program && <p className="field-error">{errors.program}</p>}
        </div>

        <div className={`field ${miss.levelType ? 'cp-missing' : ''}`}>
          <label className="cp-label">{reqLabel('Level / Type')}</label>
          <select
            className="cp-select"
            value={levelType}
            onChange={(e) => setLevelType(e.target.value)}
          >
            <option value="">Select…</option>
            {LEVEL_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {errors.levelType && <p className="field-error">{errors.levelType}</p>}
        </div>

        <div className={`field ${miss.country ? 'cp-missing' : ''}`}>
          <label className="cp-label">{reqLabel('Country')}</label>
          <select
            className="cp-select"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            <option value="">Select…</option>
            {COUNTRY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {errors.country && <p className="field-error">{errors.country}</p>}
        </div>

        <div className={`field ${miss.startMonth || miss.startYear ? 'cp-missing' : ''}`}>
          <label className="cp-label">{reqLabel('Start')}</label>
          <div className="cp-grid cp-grid-2">
            <select
              className="cp-select"
              value={startMonth}
              onChange={(e) => setStartMonth(e.target.value)}
              aria-label="Start month"
            >
              <option value="">MM</option>
              {MONTHS.map((m) => (
                <option key={m.v} value={m.v}>
                  {m.l}
                </option>
              ))}
            </select>
            <select
              className="cp-select"
              value={startYear}
              onChange={(e) => setStartYear(e.target.value)}
              aria-label="Start year"
            >
              <option value="">YYYY</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          {(errors.startMonth || errors.startYear) && (
            <p className="field-error">{errors.startMonth || errors.startYear}</p>
          )}
        </div>

        <div className={`field ${miss.endMonth || miss.endYear ? 'cp-missing' : ''}`}>
          <label className="cp-label">{reqLabel('End')}</label>
          <div className="cp-grid cp-grid-2">
            <select
              className="cp-select"
              value={current ? "" : endMonth}
              onChange={(e) => setEndMonth(e.target.value)}
              aria-label="End month"
              disabled={current}
            >
              <option value="">MM</option>
              {MONTHS.map((m) => (
                <option key={m.v} value={m.v}>
                  {m.l}
                </option>
              ))}
            </select>
            <select
              className="cp-select"
              value={current ? "" : endYear}
              onChange={(e) => setEndYear(e.target.value)}
              aria-label="End year"
              disabled={current}
            >
              <option value="">YYYY</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          {(errors.endMonth || errors.endYear) && !current && (
            <p className="field-error">{errors.endMonth || errors.endYear}</p>
          )}
          <label
            className="cp-label"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 8 }}
          >
            <input
              type="checkbox"
              checked={current}
              onChange={(e) => {
                setCurrent(e.target.checked);
                if (e.target.checked) {
                  setEndMonth("");
                  setEndYear("");
                }
              }}
              style={{ margin: 0 }}
            />
            Currently studying
          </label>
        </div>
      </div>

      <div className="form-actions cp-actions education-actions">
        <button type="button" className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="submit"
          className="btn primary"
          disabled={!canSave}
          title={
            !canSave
              ? "Complete all required fields (including Start and End or mark Currently studying)"
              : undefined
          }
        >
          Save
        </button>
      </div>

      <style>{`
        /* ===== SOLO móviles ===== */
        @media (max-width: 720px) {
          .education-form-grid {
            grid-template-columns: 1fr !important;
          }
          .education-actions {
            flex-direction: column !important;
            width: 100%;
            gap: 8px;
          }
          .education-actions .btn {
            width: 100% !important;
          }
          .education-form {
            padding: 4px 2px !important;
          }
        }
      `}</style>
    </form>
  );
}
