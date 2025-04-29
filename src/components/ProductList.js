// src/components/ProductList.js

import React from 'react';
import ProductCard from './ProductCard'; // Importamos el componente ProductCard

function ProductList({ products }) {
  return (
    <div className="products-grid">
      {products.length > 0 ? (
        products.map((product) => (
          <ProductCard key={product.id} product={product} /> // Pasamos el producto como prop a ProductCard
        ))
      ) : (
        <p>No hay productos disponibles.</p>
      )}
    </div>
  );
}

export default ProductList;