import React, { useState } from 'react';
import supabase from '../supabase'; // ✅ Ruta corregida según tu estructura

const initialState = {
  title: '',
  city: '',
  country: '',
  type: '',
  start_date: '',
  end_date: '',
  salary: '',
  is_doe: false,
  years_in_rank: '',
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
  flag: '',
  yacht_size: '',
  yacht_type: '',
  uses: '',
  homeport: '',
  liveaboard: '',
  season_type: '',
  holidays: '',
  is_asap: false,
  language_1: '',
  language_1_fluency: '',
  language_2: '',
  language_2_fluency: '',
  salary_currency: '',
  teammate_salary_currency: '',
};

const titles = ['Captain', 'Captain/Engineer', 'Skipper', 'Chase Boat Captain', 'Relief Captain', 'Chief Officer', '2nd Officer', '3rd Officer', 'Bosun', 'Deck/Engineer', 'Mate', 'Lead Deckhand', 'Deckhand', 'Deck/Steward(ess)', 'Deck/Carpenter', 'Deck/Divemaster', 'Dayworker', 'Chief Engineer', '2nd Engineer', '3rd Engineer', 'Solo Engineer', 'Electrician', 'Head Chef', 'Sous Chef', 'Solo Chef', 'Cook/Crew Chef', 'Chief Steward(ess)', '2nd Steward(ess)', '3rd Stewardess', 'Solo Steward(ess)', 'Junior Steward(ess)', 'Cook/Steward(ess)', 'Stew/Deck', 'Laundry/Steward(ess)', 'Stew/Masseur', 'Masseur', 'Hairdresser/Barber', 'Nanny', 'Videographer', 'Yoga/Pilates Instructor', 'Personal Trainer', 'Dive Instrutor', 'Water Sport Instrutor', 'Nurse', 'Other']; // ajusta según lista oficial

const countries = ["Albania", "Anguilla", "Antigua and Barbuda", "Argentina", "Aruba", "Australia", "Bahamas", "Bahrain", "Barbados",
    "Belgium", "Belize", "Bonaire", "Brazil", "Brunei", "Bulgaria", "BVI, UK", "Cambodia", "Canada", "Cape Verde",
    "Chile", "China", "Colombia", "Costa Rica", "Croatia", "Cuba", "Curacao", "Cyprus", "Denmark", "Dominica",
    "Dominican Republic", "Ecuador", "Egypt", "Estonia", "Fiji", "Finland", "France", "Germany",
    "Greece", "Grenada", "Guatemala", "Honduras", "India", "Indonesia", "Ireland", "Israel",
    "Italy", "Jamaica", "Japan", "Kiribati", "Kuwait", "Latvia", "Libya", "Lithuania", "Madagascar",
    "Malaysia", "Maldives", "Malta", "Marshall Islands", "Mauritius", "Mexico", "Micronesia",
    "Monaco", "Montenegro", "Morocco", "Myanmar", "Netherlands", "New Zealand", "Nicaragua",
    "Norway", "Panama", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Saint Kitts and Nevis",
    "Saint Lucia", "Saint Maarten", "Saint Vincent and the Grenadines", "Samoa", "Saudi Arabia", "Seychelles",
    "Singapore", "Solomon Islands", "South Africa", "South Korea", "Spain", "Sweden", "Taiwan",
    "Thailand", "Trinidad and Tobago", "Tunisia", "Turkey", "United Arab Emirates", "United Kingdom",
    "United States", "Uruguay", "Vanuatu", "Venezuela", "Vietnam"];

const types = ['Rotational', 'Permanent', 'Temporary', 'Seasonal', 'Relief', 'Delivery', 'Cruising', 'DayWork'];
const yearsOptions = ['Green', 1, 2, 2.5, 3, 5];

function YachtOfferForm({ user, onOfferPosted }) {
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });

    if (name === 'salary_currency' && formData.team === 'Yes') {
      setFormData((prev) => ({
        ...prev,
        teammate_salary_currency: value,
      }));  
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.city || !formData.country || !formData.type || (!formData.start_date && !formData.is_asap)) {
  alert('Por favor completa los campos obligatorios.');
  return;
}
    if (!formData.is_doe && !formData.salary) {
      alert('Ingresa un salario o selecciona la opción DOE.');
      return;
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

    const { error } = await supabase.from('yacht_work_offers').insert([{
  user_id: user.id,
  title: sanitizedData.title,
  city: sanitizedData.city,
  country: sanitizedData.country,
  type: sanitizedData.type,
  start_date: sanitizedData.is_asap
  ? new Date().toISOString().split('T')[0]  // fecha actual
  : sanitizedData.start_date || null,
  end_date: sanitizedData.type === 'Permanent' ? null : (sanitizedData.end_date || null),
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
  holidays: sanitizedData.holidays ? Number(sanitizedData.holidays) : null,
  language_1: sanitizedData.language_1 || null,
  language_1_fluency: sanitizedData.language_1_fluency || null,
  language_2: sanitizedData.language_2 || null,
  language_2_fluency: sanitizedData.language_2_fluency || null,
}]);

    setLoading(false);

    if (error) {
      console.error('Error al publicar oferta:', error);
      alert('Hubo un error. Intenta nuevamente.');
    } else {
      alert('Oferta publicada exitosamente.');
      setFormData(initialState);
      onOfferPosted();
    }
  };

  return (
  <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }}>
    {/* 1. Team */}
    <label>Team</label>
    <select name="team" value={formData.team} onChange={handleChange}>
      <option value="No">No</option>
      <option value="Yes">Yes</option>
    </select>

    {/* 2. Título del puesto */}
    <label>Rank:</label>
    <select name="title" value={formData.title} onChange={handleChange} required>
      <option value="">Selecciona...</option>
      {titles.map((t) => <option key={t} value={t}>{t}</option>)}
    </select>

    {/* 3. Años en el cargo */}
    <label>Time in Rank:</label>
    <select name="years_in_rank" value={formData.years_in_rank} onChange={handleChange}>
      <option value="">Selecciona...</option>
      {yearsOptions.map((y) => (
        <option key={y} value={y}>{y === 'Green' ? 'Green' : `>${y}`}</option>
      ))}
    </select>

{/* 6. Salary */}
{!formData.is_doe && (
  <>
    <label>Salary Currency:</label>
    <select
      name="salary_currency"
      value={formData.salary_currency}
      onChange={handleChange}
      required
    >
      <option value="">Select currency...</option>
      <option value="USD">USD</option>
      <option value="EUR">EUR</option>
      <option value="AUD">AUD</option>
      <option value="GBP">GBP</option>
    </select>

    <label>Salary:</label>
    <input type="number" name="salary" value={formData.salary || ''} onChange={handleChange} />
  </>
)}

{/* 5. DOE */}
<label>
  <input type="checkbox" name="is_doe" checked={formData.is_doe} onChange={handleChange} />
  DOE (Salary)
</label>

{/* 6-8. Campos si Team === 'Yes' */}
{formData.team === 'Yes' && (
  <>
    <label>Teammate Rank:</label>
    <select name="teammate_rank" value={formData.teammate_rank} onChange={handleChange}>
      <option value="">Selecciona...</option>
      {titles.map((t) => <option key={t} value={t}>{t}</option>)}
    </select>

    <label>Teammate Experience:</label>
    <select name="teammate_experience" value={formData.teammate_experience} onChange={handleChange}>
      <option value="">Selecciona...</option>
      {yearsOptions.map((y) => (
        <option key={y} value={y}>{y === 'Green' ? 'Green' : `>${y}`}</option>
      ))}
    </select>

    {!formData.is_doe && (
      <>
        <label>Teammate Salary:</label>
<div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
  <span>{formData.teammate_salary_currency}</span>
  <input
    type="number"
    name="teammate_salary"
    value={formData.teammate_salary || ''}
    onChange={handleChange}
  />
</div>
      </>
    )}
  </>
)}

{/* Languages */}
<label>Languages:</label>

<div>
  <select name="language_1" value={formData.language_1} onChange={handleChange}>
    <option value="">Idioma 1...</option>
    <option value="English">English</option>
    <option value="Spanish">Spanish</option>
    <option value="Italian">Italian</option>
    <option value="French">French</option>
    <option value="Portuguese">Portuguese</option>
    <option value="Greek">Greek</option>
    <option value="Russian">Russian</option>
    <option value="Dutch">Dutch</option>
  </select>

  <select name="language_1_fluency" value={formData.language_1_fluency} onChange={handleChange}>
    <option value="">Fluidez...</option>
    <option value="Native">Native</option>
    <option value="Fluent">Fluent</option>
    <option value="Conversational">Conversational</option>
  </select>
</div>

<div>
  <select name="language_2" value={formData.language_2} onChange={handleChange}>
    <option value="">Idioma 2...</option>
    <option value="English">English</option>
    <option value="Spanish">Spanish</option>
    <option value="Italian">Italian</option>
    <option value="French">French</option>
    <option value="Portuguese">Portuguese</option>
    <option value="Greek">Greek</option>
    <option value="Russian">Russian</option>
    <option value="Dutch">Dutch</option>
  </select>

  <select name="language_2_fluency" value={formData.language_2_fluency} onChange={handleChange}>
    <option value="">Fluidez...</option>
    <option value="Native">Native</option>
    <option value="Fluent">Fluent</option>
    <option value="Conversational">Conversational</option>
  </select>
</div>

    {/* 9. Tipo */}
    <label>Terms:</label>
    <select name="type" value={formData.type} onChange={handleChange} required>
      <option value="">Selecciona...</option>
      {types.map((t) => <option key={t} value={t}>{t}</option>)}
    </select>

    {/* Liveaboard */}
    <label>Liveaboard:</label>
    <select name="liveaboard" value={formData.liveaboard} onChange={handleChange}>
      <option value="">Selecciona...</option>
      <option value="No">No</option>
      <option value="Own Cabin">Own Cabin</option>
      <option value="Share Cabin">Share Cabin</option>
    </select>

    {/* Season Type */}
    <label>Season Type:</label>
    <select name="season_type" value={formData.season_type} onChange={handleChange}>
      <option value="">Selecciona...</option>
      <option value="Single Season">Single Season</option>
      <option value="Dual Season">Dual Season</option>
    </select>

    {/* 10. Tipo de Yate */}
    <label>Yacht Type:</label>
    <select name="yacht_type" value={formData.yacht_type} onChange={handleChange}>
      <option value="">Selecciona...</option>
      <option value="Motor Yacht">Motor Yacht</option>
      <option value="Sailing Yacht">Sailing Yacht</option>
      <option value="Chase Boat">Chase Boat</option>
      <option value="Catamaran">Catamaran</option>
    </select>

    {/* 11. Tamaño del Yate */}
    <label>Yacht Size:</label>
    <select name="yacht_size" value={formData.yacht_size} onChange={handleChange}>
      <option value="">Selecciona...</option>
      <option value="0 - 30m">0 - 30m</option>
      <option value="31 - 40m">31 - 40m</option>
      <option value="41 - 50m">41 - 50m</option>
      <option value="51 - 70m">51 - 70m</option>
      <option value="> 70m">{'> 70m'}</option>
    </select>

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
      <option value="">Selecciona...</option>
      {['USA', 'Cayman Islands', 'Bermuda', 'UK', 'BVI', 'Jamaica', 'Marshall Islands', 'Malta', 'Panama', 'Holland', 'Germany', 'Poland', 'Spain', 'Portugal', 'Greece', 'Italy', 'France', 'Australia', 'China'].map((f) => (
        <option key={f} value={f}>{f}</option>
      ))}
    </select>

    {/* 13. Fecha de Inicio */}
   {/* Start Date */}
<label>Start Date:</label>
<input
  type="date"
  name="start_date"
  value={formData.start_date}
  onChange={handleChange}
  required={!formData.is_asap}
  disabled={formData.is_asap}
/>

{/* ASAP Option */}
<label>
  <input
    type="checkbox"
    name="is_asap"
    checked={formData.is_asap}
    onChange={handleChange}
  />
  ASAP
</label>

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
    <label>Holidays (Days per month):</label>
    <input
      type="number"
      step="0.1"
      name="holidays"
      value={formData.holidays || ''}
      onChange={handleChange}
    />

    {/* 15. Ciudad */}
    <label>City:</label>
    <input name="city" value={formData.city} onChange={handleChange} required />

    {/* 16. País */}
    <label>Country:</label>
    <select name="country" value={formData.country} onChange={handleChange} required>
      <option value="">Selecciona...</option>
      {countries.map((c) => <option key={c} value={c}>{c}</option>)}
    </select>

    {/* 17. Email de contacto */}
    <label>Contact Email:</label>
    <input type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} />

    {/* 18. Teléfono de contacto */}
    <label>Contact Phone:</label>
    <input type="tel" name="contact_phone" value={formData.contact_phone} onChange={handleChange} />

    {/* 19. Descripción */}
    <label>Remarks:</label>
    <textarea name="description" value={formData.description} onChange={handleChange} />

    {/* Submit */}
    <button type="submit" disabled={loading}>
      {loading ? 'Publicando...' : 'Publicar Oferta'}
    </button>
  </form>
  );
}

export default YachtOfferForm;