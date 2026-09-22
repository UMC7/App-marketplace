import React from 'react';
import Modal from './Modal';

export default function InformationalModal({ kicker, title, intro, points = [], actionLabel = 'Got it', onClose }) {
  return (
    <Modal
      onClose={onClose}
      overlayClassName="info-promo-modal-overlay"
      contentClassName="info-promo-modal"
    >
      <div className="info-promo-modal-hero">
        {kicker && <p className="info-promo-modal-kicker">{kicker}</p>}
        <h3>{title}</h3>
        <p className="info-promo-modal-intro">{intro}</p>
      </div>

      {points.length > 0 && (
        <ul className="info-promo-modal-points">
          {points.map((point) => <li key={point}>{point}</li>)}
        </ul>
      )}

      <div className="info-promo-modal-footer">
        <button type="button" className="info-promo-modal-btn" onClick={onClose}>
          {actionLabel}
        </button>
      </div>
    </Modal>
  );
}
