import React from 'react';

function ProductCard({ product, onRemoveFavorite }) {
  const isDeleted = product?.status === 'deleted';
  const isPaused = product?.status === 'paused';

  const handleCardClick = (e) => {
    if (isDeleted || isPaused) {
      e.preventDefault();
    }
  };

  const id = product?.id ?? null;
  const name = product?.name || '';
  const price = product?.price ? `${product.currency || ''} ${product.price}` : '-';
  const country = product?.country || 'No especificado';
  const mainphoto = product?.mainphoto || 'https://via.placeholder.com/200?text=Sin+imagen';

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
          Producto eliminado
        </div>
      )}

      <a
        href={isDeleted ? undefined : `/product/${id}`}
        onClick={handleCardClick}
        style={{
          pointerEvents: isDeleted ? 'none' : 'auto',
          textDecoration: 'none',
          color: 'inherit',
        }}
      >
        <img
          src={mainphoto}
          alt={name}
          style={{ width: '200px', height: '200px', objectFit: 'cover' }}
        />
        <h3>{name}</h3>
        <p>Precio: {price}</p>
        <p>País: {country}</p>

        {isPaused && (
          <p style={{ color: 'orange', fontWeight: 'bold' }}>Producto Pausado</p>
        )}
      </a>

      {onRemoveFavorite && (
        <button
  className="landing-button"
  onClick={() => onRemoveFavorite(id)}
  style={{ marginTop: '10px' }}
>
  Quitar de favoritos
</button>
      )}
    </div>
  );
}

export default ProductCard;