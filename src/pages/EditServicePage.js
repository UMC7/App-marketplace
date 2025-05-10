import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../supabase';
import ImageUploader from '../components/ImageUploader';

const EditServicePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [photos, setPhotos] = useState([]);
  const [mainPhoto, setMainPhoto] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

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
    const fetchService = async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        alert('Error al cargar el servicio.');
        console.error(error);
        return;
      }

      setCompanyName(data.company_name || '');
      setDescription(data.description || '');
      setCategoryId(data.category_id?.toString() || '');
      setCity(data.city || '');
      setCountry(data.country || '');
      setPhotos(data.photos || []);
      setMainPhoto(data.mainphoto || '');
      setContactEmail(data.contact_email || '');
      setPhone(data.contact_phone || '');
      setAltPhone(data.alt_phone || '');
      setWebsite(data.website || '');
      setFacebook(data.facebook_url || '');
      setInstagram(data.instagram_url || '');
      setLinkedin(data.linkedin_url || '');
      setWhatsapp(data.whatsapp_number || '');
      setLoading(false);
    };

    fetchService();
  }, [id]);

  const handleMainPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = `main-${Date.now()}-${file.name}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
      .from('services')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      alert('Error al subir imagen principal.');
      console.error(error);
      return;
    }

    const { publicUrl } = supabase.storage
      .from('services')
      .getPublicUrl(data.path).data;

    setMainPhoto(publicUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { error } = await supabase
      .from('services')
      .update({
        company_name: companyName,
        description,
        category_id: parseInt(categoryId, 10),
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
      })
      .eq('id', id);

    if (error) {
      alert('Error al guardar los cambios.');
      console.error(error);
    } else {
      alert('Servicio actualizado correctamente.');
      navigate('/profile');
    }
  };

  if (loading) return <p style={{ padding: '20px' }}>Cargando datos del servicio...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Editar Servicio</h1>
      <form onSubmit={handleSubmit}>
        <label>Nombre de la Compañía:</label>
        <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />

        <label>Descripción:</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />

        <label>Categoría:</label>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
          <option value="">Seleccione una categoría</option>
          <option value="1">Mantenimiento</option>
          <option value="2">Reparación</option>
          <option value="3">Limpieza</option>
          <option value="4">Transporte</option>
          <option value="5">Otros</option>
        </select>

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

        <label>Fotos adicionales:</label>
        <ImageUploader
          bucket="services"
          onUpload={(urls) => setPhotos([...photos, ...urls])}
          existingImages={photos}
        />

        <label>Foto principal:</label>
        <input type="file" accept="image/*" onChange={handleMainPhotoUpload} />
        {mainPhoto && <img src={mainPhoto} alt="Main" style={{ width: '150px', marginTop: '10px' }} />}

        <label>Sitio Web:</label>
        <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} />

        <label>Facebook:</label>
        <input type="url" value={facebook} onChange={(e) => setFacebook(e.target.value)} />

        <label>Instagram:</label>
        <input type="url" value={instagram} onChange={(e) => setInstagram(e.target.value)} />

        <label>LinkedIn:</label>
        <input type="url" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />

        <label>WhatsApp:</label>
        <input type="text" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />

        <button type="submit">Guardar Cambios</button>
      </form>
    </div>
  );
};

export default EditServicePage;