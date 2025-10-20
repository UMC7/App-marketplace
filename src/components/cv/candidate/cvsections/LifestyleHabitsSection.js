// src/components/cv/candidate/cvsections/LifestyleHabitsSection.js
import React, { useMemo, useState, useEffect } from 'react';

// Opciones actualizadas (escala objetiva con 4 niveles)
const TATTOOS = ['Yes', 'No'];

const SMOKING = [
  'Non-smoker',
  '< 3 cigarettes per day',
  '3–10 cigarettes per day',
  '> 10 cigarettes per day',
];

const VAPING = [
  'None',
  '< 1 puff per hour',
  '1–3 puffs per hour',
  '> 3 puffs per hour',
];

const ALCOHOL = [
  'None',
  '≤ 1 unit per day',
  '≤ 3 units per day',
  '> 3 units per day',
];

const FITNESS = [
  'None',
  '< 2 days per week',
  '2–4 days per week',
  '≥ 5 days per week',
];

const ALLERGIES = [
  'None',
  'Seafood',
  'Fish',
  'Shellfish',
  'Eggs',
  'Dairy',
  'Nuts',
  'Gluten',
];

function SelectField({ label, options, value, onChange }) {
  const opts = useMemo(() => options || [], [options]);
  return (
    <div className="lh-field">
      <label className="cp-label">{label}</label>
      <select
        className="cp-select cp-input"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select...</option>
        {opts.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function LifestyleHabitsSection({ value, onChange }) {
  const v = value || {
    tattoosVisible: '',
    smoking: '',
    vaping: '',
    alcohol: '',
    dietaryAllergies: [],
    fitness: '',
  };

  const setField = (k) => (next) => onChange({ ...v, [k]: next });

  // Asignar valores por defecto si los campos están vacíos
  useEffect(() => {
    const defaults = {
      smoking: 'Non-smoker',
      vaping: 'None',
      alcohol: 'None',
      fitness: 'None',
    };
    const updated = { ...v };
    let changed = false;

    for (const key in defaults) {
      if (!v[key] || v[key].trim() === '') {
        updated[key] = defaults[key];
        changed = true;
      }
    }

    if (changed) onChange(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Solo para Dietary allergies (multi con botón Add)
  const [selAllergy, setSelAllergy] = useState('');
  const addAllergy = () => {
    if (!selAllergy) return;
    const set = new Set(v.dietaryAllergies || []);
    set.add(selAllergy);
    onChange({ ...v, dietaryAllergies: Array.from(set) });
    setSelAllergy('');
  };
  const removeAllergy = (item) => {
    onChange({
      ...v,
      dietaryAllergies: (v.dietaryAllergies || []).filter((a) => a !== item),
    });
  };

  return (
    <div className="cp-form">
      <div className="lh-grid">
        <SelectField
          label="Visible tattoos *"
          options={TATTOOS}
          value={v.tattoosVisible}
          onChange={setField('tattoosVisible')}
        />

        <SelectField
          label="Smoking habits"
          options={SMOKING}
          value={v.smoking}
          onChange={setField('smoking')}
        />

        <SelectField
          label="Vaping"
          options={VAPING}
          value={v.vaping}
          onChange={setField('vaping')}
        />

        <SelectField
          label="Alcohol consumption"
          options={ALCOHOL}
          value={v.alcohol}
          onChange={setField('alcohol')}
        />

        {/* Dietary allergies (multi con Add + chips iguales a Preferences & Skills) */}
        <div className="lh-field">
          <label className="cp-label">Dietary allergies *</label>
          <div className="lh-allergies-controls">
            <select
              className="cp-select cp-input"
              value={selAllergy}
              onChange={(e) => setSelAllergy(e.target.value)}
            >
              <option value="">Select...</option>
              {ALLERGIES.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <button type="button" className="cp-btn-add" onClick={addAllergy}>
              Add
            </button>
          </div>

          {/* Chips – mismo marcado/clases que el resto de secciones */}
          <div className="lh-pills cp-chips">
            {(v.dietaryAllergies || []).map((item) => (
              <span key={item} className="cp-chip cp-chip--active">
                {item}
                <button
                  type="button"
                  className="cp-chip-x"
                  onClick={() => removeAllergy(item)}
                  aria-label={`Remove ${item}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <SelectField
          label="Fitness / sport activity *"
          options={FITNESS}
          value={v.fitness}
          onChange={setField('fitness')}
        />
      </div>
    </div>
  );
}