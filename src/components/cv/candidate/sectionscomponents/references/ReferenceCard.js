// src/components/cv/candidate/sectionscomponents/references/ReferenceCard.jsx
import React, { useState } from "react";
import { getAttachmentSignedUrl } from "./index";

export default function ReferenceCard({ item, onEdit, onDelete }) {
  const [opening, setOpening] = useState(false);

  const company = item.company || item.vessel_company || "";

  const handleOpenSigned = async () => {
    if (!item?.attachment_path || opening) return;
    try {
      setOpening(true);
      const url = await getAttachmentSignedUrl(item.attachment_path, 60);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      // silencio: si falla, no rompemos la UI
    } finally {
      setOpening(false);
    }
  };

  const renderAttachmentBtn = () => {
    if (item.attachment_path) {
      return (
        <button
          type="button"
          className="linklike"
          onClick={handleOpenSigned}
          disabled={opening}
          title={item.attachment_name || "View attachment"}
        >
          {opening ? "Opening…" : "View attachment"}
        </button>
      );
    }
    if (item.attachment_url) {
      return (
        <a
          href={item.attachment_url}
          target="_blank"
          rel="noopener noreferrer"
          className="linklike"
          title="View attachment"
        >
          View attachment
        </a>
      );
    }
    return null;
  };

  return (
    <div className="cv-ref-card">
      <div className="head">
        <strong className="title">{item.name || "—"}</strong>
        <div className="minor">
          {item.role ? item.role : "—"}
          {company ? ` — ${company}` : ""}
        </div>
      </div>

      {/* Línea de contacto: teléfono y email */}
      <div className="meta">
        {item.phone && (
          <div className="meta-item">
            <span className="ico">📞</span>
            <a href={`tel:${item.phone}`} className="link">
              {item.phone}
            </a>
          </div>
        )}
        {item.email && (
          <div className="meta-item">
            <span className="ico">✉️</span>
            <a href={`mailto:${item.email}`} className="link">
              {item.email}
            </a>
          </div>
        )}
      </div>

      {/* Fila de CTAs: View attachment + Edit + Delete */}
      <div className="cta-row">
        {renderAttachmentBtn() && (
          <div className="cta cta-attach">
            <span className="ico">📎</span>
            {renderAttachmentBtn()}
          </div>
        )}

        <div className="cta actions">
          <button className="btn ghost" onClick={onEdit}>
            Edit
          </button>
          <button className="btn danger" onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>

      <style>{`
        /* Tarjeta */
        .cv-ref-card{
          border:1px solid var(--line, #212734);
          background: linear-gradient(180deg, var(--card, #151a23), var(--card-2, #10151d));
          border-radius:12px;
          padding:14px;
          display:flex; flex-direction:column; gap:10px;
          box-sizing:border-box; width:100%; max-width:100%;
        }
        .cv-ref-card .head{ display:flex; flex-direction:column; gap:4px; min-width:0; }
        .cv-ref-card .title{ font-size:1.05rem; color:var(--text, #e6e9ef); }
        .cv-ref-card .minor{ color:var(--muted, #9aa4b2); overflow-wrap:anywhere; }

        .cv-ref-card .meta{
          display:flex; gap:18px; flex-wrap:wrap;
          color:var(--text, #cbd5e1);
        }
        .cv-ref-card .meta-item{ display:inline-flex; align-items:center; gap:6px; min-width:0; }
        .cv-ref-card .ico{ opacity:.85; }

        /* Enlaces protegidos: evitar nowrap global */
        .cv-ref-card .link{
          display:inline;
          max-width:100%;
          white-space:normal;
          overflow-wrap:anywhere;
          word-break:break-word;
          color:var(--text, #cbd5e1);
          text-decoration:none;
        }
        .cv-ref-card .link:hover{ text-decoration:underline; }

        /* ===== CTAs (adjunto + botones) ===== */
        .cta-row{
          display:flex;
          flex-wrap:wrap;
          align-items:center;
          gap:8px;
          justify-content:flex-start;
        }
        .cta{
          display:inline-flex;
          align-items:center;
          gap:6px;
        }
        .linklike{
          background:transparent;
          border:0;
          color:var(--btn-tx, #e6e9ef);
          text-decoration:underline;
          cursor:pointer;
          padding:6px 10px;
          border-radius:10px;
        }
        .linklike[disabled]{ opacity:.6; cursor:not-allowed; text-decoration:none; }

        /* ➤ En desktop empuja Edit/Delete al borde derecho */
        .actions{ margin-left:auto; display:flex; gap:8px; }

        .btn{
          border-radius:10px; padding:8px 12px; cursor:pointer;
          background:var(--btn-bg, #0c1017); color:var(--btn-tx, #e6e9ef);
          border:1px solid var(--btn-bd, #202635);
        }
        .btn.ghost{ background:var(--btn-bg, #0c1017); }
        .btn.danger{ background:transparent; color:#b91c1c; border-color:#b91c1c; }

        /* SOLO móvil: patrón previo (attach arriba y botones 2 columnas) */
        @media (max-width:720px){
          .cv-ref-card{ padding:12px; }
          .cta-row{
            display:grid;
            grid-template-columns: 1fr 1fr;
            gap:8px;
          }
          .cta-attach{
            grid-column: 1 / -1;
            justify-content:flex-start;
          }
          .actions{
            grid-column: 1 / -1;
            display:grid;
            grid-template-columns: 1fr 1fr;
            gap:8px;
            margin-left:0; /* anula el empuje a la derecha en móvil */
          }
          .actions .btn{ width:100%; }
          .linklike{ padding:10px 12px; border:1px solid var(--btn-bd, #202635); border-radius:10px; text-decoration:none; }
        }
      `}</style>
    </div>
  );
}