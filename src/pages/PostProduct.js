import React, { useState, useEffect } from 'react';
import supabase from '../supabase';  // Asegúrate de que supabase esté correctamente configurado
import ImageUploader from '../components/ImageUploader';  // Componente para subir imágenes

const PostProduct = () => {
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [categoryId, setCategoryId] = useState(''); // Para manejar la categoría seleccionada
  const [photos, setPhotos] = useState([]);
  const [mainPhoto, setMainPhoto] = useState('');
  const [ownerId, setOwnerId] = useState(null); // Almacenamos el ID del propietario

  const isUploading = uploading;

  useEffect(() => {
    // Obtener el usuario autenticado al cargar el componente
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error al obtener el usuario:', error);
        alert('Error al obtener el usuario.');
        return;
      }

      if (user) {
        setOwnerId(user.id); // Asignamos el ID del propietario desde Supabase
      } else {
        alert('No estás autenticado. Debes iniciar sesión primero.');
      }
    };

    fetchUser();
  }, []); // Esto solo se ejecutará al montar el componente

  const handleMainPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = `main-${Date.now()}-${file.name}`;

    try {
      setUploading(true);
      const { data, error } = await supabase.storage
        .from('products')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw new Error(`Error uploading main photo: ${error.message}`);
      }
      if (!data) {
        throw new Error('No se pudo obtener data al subir la imagen.');
      }
      const publicUrl = supabase.storage
        .from('products')
        .getPublicUrl(data.path).publicURL;

      setMainPhoto(publicUrl);
      console.log("Foto principal cargada correctamente:", publicUrl);

    } catch (error) {
      console.error("Error al cargar la foto principal:", error);
      alert("Error al subir la foto principal.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!categoryId) {
      alert('Por favor, selecciona una categoría.');
      return;
    }
    if (!ownerId) {
      alert('No se ha encontrado un propietario para este producto.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .insert([
          {
            name,
            description,
            price,
            quantity,
            category_id: categoryId,
            owner: ownerId,
            owneremail: 'usuario@ejemplo.com', // Este es un valor fijo; ajusta según lo necesites
            photos,
            mainphoto: mainPhoto,
          }
        ]);

      if (error) {
        console.error("Error al guardar el producto:", error.message);
        alert(`Error al guardar el producto: ${error.message}`);
      } else {
        console.log('Producto guardado correctamente:', data);
        alert('Producto guardado correctamente');
        setName('');
        setDescription('');
        setPrice('');
        setQuantity(1);
        setCategoryId('');
        setPhotos([]);
        setMainPhoto('');
      }
    } catch (error) {
      console.error('Error inesperado:', error.message);
      alert('Hubo un error al guardar el producto.');
    }
  };

  return (
    <div>
      <h1>Agregar Producto</h1>
      <form onSubmit={handleSubmit}>
        <label>Nombre del Producto:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <label>Descripción:</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <label>Precio:</label>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />

        <label>Cantidad:</label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />

        <label>Categoría:</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
        >
          <option value="">Seleccione una categoría</option>
          <option value="1">Deck</option>
          <option value="2">Engineering</option>
          <option value="3">Navigation</option>
          <option value="4">Galley</option>
          <option value="5">Interior</option>
          <option value="6">Others</option>
        </select>

        <label>Fotos adicionales:</label>
        <ImageUploader setImageUrls={setPhotos} />

        <label>Foto principal:</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleMainPhotoUpload}
        />

        <button type="submit" disabled={isUploading}>
          {isUploading ? 'Subiendo imágenes...' : 'Guardar Producto'}
        </button>
      </form>
    </div>
  );
};

export default PostProduct;