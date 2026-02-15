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
  showRequiredMark = true,
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
    const name = model.name?.trim() || "";
    const role = model.role?.trim() || "";
    const company = model.company?.trim() || "";
    const phone = model.phone?.trim() || "";
    const email = model.email?.trim() || "";
    const emailOk = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!name) e.name = "Required";
    if (!role) e.role = "Required";
    if (!company) e.company = "Required";
    if (!phone && !email) {
      e.phone = "Required";
      e.email = "Required";
    }
    if (email && !emailOk) e.email = "Invalid email";

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

  const nameOk = !!model.name?.trim();
  const roleOk = !!model.role?.trim();
  const companyOk = !!model.company?.trim();
  const phoneOk = !!model.phone?.trim();
  const emailVal = model.email?.trim() || "";
  const emailOk = !emailVal || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
  const contactOk = phoneOk || !!emailVal;
  const canSave = nameOk && roleOk && companyOk && contactOk && emailOk;

  const reqLabel = (text) => (showRequiredMark ? `${text} *` : text);
  const optLabel = (text) => (showRequiredMark ? text : `${text} (Optional)`);

  return (
    <form className="cv-ref-form" onSubmit={handleSubmit}>
      <div className="grid">
        <label>
          <span>{reqLabel('Name')}</span>
          <input
            type="text"
            value={model.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="e.g., Mathilde Larrey"
            className={!nameOk ? "cp-missing-input" : ""}
          />
          {errors.name && <em className="err">{errors.name}</em>}
        </label>

        <label>
          <span>{reqLabel('Role / Position')}</span>
          <input
            type="text"
            value={model.role}
            onChange={(e) => setField("role", e.target.value)}
            placeholder="e.g., Chief Stew"
            className={!roleOk ? "cp-missing-input" : ""}
          />
          {errors.role && <em className="err">{errors.role}</em>}
        </label>

        <label>
          <span>{reqLabel('Vessel / Company')}</span>
          <input
            type="text"
            value={model.company}
            onChange={(e) => setField("company", e.target.value)}
            placeholder="e.g., M/Y Euphoria II"
            className={!companyOk ? "cp-missing-input" : ""}
          />
          {errors.company && <em className="err">{errors.company}</em>}
        </label>

        <label>
          <span>{reqLabel('Phone')}</span>
          <input
            type="tel"
            value={model.phone}
            onChange={(e) => setField("phone", e.target.value)}
            placeholder="+33 6 95 38 27 57"
            className={!phoneOk && !emailVal ? "cp-missing-input" : ""}
          />
          {errors.phone && <em className="err">{errors.phone}</em>}
        </label>

        <label>
          <span>{reqLabel('Email')}</span>
          <input
            type="email"
            value={model.email}
            onChange={(e) => setField("email", e.target.value)}
            placeholder="name@domain.com"
            className={(!emailVal && !phoneOk) || (emailVal && !emailOk) ? "cp-missing-input" : ""}
          />
          {errors.email && <em className="err">{errors.email}</em>}
        </label>

        {/* Attachment (optional) */}
        <div>
          <AttachmentInput
            value={model.attachment_url}
            onChange={(u) => setField("attachment_url", u)}
            onUpload={handleUpload}
            label={optLabel('Attachment')}
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
        .cv-ref-form input.cp-missing-input{
          border-color:#e05252 !important;
          box-shadow: 0 0 0 2px rgba(224, 82, 82, 0.25) !important;
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
