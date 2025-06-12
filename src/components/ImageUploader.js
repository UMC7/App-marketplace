import React, { useState } from 'react';
import supabase from '../supabase';

function ImageUploader({ onUpload, existingImages = [], bucket = 'products' }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState(existingImages);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);

    const newPreviewUrls = selectedFiles.map((file) =>
      URL.createObjectURL(file)
    );
    setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
  };

  const uploadImages = async () => {
    setUploading(true);
    const uploadedUrls = [];

    for (const file of files) {
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `additional/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        console.error('Error uploading image:', uploadError.message);
        continue;
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        uploadedUrls.push(publicUrlData.publicUrl);
        console.log('Image uploaded:', publicUrlData.publicUrl);
      } else {
        console.warn(`No public URL returned for ${fileName}`);
      }
    }

    setUploading(false);
    onUpload(uploadedUrls);
  };

  return (
    <div>
      <input type="file" multiple onChange={handleFileChange} />
      <button
        type="button"
        className="image-upload-btn"
        onClick={uploadImages}
        disabled={uploading}
      >
        {uploading ? 'Uploading...' : 'Upload Images'}
      </button>
      <div className="image-upload-helper">
        <small>
        <span style={{ color: '#a00' }}>
          Click <b>Upload Images</b> after selecting additional photos.<br />
        </span>
          <b>Main Photo</b> does not require additional actions.
        </small>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: '10px' }}>
        {previewUrls.map((url, index) => (
          <img
            key={index}
            src={url}
            alt={`Preview ${index + 1}`}
            style={{
              width: '100px',
              height: '100px',
              objectFit: 'cover',
              marginRight: '10px',
              marginBottom: '10px',
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default ImageUploader;