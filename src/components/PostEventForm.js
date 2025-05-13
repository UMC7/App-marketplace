import React, { useState, useEffect } from 'react';
import supabase from '../supabase';

const PostEventForm = () => {
  const [uploading, setUploading] = useState(false);
  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [mainPhoto, setMainPhoto] = useState('');
  const [ownerId, setOwnerId] = useState(null);
  const [ownerEmail, setOwnerEmail] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSingleDay, setIsSingleDay] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [cost, setCost] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [isFree, setIsFree] = useState(false);
  const [locationDetails, setLocationDetails] = useState('');


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

  useEffect(() => {
    const fetchUser = async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        alert('Debes iniciar sesión primero.');
        return;
      }

      setOwnerId(authData.user.id);
      setOwnerEmail(authData.user.email);
    };

    fetchUser();
  }, []);

  const handleMainPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = `main-${Date.now()}-${file.name}`;
    const filePath = `${fileName}`;

    try {
      setUploading(true);

      const { data, error } = await supabase.storage
        .from('events')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error || !data?.path) {
        throw new Error(error?.message || 'Error al subir la imagen.');
      }

      const { publicUrl } = supabase
        .storage
        .from('events')
        .getPublicUrl(data.path).data;

      setMainPhoto(publicUrl);
    } catch (error) {
      alert("Error al subir la foto principal.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!eventName || !mainPhoto || !city || !country) {
      alert('Por favor, completa todos los campos obligatorios.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('events')
        .insert([{
          event_name: eventName,
          description,
          owner: ownerId,
          contact_email: contactEmail,
          contact_phone: phone,
          alt_phone: altPhone,
          mainphoto: mainPhoto,
          city,
          country,
          start_date: startDate,
          end_date: isSingleDay ? null : endDate,
          is_single_day: isSingleDay,
          start_time: startTime || null,
          end_time: endTime || null,
          cost: isFree ? null : cost,
          is_free: isFree,
          currency: isFree ? null : currency,
          location_details: locationDetails || null,
          website,
          facebook_url: facebook,
          instagram_url: instagram,
          whatsapp_number: whatsapp,
          status: 'active'
        }])
        .select('*');

      if (error) {
        alert(`Error al guardar el evento: ${error.message}`);
      } else {
        alert('Evento guardado correctamente');
        setEventName('');
        setDescription('');
        setMainPhoto('');
        setCity('');
        setCountry('');
        setPhone('');
        setAltPhone('');
        setContactEmail('');
        setStartDate('');
        setEndDate('');
        setIsSingleDay(false);
        setStartTime('');
        setEndTime('');
        setCost('');
        setIsFree(false);
        setLocationDetails('');
      }
    } catch (error) {
      alert('Hubo un error inesperado al guardar el evento.');
    }
  };

  return (
    <div>
      <h1>Agregar Evento</h1>
      <form onSubmit={handleSubmit}>
        <label>Nombre del Evento:</label>
        <input type="text" value={eventName} onChange={(e) => setEventName(e.target.value)} required />

        <label>Descripción:</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />

        <label>Ciudad:</label>
        <input type="text" value={city} onChange={(e) => setCity(e.target.value)} required />

        <label>País:</label>
        <select value={country} onChange={(e) => setCountry(e.target.value)} required>
          <option value="">Seleccione un país</option>
          {countries.map((pais, idx) => (
            <option key={idx} value={pais}>{pais}</option>
          ))}
        </select>

        <label>Correo de contacto:</label>
        <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />

        <label>Teléfono principal:</label>
        <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />

        <label>Teléfono alternativo:</label>
        <input type="text" value={altPhone} onChange={(e) => setAltPhone(e.target.value)} />

        <label>Foto principal:</label>
        <input type="file" accept="image/*" onChange={handleMainPhotoUpload} required />
        {mainPhoto && <img src={mainPhoto} alt="Main" style={{ width: '150px', marginTop: '10px' }} />}

        <label>Fecha del evento:</label>
<div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
  <input
    type="date"
    value={startDate}
    onChange={(e) => setStartDate(e.target.value)}
    required
  />
  {!isSingleDay && (
    <input
      type="date"
      value={endDate}
      onChange={(e) => setEndDate(e.target.value)}
    />
  )}
  <label>
    <input
      type="checkbox"
      checked={isSingleDay}
      onChange={() => setIsSingleDay(!isSingleDay)}
    />{' '}
    Evento de un solo día
  </label>
</div>

<label>Horario del evento:</label>
<div style={{ display: 'flex', gap: '10px' }}>
  <input
    type="time"
    value={startTime}
    onChange={(e) => setStartTime(e.target.value)}
  />
  <input
    type="time"
    value={endTime}
    onChange={(e) => setEndTime(e.target.value)}
    disabled={startTime === ''}
  />
</div>

<label>Ubicación exacta:</label>
<input
  type="text"
  value={locationDetails}
  onChange={(e) => setLocationDetails(e.target.value)}
/>

<label>Costo de participación:</label>
<div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
  <select
    value={currency}
    onChange={(e) => setCurrency(e.target.value)}
    disabled={isFree}
  >
    <option value="USD">USD</option>
    <option value="EUR">EUR</option>
    <option value="AUD">AUD</option>
    <option value="GBP">GBP</option>
  </select>
  <input
    type="text"
    value={cost}
    onChange={(e) => setCost(e.target.value)}
    disabled={isFree}
    placeholder="Monto"
  />
  <label>
    <input
      type="checkbox"
      checked={isFree}
      onChange={() => setIsFree(!isFree)}
    />{' '}
    Evento gratuito
  </label>
</div>

        <label>Sitio Web:</label>
        <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} />

        <label>Facebook:</label>
        <input type="url" value={facebook} onChange={(e) => setFacebook(e.target.value)} />

        <label>Instagram:</label>
        <input type="url" value={instagram} onChange={(e) => setInstagram(e.target.value)} />

        <label>WhatsApp:</label>
        <input type="text" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />

        <button type="submit" disabled={uploading}>
          {uploading ? 'Subiendo imagen...' : 'Guardar Evento'}
        </button>
      </form>
    </div>
  );
};

export default PostEventForm;