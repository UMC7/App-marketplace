import React from 'react';
import './Modal.css';

function Modal({ isOpen = true, onClose, children, contentClassName = '', overlayClassName = '' }) {
  if (!isOpen) return null;

  return (
    <div className={`modal-overlay ${overlayClassName}`.trim()} onClick={onClose}>
      <div
        className={`modal-content-wrapper ${contentClassName}`.trim()}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-button" onClick={onClose}>✖</button>
        <div className="modal-inner-content">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;
