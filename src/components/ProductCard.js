// src/components/ProductCard.js

import React from 'react';
import { Link } from 'react-router-dom';

function ProductCard({ product }) {
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
    </div>
  );
}

export default ProductCard;