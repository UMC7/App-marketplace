// src/components/ImageUploader.js

import React, { useState } from 'react';
import supabase from '../supabase';

function ImageUploader({ onUpload }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const uploadImages = async () => {
    setUploading(true);
    const uploadedUrls = [];

    for (const file of files) {
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `additional/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        console.error('Error al subir imagen:', uploadError.message);
        continue;
      }

      const { data: publicUrlData } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        uploadedUrls.push(publicUrlData.publicUrl);
        console.log('Imagen subida:', publicUrlData.publicUrl);
      } else {
        console.warn(`No se obtuvo publicURL para ${fileName}`);
      }
    }

    setUploading(false);
    onUpload(uploadedUrls);
  };

  return (
    <div>
      <input type="file" multiple onChange={handleFileChange} />
      <button onClick={uploadImages} disabled={uploading}>
        {uploading ? 'Subiendo...' : 'Subir imágenes'}
      </button>
    </div>
  );
}

export default ImageUploader;