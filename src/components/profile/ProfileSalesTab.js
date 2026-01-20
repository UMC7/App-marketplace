import React from 'react';

const ProfileSalesTab = ({ sales }) => (
  <>
    <h2>My Sales</h2>
    {sales.length === 0 ? (
      <p>You have not made any sales yet.</p>
    ) : (
      <div className="profile-products-container">
        {sales.map((item) => (
          <div key={item.id} className="profile-card">
            <img
              src={item.products?.mainphoto || 'https://via.placeholder.com/250'}
              alt={item.products?.name || 'Product'}
            />
            <p>
              <strong>Product:</strong> {item.products?.name || 'Name not available'}
            </p>
            <p>
              <strong>Quantity:</strong> {item.quantity}
            </p>
            <p>
              <strong>Total:</strong> ${item.total_price}
            </p>
            <p>
              <strong>Buyer:</strong> {item.purchases?.users?.first_name}{' '}
              {item.purchases?.users?.last_name}
            </p>
            <p>
              <strong>Phone:</strong> {item.purchases?.users?.phone || 'Not available'}
            </p>
            <p>
              <strong>Email:</strong> {item.purchases?.users?.email || 'Not available'}
            </p>
            <p>
              <strong>Sale Date:</strong>{' '}
              {new Date(item.purchases?.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        ))}
      </div>
    )}
  </>
);

export default ProfileSalesTab;
