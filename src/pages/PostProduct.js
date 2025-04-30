// src/pages/PostProduct.js

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
  const [photos, setPhotos] = useState([]);
  const [mainPhoto, setMainPhoto] = useState('');
  const [ownerId, setOwnerId] = useState(null);
  const isUploading = uploading;

  useEffect(() => {
    const fetchUser = async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Error al obtener el usuario:', authError.message);
        alert('Error al obtener el usuario.');
        return;
      }

      if (!authData?.user) {
        alert('No estás autenticado. Debes iniciar sesión primero.');
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', authData.user.id)
        .single();

      if (userError) {
        console.error('Error al buscar usuario registrado:', userError.message);
        alert('Tu cuenta no está completamente registrada.');
        return;
      }

      setOwnerId(userData.id);
    };

    fetchUser();
  }, []);

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
        throw new Error(`Error subiendo imagen: ${error.message}`);
      }

      if (!data) {
        throw new Error('No se pudo obtener data del archivo subido.');
      }

      const publicURL = `${supabase.storageUrl}/object/public/products/${fileName}`;

      setMainPhoto(publicURL);
      console.log("Foto principal cargada correctamente:", publicURL);
    } catch (error) {
      console.error("Error al cargar la foto principal:", error.message);
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
      alert('No se ha encontrado un propietario válido para este producto.');
      return;
    }
    if (!mainPhoto) {
      alert('Por favor, sube una foto principal.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .insert([
          {
            name,
            description,
            price: parseFloat(price),
            quantity: parseInt(quantity, 10),
            category_id: parseInt(categoryId, 10), // 👈 casteamos para asegurar
            owner: ownerId,
            owneremail: '', 
            photos,
            mainphoto: mainPhoto,
          }
        ]);

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
      } else {
        console.error("No se devolvió ningún producto al guardar.");
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
          required
        />

        <label>Precio:</label>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          min="0"
        />

        <label>Cantidad:</label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
          min="1"
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
          required
        />

        <button type="submit" disabled={isUploading}>
          {isUploading ? 'Subiendo imágenes...' : 'Guardar Producto'}
        </button>
      </form>
    </div>
  );
};

export default PostProduct;