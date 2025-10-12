// src/components/cv/candidate/cvsections/LifestyleHabitsSection.js
import React, { useMemo, useState } from 'react';

// Opciones estandarizadas (labels cortos, filtrables)
const TATTOOS = ['Yes', 'No'];
const SMOKING = ['Non-smoker', 'Occasional', 'Regular'];
const VAPING = ['No', 'Occasionally', 'Regularly'];
const ALCOHOL = ['None', 'Social', 'Regular'];
const FITNESS = ['Active', 'Moderate', 'Low'];
const ALLERGIES = ['None', 'Seafood', 'Fish', 'Shellfish', 'Eggs', 'Dairy', 'Nuts', 'Gluten'];

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
        {opts.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
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
      dietaryAllergies: (v.dietaryAllergies || []).filter(a => a !== item),
    });
  };

  return (
    <div className="cp-form">
      <div className="lh-grid">
        <SelectField
          label="Visible tattoos"
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
          <label className="cp-label">Dietary allergies</label>
          <div className="lh-allergies-controls">
            <select
              className="cp-select cp-input"
              value={selAllergy}
              onChange={(e) => setSelAllergy(e.target.value)}
            >
              <option value="">Select...</option>
              {ALLERGIES.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <button type="button" className="cp-btn-add" onClick={addAllergy}>
              Add
            </button>
          </div>

          {/* Chips – mismo marcado/clases que el resto de secciones */}
          <div className="lh-pills cp-chips">
            {(v.dietaryAllergies || []).map(item => (
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
          label="Fitness / sport activity"
          options={FITNESS}
          value={v.fitness}
          onChange={setField('fitness')}
        />
      </div>
    </div>
  );
}