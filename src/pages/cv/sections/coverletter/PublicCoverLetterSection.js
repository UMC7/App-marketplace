import React from 'react';
import './PublicCoverLetterSection.css';

export default function PublicCoverLetterSection({
  text = '',
}) {
  return (
    <section className="pcl-section" aria-label="About me">
      <h2 className="pcl-title">PROFESSIONAL STATEMENT</h2>
      <div className="pcl-divider" aria-hidden="true" />

      <div className="pcl-body">
        {String(text || '').trim() || '-'}
      </div>
    </section>
  );
}
