// src/components/ProductCard.js

import React from 'react';

function ProductCard({ product, onRemoveFavorite }) {
  if (!product) {
    return (
      <div className="product-card">
        <p style={{ color: 'red', fontWeight: 'bold' }}>Producto no disponible</p>
        {onRemoveFavorite && (
          <button
            onClick={() => onRemoveFavorite(null)}
            style={{
              marginTop: '10px',
              backgroundColor: '#ff4d4f',
              color: 'white',
              border: 'none',
              padding: '5px 10px',
              cursor: 'pointer'
            }}
          >
            Quitar de favoritos
          </button>
        )}
      </div>
    );
  }

  const isPaused = product.status === 'paused';

  const handleCardClick = (e) => {
    if (isPaused) {
      e.preventDefault();
    }
  };

  return (
    <div className="product-card">
      <a
        href={isPaused ? undefined : `/product/${product.id}`}
        onClick={handleCardClick}
        style={{ pointerEvents: isPaused ? 'none' : 'auto', textDecoration: 'none', color: 'inherit' }}
      >
        <img
          src={product.mainphoto || 'https://via.placeholder.com/200'}
          alt={product.name}
          style={{ width: '200px', height: '200px', objectFit: 'cover' }}
        />
        <h3>{product.name}</h3>
        <p>Precio: ${product.price}</p>
        <p>País: {product.country || 'No especificado'}</p>
        {isPaused && (
          <p style={{ color: 'red', fontWeight: 'bold' }}>Producto Pausado</p>
        )}
      </a>

      {onRemoveFavorite && (
        <button
          onClick={() => onRemoveFavorite(product.id)}
          style={{
            marginTop: '10px',
            backgroundColor: '#ff4d4f',
            color: 'white',
            border: 'none',
            padding: '5px 10px',
            cursor: 'pointer'
          }}
        >
          Quitar de favoritos
        </button>
      )}
    </div>
  );
}

export default ProductCard;