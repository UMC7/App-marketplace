// src/components/ProductCard.js

import React from 'react';
import { Link } from 'react-router-dom';

function ProductCard({ product, onRemoveFavorite }) {
  return (
    <div className="product-card">
      <Link to={`/product/${product.id}`}>
        <img
          src={product.mainphoto || 'https://via.placeholder.com/200'}
          alt={product.name}
          style={{ width: '200px', height: '200px', objectFit: 'cover' }}
        />
        <h3>{product.name}</h3>
        <p>{product.description || 'Sin descripción disponible.'}</p>
        <p>Precio: ${product.price}</p>
      </Link>

      {onRemoveFavorite && (
        <button
          onClick={() => onRemoveFavorite(product.id)}
          style={{ marginTop: '10px', backgroundColor: '#ff4d4f', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}
        >
          Quitar de favoritos
        </button>
      )}
    </div>
  );
}

export default ProductCard;