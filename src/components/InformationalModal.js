import React from 'react';
import Modal from './Modal';

export default function InformationalModal({ kicker, title, intro, points = [], sections = [], actionLabel = 'Got it', onClose }) {
  return (
    <Modal
      onClose={onClose}
      overlayClassName="info-promo-modal-overlay"
      contentClassName="info-promo-modal"
    >
      <div className="info-promo-modal-hero">
        {kicker && <p className="info-promo-modal-kicker">{kicker}</p>}
        <h3>{title}</h3>
        {intro && <p className="info-promo-modal-intro">{intro}</p>}
      </div>

      {points.length > 0 && (
        <ul className="info-promo-modal-points">
          {points.map((point) => <li key={point}>{point}</li>)}
        </ul>
      )}

      {sections.map((section) => (
        <section key={section.title} className="info-promo-modal-section">
          <h4 className="info-promo-modal-section-title">{section.title}</h4>
          {section.description && <p className="info-promo-modal-section-desc">{section.description}</p>}
          {Array.isArray(section.points) && section.points.length > 0 && (
            <ul className="info-promo-modal-points">
              {section.points.map((point) => <li key={point}>{point}</li>)}
            </ul>
          )}
        </section>
      ))}

      <div className="info-promo-modal-footer">
        <button type="button" className="info-promo-modal-btn" onClick={onClose}>
          {actionLabel}
        </button>
      </div>
    </Modal>
  );
}
