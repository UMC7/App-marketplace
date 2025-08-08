import React from 'react';
import './Modal.css';

function Modal({ onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-wrapper" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>✖</button>
        <div className="modal-inner-content">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;