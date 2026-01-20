import React from 'react';

const ProfileJobsTab = ({ jobOffers, onTogglePause, onEdit, onDelete }) => (
  <>
    <h2>My Posted Jobs</h2>
    {jobOffers.length === 0 ? (
      <p>You have not posted any job offers yet.</p>
    ) : (
      <div className="profile-products-container">
        {jobOffers.map((offer) => (
          <div key={offer.id} className="profile-card">
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
              {offer.title}
            </div>
            {offer.teammate_rank && (
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                {offer.teammate_rank}
              </div>
            )}
            <p style={{ margin: '4px 0' }}>
              {offer.city}, {offer.country}
            </p>
            <p
              style={{
                margin: '4px 0',
                fontWeight: '500',
                fontSize: '0.95rem',
                color: '#333',
              }}
            >
              <strong>Posted:</strong>{' '}
              {new Date(offer.created_at).toLocaleDateString('en-GB')}
            </p>
            <div className="profile-action-buttons">
              <button
                className="pause-btn"
                onClick={() => onTogglePause(offer.id, offer.status)}
              >
                {offer.status === 'paused' ? 'Reactivate' : 'Pause'}
              </button>
              <button className="edit-btn" onClick={() => onEdit(offer.id)}>
                Edit
              </button>
              <button className="delete-btn" onClick={() => onDelete(offer.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </>
);

export default ProfileJobsTab;
