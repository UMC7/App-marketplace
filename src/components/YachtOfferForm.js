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
};

const titles = ['Deckhand', 'Engineer', 'Chef', 'Stewardess', 'Captain']; // ajusta según lista oficial

const countries = [
  "Albania", "Anguilla", "Antigua and Barbuda", "Argentina", "Aruba", "Australia", "Bahamas", "Bahrain", "Barbados",
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
  "United States", "Uruguay", "Vanuatu", "Venezuela", "Vietnam"
];

const types = ['Permanent', 'Temporary', 'Relief', 'Delivery', 'Day Work'];
const yearsOptions = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6];

function YachtOfferForm({ user, onOfferPosted }) {
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.city || !formData.country || !formData.type || !formData.start_date) {
      alert('Por favor completa los campos obligatorios.');
      return;
    }
    if (!formData.is_doe && !formData.salary) {
      alert('Ingresa un salario o selecciona la opción DOE.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('yacht_work_offers').insert([
      {
        user_id: user.id,
        ...formData,
        salary: formData.is_doe ? null : formData.salary,
      },
    ]);

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
      <label>Título del puesto:</label>
      <select name="title" value={formData.title} onChange={handleChange} required>
        <option value="">Selecciona...</option>
        {titles.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>

      <label>Ciudad:</label>
      <input name="city" value={formData.city} onChange={handleChange} required />

      <label>País:</label>
      <select name="country" value={formData.country} onChange={handleChange} required>
        <option value="">Selecciona...</option>
        {countries.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>

      <label>Tipo:</label>
      <select name="type" value={formData.type} onChange={handleChange} required>
        <option value="">Selecciona...</option>
        {types.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>

      <label>Fecha de inicio:</label>
      <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} required />

      <label>Fecha de finalización (opcional):</label>
      <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} />

      <label>Años en el cargo (opcional):</label>
      <select name="years_in_rank" value={formData.years_in_rank} onChange={handleChange}>
        <option value="">Selecciona...</option>
        {yearsOptions.map((y) => <option key={y} value={y}>{y === 6 ? '>5' : y}</option>)}
      </select>

      <label>
        <input type="checkbox" name="is_doe" checked={formData.is_doe} onChange={handleChange} />
        DOE (Depende de la experiencia)
      </label>

      {!formData.is_doe && (
        <>
          <label>Salario:</label>
          <input type="number" name="salary" value={formData.salary} onChange={handleChange} />
        </>
      )}

      <label>Descripción (opcional):</label>
      <textarea name="description" value={formData.description} onChange={handleChange} />

      <button type="submit" disabled={loading}>
        {loading ? 'Publicando...' : 'Publicar Oferta'}
      </button>
    </form>
  );
}

export default YachtOfferForm;