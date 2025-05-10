import React, { useState, useEffect } from 'react';
import supabase from '../supabase';
import ImageUploader from './ImageUploader';

const PostServiceForm = () => {
  const [uploading, setUploading] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [photos, setPhotos] = useState([]);
  const [mainPhoto, setMainPhoto] = useState('');
  const [ownerId, setOwnerId] = useState(null);
  const [ownerEmail, setOwnerEmail] = useState('');
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
    const fetchUser = async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        console.error('Error al obtener el usuario:', authError?.message || 'Usuario no autenticado');
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
        .from('services')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error || !data?.path) {
        throw new Error(error?.message || 'Error al subir la imagen.');
      }

      const { publicUrl } = supabase
        .storage
        .from('services')
        .getPublicUrl(data.path).data;

      setMainPhoto(publicUrl);
      console.log("Foto principal cargada correctamente:", publicUrl);
    } catch (error) {
      console.error("Error al cargar la foto principal:", error.message);
      alert("Error al subir la foto principal.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!categoryId || !mainPhoto || !city || !country) {
      alert('Por favor, completa todos los campos obligatorios.');
      return;
    }

    console.log("Fotos adicionales subidas:", photos);

    try {
      const { data, error } = await supabase
        .from('services')
        .insert([{
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

          status: 'active' // 👈 AÑADIR ESTO
        }])
        .select('*');

      if (error) {
        console.error("Error al guardar el servicio:", error.message);
        alert(`Error al guardar el servicio: ${error.message}`);
      } else if (data && data.length > 0) {
        console.log('Servicio guardado correctamente:', data);
        alert('Servicio guardado correctamente');
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
        alert('Hubo un error desconocido al guardar el servicio.');
      }
    } catch (error) {
      console.error('Error inesperado:', error.message);
      alert('Hubo un error inesperado al guardar el servicio.');
    }
  };

  return (
    <div>
      <h1>Agregar Servicio</h1>
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
        <ImageUploader onUpload={(urls) => setPhotos(urls)} />

        <label>Foto principal:</label>
        <input type="file" accept="image/*" onChange={handleMainPhotoUpload} required />

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


        <button type="submit" disabled={uploading}>
          {uploading ? 'Subiendo imágenes...' : 'Guardar Servicio'}
        </button>
      </form>
    </div>
  );
};

export default PostServiceForm;