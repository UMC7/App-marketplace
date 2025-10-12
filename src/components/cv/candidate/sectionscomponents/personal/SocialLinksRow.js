// src/components/cv/candidate/sectionscomponents/personal/SocialLinksRow.jsx
import React from 'react';

export default function SocialLinksRow({
  facebook = '',
  onChangeFacebook,
  instagram = '',
  onChangeInstagram,
  linkedin = '',
  onChangeLinkedin,
  website = '',
  onChangeWebsite,
}) {
  const twoCols = {
    display: 'grid',
    gridTemplateColumns: 'var(--row-2-cols, 1fr 1fr)',
    gap: 12,
  };

  return (
    <>
      {/* Sociales: Facebook + Instagram */}
      <div style={twoCols}>
        <div>
          <label className="cp-label">Facebook</label>
          <input
            className="cp-input"
            value={facebook}
            onChange={(e) => onChangeFacebook && onChangeFacebook(e.target.value)}
            placeholder="https://facebook.com/…"
          />
        </div>
        <div>
          <label className="cp-label">Instagram (handle)</label>
          <input
            className="cp-input"
            value={instagram}
            onChange={(e) => onChangeInstagram && onChangeInstagram(e.target.value)}
            placeholder="@handle"
          />
        </div>
      </div>

      {/* Sociales: LinkedIn + Website/Portfolio (con separación vertical como si fueran 2 filas del form) */}
      <div style={{ ...twoCols, marginTop: 12 }}>
        <div>
          <label className="cp-label">LinkedIn</label>
          <input
            className="cp-input"
            value={linkedin}
            onChange={(e) => onChangeLinkedin && onChangeLinkedin(e.target.value)}
            placeholder="https://linkedin.com/in/…"
          />
        </div>
        <div>
          <label className="cp-label">Website / Portfolio</label>
          <input
            className="cp-input"
            value={website}
            onChange={(e) => onChangeWebsite && onChangeWebsite(e.target.value)}
            placeholder="https://your-portfolio.com"
          />
        </div>
      </div>
    </>
  );
}