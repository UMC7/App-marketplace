// src/components/ProductList.js
import React, { useState } from 'react';
import ProductCard from './ProductCard';
import Modal from './Modal';
import ProductDetailPage from '../pages/ProductDetailPage';

function ProductList({ products, onRemoveFavorite }) {
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleOpenModal = (product) => {
    setSelectedProduct(product);
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
  };

  if (!products || products.length === 0) {
    return <p>No products available.</p>;
  }

  return (
    <>
      <div className="products-grid">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onRemoveFavorite={onRemoveFavorite}
            onOpenModal={handleOpenModal}
          />
        ))}
      </div>

      {selectedProduct && (
        <Modal onClose={handleCloseModal}>
          <ProductDetailPage id={selectedProduct.id} />
        </Modal>
      )}
    </>
  );
}

export default ProductList;