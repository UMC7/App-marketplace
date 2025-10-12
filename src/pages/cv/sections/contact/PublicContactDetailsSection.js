// src/pages/cv/sections/contact/PublicContactDetailsSection.jsx
import React, { useMemo } from 'react';
import './PublicContactDetailsSection.css';

const isBlank = (v) => String(v ?? '').trim() === '';

function normUrl(u) {
  if (isBlank(u)) return '';
  const s = String(u).trim();
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}
function mailto(e) { return e ? `mailto:${e}` : null; }
function tel(cc, num) {
  const ccD = String(cc || '').replace(/[^\d]/g, '');
  const nD  = String(num || '').replace(/[^\d]/g, '');
  return nD ? `tel:+${ccD}${nD}` : null;
}
function waLink(cc, num) {
  const ccD = String(cc || '').replace(/[^\d]/g, '');
  const nD  = String(num || '').replace(/[^\d]/g, '');
  return nD ? `https://wa.me/${ccD}${nD}` : null;
}

export default function PublicContactDetailsSection({ profile }) {
  // flags de visibilidad
  const showEmail = (profile?.show_email_public !== false);
  const showPhone = (profile?.show_phone_public !== false);

  // contacto (desde public_profiles expuesto por el RPC)
  const email       = showEmail ? (profile?.email_public || '') : '';
  const phoneCC     = showPhone ? (profile?.phone_cc || '') : '';
  const phoneNumber = showPhone ? (profile?.phone_number || '') : '';
  const waSame      = !!profile?.whatsapp_same;
  const waCC        = showPhone ? (waSame ? phoneCC     : (profile?.whatsapp_cc || '')) : '';
  const waNumber    = showPhone ? (waSame ? phoneNumber : (profile?.whatsapp_number || '')) : '';

  const website  = normUrl(profile?.website || '');
  const linkedin = normUrl(profile?.linkedin || '');
  const facebook = normUrl(profile?.facebook || '');

  const instagram = useMemo(() => {
    const raw = String(profile?.instagram || '').trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;
    return `https://www.instagram.com/${raw.replace(/^@/, '')}`;
  }, [profile?.instagram]);

  const phoneText = !isBlank(phoneNumber)
    ? `+${String(phoneCC || '').replace(/[^\d]/g, '')} ${phoneNumber}`
    : '';
  const waText    = !isBlank(waNumber)
    ? `+${String(waCC || '').replace(/[^\d]/g, '')} ${waNumber}`
    : '';

  return (
    <section className="pcd-section" aria-label="Contact details">
      <h3 className="pcd-title">CONTACT DETAILS</h3>

      {/* ÚNICA grilla con 3 columnas para TODOS los campos */}
      <div className="pcd-grid">

        {/* 1. EMAIL */}
        <div className="pcd-item">
          <div className="pcd-field">
            <div className="pcd-headline">
              <span className="pcd-bullet" aria-hidden="true" />
              <span className="pcd-label">Email</span>
            </div>
            <div className="pcd-value">
              {showEmail
                ? (email
                    ? <a href={mailto(email)} target="_blank" rel="noreferrer">{email}</a>
                    : <span className="pcd-muted">—</span>)
                : <span className="pcd-muted">— Hidden —</span>}
            </div>
          </div>
        </div>

        {/* 2. MOBILE PHONE */}
        <div className="pcd-item">
          <div className="pcd-field">
            <div className="pcd-headline">
              <span className="pcd-bullet" aria-hidden="true" />
              <span className="pcd-label">Mobile phone</span>
            </div>
            <div className="pcd-value">
              {showPhone
                ? (phoneText
                    ? <a href={tel(phoneCC, phoneNumber)} target="_blank" rel="noreferrer">{phoneText}</a>
                    : <span className="pcd-muted">—</span>)
                : <span className="pcd-muted">— Hidden —</span>}
            </div>
          </div>
        </div>

        {/* 3. WHATSAPP */}
        <div className="pcd-item">
          <div className="pcd-field">
            <div className="pcd-headline">
              <span className="pcd-bullet" aria-hidden="true" />
              <span className="pcd-label">WhatsApp</span>
            </div>
            <div className="pcd-value">
              {showPhone
                ? (waText
                    ? <a href={waLink(waCC, waNumber)} target="_blank" rel="noreferrer">{waText}</a>
                    : <span className="pcd-muted">—</span>)
                : <span className="pcd-muted">— Hidden —</span>}
            </div>
          </div>
        </div>

        {/* 4. FACEBOOK */}
        <div className="pcd-item">
          <div className="pcd-field">
            <div className="pcd-headline">
              <span className="pcd-bullet" aria-hidden="true" />
              <span className="pcd-label">Facebook</span>
            </div>
            <div className="pcd-value">
              {facebook
                ? <a href={facebook} target="_blank" rel="noreferrer">
                    {facebook.replace(/^https?:\/\//, '')}
                  </a>
                : <span className="pcd-muted">—</span>}
            </div>
          </div>
        </div>

        {/* 5. INSTAGRAM */}
        <div className="pcd-item">
          <div className="pcd-field">
            <div className="pcd-headline">
              <span className="pcd-bullet" aria-hidden="true" />
              <span className="pcd-label">Instagram</span>
            </div>
            <div className="pcd-value">
              {instagram
                ? <a href={instagram} target="_blank" rel="noreferrer">
                    {instagram.replace(/^https?:\/\//, '')}
                  </a>
                : <span className="pcd-muted">—</span>}
            </div>
          </div>
        </div>

        {/* 6. WEBSITE */}
        <div className="pcd-item">
          <div className="pcd-field">
            <div className="pcd-headline">
              <span className="pcd-bullet" aria-hidden="true" />
              <span className="pcd-label">Website / Portfolio</span>
            </div>
            <div className="pcd-value">
              {website
                ? <a href={website} target="_blank" rel="noreferrer">
                    {website.replace(/^https?:\/\//, '')}
                  </a>
                : <span className="pcd-muted">—</span>}
            </div>
          </div>
        </div>

        {/* 7. LINKEDIN */}
        <div className="pcd-item">
          <div className="pcd-field">
            <div className="pcd-headline">
              <span className="pcd-bullet" aria-hidden="true" />
              <span className="pcd-label">LinkedIn</span>
            </div>
            <div className="pcd-value">
              {linkedin
                ? <a href={linkedin} target="_blank" rel="noreferrer">
                    {linkedin.replace(/^https?:\/\//, '')}
                  </a>
                : <span className="pcd-muted">—</span>}
            </div>
          </div>
        </div>

        {/* 8-9. Espaciadores para completar la grilla (alineación perfecta) */}
        <div className="pcd-item pcd-item--spacer" aria-hidden="true">&nbsp;</div>
        <div className="pcd-item pcd-item--spacer" aria-hidden="true">&nbsp;</div>
      </div>
    </section>
  );
}