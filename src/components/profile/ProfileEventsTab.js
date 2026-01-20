import React from 'react';
import EditEventModal from '../EditEventModal';

const ProfileEventsTab = ({
  events,
  onEdit,
  onCancel,
  onPostpone,
  onDelete,
  editingEventId,
  onCloseEdit,
  onUpdate,
}) => (
  <>
    <h2>My Posted Events</h2>
    {events.length === 0 ? (
      <p>You have not posted any events.</p>
    ) : (
      <div className="profile-products-container">
        {events.map((event) => (
          <div key={event.id} className="profile-card">
            <img
              src={event.mainphoto || 'https://via.placeholder.com/250'}
              alt={event.event_name}
            />
            <h3>{event.event_name}</h3>
            <p>
              <strong>City:</strong> {event.city}
            </p>
            <p>
              <strong>Country:</strong> {event.country}
            </p>
            <p>
              <strong>Category:</strong> {event.category_id}
            </p>
            <p>
              <strong>Status:</strong> {event.status}
            </p>
            <div className="profile-action-buttons">
              <button className="edit-btn" onClick={() => onEdit(event.id)}>
                Edit
              </button>
              <button className="cancel-btn" onClick={() => onCancel(event.id)}>
                Cancel
              </button>
              <button className="postpone-btn" onClick={() => onPostpone(event.id)}>
                Postpone
              </button>
              <button className="delete-btn" onClick={() => onDelete(event.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
    {editingEventId && (
      <EditEventModal
        eventId={editingEventId}
        onClose={onCloseEdit}
        onUpdate={onUpdate}
      />
    )}
  </>
);

export default ProfileEventsTab;
