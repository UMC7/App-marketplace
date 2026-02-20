import React, { useState, useEffect } from 'react';
import supabase from '../supabase';
import { toast } from 'react-toastify';

const PostEventForm = ({ initialValues = {}, onSubmit, mode = 'create' }) => {
  const [uploading, setUploading] = useState(false);
  const [eventName, setEventName] = useState(initialValues.event_name || '');
  const [description, setDescription] = useState(initialValues.description || '');
  const [city, setCity] = useState(initialValues.city || '');
  const [country, setCountry] = useState(initialValues.country || '');
  const [mainPhoto, setMainPhoto] = useState(initialValues.mainphoto || '');
  const [ownerId, setOwnerId] = useState(null);
  const [contactEmail, setContactEmail] = useState(initialValues.contact_email || '');
  const [phone, setPhone] = useState(initialValues.contact_phone || '');
  const [altPhone, setAltPhone] = useState(initialValues.alt_phone || '');
  const [website, setWebsite] = useState(initialValues.website || '');
  const [facebook, setFacebook] = useState(initialValues.facebook_url || '');
  const [instagram, setInstagram] = useState(initialValues.instagram_url || '');
  const [whatsapp, setWhatsapp] = useState(initialValues.whatsapp_number || '');
  const [startDate, setStartDate] = useState(initialValues.start_date || '');
  const [endDate, setEndDate] = useState(initialValues.end_date || '');
  const [isSingleDay, setIsSingleDay] = useState(initialValues.is_single_day || false);
  const [startTime, setStartTime] = useState(initialValues.start_time || '');
  const [endTime, setEndTime] = useState(initialValues.end_time || '');
  const [cost, setCost] = useState(initialValues.cost || '');
  const [currency, setCurrency] = useState(initialValues.currency || 'USD');
  const [isFree, setIsFree] = useState(initialValues.is_free || false);
  const [locationDetails, setLocationDetails] = useState(initialValues.location_details || '');

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
        throw new Error(error?.message || 'Error uploading the image.');
      }
      const { publicUrl } = supabase
        .storage
        .from('events')
        .getPublicUrl(data.path).data;
      setMainPhoto(publicUrl);
    } catch (error) {
      toast.error("Error uploading the main photo.");
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
    const eventData = {
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
      status: 'active',
    };
    if (mode === 'edit') {
      if (onSubmit) {
        await onSubmit(eventData);
      }
      return;
    }
    try {
      const { error } = await supabase
        .from('events')
        .insert([eventData])
        .select('*');
      if (error) {
        toast.error(`Error saving the event: ${error.message}`);
      } else {
        toast.success('Event saved successfully');
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
      toast.error('Unexpected error while saving the event.');
    }
  };

  const checkboxLabelStyle = {
  display: 'flex',
  alignItems: 'baseline',  // <--- CAMBIO AQUÍ
  gap: 8,
  fontWeight: 500,
  color: 'var(--primary-color)',
  cursor: 'pointer',
  margin: '12px 0 4px',
  fontSize: '1rem',
  userSelect: 'none',
  lineHeight: 1.2
};

const checkboxInputStyle = {
  marginRight: 6,
  accentColor: 'var(--primary-color)',
  width: 17,
  height: 17,
  minWidth: 17,
  minHeight: 17,
  verticalAlign: 'middle', // <--- CAMBIO AQUÍ
};

  return (
    <div className="container">
      <div className="login-form">
        <h2>{mode === 'edit' ? 'Edit Event' : 'New Event'}</h2>
        <form onSubmit={handleSubmit}>
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
          <input type="file" accept="image/*" onChange={handleMainPhotoUpload} />
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
              style={{ flex: 1 }}
            />
            <input
              type="date"
              value={isSingleDay ? '' : endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={isSingleDay}
              required={!isSingleDay}
              style={{ flex: 1, opacity: isSingleDay ? 0.6 : 1 }}
              placeholder="End Date"
            />
          </div>
          {/* Checkbox: One-Day Event, always BELOW the date inputs */}
          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={isSingleDay}
              onChange={() => setIsSingleDay(!isSingleDay)}
              style={checkboxInputStyle}
            />
            One-Day Event
          </label>

          <label>Schedule:</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} disabled={startTime === ''} />
          </div>

          <label>Location Detail:</label>
          <input type="text" value={locationDetails} onChange={(e) => setLocationDetails(e.target.value)} />

          <label>Cost:</label>
          <div className="form-inline-group">
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} disabled={isFree}>
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
              placeholder="Amount"
            />
          </div>
          {/* Checkbox: Free Event, always BELOW the currency/amount inputs */}
          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={isFree}
              onChange={() => setIsFree(!isFree)}
              style={checkboxInputStyle}
            />
            Free Event
          </label>

          <label>Website:</label>
          <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} />

          <label>Facebook:</label>
          <input type="url" value={facebook} onChange={(e) => setFacebook(e.target.value)} />

          <label>Instagram:</label>
          <input type="url" value={instagram} onChange={(e) => setInstagram(e.target.value)} />

          <label>WhatsApp:</label>
          <input type="text" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />

          <button type="submit" disabled={uploading} className="landing-button">
            {uploading ? 'Uploading image...' : mode === 'edit' ? 'Update Event' : 'Save Event'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostEventForm;