import React from 'react';

const ProfilePurchasesTab = ({
  purchases,
  updatedPurchaseStatuses,
  sentReviews,
  onReviewSubmit,
  onConfirmPurchase,
  onReportProblem,
  onCancelPurchase,
}) => (
  <>
    <h2>My Purchases</h2>
    {purchases.length === 0 ? (
      <p>You have not made any purchases yet.</p>
    ) : (
      <div className="profile-products-container">
        {purchases.map((item) => {
          const status =
            updatedPurchaseStatuses[item.purchases?.id] || item.purchases?.status;
          const reviewed = sentReviews.some(
            (r) =>
              r.purchase_id === item.purchases?.id && r.product_id === item.product_id
          );
          return (
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
                <strong>Seller:</strong> {item.products?.users?.first_name}{' '}
                {item.products?.users?.last_name}
              </p>
              <p>
                <strong>Phone:</strong> {item.products?.users?.phone || 'Not available'}
              </p>
              <p>
                <strong>Email:</strong> {item.products?.users?.email || 'Not available'}
              </p>
              <p>
                <strong>City:</strong> {item.products?.city || 'Not available'}
              </p>
              <p>
                <strong>Purchase Date:</strong>{' '}
                {new Date(item.purchases?.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>

              {['completed', 'cancelled', 'problem_reported'].includes(status) && (
                <div
                  style={{
                    marginTop: '10px',
                    color:
                      status === 'completed'
                        ? '#2e7d32'
                        : status === 'cancelled'
                        ? '#aa7b00'
                        : '#b00020',
                  }}
                >
                  <strong>ƒo. Action recorded:</strong>{' '}
                  {status === 'completed'
                    ? 'Purchase confirmed'
                    : status === 'cancelled'
                    ? 'Purchase cancelled'
                    : 'Problem reported'}
                </div>
              )}

              {['completed', 'cancelled', 'problem_reported'].includes(
                item.purchases?.status
              ) &&
                !reviewed && (
                  <div style={{ marginTop: '10px' }}>
                    <form onSubmit={(e) => onReviewSubmit(e, item)}>
                      <p>
                        <strong>Leave your rating for the seller:</strong>
                      </p>
                      <label>
                        Score (1ƒ?"5):
                        <input type="number" name="rating" min="1" max="5" required />
                      </label>
                      <br />
                      <label>
                        Comment:
                        <textarea name="comment" rows="3" style={{ width: '100%' }} />
                      </label>
                      <br />
                      <button
                        className="profile-action-buttons action-btn"
                        type="submit"
                      >
                        Submit Rating
                      </button>
                    </form>
                  </div>
                )}

              {!['completed', 'cancelled', 'problem_reported'].includes(status) && (
                <div className="profile-action-buttons" style={{ marginTop: '10px' }}>
                  <p>
                    <strong>How did this transaction end?</strong>
                  </p>
                  <button
                    className="success-btn"
                    onClick={() => onConfirmPurchase(item)}
                  >
                    Received successfully
                  </button>

                  <button
                    className="warning-btn"
                    onClick={() => onReportProblem(item)}
                  >
                    There was a problem
                  </button>

                  <button
                    className="danger-btn"
                    onClick={() => onCancelPurchase(item)}
                  >
                    Cancel purchase
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    )}
  </>
);

export default ProfilePurchasesTab;
