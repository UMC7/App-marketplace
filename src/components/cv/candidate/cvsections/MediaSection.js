// src/components/cv/candidate/cvsections/MediaSection.js
import React, { useEffect, useState } from "react";
import { MediaUploader, MediaGallery } from "../sectionscomponents/media";

export default function MediaSection({
  value,
  onChange,
  onUpload,
  title = "Photos & Videos",
  max = 12,
  readOnly = false,
  columns = 3,
  // showEditor se mantiene en la firma por compatibilidad, pero no se renderiza
  showEditor = true,
}) {
  const [local, setLocal] = useState(Array.isArray(value) ? value : []);
  const controlled = typeof onChange === "function";

  // Sync cuando el padre cambia value
  useEffect(() => {
    if (Array.isArray(value)) setLocal(value);
  }, [value]);

  const handleChange = (next) => {
    if (controlled) onChange(next);
    else setLocal(next);
  };

  const data = controlled ? value || [] : local;

  const handleRemove = (index) => {
    const next = data.filter((_, i) => i !== index);
    handleChange(next);
  };

  const handleMove = (index, dir) => {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= data.length) return;
    const next = [...data];
    const [itm] = next.splice(index, 1);
    next.splice(newIndex, 0, itm);
    handleChange(next);
  };

  const handleSetCover = (index) => {
    if (index === 0) return;
    const next = [...data];
    const [itm] = next.splice(index, 1);
    next.unshift(itm);
    handleChange(next);
  };

  // Quitamos el contenedor con borde (cv-section) para evitar el “doble marco”
  // y dejamos solo el contenido funcional.
  return (
    <>
      {!readOnly && (
        <div className="block">
          <MediaUploader
            value={data}
            onChange={handleChange}
            onUpload={onUpload}
            max={max}
            // Dejamos el uploader solo como dropzone para evitar grilla duplicada
            showGrid={false}
          />
        </div>
      )}

      {/* Editor en lista no se renderiza para evitar duplicación visual.
          La funcionalidad de reordenar y set cover vive ahora en la grilla. */}
      <div className="block">
        <MediaGallery
          items={data}
          onRemove={readOnly ? undefined : handleRemove}
          onMove={readOnly ? undefined : handleMove}
          onSetCover={readOnly ? undefined : handleSetCover}
          readOnly={readOnly}
          columns={columns}
        />
      </div>
    </>
  );
}