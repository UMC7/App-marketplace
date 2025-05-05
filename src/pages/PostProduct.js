import React, { useState, useEffect } from 'react';
import supabase from '../supabase';
import ImageUploader from '../components/ImageUploader';

const PostProduct = () => {
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [categoryId, setCategoryId] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [condition, setCondition] = useState('');
  const [photos, setPhotos] = useState([]);
  const [mainPhoto, setMainPhoto] = useState('');
  const [ownerId, setOwnerId] = useState(null);
  const [ownerEmail, setOwnerEmail] = useState('');

  const countries = [
    "Albania", "Antigua and Barbuda", "Argentina", "Australia", "Bahamas", "Bahrain", "Barbados",
    "Belgium", "Belize", "Brazil", "Brunei", "Bulgaria", "Cambodia", "Canada", "Cape Verde",
    "Chile", "China", "Colombia", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Denmark", "Dominica",
    "Dominican Republic", "Ecuador", "Egypt", "Estonia", "Fiji", "Finland", "France", "Germany",
    "Greece", "Grenada", "Guatemala", "Honduras", "India", "Indonesia", "Ireland", "Israel",
    "Italy", "Jamaica", "Japan", "Kiribati", "Kuwait", "Latvia", "Libya", "Lithuania", "Madagascar",
    "Malaysia", "Maldives", "Malta", "Marshall Islands", "Mauritius", "Mexico", "Micronesia",
    "Monaco", "Montenegro", "Morocco", "Myanmar", "Netherlands", "New Zealand", "Nicaragua",
    "Norway", "Panama", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Saint Kitts and Nevis",
    "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "Saudi Arabia", "Seychelles",
    "Singapore", "Solomon Islands", "South Africa", "South Korea", "Spain", "Sweden", "Taiwan",
    "Thailand", "Trinidad and Tobago", "Tunisia", "Turkey", "United Arab Emirates", "United Kingdom",
    "United States", "Uruguay", "Vanuatu", "Venezuela", "Vietnam"
  ];

  const conditions = ["Nuevo", "Usado", "Reacondicionado"];

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
        .from('products')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error || !data?.path) {
        throw new Error(error?.message || 'Error al subir la imagen.');
      }

      const { publicUrl } = supabase
        .storage
        .from('products')
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

    if (!categoryId || !mainPhoto || !city || !country || !condition) {
      alert('Por favor, completa todos los campos obligatorios.');
      return;
    }

    console.log("Fotos adicionales subidas:", photos);

    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          name,
          description,
          price: parseFloat(price),
          quantity: parseInt(quantity, 10),
          category_id: parseInt(categoryId, 10),
          owner: ownerId,
          owneremail: ownerEmail,
          photos: photos,
          mainphoto: mainPhoto,
          city,
          country,
          condition,
        }])
        .select('*');

      if (error) {
        console.error("Error al guardar el producto:", error.message);
        alert(`Error al guardar el producto: ${error.message}`);
      } else if (data && data.length > 0) {
        console.log('Producto guardado correctamente:', data);
        alert('Producto guardado correctamente');
        setName('');
        setDescription('');
        setPrice('');
        setQuantity(1);
        setCategoryId('');
        setPhotos([]);
        setMainPhoto('');
        setCity('');
        setCountry('');
        setCondition('');
      } else {
        alert('Hubo un error desconocido al guardar el producto.');
      }
    } catch (error) {
      console.error('Error inesperado:', error.message);
      alert('Hubo un error inesperado al guardar el producto.');
    }
  };

  return (
    <div>
      <h1>Agregar Producto</h1>
      <form onSubmit={handleSubmit}>
        <label>Nombre del Producto:</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />

        <label>Descripción:</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />

        <label>Precio:</label>
        <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required min="0" />

        <label>Cantidad:</label>
        <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required min="1" />

        <label>Categoría:</label>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
          <option value="">Seleccione una categoría</option>
          <option value="1">Deck</option>
          <option value="2">Engineering</option>
          <option value="3">Navigation</option>
          <option value="4">Galley</option>
          <option value="5">Interior</option>
          <option value="6">Others</option>
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

        <label>Condición:</label>
        <select value={condition} onChange={(e) => setCondition(e.target.value)} required>
          <option value="">Seleccione una condición</option>
          {conditions.map((c, idx) => (
            <option key={idx} value={c}>{c}</option>
          ))}
        </select>

        <label>Fotos adicionales:</label>
        <ImageUploader onUpload={(urls) => setPhotos(urls)} />

        <label>Foto principal:</label>
        <input type="file" accept="image/*" onChange={handleMainPhotoUpload} required />

        <button type="submit" disabled={uploading}>
          {uploading ? 'Subiendo imágenes...' : 'Guardar Producto'}
        </button>
      </form>
    </div>
  );
};

export default PostProduct;