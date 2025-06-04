import React, { useState, useEffect } from 'react';
import supabase from '../supabase';
import { toast } from 'react-toastify';

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
        toast.error('You must log in first.');
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
        throw new Error(error?.message || 'Error uploading the image. Please try again.');
      }

      const { publicUrl } = supabase
        .storage
        .from('events')
        .getPublicUrl(data.path).data;

      setMainPhoto(publicUrl);
    } catch (error) {
      toast.error("Error uploading the main photo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!eventName || !mainPhoto || !city || !country) {
      toast.error('Please fill in all required fields.');
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
        toast.error(`Error saving the event. Please try again: ${error.message}`);
      } else {
        toast.error('Event saved successfully');
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
      toast.error('An unexpected error occurred while saving the event. Please try again.');
    }
  };

  return (
    <div className="container">
    <div className="login-form">
      <h2>New Event</h2>
      <form onSubmit={handleSubmit} className="login-form">
        <label>Event Name:</label>
        <input type="text" value={eventName} onChange={(e) => setEventName(e.target.value)} required />

        <label>Description:</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />

        <label>City:</label>
        <input type="text" value={city} onChange={(e) => setCity(e.target.value)} required />

        <label>Country:</label>
        <select value={country} onChange={(e) => setCountry(e.target.value)} required>
          <option value="">Select a Country</option>
          {countries.map((pais, idx) => (
            <option key={idx} value={pais}>{pais}</option>
          ))}
        </select>

        <label>Contact Email:</label>
        <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />

        <label>Primary Phone:</label>
        <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />

        <label>Alternative Phone:</label>
        <input type="text" value={altPhone} onChange={(e) => setAltPhone(e.target.value)} />

        <label>Main Photo:</label>
        <input type="file" accept="image/*" onChange={handleMainPhotoUpload} required />
        {mainPhoto && (
  <div style={{ marginTop: '12px', textAlign: 'center' }}>
    <img
      src={mainPhoto}
      alt="Main"
      style={{
        width: '100%',
        maxWidth: '300px',
        borderRadius: '8px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
      }}
    />
  </div>
)}

        <label>Dates:</label>
<div className="form-inline-group">
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
    One-Day Event
  </label>
</div>

<label>Schedule:</label>
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

<label>Location Detail:</label>
<input
  type="text"
  value={locationDetails}
  onChange={(e) => setLocationDetails(e.target.value)}
/>

<label>Cost:</label>
<div className="form-inline-group">
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
    Free Event
  </label>
</div>

        <label>Website:</label>
        <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} />

        <label>Facebook:</label>
        <input type="url" value={facebook} onChange={(e) => setFacebook(e.target.value)} />

        <label>Instagram:</label>
        <input type="url" value={instagram} onChange={(e) => setInstagram(e.target.value)} />

        <label>WhatsApp:</label>
        <input type="text" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />

        <button type="submit" disabled={uploading} className="landing-button">
        {uploading ? 'Uploading image...' : 'Save Event'}
        </button>
      </form>
    </div>
  </div>
  );
};

export default PostEventForm;