// src/components/ProductList.js

import React from 'react';
import ProductCard from './ProductCard';

function ProductList({ products }) {
  if (!products || products.length === 0) {
    return <p>No hay productos disponibles.</p>;
  }

  return (
    <div className="products-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export default ProductList;