// src/components/PostServiceForm.js
import React, { useState, useEffect } from 'react';
import supabase from '../supabase';
// Unifica subida de portada + galería (igual que SeaMarket)
import UnifiedImageUploader from './UnifiedImageUploader';

const PostServiceForm = ({ initialValues = {}, onSubmit, mode = 'create' }) => {
  const [uploading, setUploading] = useState(false);

  const [companyName, setCompanyName] = useState(initialValues.company_name || '');
  const [description, setDescription] = useState(initialValues.description || '');
  const [categoryId, setCategoryId] = useState(initialValues.category_id || '');
  const [categories, setCategories] = useState([]);
  const [city, setCity] = useState(initialValues.city || '');
  const [country, setCountry] = useState(initialValues.country || '');

  // Imágenes unificadas (igual que en PostProductForm)
  const [photos, setPhotos] = useState(Array.isArray(initialValues.photos) ? initialValues.photos : []);
  const [mainPhoto, setMainPhoto] = useState(initialValues.mainphoto || initialValues.mainPhoto || '');

  const [ownerId, setOwnerId] = useState(null);
  const [ownerEmail, setOwnerEmail] = useState('');

  const [contactEmail, setContactEmail] = useState(initialValues.contact_email || '');
  const [phone, setPhone] = useState(initialValues.contact_phone || '');
  const [altPhone, setAltPhone] = useState(initialValues.alt_phone || '');
  const [website, setWebsite] = useState(initialValues.website || '');
  const [facebook, setFacebook] = useState(initialValues.facebook_url || '');
  const [instagram, setInstagram] = useState(initialValues.instagram_url || '');
  const [linkedin, setLinkedin] = useState(initialValues.linkedin_url || '');
  const [whatsapp, setWhatsapp] = useState(initialValues.whatsapp_number || '');

  const countries = [
    "Albania","Anguilla","Antigua and Barbuda","Argentina","Aruba","Australia","Bahamas","Bahrain","Barbados",
    "Belgium","Belize","Bonaire","Brazil","Brunei","Bulgaria","BVI, UK","Cambodia","Canada","Cape Verde",
    "Chile","China","Colombia","Costa Rica","Croatia","Cuba","Curacao","Cyprus","Denmark","Dominica",
    "Dominican Republic","Ecuador","Egypt","Estonia","Fiji","Finland","France","Germany",
    "Greece","Grenada","Guatemala","Honduras","India","Indonesia","Ireland","Israel",
    "Italy","Jamaica","Japan","Kiribati","Kuwait","Latvia","Libya","Lithuania","Madagascar",
    "Malaysia","Maldives","Malta","Marshall Islands","Mauritius","Mexico","Micronesia",
    "Monaco","Montenegro","Morocco","Myanmar","Netherlands","New Zealand","Nicaragua",
    "Norway","Panama","Peru","Philippines","Poland","Portugal","Qatar","Saint Kitts and Nevis",
    "Saint Lucia","Saint Maarten","Saint Vincent and the Grenadines","Samoa","Saudi Arabia","Seychelles",
    "Singapore","Solomon Islands","South Africa","South Korea","Spain","Sweden","Taiwan",
    "Thailand","Trinidad and Tobago","Tunisia","Turkey","United Arab Emirates","United Kingdom",
    "United States","Uruguay","Vanuatu","Venezuela","Vietnam"
  ];

  useEffect(() => {
    const fetchUser = async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        console.error('Error fetching user:', authError?.message || 'Not authenticated');
        alert('You must be logged in.');
        return;
      }
      setOwnerId(authData.user.id);
      setOwnerEmail(authData.user.email);
    };

    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('module', 'service')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching service categories:', error.message);
      } else {
        setCategories(data || []);
      }
    };

    fetchUser();
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación básica (no obligamos portada, igual que SeaMarket)
    if (!categoryId || !city || !country) {
      alert('Please fill in all required fields.');
      return;
    }

    // Unificar portada + galería (mismo criterio que PostProductForm)
    const all = Array.from(new Set([mainPhoto, ...photos].filter(Boolean)));
    const cover = all[0] || '';
    const gallery = all.slice(1);

    const serviceData = {
      company_name: companyName,
      description,
      category_id: parseInt(categoryId, 10),
      owner: ownerId,
      contact_email: contactEmail,
      contact_phone: phone,
      alt_phone: altPhone,
      photos: gallery,
      mainphoto: cover,
      city,
      country,
      website,
      facebook_url: facebook,
      instagram_url: instagram,
      linkedin_url: linkedin,
      whatsapp_number: whatsapp,
      status: 'active',
    };

    if (mode === 'edit') {
      if (onSubmit) {
        await onSubmit(serviceData);
      }
      return;
    }

    try {
      const { data, error } = await supabase
        .from('services')
        .insert([serviceData])
        .select('*');

      if (error) {
        console.error("Insert error:", error.message);
        alert(`Failed to save service: ${error.message}`);
      } else if (data && data.length > 0) {
        alert('Service saved successfully');
        setCompanyName('');
        setDescription('');
        setCategoryId('');
        setPhotos([]);
        setMainPhoto('');
        setCity('');
        setCountry('');
        setPhone('');
        setAltPhone('');
        setContactEmail('');
      } else {
        alert('Unknown error occurred while saving service.');
      }
    } catch (err) {
      console.error('Unexpected error:', err.message);
      alert('Unexpected error while saving service.');
    }
  };

  return (
    <div className="container">
      <div className="login-form">
        <h2>{mode === 'edit' ? 'Edit Service' : 'Add Service'}</h2>

        <form onSubmit={handleSubmit}>
          <label>Company Name:</label>
          <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />

          <label>Description:</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />

          <label>Category:</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <label>City:</label>
          <input type="text" value={city} onChange={(e) => setCity(e.target.value)} required />

          <label>Country:</label>
          <select value={country} onChange={(e) => setCountry(e.target.value)} required>
            <option value="">Select a country</option>
            {countries.map((pais, idx) => (
              <option key={idx} value={pais}>{pais}</option>
            ))}
          </select>

          <label>Contact Email:</label>
          <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />

          <label>Main Phone:</label>
          <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />

          <label>Alternative Phone:</label>
          <input type="text" value={altPhone} onChange={(e) => setAltPhone(e.target.value)} />

          {/* Uploader unificado (★ = portada) */}
          <label>Photos (cover + gallery):</label>
          <UnifiedImageUploader
            // si tu componente soporta bucket, usamos el de servicios
            bucket="services"
            value={{ cover: mainPhoto, gallery: photos }}
            onChange={({ cover, gallery }) => { setMainPhoto(cover); setPhotos(gallery); }}
            onBusyChange={setUploading}
          />
          <small style={{ display: 'block', margin: '6px 0 12px', color: '#666' }}>
            The image marked with ★ will be the cover.
          </small>

          <label>Website:</label>
          <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} />

          <label>Facebook:</label>
          <input type="url" value={facebook} onChange={(e) => setFacebook(e.target.value)} />

          <label>Instagram:</label>
          <input type="url" value={instagram} onChange={(e) => setInstagram(e.target.value)} />

          <label>LinkedIn:</label>
          <input type="url" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />

          <label>WhatsApp:</label>
          <input type="text" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />

          <button className="landing-button" type="submit" disabled={uploading}>
            {uploading ? 'Uploading photos...' : mode === 'edit' ? 'Update Service' : 'Save Service'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostServiceForm;