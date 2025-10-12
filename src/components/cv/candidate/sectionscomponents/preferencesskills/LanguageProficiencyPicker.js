// src/components/cv/candidate/sectionscomponents/preferencesskills/LanguageProficiencyPicker.jsx
import React, { useState } from 'react';

const LANGUAGES = [
  'Arabic','Dutch','English','French','German','Greek','Italian',
  'Mandarin','Portuguese','Russian','Spanish','Turkish','Ukrainian','Japanese','Chinese'
];

const FLUENCY_LEVELS = ['Native', 'Fluent', 'Conversational'];

export default function LanguageProficiencyPicker({ value = [], onChange }) {
  const [selLang, setSelLang] = useState('');
  const [selLevel, setSelLevel] = useState('');

  const add = () => {
    if (!selLang || !selLevel) return;
    const lower = selLang.toLowerCase();

    const exists = (value || []).some((x) => String(x.lang).toLowerCase() === lower);
    const next = exists
      ? (value || []).map((x) =>
          String(x.lang).toLowerCase() === lower ? { ...x, level: selLevel } : x
        )
      : [ ...(value || []), { lang: selLang, level: selLevel } ];

    onChange?.(next);
    setSelLang('');
    setSelLevel('');
  };

  const remove = (name) => {
    onChange?.((value || []).filter((x) => x.lang !== name));
  };

  const canAdd = !!selLang && !!selLevel; // deshabilitar Add si falta selección

  return (
    <div>
      <label className="cp-label">Languages (with proficiency)</label>

      {/* Mantener layout; Language y Fluency ocupan 50% cada uno */}
      <div className="cp-row-exp-c__regions" style={{ marginBottom: 6 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%' }}>
          <select
            className="cp-input"
            value={selLang}
            onChange={(e) => setSelLang(e.target.value)}
          >
            <option value="">Language…</option>
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>

          <select
            className="cp-input"
            value={selLevel}
            onChange={(e) => setSelLevel(e.target.value)}
          >
            <option value="">Fluency…</option>
            {FLUENCY_LEVELS.map((lv) => (
              <option key={lv} value={lv}>{lv}</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="cp-btn-add"
          onClick={add}
          disabled={!canAdd}
          title={!canAdd ? 'Select language and fluency' : undefined}
        >
          Add
        </button>
      </div>

      {(value || []).length > 0 && (
        <div className="cp-chips" style={{ marginTop: 8 }}>
          {(value || []).map(({ lang, level }) => (
            <span key={lang} className="cp-chip cp-chip--active">
              {lang} — {level}
              <button
                type="button"
                className="cp-chip-x"
                onClick={() => remove(lang)}
                title="Remove"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}