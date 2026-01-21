import React, { useState, useRef, useEffect } from 'react';
import supabase from '../supabase';
import { toast } from 'react-toastify';
import '../styles/float.css';

const defaultYachtSizes = [
  "0 - 30m", "31 - 40m", "41 - 50m", "51 - 70m", "71 - 100m", ">100m"
];

const chaseBoatSizes = [
  "<10m", "10 - 15m", "15 - 20m", ">20m"
];

const visaOptions = [
  'Green card or US Citizen',
  'B1/B2',
  'C1/D',
  'Schengen',
  'European Passport'
];

const initialState = {
  work_environment: '',
  title: '',
  city: '',
  country: '',
  type: '',
  start_date: '',
  end_date: '',
  salary: '',
  is_doe: false,
  is_tips: false,
  is_flexible: false,
  years_in_rank: '',
  gender: '',
  description: '',
  contact_email: '',
  contact_phone: '',
  link_facebook: '',
  link_instagram: '',
  link_x: '',
  team: 'No',
  teammate_rank: '',
  teammate_salary: '',
  teammate_experience: '',
  flag: 'Foreign Flag',
  yacht_size: '',
  yacht_type: '',
  propulsion_type: '',
  uses: '',
  homeport: '',
  liveaboard: '',
  season_type: '',
  holidays: '',
  is_asap: false,
  language_1: 'English',
  language_1_fluency: 'Fluent',
  language_2: '',
  language_2_fluency: '',
  salary_currency: '',
  teammate_salary_currency: '',
  visas: [],
};

const titles = ['Captain', 'Captain/Engineer', 'Skipper', 'Chase Boat Captain', 'Relief Captain', 'Chief Officer', '2nd Officer', '3rd Officer', 'Bosun', 'Deck/Engineer', 'Mate', 'Lead Deckhand', 'Deckhand', 'Deck/Steward(ess)', 'Deck/Carpenter', 'Deck/Divemaster', 'Dayworker', 'Chief Engineer', '2nd Engineer', '3rd Engineer', 'Solo Engineer', 'Electrician', 'Chef', 'Head Chef', 'Sous Chef', 'Solo Chef', 'Cook/Crew Chef', 'Crew Chef/Stew', 'Butler', 'Steward(ess)', 'Chief Steward(ess)', '2nd Steward(ess)', '3rd Steward(ess)', '4th Steward(ess)', 'Solo Steward(ess)', 'Junior Steward(ess)', 'Housekeeper', 'Cook/Stew/Deck', 'Cook/Steward(ess)', 'Stew/Deck', 'Laundry/Steward(ess)', 'Stew/Masseur', 'Masseur', 'Hairdresser/Barber', 'Nanny', 'Videographer', 'Yoga/Pilates Instructor', 'Personal Trainer', 'Dive Instrutor', 'Water Sport Instrutor', 'Nurse', 'Other']; // ajusta según lista oficial

const countries = [
  // 🌐 Countries
  "Albania", "Anguilla", "Antigua and Barbuda", "Argentina", "Aruba", "Australia", "Bahamas", "Bahrain", "Barbados",
  "Belgium", "Belize", "Bermuda (UK)", "Bonaire", "Brazil", "Brunei", "Bulgaria", "BVI (UK)", "Cambodia", "Canada", "Cape Verde", "Cayman Islands (UK)",
  "Chile", "China", "Colombia", "Costa Rica", "Croatia", "Cuba", "Curacao", "Cyprus", "Denmark", "Dominica",
  "Dominican Republic", "Ecuador", "Egypt", "Estonia", "Fiji", "Finland", "France", "Germany", "Gibraltar (UK)", "Greece", "Grenada", "Guatemala", "Guernsey (UK)", "Honduras", "India", "Indonesia", "Ireland", "Israel", "Isle of Man (UK)",
  "Italy", "Jamaica", "Japan", "Jersey (UK)", "Kiribati", "Kuwait", "Latvia", "Libya", "Lithuania", "Madagascar",
  "Malaysia", "Maldives", "Malta", "Marshall Islands", "Mauritius", "Mexico", "Micronesia",
  "Monaco", "Montenegro", "Morocco", "Myanmar", "Netherlands", "New Zealand", "Nicaragua",
  "Norway", "Panama", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Saint Barthélemy", "Saint Kitts and Nevis",
  "Saint Lucia", "Saint Maarten", "Saint Vincent and the Grenadines", "Samoa", "Saudi Arabia", "Seychelles",
  "Singapore", "Solomon Islands", "South Africa", "South Korea", "Spain", "Sweden", "Taiwan",
  "Thailand", "Trinidad and Tobago", "Tunisia", "Turkey", "United Arab Emirates", "United Kingdom",
  "United States", "Uruguay", "Vanuatu", "Venezuela", "Vietnam"
];

const types = ['Rotational', 'Permanent', 'Temporary', 'Seasonal', 'Relief', 'Delivery', 'Crossing', 'DayWork'];
const yearsOptions = ['Green', 1, 2, 2.5, 3, 5];

function YachtOfferForm({ user, onOfferPosted, initialValues, mode }) {
  const [formData, setFormData] = useState(initialValues ? { ...initialState, ...initialValues } : initialState);
  // Normaliza team para edición: boolean -> 'Yes'/'No'
useEffect(() => {
  if (initialValues && typeof initialValues.team !== 'undefined') {
    setFormData(prev => ({
      ...prev,
      team: (initialValues.team === true || initialValues.team === 'Yes') ? 'Yes' : 'No',
    }));
  }
}, [initialValues]);
  const [loading, setLoading] = useState(false);
  const [showMissing, setShowMissing] = useState(false);
  const [jobText, setJobText] = useState('');
  const [showPaste, setShowPaste] = useState(false);
  const [showVisas, setShowVisas] = useState(false);

  // close the visas dropdown on outside click or ESC
const visasRef = useRef(null);
useEffect(() => {
  const handleClickOutside = (e) => {
    if (visasRef.current && !visasRef.current.contains(e.target)) {
      setShowVisas(false);
    }
  };
  const handleEsc = (e) => {
    if (e.key === 'Escape') setShowVisas(false);
  };
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleEsc);
  return () => {
    document.removeEventListener('click', handleClickOutside);
    document.removeEventListener('keydown', handleEsc);
  };
}, []);

// YachtOfferForm.js
const autoFillFromText = async () => {
  if (!jobText.trim()) {
    toast.error('Paste a job post first.');
    return;
  }

  setLoading(true);

  try {
    const res = await fetch('/api/parse-job', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: jobText }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Parse failed.');

    setFormData(prev => {
      const merged = { ...prev };

      const normalizeTitle = (val) => {
        if (!val) return "";
        const v = String(val).trim().toLowerCase();
        const hit = titles.find(t => t.toLowerCase() === v);
        return hit || "";
      };

      // Recorremos con defensiva
      for (const [k, vRaw] of Object.entries(data || {})) {
        if (vRaw == null) continue;
        const v = (typeof vRaw === "string") ? vRaw.trim() : vRaw;

        // rank → title
        if (k === "rank") {
          const norm = normalizeTitle(v);
          if (!merged.title) merged.title = norm;
          continue;
        }

        // booleanos
        if (k === "is_asap" || k === "is_doe" || k === "is_flexible" || k === "is_tips") {
          if (typeof v === "boolean" && v !== merged[k]) merged[k] = v;
          continue;
        }

        // visas (array): solo escribir si está vacío en el form
        if (k === "visas") {
          const arr = Array.isArray(v) ? v : [];
          if (!Array.isArray(merged.visas) || merged.visas.length === 0) {
            merged.visas = arr;
          }
          continue;
        }

        // regla general: no sobreescribir si ya hay valor
        const cur = merged[k];
        const isEmpty =
          cur === "" ||
          cur == null ||
          (Array.isArray(cur) && cur.length === 0) ||
          (typeof cur === "number" && Number.isNaN(cur));

        if (isEmpty) merged[k] = v;
      }

            // ⬇️ Forzar escalado de Team si el parser detectó pareja (captain+chef, etc.)
      if ((data.team === "Yes" || data.team === true) && merged.team !== "Yes") {
        merged.team = "Yes";
      }

      // Coherencia DOE
      if (data.is_doe === true || (merged.salary_currency && !merged.salary)) {
        merged.is_doe = true;
        merged.salary = "";
        merged.teammate_salary = "";
        merged.salary_currency = merged.salary_currency || data.salary_currency || "";
        merged.teammate_salary_currency = "";
      }

      return merged;
    });

    toast.success('Auto-filled from job post.');
  } catch (err) {
    console.error(err);
    toast.error(err.message || 'Could not parse.');
  } finally {
    setLoading(false);
  }
};

  const isDayworker = formData.title === 'Dayworker';

const isOnboard = formData.work_environment === 'Onboard';
const isShoreBased = formData.work_environment === 'Shore-based';

const highlightClass = (missing) => (showMissing && missing ? 'missing-required' : '');
const autoResizeTextarea = (e) => {
  const el = e.target;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
};

const formReady = (() => {
  if (!formData.work_environment) return false;

  if (isOnboard) {
    if (
      !formData.title ||
      (!formData.salary_currency && !formData.is_doe) ||
      (!formData.salary && !formData.is_doe) ||
      !formData.type ||
      !formData.yacht_type ||
      !formData.yacht_size ||
      (!formData.start_date && !formData.is_asap && !formData.is_flexible) ||
      !formData.country ||
      (formData.team === 'Yes' && (!formData.teammate_rank || (!formData.teammate_salary && !formData.is_doe)))
    ) return false;
  }

  if (isShoreBased) {
    if (
      !formData.title ||
      (!formData.salary_currency && !formData.is_doe) ||
      (!formData.salary && !formData.is_doe) ||
      (!formData.start_date && !formData.is_asap && !formData.is_flexible) ||
      !formData.work_location ||
      (formData.work_location === 'On - site' && (!formData.city || !formData.country))
    ) return false;
  }

  return true;
})();

  const yachtSizeOptions =
  formData.title === 'Chase Boat Captain' ? chaseBoatSizes : defaultYachtSizes;

  const handleChange = (e) => {
  const { name, value, type, checked } = e.target;

  if (name === 'visas') {
    setFormData(prev => {
      const currentVisas = prev.visas || [];
      const newVisas = checked
        ? [...currentVisas, value] // Agrega la visa si está marcada
        : currentVisas.filter(v => v !== value); // Elimina la visa si no está marcada
      return { ...prev, visas: newVisas };
    });
  } else {
    setFormData(prev => {
      const newState = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };

      // 🔹 Si cambia salary_currency y hay team
      if (name === 'salary_currency' && prev.team === 'Yes') {
        newState.teammate_salary_currency = value;
      }

      // 🔹 Si selecciona Dayworker → autoasigna DayWork
      if (name === 'title' && value === 'Dayworker') {
        newState.type = 'DayWork';
      }

      // 🔹 Si marca ASAP → limpiar fecha
      if (name === 'is_asap') {
        newState.start_date = checked ? '' : prev.start_date;
        if (checked) {
          newState.is_flexible = false;
        }
      }

      if (name === 'is_flexible') {
        newState.start_date = checked ? '' : prev.start_date;
        if (checked) {
          newState.is_asap = false;
        }
      }

      // 🔹 Si cambia Start Date → desmarcar ASAP
      if (name === 'start_date' && value) {
        newState.is_asap = false;
        newState.is_flexible = false;
      }

      return newState;
    });
  }
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isOnboard = formData.work_environment === 'Onboard';
const isShoreBased = formData.work_environment === 'Shore-based';

if (!formData.work_environment) {
  toast.error('Work environment.');
  return;
}

if (isOnboard) {
  if (
    !formData.title ||
    !formData.salary_currency && !formData.is_doe ||
    !formData.salary && !formData.is_doe ||
    !formData.type ||
    !formData.yacht_type ||
    !formData.yacht_size ||
    (!formData.start_date && !formData.is_asap && !formData.is_flexible) ||
    !formData.country ||
    (formData.team === 'Yes' && (!formData.teammate_rank || (!formData.teammate_salary && !formData.is_doe)))
  ) {
    toast.error('Fill in all required fields marked with *.');
    return;
  }
}

if (isShoreBased) {
  if (
    !formData.title ||
    !formData.salary_currency && !formData.is_doe ||
    !formData.salary && !formData.is_doe ||
    (!formData.start_date && !formData.is_asap && !formData.is_flexible) ||
    !formData.work_location ||
    (formData.work_location === 'On - site' && (!formData.city || !formData.country))
  ) {
    toast.error('Fill in all required fields marked with *.');
    return;
  }
}

const sanitizedData = {
  ...formData,
  years_in_rank:
    formData.years_in_rank === 'Green'
      ? 0
      : formData.years_in_rank
      ? Number(formData.years_in_rank)
      : null,
  teammate_experience:
    formData.teammate_experience === 'Green'
      ? 0
      : formData.teammate_experience
      ? Number(formData.teammate_experience)
      : null,
};

    setLoading(true);

    if (mode === 'edit') {
  // en modo edición, delega a la función onOfferPosted que viene del modal
  await onOfferPosted(sanitizedData);
} else {
  // en modo creación, inserta como siempre
  const { error } = await supabase.from('yacht_work_offers').insert([{
    user_id: user.id,
    work_environment: sanitizedData.work_environment,
    work_location: sanitizedData.work_location || null,
    title: sanitizedData.title,
    city: sanitizedData.city,
    country: sanitizedData.country,
    type: sanitizedData.type || null,
    start_date: sanitizedData.is_asap
      ? new Date().toISOString().split('T')[0]
      : sanitizedData.is_flexible
      ? null
      : sanitizedData.start_date || null,
    end_date:
      sanitizedData.type === 'Permanent'
        ? null
        : sanitizedData.end_date || null,
    is_doe: sanitizedData.is_doe,
    salary: sanitizedData.is_doe ? null : sanitizedData.salary,
    salary_currency: sanitizedData.is_doe ? null : sanitizedData.salary_currency || null,
    years_in_rank: sanitizedData.years_in_rank,
    description: sanitizedData.description || null,
    contact_email: sanitizedData.contact_email || null,
    contact_phone: sanitizedData.contact_phone || null,
    team: sanitizedData.team === 'Yes',
    teammate_rank: sanitizedData.team === 'Yes' ? sanitizedData.teammate_rank || null : null,
    teammate_salary: sanitizedData.team === 'Yes' ? sanitizedData.teammate_salary || null : null,
    teammate_salary_currency: sanitizedData.team === 'Yes' ? sanitizedData.teammate_salary_currency || null : null,
    teammate_experience: sanitizedData.team === 'Yes' ? sanitizedData.teammate_experience || null : null,
    flag: sanitizedData.flag || null,
    yacht_size: sanitizedData.yacht_size || null,
    yacht_type: sanitizedData.yacht_type || null,
    uses: sanitizedData.uses || null,
    homeport: sanitizedData.homeport || null,
    liveaboard: sanitizedData.liveaboard || null,
    season_type: sanitizedData.season_type || null,
    is_asap: sanitizedData.is_asap,
    is_tips: sanitizedData.is_tips,
    is_flexible: sanitizedData.is_flexible,
    holidays: sanitizedData.holidays ? Number(sanitizedData.holidays) : null,
    language_1: sanitizedData.language_1 || null,
    language_1_fluency: sanitizedData.language_1_fluency || null,
    language_2: sanitizedData.language_2 || null,
    language_2_fluency: sanitizedData.language_2_fluency || null,
    propulsion_type: sanitizedData.propulsion_type || null,
    gender: sanitizedData.gender || null, // null = Any
    visas: Array.isArray(sanitizedData.visas) ? sanitizedData.visas : [],
  }]);

  if (error) {
    console.error('Error posting the offer:', error);
    toast.error('Something went wrong. Please try again.');
  } else {
    toast.success('Offer posted successfully.');
    setFormData(initialState);
    onOfferPosted(); // en modo creación esto puede ser una recarga o mensaje
  }
}

    setLoading(false);
};

  return (
  <>
    {loading && (
      <div className="form-loading-overlay">
        <img
          src="/logos/Iniciales.png"
          alt="Loading logo"
          className="floating-logo"
        />
        <p style={{
          marginTop: 20,
          fontSize: 20,
          color: '#ffffff',
          fontWeight: 700,
          fontFamily: 'sans-serif',
          textShadow: '1px 1px 3px rgba(0, 0, 0, 0.6)',
        }}>
          Almost there...
        </p>
      </div>
    )}
    
    <div className="container">

    <div className="login-form">
    <h2 style={{ textAlign: 'center', color: 'var(--primary-color)', marginBottom: '20px' }}>
    Job Offer Form
    </h2>
    <form onSubmit={handleSubmit}>

    {/* === Paste job post (optional) === */}
<div style={{ marginBottom: 16, borderBottom: '1px solid #eee', paddingBottom: 12 }}>
  <button
    type="button"
    onClick={() => setShowPaste((v) => !v)}
    className="btn btn-light"
    style={{ marginBottom: 8 }}
  >
    {showPaste ? 'Hide Smart Paste' : 'Smart Paste (Optional)'}
  </button>

  {showPaste && (
    <div>
      <p style={{ margin: '6px 0 8px', fontSize: 13, color: '#666' }}>
        Paste the job text. <b>Smart Paste</b> will automatically fill the form fields for you.
      </p>
      <textarea
        className="form-control"
        rows={5}
        value={jobText}
        onChange={(e) => setJobText(e.target.value)}
        placeholder="Paste the job post here…"
        style={{ width: '100%' }}
      />
      <div>
        <button
          type="button"
          onClick={autoFillFromText}
          className="btn btn-secondary"
          style={{ marginTop: 8 }}
        >
          Auto-Fill Fields
        </button>
      </div>
    </div>
  )}
</div>

    {mode !== 'edit' && (
  <>
    <label>Work Environment:</label>
    <select
      name="work_environment"
      value={formData.work_environment}
      onChange={handleChange}
      className={highlightClass(!formData.work_environment)}
      required
    >
      <option value="">Select...</option>
      <option value="Onboard">Onboard</option>
      <option value="Shore-based">Shore-based</option>
    </select>
  </>
)}

    {/* Mostrar solo si ya se seleccionó un entorno */}
    {formData.work_environment === '' && (
      <p style={{ marginTop: '1em', fontStyle: 'italic' }}>
        Select a work environment to continue...
      </p>
    )}

    {formData.work_environment === 'Onboard' && (
      <>

    {/* 1. Team */}
    <label>Team</label>
    <select name="team" value={formData.team} onChange={handleChange}>
      <option value="No">No</option>
      <option value="Yes">Yes</option>
    </select>

    {/* 2. Título del puesto */}
    <label>Rank: <span style={{ color: 'red' }}>*</span></label>
    <select
      name="title"
      value={formData.title}
      onChange={handleChange}
      className={highlightClass(!formData.title)}
      required
    >
      <option value="">Select...</option>
      {titles.map((t) => <option key={t} value={t}>{t}</option>)}
    </select>

    {/* 3. Años en el cargo */}
    <label>Time in Rank:</label>
    <select name="years_in_rank" value={formData.years_in_rank} onChange={handleChange}>
      <option value="">Select...</option>
      {yearsOptions.map((y) => (
        <option key={y} value={y}>{y === 'Green' ? 'Green' : `>${y}`}</option>
      ))}
    </select>

    {/* 3.5. Gender Requirement (solo si Team === 'No') */}
      {formData.team === 'No' && (
        <>
          <label>Gender:</label>
          <select name="gender" value={formData.gender} onChange={handleChange}>
            <option value="">Any</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </>
      )}

{/* 6. Salary */}
{!formData.is_doe && (
  <>
    <label>Salary Currency: <span style={{ color: 'red' }}>*</span></label>
    <select
      name="salary_currency"
      value={formData.salary_currency}
      onChange={handleChange}
      className={highlightClass(!formData.salary_currency && !formData.is_doe)}
      required
    >
      <option value="">Select currency...</option>
      <option value="USD">USD</option>
      <option value="EUR">EUR</option>
      <option value="AUD">AUD</option>
      <option value="GBP">GBP</option>
    </select>

    <label>Salary: <span style={{ color: 'red' }}>*</span></label>
    <input
      type="number"
      name="salary"
      value={formData.salary || ''}
      onChange={handleChange}
      className={highlightClass(!formData.salary && !formData.is_doe)}
    />
  </>
)}

{/* 5. DOE */}
<div className="form-group salary-extra-row"> 
  <label className="form-checkbox-label"> 
    <input
      type="checkbox"
      name="is_doe"
      checked={formData.is_doe}
      onChange={handleChange}
    />
    <span>DOE (Salary)</span>
  </label>
  <label className="form-checkbox-label"> 
    <input
      type="checkbox"
      name="is_tips"
      checked={formData.is_tips}
      onChange={handleChange}
    />
    <span>+ Tips</span>
  </label>
</div>

{/* 6-8. Campos si Team === 'Yes' */}
{formData.team === 'Yes' && (
  <>
    <label>Teammate Rank: <span style={{ color: 'red' }}>*</span></label>
    <select
      name="teammate_rank"
      value={formData.teammate_rank}
      onChange={handleChange}
      className={highlightClass(formData.team === 'Yes' && !formData.teammate_rank)}
    >
      <option value="">Select...</option>
      {titles.map((t) => <option key={t} value={t}>{t}</option>)}
    </select>

    <label>Teammate Experience:</label>
    <select name="teammate_experience" value={formData.teammate_experience} onChange={handleChange}>
      <option value="">Select...</option>
      {yearsOptions.map((y) => (
        <option key={y} value={y}>{y === 'Green' ? 'Green' : `>${y}`}</option>
      ))}
    </select>

    {!formData.is_doe && (
      <>
        <label>Teammate Salary: <span style={{ color: 'red' }}>*</span></label>
<div className="form-inline-group">
  <span>{formData.teammate_salary_currency}</span>
  <input
    type="number"
    name="teammate_salary"
    value={formData.teammate_salary || ''}
    onChange={handleChange}
    className={highlightClass(formData.team === 'Yes' && !formData.is_doe && !formData.teammate_salary)}
  />
</div>
      </>
    )}
  </>
)}

{/* Languages */}
<label>Languages:</label>

<div className="form-inline-group">
  <select name="language_1" value={formData.language_1} onChange={handleChange}>
    <option value="">Language 1...</option>
    <option value="Arabic">Arabic</option>
    <option value="Dutch">Dutch</option>
    <option value="English">English</option>
    <option value="French">French</option>
    <option value="German">German</option>
    <option value="Greek">Greek</option>
    <option value="Italian">Italian</option>
    <option value="Mandarin">Mandarin</option>
    <option value="Portuguese">Portuguese</option>
    <option value="Russian">Russian</option>
    <option value="Spanish">Spanish</option>
    <option value="Turkish">Turkish</option>
    <option value="Ukrainian">Ukrainian</option>
  </select>

  <select name="language_1_fluency" value={formData.language_1_fluency} onChange={handleChange}>
    <option value="">Fluency...</option>
    <option value="Native">Native</option>
    <option value="Fluent">Fluent</option>
    <option value="Conversational">Conversational</option>
  </select>
</div>

<div className="form-inline-group">
  <select name="language_2" value={formData.language_2} onChange={handleChange}>
    <option value="">Language 2...</option>
    <option value="Arabic">Arabic</option>
    <option value="Dutch">Dutch</option>
    <option value="English">English</option>
    <option value="French">French</option>
    <option value="German">German</option>
    <option value="Greek">Greek</option>
    <option value="Italian">Italian</option>
    <option value="Mandarin">Mandarin</option>
    <option value="Portuguese">Portuguese</option>
    <option value="Russian">Russian</option>
    <option value="Spanish">Spanish</option>
    <option value="Turkish">Turkish</option>
    <option value="Ukrainian">Ukrainian</option>
  </select>

  <select name="language_2_fluency" value={formData.language_2_fluency} onChange={handleChange}>
    <option value="">Fluency...</option>
    <option value="Native">Native</option>
    <option value="Fluent">Fluent</option>
    <option value="Conversational">Conversational</option>
  </select>
</div>

  {/* Campo Visas */}
<label htmlFor="visas-trigger">Visa(s):</label>
<div
  className={`custom-multiselect ${showVisas ? 'open' : ''}`}
  ref={visasRef}
>
  <button
    type="button"
    id="visas-trigger"
    className="multiselect-trigger"
    onClick={() => setShowVisas((v) => !v)}
  >
    {formData.visas.length > 0 ? formData.visas.join(', ') : 'Select...'}
    <span className={`caret ${showVisas ? 'up' : ''}`} aria-hidden>▾</span>
  </button>

  <div className="multiselect-options">
    {visaOptions.map((visa) => (
      <label key={visa} className="form-checkbox-label">
        <input
          type="checkbox"
          name="visas"
          value={visa}
          checked={formData.visas.includes(visa)}
          onChange={handleChange}
        />
        {visa}
      </label>
    ))}
  </div>
</div>

    {/* 9. Tipo */}
    <label>Terms: <span style={{ color: 'red' }}>*</span></label>
<select
  name="type"
  value={isDayworker ? 'DayWork' : formData.type}
  onChange={handleChange}
  className={highlightClass(!isDayworker && !formData.type)}
  required
  disabled={isDayworker}
>
  <option value="">Select...</option>
  {types.map((t) => <option key={t} value={t}>{t}</option>)}
</select>

    {/* Liveaboard */}
    <label>Liveaboard:</label>
<select
  name="liveaboard"
  value={formData.liveaboard}
  onChange={handleChange}
  disabled={isDayworker}
>
      <option value="">Select...</option>
      <option value="No">No</option>
      <option value="Own Cabin">Own Cabin</option>
      <option value="Share Cabin">Share Cabin</option>
      <option value="Flexible">Flexible</option>
    </select>

    {/* Use */}
    <label>Use:</label>
<select
  name="uses"
  value={formData.uses}
  onChange={handleChange}
  disabled={isDayworker}
>
      <option value="">Select...</option>
      <option value="Private">Private</option>
      <option value="Charter (only)">Charter (only)</option>
      <option value="Private/Charter">Private/Charter</option>
    </select>

    {/* Season Type */}
    <label>Season Type:</label>
<select
  name="season_type"
  value={formData.season_type}
  onChange={handleChange}
  disabled={isDayworker}
>
      <option value="">Select...</option>
      <option value="Single Season">Single Season</option>
      <option value="Dual Season">Dual Season</option>
      <option value="Year-round">Year-round</option>
    </select>

    {/* 10. Tipo de Yate */}
    <label>Yacht Type: <span style={{ color: 'red' }}>*</span></label>
    <select
      name="yacht_type"
      value={formData.yacht_type}
      onChange={handleChange}
      className={highlightClass(!formData.yacht_type)}
    >
      <option value="">Select...</option>
      <option value="Motor Yacht">Motor Yacht</option>
      <option value="Sailing Yacht">Sailing Yacht</option>
      <option value="Chase Boat">Chase Boat</option>
      <option value="Sailing Catamaran">Sailing Catamaran</option>
      <option value="Motor Catamaran">Motor Catamaran</option>
      <option value="Support Yacht">Support Yacht</option>
      <option value="Expedition Yacht">Expedition Yacht</option>
    </select>

    {/* 11. Tamaño del Yate */}
<label>Yacht Size: <span style={{ color: 'red' }}>*</span></label>
<select
  name="yacht_size"
  value={formData.yacht_size}
  onChange={handleChange}
  className={highlightClass(!formData.yacht_size)}
>
  <option value="">Select...</option>
  {yachtSizeOptions.map((size) => (
    <option key={size} value={size}>{size}</option>
  ))}
</select>

    {/* 11.5 Propulsion Type (solo para ciertos rangos) */}
{['Captain', 'Relief Captain', 'Skipper', 'Captain/Engineer'].includes(formData.title) && (
  <>
    <label>Propulsion Type:</label>
    <select name="propulsion_type" value={formData.propulsion_type} onChange={handleChange}>
      <option value="">Select...</option>
      <option value="Shaft Drive">Shaft Drive</option>
      <option value="Waterjet">Waterjet</option>
      <option value="Pod Drive">Pod Drive</option>
      <option value="Arneson Drive">Arneson Drive</option>
    </select>
  </>
)}

    {/* Homeport */}
    <label>Homeport:</label>
    <input
      type="text"
      name="homeport"
      value={formData.homeport}
      onChange={handleChange}
/>

    {/* 12. Flag */}
    <label>Flag:</label>
    <select name="flag" value={formData.flag} onChange={handleChange}>
      <option value="">Select...</option>
      {['Foreign Flag', 'United States', 'Cayman Islands', 'Marshall Islands', 'Malta', 'Panama', 'Bermuda', 'BVI', 'UK', 'France', 'Italy', 'Spain', 'Holland', 'Greece', 'Germany', 'Portugal', 'Cyprus', 'Isle of Man', 'Gibraltar', 'Jersey', 'Guernsey', 'Belgium', 'Australia', 'Poland', 'Delaware', 'Cook Islands', 'Langkawi', 'Jamaica', 'San Marino', 'Hong Kong', 'Singapore'].map((f) => (
        <option key={f} value={f}>{f}</option>
      ))}
    </select>

    {/* 13. Fecha de Inicio */}
<label>Start Date: <span style={{ color: 'red' }}>*</span></label>
<input
  type="date"
  name="start_date"
  value={formData.start_date}
  onChange={handleChange}
  className={highlightClass(!formData.start_date && !formData.is_asap && !formData.is_flexible)}
  required={!formData.is_asap && !formData.is_flexible}
  disabled={formData.is_asap || formData.is_flexible}
/>

{/* ASAP Option */}
<div className="form-group asap-flex-row">
  <label className="form-checkbox-label">
    <input
      type="checkbox"
      name="is_asap"
      checked={formData.is_asap}
      onChange={handleChange}
      disabled={formData.is_flexible}
    />
    <span>ASAP</span>
  </label>
  <label className="form-checkbox-label">
    <input
      type="checkbox"
      name="is_flexible"
      checked={formData.is_flexible}
      onChange={handleChange}
      disabled={formData.is_asap}
    />
    <span>Flexible</span>
  </label>
</div>

    {/* 14. Fecha de Finalización */}
    <label>End Date:</label>
    <input
      type="date"
      name="end_date"
      value={formData.end_date}
      onChange={handleChange}
      disabled={formData.type === 'Permanent'}
    />

    {/* Holidays */}
    <label>Holidays (Days per year):</label>
    <input
      type="number"
      step="0.1"
      name="holidays"
      value={formData.holidays || ''}
      onChange={handleChange}
      disabled={isDayworker}
    />

    {/* 15. Ciudad */}
    <label>City:</label>
    <input name="city" value={formData.city} onChange={handleChange} />

    {/* 16. Country/Region */}
<label>Country/Region: <span style={{ color: 'red' }}>*</span></label>
<select
  name="country"
  value={formData.country}
  onChange={handleChange}
  className={highlightClass(!formData.country)}
  required
>
  <option value="">Select...</option>

  <optgroup label="Regions">
    <option value="Asia">Asia</option>
    <option value="Baltic">Baltic</option>
    <option value="Caribbean">Caribbean</option>
    <option value="Indian Ocean">Indian Ocean</option>
    <option value="Mediterranean">Mediterranean</option>
    <option value="North Sea">North Sea</option>
    <option value="Pacific">Pacific</option>
  </optgroup>

  <optgroup label="Countries">
    {countries.map((c) => (
      <option key={c} value={c}>{c}</option>
    ))}
  </optgroup>
</select>

    {/* 17. Email de contacto */}
    <label>Contact Email:</label>
    <input type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} />

    {/* 18. Teléfono de contacto */}
    <label>Contact Phone:</label>
    <input type="tel" name="contact_phone" value={formData.contact_phone} onChange={handleChange} />

    {/* 19. Descripción */}
    <label>Remarks:</label>
    <textarea
      className="remarks-textarea"
      name="description"
      rows={5}
      value={formData.description}
      onChange={handleChange}
      onInput={autoResizeTextarea}
      onFocus={autoResizeTextarea}
      style={{ overflow: 'hidden', resize: 'none' }}
    />

          </>
    )}

    {formData.work_environment === 'Shore-based' && (
  <>
    {/* Position */}
    <label>Position: <span style={{ color: 'red' }}>*</span></label>
    <input
      name="title"
      value={formData.title}
      onChange={handleChange}
      className={highlightClass(!formData.title)}
      required
    />

    {/* Salary */}
    {!formData.is_doe && (
      <>
        <label>Salary Currency: <span style={{ color: 'red' }}>*</span></label>
        <select
          name="salary_currency"
          value={formData.salary_currency}
          onChange={handleChange}
          className={highlightClass(!formData.salary_currency && !formData.is_doe)}
          required
        >
          <option value="">Select currency...</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="AUD">AUD</option>
          <option value="GBP">GBP</option>
        </select>

        <label>Salary: <span style={{ color: 'red' }}>*</span></label>
        <input
          type="number"
          name="salary"
          value={formData.salary || ''}
          onChange={handleChange}
          className={highlightClass(!formData.salary && !formData.is_doe)}
        />
      </>
    )}

    {/* DOE */}
    <div className="form-group salary-extra-row"> 
  <label className="form-checkbox-label"> 
    <input
      type="checkbox"
      name="is_doe"
      checked={formData.is_doe}
      onChange={handleChange}
    />
    <span>DOE (Salary)</span>
  </label>
  <label className="form-checkbox-label"> 
    <input
      type="checkbox"
      name="is_tips"
      checked={formData.is_tips}
      onChange={handleChange}
    />
    <span>+ Tips</span>
  </label>
</div>

    {/* Languages */}
    <label>Languages:</label>
    <div className="form-inline-group">
      <select name="language_1" value={formData.language_1} onChange={handleChange}>
        <option value="">Language 1...</option>
        <option value="Arabic">Arabic</option>
        <option value="Dutch">Dutch</option>
        <option value="English">English</option>
        <option value="French">French</option>
        <option value="German">German</option>
        <option value="Greek">Greek</option>
        <option value="Italian">Italian</option>
        <option value="Mandarin">Mandarin</option>
        <option value="Portuguese">Portuguese</option>
        <option value="Russian">Russian</option>
        <option value="Spanish">Spanish</option>
        <option value="Turkish">Turkish</option>
        <option value="Ukrainian">Ukrainian</option>
      </select>

      <select name="language_1_fluency" value={formData.language_1_fluency} onChange={handleChange}>
        <option value="">Fluency...</option>
        <option value="Native">Native</option>
        <option value="Fluent">Fluent</option>
        <option value="Conversational">Conversational</option>
      </select>
    </div>

    
      <div className="form-inline-group">
      <select name="language_2" value={formData.language_2} onChange={handleChange}>
        <option value="">Language 2...</option>
        <option value="Arabic">Arabic</option>
        <option value="Dutch">Dutch</option>
        <option value="English">English</option>
        <option value="French">French</option>
        <option value="German">German</option>
        <option value="Greek">Greek</option>
        <option value="Italian">Italian</option>
        <option value="Mandarin">Mandarin</option>
        <option value="Portuguese">Portuguese</option>
        <option value="Russian">Russian</option>
        <option value="Spanish">Spanish</option>
        <option value="Turkish">Turkish</option>
        <option value="Ukrainian">Ukrainian</option>
      </select>

      <select name="language_2_fluency" value={formData.language_2_fluency} onChange={handleChange}>
        <option value="">Fluency...</option>
        <option value="Native">Native</option>
        <option value="Fluent">Fluent</option>
        <option value="Conversational">Conversational</option>
      </select>
    </div>

    {/* Start Date */}
    <label>Start Date: <span style={{ color: 'red' }}>*</span></label>
    <input
      type="date"
      name="start_date"
      value={formData.start_date}
      onChange={handleChange}
      className={highlightClass(!formData.start_date && !formData.is_asap && !formData.is_flexible)}
      required={!formData.is_asap && !formData.is_flexible}
      disabled={formData.is_asap || formData.is_flexible}
    />

    {/* ASAP */}
    <div className="form-group asap-flex-row">
      <label className="form-checkbox-label">
        <input
          type="checkbox"
          name="is_asap"
          checked={formData.is_asap}
          onChange={handleChange}
          disabled={formData.is_flexible}
        />
        <span>ASAP</span>
      </label>
      <label className="form-checkbox-label">
        <input
          type="checkbox"
          name="is_flexible"
          checked={formData.is_flexible}
          onChange={handleChange}
          disabled={formData.is_asap}
        />
        <span>Flexible</span>
      </label>
    </div>

    {/* End Date */}
    <label>End Date:</label>
    <input
      type="date"
      name="end_date"
      value={formData.end_date}
      onChange={handleChange}
    />

    {/* Work Location */}
    <label>Work Location: <span style={{ color: 'red' }}>*</span></label>
    <select
      name="work_location"
      value={formData.work_location}
      onChange={handleChange}
      className={highlightClass(!formData.work_location)}
    >
      <option value="">Select...</option>
      <option value="Remote">Remote</option>
      <option value="On - site">On - site</option>
    </select>

    {/* City & Country if On - site */}
    {formData.work_location === 'On - site' && (
      <>
        <label>City: <span style={{ color: 'red' }}>*</span></label>
        <input
          name="city"
          value={formData.city}
          onChange={handleChange}
          className={highlightClass(formData.work_location === 'On - site' && !formData.city)}
          required
        />

        <label>Country: <span style={{ color: 'red' }}>*</span></label>
        <select
          name="country"
          value={formData.country}
          onChange={handleChange}
          className={highlightClass(formData.work_location === 'On - site' && !formData.country)}
          required
        >
          <option value="">Select...</option>
          {countries.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </>
    )}

    {/* Contact Email */}
    <label>Contact Email:</label>
    <input
      type="email"
      name="contact_email"
      value={formData.contact_email}
      onChange={handleChange}
    />

    {/* Contact Phone */}
    <label>Contact Phone:</label>
    <input
      type="tel"
      name="contact_phone"
      value={formData.contact_phone}
      onChange={handleChange}
    />

    {/* Remarks */}
<label>Remarks:</label>
<textarea
  className="remarks-textarea"
  name="description"
  rows={5}
  value={formData.description}
  onChange={handleChange}
  onInput={autoResizeTextarea}
  onFocus={autoResizeTextarea}
  style={{ overflow: 'hidden', resize: 'none' }}
/>
  </>
)}

    {/* Submit */}
    <p style={{ fontStyle: 'italic', marginTop: '1.5em' }}><span style={{ color: 'red' }}>*</span> Required</p>
    <div style={{ position: 'relative' }}>
      <button
        type="submit"
        className="landing-button"
        disabled={loading || !formReady}
      >
        {loading ? (mode === 'edit' ? 'Updating...' : 'Posting...') : (mode === 'edit' ? 'Update Offer' : 'Post Offer')}
      </button>
      {!loading && !formReady && (
        <div
          onClick={() => setShowMissing(true)}
          style={{
            position: 'absolute',
            inset: 0,
            cursor: 'not-allowed',
            background: 'transparent',
          }}
          aria-hidden="true"
        />
      )}
    </div>
    {showMissing && !formReady && (
      <p style={{ marginTop: 8, color: '#b00020' }}>
        Some required fields are missing. Please complete them to post the offer.
      </p>
    )}
  </form>
  </div>
  </div>
  </>
  );
}

export default YachtOfferForm;





