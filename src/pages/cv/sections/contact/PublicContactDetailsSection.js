// src/pages/cv/sections/contact/PublicContactDetailsSection.jsx
import React, { useMemo } from 'react';
import './PublicContactDetailsSection.css';
import { emitContactOpen } from '../../../../services/analytics/emitEvent';

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

  // Reglas para "compactar" grilla (solo omitimos los campos realmente vacíos)
  const shouldShowEmail     = showEmail ? !isBlank(email) : true;  // si está oculto mostramos "Hidden"
  const shouldShowPhone     = showPhone ? !isBlank(phoneText) : true;
  const shouldShowWhatsapp  = showPhone ? !isBlank(waText) : true;
  const shouldShowFacebook  = !isBlank(facebook);
  const shouldShowInstagram = !isBlank(instagram);
  const shouldShowWebsite   = !isBlank(website);
  const shouldShowLinkedin  = !isBlank(linkedin);

  // Contexto para analytics
  const ownerUserId = profile?.user_id || profile?.owner_user_id || null;
  const handle      = profile?.handle || null;

  // Emisor "fire-and-forget" (no interfiere con la navegación)
  const emitContact = (channel, value) => {
    try {
      emitContactOpen({
        ownerUserId,
        handle,
        extra: { channel, value: String(value || '').slice(0, 200) },
      });
    } catch (_) {
      /* no-op */
    }
  };

  return (
    <section className="pcd-section" aria-label="Contact details">
      <h3 className="pcd-title">CONTACT DETAILS</h3>

      {/* ÚNICA grilla con 3 columnas para TODOS los campos */}
      <div className="pcd-grid">

        {/* 1. EMAIL (si está oculto, mostramos "Hidden" y ocupa lugar) */}
        {shouldShowEmail && (
          <div className="pcd-item">
            <div className="pcd-field">
              <div className="pcd-headline">
                <span className="pcd-bullet" aria-hidden="true" />
                <span className="pcd-label">Email</span>
              </div>
              <div className="pcd-value">
                {showEmail
                  ? (email
                      ? (
                        <a
                          href={mailto(email)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => emitContact('email', email)}
                        >
                          {email}
                        </a>
                      )
                      : <span className="pcd-muted">—</span>)
                  : <span className="pcd-muted">— Hidden —</span>}
              </div>
            </div>
          </div>
        )}

        {/* 2. MOBILE PHONE (si está oculto, mostramos "Hidden" y ocupa lugar) */}
        {shouldShowPhone && (
          <div className="pcd-item">
            <div className="pcd-field">
              <div className="pcd-headline">
                <span className="pcd-bullet" aria-hidden="true" />
                <span className="pcd-label">Mobile phone</span>
              </div>
              <div className="pcd-value">
                {showPhone
                  ? (phoneText
                      ? (
                        <a
                          href={tel(phoneCC, phoneNumber)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => emitContact('phone', `+${String(phoneCC || '').replace(/[^\d]/g, '')}${String(phoneNumber || '').replace(/[^\d]/g, '')}`)}
                        >
                          {phoneText}
                        </a>
                      )
                      : <span className="pcd-muted">—</span>)
                  : <span className="pcd-muted">— Hidden —</span>}
              </div>
            </div>
          </div>
        )}

        {/* 3. WHATSAPP (si está oculto, mostramos "Hidden" y ocupa lugar) */}
        {shouldShowWhatsapp && (
          <div className="pcd-item">
            <div className="pcd-field">
              <div className="pcd-headline">
                <span className="pcd-bullet" aria-hidden="true" />
                <span className="pcd-label">WhatsApp</span>
              </div>
              <div className="pcd-value">
                {showPhone
                  ? (waText
                      ? (
                        <a
                          href={waLink(waCC, waNumber)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => emitContact('whatsapp', `+${String(waCC || '').replace(/[^\d]/g, '')}${String(waNumber || '').replace(/[^\d]/g, '')}`)}
                        >
                          {waText}
                        </a>
                      )
                      : <span className="pcd-muted">—</span>)
                  : <span className="pcd-muted">— Hidden —</span>}
              </div>
            </div>
          </div>
        )}

        {/* 4. FACEBOOK */}
        {shouldShowFacebook && (
          <div className="pcd-item">
            <div className="pcd-field">
              <div className="pcd-headline">
                <span className="pcd-bullet" aria-hidden="true" />
                <span className="pcd-label">Facebook</span>
              </div>
              <div className="pcd-value">
                <a href={facebook} target="_blank" rel="noreferrer">
                  {facebook.replace(/^https?:\/\//, '')}
                </a>
              </div>
            </div>
          </div>
        )}

        {/* 5. INSTAGRAM */}
        {shouldShowInstagram && (
          <div className="pcd-item">
            <div className="pcd-field">
              <div className="pcd-headline">
                <span className="pcd-bullet" aria-hidden="true" />
                <span className="pcd-label">Instagram</span>
              </div>
              <div className="pcd-value">
                <a href={instagram} target="_blank" rel="noreferrer">
                  {instagram.replace(/^https?:\/\//, '')}
                </a>
              </div>
            </div>
          </div>
        )}

        {/* 6. WEBSITE */}
        {shouldShowWebsite && (
          <div className="pcd-item">
            <div className="pcd-field">
              <div className="pcd-headline">
                <span className="pcd-bullet" aria-hidden="true" />
                <span className="pcd-label">Website / Portfolio</span>
              </div>
              <div className="pcd-value">
                <a href={website} target="_blank" rel="noreferrer">
                  {website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            </div>
          </div>
        )}

        {/* 7. LINKEDIN */}
        {shouldShowLinkedin && (
          <div className="pcd-item">
            <div className="pcd-field">
              <div className="pcd-headline">
                <span className="pcd-bullet" aria-hidden="true" />
                <span className="pcd-label">LinkedIn</span>
              </div>
              <div className="pcd-value">
                <a href={linkedin} target="_blank" rel="noreferrer">
                  {linkedin.replace(/^https?:\/\//, '')}
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Eliminamos spacers: la grilla se compacta sola a 3 columnas máximo */}
      </div>
    </section>
  );
}