import React from 'react';
// No necesitamos definir los objetos de estilo aquí porque usaremos clases CSS

function Modal({ onClose, children }) {
  return (
    // Usa la clase CSS 'modal-overlay' en lugar de los estilos inline
    <div className="modal-overlay" onClick={onClose}>
      {/* Usa la clase CSS 'modal-content-wrapper' en lugar de los estilos inline */}
      <div className="modal-content-wrapper" onClick={(e) => e.stopPropagation()}>
        {/* 'close-button' ya es una clase que tienes en global.css */}
        <button className="close-button" onClick={onClose}>✖</button>
        {children}
      </div>
    </div>
  );
}

export default Modal;