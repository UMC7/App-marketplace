// src/components/ImageUploader.js

import React, { useState } from 'react';
import supabase from '../supabase';

const ImageUploader = ({ setImageUrls }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadImages = async (files) => {
    if (!files.length) return;

    setIsUploading(true);
    const uploadedUrls = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = `${Date.now()}-${file.name}`;

      try {
        const { data, error } = await supabase.storage
          .from('products')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) {
          console.error(`Error subiendo imagen ${file.name}:`, error.message);
        } else {
          const publicUrl = supabase
            .storage
            .from('products')
            .getPublicUrl(data.path)
            .publicURL;

          if (publicUrl) {
            uploadedUrls.push(publicUrl);
          }
        }

        setProgress(Math.round(((i + 1) / files.length) * 100));
      } catch (err) {
        console.error('Error inesperado al subir imagen:', err.message);
      }
    }

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