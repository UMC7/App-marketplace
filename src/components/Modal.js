import React from 'react';

const modalOverlay = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 999,
};

const modalContent = {
  backgroundColor: '#fff',
  padding: '20px',
  borderRadius: '10px',
  maxWidth: '600px',
  width: '90%',
  maxHeight: '80vh',             // Limita la altura
  overflowY: 'auto',             // Scroll vertical si se excede
  boxShadow: '0 0 10px rgba(0,0,0,0.3)'
};

function Modal({ onClose, children }) {
  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modalContent} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} style={{ float: 'right' }}>✖</button>
        {children}
      </div>
    </div>
  );
}

export default Modal;