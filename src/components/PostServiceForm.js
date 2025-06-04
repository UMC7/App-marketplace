// src/components/PostServiceForm.js

import React, { useState, useEffect } from 'react';
import supabase from '../supabase';
import ImageUploader from './ImageUploader';

const PostServiceForm = ({ initialValues = {}, onSubmit, mode = 'create' }) => {
  const [uploading, setUploading] = useState(false);
  const [companyName, setCompanyName] = useState(initialValues.company_name || '');
  const [description, setDescription] = useState(initialValues.description || '');
  const [categoryId, setCategoryId] = useState(initialValues.category_id || '');
  const [city, setCity] = useState(initialValues.city || '');
  const [country, setCountry] = useState(initialValues.country || '');
  const [photos, setPhotos] = useState(initialValues.photos || []);
  const [mainPhoto, setMainPhoto] = useState(initialValues.mainphoto || '');
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
        console.error('Error fetching user:', authError?.message || 'Not authenticated');
        alert('You must be logged in.');
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
        .from('services')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error || !data?.path) {
        throw new Error(error?.message || 'Image upload failed.');
      }

      const { publicUrl } = supabase
        .storage
        .from('services')
        .getPublicUrl(data.path).data;

      setMainPhoto(publicUrl);
    } catch (error) {
      console.error("Main photo upload error:", error.message);
      alert("Error uploading main photo.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!categoryId || !mainPhoto || !city || !country) {
      alert('Please fill in all required fields.');
      return;
    }

    const serviceData = {
      company_name: companyName,
      description,
      category_id: parseInt(categoryId, 10),
      owner: ownerId,
      contact_email: contactEmail,
      contact_phone: phone,
      alt_phone: altPhone,
      photos,
      mainphoto: mainPhoto,
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
    } catch (error) {
      console.error('Unexpected error:', error.message);
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
            <option value="1">Maintenance</option>
            <option value="2">Repair</option>
            <option value="3">Cleaning</option>
            <option value="4">Transport</option>
            <option value="5">Other</option>
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

          <label>Additional Photos:</label>
          <ImageUploader onUpload={(urls) => setPhotos(urls)} initialUrls={photos} />

          <label>Main Photo:</label>
          <input type="file" accept="image/*" onChange={handleMainPhotoUpload} />

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
            {uploading ? 'Uploading images...' : mode === 'edit' ? 'Update Service' : 'Save Service'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostServiceForm;