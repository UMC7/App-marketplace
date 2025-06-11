// src/components/ProductCard.js
import React from 'react';

function ProductCard({ product, onRemoveFavorite, onOpenModal }) {
  const isDeleted = product?.status === 'deleted';
  const isPaused = product?.status === 'paused';

  const id = product?.id ?? null;
  const name = product?.name || '';
  const price = product?.price
  ? `${product.currency || ''} ${Number(product.price).toLocaleString('en-US')}` : '-';
  const country = product?.country || 'Not specified';
  const mainphoto = product?.mainphoto || 'https://via.placeholder.com/200?text=Sin+imagen';

  const handleClick = (e) => {
    if (e.ctrlKey || e.metaKey || e.button !== 0) return;
    e.preventDefault();
    if (!isDeleted && onOpenModal) onOpenModal(product);
  };

  return (
    <div className="product-card">
      {isDeleted && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-20deg)',
            backgroundColor: 'rgba(255, 0, 0, 0.75)',
            color: 'white',
            padding: '5px 20px',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          Product deleted
        </div>
      )}

      <div className="product-card-inner" onClick={handleClick} style={{ cursor: isDeleted ? 'not-allowed' : 'pointer', opacity: isDeleted ? 0.5 : 1 }}>
        <div className="product-image-col">
          <img
            src={mainphoto}
            alt={name}
            style={{ width: '110px', height: '110px', objectFit: 'cover', borderRadius: '10px' }}
          />
        </div>
        <div className="product-info-col">
          <h3>{name}</h3>
          <p>{price}</p>
          <p>{country}</p>
          {isPaused && (
            <p style={{ color: 'orange', fontWeight: 'bold' }}>Product Paused</p>
          )}
          {onRemoveFavorite && (
            <button
              className="landing-button"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveFavorite(id);
              }}
              style={{ marginTop: '10px' }}
            >
              Remove from favorites
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
