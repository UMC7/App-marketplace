// src/components/cv/candidate/sectionscomponents/references/ReferenceForm.jsx
import React, { useEffect, useState } from "react";
import { AttachmentInput } from "./index";

/**
 * ReferenceForm
 * Props:
 * - initialValue?: { id?, name, role, company, phone, email, attachment_url }
 * - onCancel?: () => void
 * - onSave: (refObj) => void
 * - onUploadAttachment?: (file: File) => Promise<string>      // opcional
 */
const EMPTY = {
  name: "",
  role: "",
  company: "",
  phone: "",
  email: "",
  attachment_url: "",
};

export default function ReferenceForm({
  initialValue,
  onCancel,
  onSave,
  onUploadAttachment,
}) {
  const [model, setModel] = useState(
  initialValue ? { ...EMPTY, ...initialValue, company: initialValue.company ?? initialValue.vessel_company ?? "" } : EMPTY
  );

  const [errors, setErrors] = useState({});
  const [pickedFile, setPickedFile] = useState(null); // <- capturamos el File para persistencia

  useEffect(() => {
   if (initialValue) {
    setModel({ ...EMPTY, ...initialValue, company: initialValue.company ?? initialValue.vessel_company ?? "" });
   }
  }, [initialValue]);

  const setField = (k, v) => setModel((m) => ({ ...m, [k]: v }));

  const validate = () => {
    const e = {};
    if (!model.name?.trim()) e.name = "Required";
    if (!model.role?.trim()) e.role = "Required";
    if (!model.company?.trim()) e.company = "Required";
    if (model.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(model.email))
      e.email = "Invalid email";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Capturamos el File que el usuario selecciona (sin romper el flujo anterior)
  const handleUpload = async (file) => {
    setPickedFile(file);
    if (typeof onUploadAttachment === "function") {
      // comportamiento previo: delegar upload si el padre lo provee
      return onUploadAttachment(file);
    }
    // fallback: URL local para previsualización si no hay uploader
    try {
      return URL.createObjectURL(file);
    } catch {
      return "";
    }
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;

    const payload = {
      // preserva id al editar
      id: initialValue?.id || null,
      name: model.name.trim(),
      role: model.role.trim(),
      // compat + nuevo nombre que espera la API
      company: model.company.trim(),
      vessel_company: model.company.trim(),
      phone: model.phone?.trim() || "",
      email: model.email?.trim() || "",
      // compat con el componente actual
      attachment_url: model.attachment_url?.trim() || "",
      // nuevo: pasamos el File para que la API lo suba
      file: pickedFile || null,
    };

    onSave?.(payload);
  };

  return (
    <form className="cv-ref-form" onSubmit={handleSubmit}>
      <div className="grid">
        <label>
          <span>Name *</span>
          <input
            type="text"
            value={model.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="e.g., Mathilde Larrey"
          />
          {errors.name && <em className="err">{errors.name}</em>}
        </label>

        <label>
          <span>Role / Position *</span>
          <input
            type="text"
            value={model.role}
            onChange={(e) => setField("role", e.target.value)}
            placeholder="e.g., Chief Stew"
          />
          {errors.role && <em className="err">{errors.role}</em>}
        </label>

        <label>
          <span>Vessel / Company *</span>
          <input
            type="text"
            value={model.company}
            onChange={(e) => setField("company", e.target.value)}
            placeholder="e.g., M/Y Euphoria II"
          />
          {errors.company && <em className="err">{errors.company}</em>}
        </label>

        <label>
          <span>Phone</span>
          <input
            type="tel"
            value={model.phone}
            onChange={(e) => setField("phone", e.target.value)}
            placeholder="+33 6 95 38 27 57"
          />
        </label>

        <label>
          <span>Email</span>
          <input
            type="email"
            value={model.email}
            onChange={(e) => setField("email", e.target.value)}
            placeholder="name@domain.com"
          />
          {errors.email && <em className="err">{errors.email}</em>}
        </label>

        {/* Attachment (mantiene el flujo existente y además captura el File) */}
        <div>
          <AttachmentInput
            value={model.attachment_url}
            onChange={(u) => setField("attachment_url", u)}
            onUpload={handleUpload} // capturamos el File y, si existe, delegamos upload
            label="Attachment"
          />
        </div>
      </div>

      <div className="actions">
        <button type="button" className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn primary">
          Save
        </button>
      </div>

      <style>{`
        .cv-ref-form .grid{
          display:grid; gap:12px;
          grid-template-columns: repeat(3, minmax(0,1fr));
        }
        @media (max-width: 768px){
          .cv-ref-form .grid{ grid-template-columns: 1fr; }
        }
        .cv-ref-form label{ display:flex; flex-direction:column; gap:6px; }
        .cv-ref-form input{
          background:#1f2937; border:1px solid #374151; color:#e5e7eb;
          border-radius:8px; padding:10px 12px;
        }
        .cv-ref-form .actions{ display:flex; gap:10px; justify-content:flex-end; margin-top:12px; }
        .btn{ border-radius:10px; padding:10px 14px; border:1px solid transparent; cursor:pointer; }
        .btn.primary{ background:#39797a; color:white; }
        .btn.ghost{ background:transparent; border-color:#4b5563; color:#e5e7eb; }
        .err{ color:#fca5a5; font-size:12px; }
      `}</style>
    </form>
  );
}