// src/components/UnifiedImageUploader.js
import React, { useEffect, useState, useCallback, useRef } from 'react';
import supabase from '../supabase';

function unique(arr) {
  return Array.from(new Set(arr.filter(Boolean)));
}

// Límite máximo total (portada + galería)
const MAX_IMAGES = 5;

// --- util: compresión/redimensión sin dependencias ---
async function compressImage(file, { maxW = 1600, maxH = 1600, quality = 0.8 } = {}) {
  const readToImage = (blob) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(blob);
    });

  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    const img = await readToImage(file);
    const canvas0 = document.createElement('canvas');
    canvas0.width = img.naturalWidth;
    canvas0.height = img.naturalHeight;
    const ctx0 = canvas0.getContext('2d');
    ctx0.drawImage(img, 0, 0);
    bitmap = await createImageBitmap(canvas0);
  }

  let { width, height } = bitmap;
  const scale = Math.min(1, maxW / width, maxH / height);
  const outW = Math.round(width * scale);
  const outH = Math.round(height * scale);

  if (scale === 1 && file.size < 900 * 1024) return file;

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, outW, outH);

  const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality));
  return new File([blob], file.name.replace(/\.(png|webp|heic|heif)$/i, '.jpg'), { type: 'image/jpeg' });
}

const UnifiedImageUploader = ({
  value = { cover: '', gallery: [] },
  onChange = () => {},
  onBusyChange = () => {},
  bucket = 'products',
  multiple = true,
}) => {
  const [images, setImages] = useState([]);  // urls (pueden ser 'blob:' mientras sube)
  const [cover, setCover] = useState('');    // url portada
  const [busy, setBusy] = useState(false);
  const blobUrlsRef = useRef(new Set());

  // Para evitar bucle: recordamos lo último que emitimos al padre
  const lastEmittedRef = useRef({ cover: '', gallery: [] });

  // Rehidratación desde value SOLO si cambia externamente (no lo que acabamos de emitir)
  useEffect(() => {
    const incoming = {
      cover: value.cover || '',
      gallery: Array.isArray(value.gallery) ? value.gallery.filter(Boolean) : [],
    };
    const incKey = JSON.stringify(incoming);
    const lastKey = JSON.stringify(lastEmittedRef.current);
    if (incKey === lastKey) return; // ignorar eco propio

    const initial = unique([incoming.cover, ...incoming.gallery]);
    setImages(initial);
    setCover(incoming.cover || initial[0] || '');
  }, [value.cover, JSON.stringify(value.gallery || [])]);

  // Emitimos al padre SOLO URLs finales (sin 'blob:') y actualizamos lastEmitted
  useEffect(() => {
    const nonBlob = images.filter((u) => u && !u.startsWith('blob:'));
    let coverOut = cover;
    if (!nonBlob.includes(coverOut)) coverOut = nonBlob[0] || '';
    const gallery = unique(nonBlob.filter((u) => u !== coverOut));

    const payload = { cover: coverOut, gallery };
    lastEmittedRef.current = payload;
    onChange(payload);
  }, [images, cover, onChange]);

  useEffect(() => { onBusyChange?.(busy); }, [busy, onBusyChange]);

  useEffect(() => () => {
    blobUrlsRef.current.forEach((url) => {
      try { URL.revokeObjectURL(url); } catch {}
    });
    blobUrlsRef.current.clear();
  }, []);

  const uploadFiles = useCallback(async (fileList) => {
    if (!fileList || fileList.length === 0) return;

    // Enforce max images total
    const currentCount = images.length; // incluye portada + galería actuales
    const remaining = Math.max(0, MAX_IMAGES - currentCount);
    if (remaining <= 0) {
      alert(`You can upload up to ${MAX_IMAGES} images.`);
      return;
    }

    setBusy(true);
    try {
      // Filtrar imágenes y respetar el tope restante
      const incoming = Array.from(fileList).filter(f => f.type?.startsWith('image/')).slice(0, remaining);

      // 1) Previews locales inmediatas
      const localPreviews = incoming.map(f => URL.createObjectURL(f));
      localPreviews.forEach((url) => blobUrlsRef.current.add(url));
      setImages(prev => unique([...prev, ...localPreviews]));
      if (!cover && localPreviews[0]) setCover(localPreviews[0]);

      // 2) Subir (con compresión) y reemplazar preview por URL pública
      for (let i = 0; i < incoming.length; i++) {
        const file = incoming[i];
        let toUpload = file;
        try { toUpload = await compressImage(file); } catch {}

        const fileName = `img-${Date.now()}-${Math.random().toString(36).slice(2)}-${toUpload.name}`;
        const { data, error } = await supabase.storage.from(bucket).upload(fileName, toUpload, {
          cacheControl: '3600',
          upsert: false,
        });
        if (error || !data?.path) throw new Error(error?.message || 'Upload failed');

        const { publicUrl } = supabase.storage.from(bucket).getPublicUrl(data.path).data;

        const previewUrl = localPreviews[i];
        setImages(prev => {
          // Reemplazo robusto del preview
          const next = prev.map(u => (u === previewUrl ? publicUrl : u));
          return unique(next);
        });
        if (cover === previewUrl) setCover(publicUrl);

        try { URL.revokeObjectURL(previewUrl); } catch {}
        blobUrlsRef.current.delete(previewUrl);
      }

      // 3) Limpieza final: quitar cualquier 'blob:' remanente
      setImages(prev => prev.filter(u => !u.startsWith('blob:')));
      if (cover && cover.startsWith('blob:')) {
        const firstPublic = images.find(u => !u.startsWith('blob:')) || '';
        if (firstPublic) setCover(firstPublic);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }, [bucket, cover, images]);

  const onInputChange = (e) => uploadFiles(e.target.files);

  const makeCover = (url) => setCover(url);
  const removeImage = (url) => {
    if (url?.startsWith?.('blob:') && blobUrlsRef.current.has(url)) {
      try { URL.revokeObjectURL(url); } catch {}
      blobUrlsRef.current.delete(url);
    }
    const next = images.filter(u => u !== url);
    setImages(next);
    if (cover === url) setCover(next[0] || '');
  };
  const move = (url, dir) => {
    const idx = images.indexOf(url);
    if (idx === -1) return;
    const tgt = dir === 'left' ? idx - 1 : idx + 1;
    if (tgt < 0 || tgt >= images.length) return;
    const next = images.slice();
    const [item] = next.splice(idx, 1);
    next.splice(tgt, 0, item);
    setImages(next);
  };

  // estilos mínimos (no heredan estilos globales de button)
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: 10,
    marginTop: 10,
  };
  const cardStyle = (isCover) => ({
    border: isCover ? '2px solid #68ADA8' : '1px solid #ddd',
    borderRadius: 8,
    padding: 6,
    background: 'transparent',
  });
  const imgStyle = { width: '100%', height: 100, objectFit: 'cover', borderRadius: 6, background: '#222' };
  const barStyle = { display: 'flex', justifyContent: 'space-between', marginTop: 6, alignItems: 'center' };
  const icon = { all: 'unset', cursor: 'pointer', margin: '0 4px', userSelect: 'none', fontSize: 16, lineHeight: 1 };

  return (
    <div>
      <input type="file" accept="image/*" multiple={multiple} onChange={onInputChange} disabled={busy} />
      {busy && <div style={{ marginTop: 8, fontSize: 12 }}>Uploading...</div>}

      {images.length > 0 && (
        <div style={gridStyle}>
          {images.map((url) => {
            const isCover = url === cover;
            return (
              <div key={url} style={cardStyle(isCover)}>
                <img src={url} alt="preview" style={imgStyle} />
                <div style={barStyle}>
                  <span title="Set as cover" onClick={() => makeCover(url)} style={icon}>
                    {isCover ? '★' : '☆'}
                  </span>
                  <div>
                    <span title="Move left" onClick={() => move(url, 'left')} style={icon}>⟵</span>
                    <span title="Move right" onClick={() => move(url, 'right')} style={icon}>⟶</span>
                    <span title="Remove" onClick={() => removeImage(url)} style={icon}>✕</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UnifiedImageUploader;
