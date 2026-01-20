import React from 'react';

const renderStars = (rating) => {
  const count = Math.max(0, Math.min(5, Math.round(rating)));
  return '⭐'.repeat(count);
};

const ProfileRatingsTab = ({ averageRating, receivedReviews }) => (
  <>
    <h2>Received Ratings</h2>

    {averageRating ? (
      <p>
        <strong>{renderStars(parseFloat(averageRating))} Overall Average:</strong>{' '}
        {averageRating} / 5
      </p>
    ) : (
      <p>You have not received any ratings yet.</p>
    )}

    {receivedReviews.length > 0 && (
      <div style={{ marginTop: '20px' }}>
        <h3>Received Comments:</h3>
        <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
          {receivedReviews.map((review) => {
            const productPhoto =
              review.purchases?.purchase_items?.[0]?.products?.mainphoto;
            const productName =
              review.purchases?.purchase_items?.[0]?.products?.name;

            return (
              <li
                key={review.id}
                style={{
                  marginBottom: '15px',
                  borderBottom: '1px solid #ccc',
                  paddingBottom: '10px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '15px',
                }}
              >
                {productPhoto && (
                  <img
                    src={productPhoto}
                    alt={productName || 'Producto'}
                    style={{
                      width: '80px',
                      height: '80px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                    }}
                  />
                )}
                <div>
                  <p>
                    <strong>{renderStars(review.rating)} Rating:</strong>{' '}
                    {review.rating} / 5
                  </p>
                  {review.comment && (
                    <p>
                      <strong>Comment:</strong> {review.comment}
                    </p>
                  )}
                  <p style={{ fontSize: '0.9em', color: '#666' }}>
                    Date: {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    )}
  </>
);

export default ProfileRatingsTab;
