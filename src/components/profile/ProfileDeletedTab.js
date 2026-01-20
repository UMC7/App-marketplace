import React from 'react';

const ProfileDeletedTab = ({ deletedProducts, deletedJobs, onRestore }) => (
  <>
    <h2>Deleted Posts</h2>
    {deletedProducts.length === 0 && deletedJobs.length === 0 ? (
      <p>You have no deleted posts.</p>
    ) : (
      <>
        {deletedProducts.length > 0 && (
          <>
            <h3>Deleted Products</h3>
            <div className="profile-products-container">
              {deletedProducts.map((product) => (
                <div
                  key={product.id}
                  className="profile-card"
                  style={{ border: '1px dashed red' }}
                >
                  <img
                    src={product.mainphoto || 'https://via.placeholder.com/250'}
                    alt={product.name}
                  />
                  <h4>{product.name}</h4>
                  <p>
                    <strong>Price:</strong> {product.currency || ''}{' '}
                    {product.price}
                  </p>
                  <p>
                    <strong>Deleted on:</strong>{' '}
                    {new Date(product.deleted_at).toLocaleDateString()}
                  </p>
                  <div className="profile-action-buttons">
                    <button
                      className="restore-btn"
                      onClick={() => onRestore(product.id)}
                    >
                      Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {deletedJobs.length > 0 && (
          <>
            <h3>Deleted Jobs</h3>
            <div className="profile-products-container">
              {deletedJobs.map((job) => (
                <div
                  key={job.id}
                  style={{
                    border: '1px dashed red',
                    padding: '10px',
                    borderRadius: '8px',
                    width: '280px',
                  }}
                >
                  <h4>{job.title}</h4>
                  <p>
                    <strong>Location:</strong> {job.city}, {job.country}
                  </p>
                  <p>
                    <strong>Type:</strong> {job.type}
                  </p>
                  <p>
                    <strong>Start Date:</strong>{' '}
                    {new Date(job.start_date).toLocaleDateString()}
                  </p>
                  {job.end_date && (
                    <p>
                      <strong>End Date:</strong>{' '}
                      {new Date(job.end_date).toLocaleDateString()}
                    </p>
                  )}
                  {job.is_doe ? (
                    <p>
                      <strong>Salary:</strong> DOE
                    </p>
                  ) : (
                    job.salary && (
                      <p>
                        <strong>Salary:</strong> ${job.salary}
                      </p>
                    )
                  )}
                  {job.deleted_at && (
                    <p>
                      <strong>Deleted on:</strong>{' '}
                      {new Date(job.deleted_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </>
    )}
  </>
);

export default ProfileDeletedTab;
