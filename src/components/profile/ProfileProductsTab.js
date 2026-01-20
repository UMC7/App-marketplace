import React from 'react';

const ProfileProductsTab = ({
  products,
  onEdit,
  onTogglePause,
  onDelete,
}) => (
  <>
    <h2>My Posted Products</h2>
    {products.length === 0 ? (
      <p>You have not posted any products.</p>
    ) : (
      <div className="profile-products-container">
        {products.map((product) => (
          <div key={product.id} className="profile-card">
            <img
              src={product.mainphoto || 'https://via.placeholder.com/250'}
              alt={product.name}
            />
            <h3>{product.name}</h3>
            <p>
              <strong>Price:</strong> {product.currency || ''} {product.price}
            </p>
            <p>
              <strong>Status:</strong> {product.status}
            </p>
            <div className="profile-action-buttons">
              <button className="edit-btn" onClick={() => onEdit(product.id)}>
                Edit
              </button>
              <button
                className="pause-btn"
                onClick={() => onTogglePause(product.id, product.status)}
              >
                {product.status === 'paused' ? 'Reactivate' : 'Pause'}
              </button>
              <button className="delete-btn" onClick={() => onDelete(product.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </>
);

export default ProfileProductsTab;
