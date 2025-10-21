// src/components/cv/candidate/sectionscomponents/references/ReferenceForm.js
import React, { useEffect, useState } from "react";
import { AttachmentInput } from "./index";

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
    initialValue
      ? {
          ...EMPTY,
          ...initialValue,
          company: initialValue.company ?? initialValue.vessel_company ?? "",
        }
      : EMPTY
  );

  const [errors, setErrors] = useState({});
  const [pickedFile, setPickedFile] = useState(null);

  useEffect(() => {
    if (initialValue) {
      setModel({
        ...EMPTY,
        ...initialValue,
        company: initialValue.company ?? initialValue.vessel_company ?? "",
      });
    }
  }, [initialValue]);

  const setField = (k, v) => setModel((m) => ({ ...m, [k]: v }));

  const validate = () => {
    const e = {};
    if (!model.name?.trim()) e.name = "Required";
    if (!model.role?.trim()) e.role = "Required";
    if (!model.company?.trim()) e.company = "Required";
    if (!model.phone?.trim()) e.phone = "Required";
    if (!model.email?.trim()) e.email = "Required";
    if (
      model.email?.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(model.email.trim())
    ) {
      e.email = "Invalid email";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleUpload = async (file) => {
    setPickedFile(file);
    if (typeof onUploadAttachment === "function") {
      return onUploadAttachment(file);
    }
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
      id: initialValue?.id || null,
      name: model.name.trim(),
      role: model.role.trim(),
      company: model.company.trim(),
      vessel_company: model.company.trim(),
      phone: model.phone?.trim() || "",
      email: model.email?.trim() || "",
      attachment_url: model.attachment_url?.trim() || "",
      file: pickedFile || null,
    };

    onSave?.(payload);
  };

  const requiredFilled =
    !!model.name?.trim() &&
    !!model.role?.trim() &&
    !!model.company?.trim() &&
    !!model.phone?.trim() &&
    !!model.email?.trim();
  const emailLooksOk =
    !!model.email?.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(model.email.trim());
  const canSave = requiredFilled && emailLooksOk;

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
          <span>Phone *</span>
          <input
            type="tel"
            value={model.phone}
            onChange={(e) => setField("phone", e.target.value)}
            placeholder="+33 6 95 38 27 57"
          />
          {errors.phone && <em className="err">{errors.phone}</em>}
        </label>

        <label>
          <span>Email *</span>
          <input
            type="email"
            value={model.email}
            onChange={(e) => setField("email", e.target.value)}
            placeholder="name@domain.com"
          />
          {errors.email && <em className="err">{errors.email}</em>}
        </label>

        {/* Attachment (optional) */}
        <div>
          <AttachmentInput
            value={model.attachment_url}
            onChange={(u) => setField("attachment_url", u)}
            onUpload={handleUpload}
            label="Attachment"
          />
        </div>
      </div>

      <div className="actions">
        <button type="button" className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="submit"
          className="btn primary"
          disabled={!canSave}
          title={
            canSave
              ? undefined
              : "Please complete all required fields and provide a valid email."
          }
        >
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
        .cv-ref-form label > span{ color: var(--muted-2); font-size: 13px; }

        .cv-ref-form input{
          background: var(--input-bg);
          border: 1px solid var(--input-bd);
          color: var(--text);
          border-radius: 8px;
          padding: 10px 12px;
          outline: none;
          transition: border-color .15s ease, box-shadow .15s ease, background-color .15s ease;
        }
        .cv-ref-form input::placeholder{ color: var(--muted-2); opacity: .9; }
        .cv-ref-form input:focus{
          border-color: var(--accent-2);
          box-shadow: var(--focus);
        }

        .cv-ref-form .actions{
          display:flex; gap:10px; justify-content:flex-end; margin-top:12px;
        }

        .cv-ref-form .btn{
          border-radius:10px; padding:10px 14px;
          background: var(--btn-bg);
          color: var(--btn-tx);
          border: 1px solid var(--btn-bd);
          cursor:pointer;
          transition: border-color .15s ease, box-shadow .15s ease, background-color .15s ease, transform .05s ease;
        }
        .cv-ref-form .btn:hover{ border-color: var(--accent-2); box-shadow: var(--focus); }
        .cv-ref-form .btn:active{ transform: translateY(1px); }

        .cv-ref-form .btn.primary{
          background: var(--accent);
          color: #fff;
          border-color: var(--accent);
        }

        .cv-ref-form .btn.ghost{
          background: var(--btn-bg);
          color: var(--btn-tx);
          border-color: var(--btn-bd);
        }

        .cv-ref-form .btn[disabled]{ opacity:.6; cursor:not-allowed; }

        .cv-ref-form .err{ color:#fca5a5; font-size:12px; }
      `}</style>
    </form>
  );
}