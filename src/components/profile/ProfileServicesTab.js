import React from 'react';
import EditServiceModal from '../EditServiceModal';

const ProfileServicesTab = ({
  services,
  onEdit,
  onTogglePause,
  onDelete,
  editingServiceId,
  onCloseEdit,
  onUpdate,
}) => (
  <>
    <h2>My Posted Services</h2>
    {services.length === 0 ? (
      <p>You have not posted any services.</p>
    ) : (
      <div className="profile-products-container">
        {services.map((service) => (
          <div key={service.id} className="profile-card">
            <img
              src={service.mainphoto || 'https://via.placeholder.com/250'}
              alt={service.company_name}
            />
            <h3>{service.company_name}</h3>
            <p>
              <strong>City:</strong> {service.city}
            </p>
            <p>
              <strong>Country:</strong> {service.country}
            </p>
            <p>
              <strong>Category:</strong> {service.category_id}
            </p>
            <p>
              <strong>Status:</strong> {service.status}
            </p>
            <div className="profile-action-buttons">
              <button className="edit-btn" onClick={() => onEdit(service.id)}>
                Edit
              </button>
              <button
                className="pause-btn"
                onClick={() => onTogglePause(service.id, service.status)}
              >
                {service.status === 'paused' ? 'Reactivate' : 'Pause'}
              </button>
              <button className="delete-btn" onClick={() => onDelete(service.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
    {editingServiceId && (
      <EditServiceModal
        serviceId={editingServiceId}
        onClose={onCloseEdit}
        onUpdate={onUpdate}
      />
    )}
  </>
);

export default ProfileServicesTab;
