// src/components/ImageUploader.js
import React, { useState } from 'react';
import supabase from '../supabase'; // ✅ Importar el cliente configurado correctamente


const ImageUploader = ({ setImageUrls }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Función para subir las imágenes
  const uploadImages = async (files) => {
    setIsUploading(true);
    const uploadedUrls = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = `${Date.now()}-${file.name}`;

      // Subir la imagen a Supabase Storage (bucket 'products')
      const { data, error } = await supabase.storage
        .from('products')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error("Error uploading image:", error.message);
      } else {
        // Si la imagen se sube correctamente, obtenemos la URL pública
        const publicUrl = supabase.storage
          .from('products')
          .getPublicUrl(fileName).publicURL;
        
        uploadedUrls.push(publicUrl);
      }

      // Actualizar el progreso (opcional)
      setProgress(Math.round(((i + 1) / files.length) * 100));
    }

    // Llamamos a setImageUrls para pasar las URLs al componente padre
    setImageUrls(uploadedUrls);
    setIsUploading(false);
  };

  return (
    <div>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => uploadImages(e.target.files)}
      />
      {isUploading && <p>Subiendo imágenes... {progress}%</p>}
    </div>
  );
};

export default ImageUploader;