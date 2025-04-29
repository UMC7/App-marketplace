// src/components/ProductCard.js

import React from 'react';
import { Link } from 'react-router-dom'; // Para hacer que cada producto sea clickeable y llevar a su página de detalle

function ProductCard({ product }) {
  return (
    <div className="product-card">
      <Link to={`/product/${product.id}`}>
        <img
          src={product.mainphoto}
          alt={product.name}
          style={{ width: '200px', height: '200px', objectFit: 'cover' }}
        />
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <p>Precio: ${product.price}</p>
      </Link>
    </div>
  );
}

export default ProductCard;