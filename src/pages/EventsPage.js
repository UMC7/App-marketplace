import React, { useState, useEffect } from 'react';
import supabase from '../supabase';

function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedEventId, setExpandedEventId] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .in('status', ['active', 'cancelled', 'postponed'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando eventos:', error.message);
      } else {
        setEvents(data || []);
      }
      setLoading(false);
    };

    fetchEvents();
  }, []);

  const toggleExpand = (eventId) => {
    setExpandedEventId((prevId) => (prevId === eventId ? null : eventId));
  };

  if (loading) {
    return <p style={{ padding: '20px' }}>Cargando eventos...</p>;
  }

  if (events.length === 0) {
    return <p style={{ padding: '20px' }}>No hay eventos disponibles.</p>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Eventos</h1>
      <p>Bienvenido a la sección de eventos. Aquí podrás ver todos los eventos publicados por la comunidad.</p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
          marginTop: '20px',
        }}
      >
        {events.map((event) => (
          <div
            key={event.id}
            style={{
              position: 'relative',
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '10px',
              cursor: 'pointer',
              backgroundColor: expandedEventId === event.id ? '#f9f9f9' : 'white',
            }}
            onClick={() => toggleExpand(event.id)}
          >
            {event.status !== 'active' && (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(-45deg)',
    backgroundColor: 'rgba(255,0,0,0.7)',
    color: 'white',
    padding: '10px 50px',
    fontSize: '1.2em',
    fontWeight: 'bold',
    textAlign: 'center',
    pointerEvents: 'none',
    zIndex: 2,
  }}>
    {event.status === 'cancelled' ? 'CANCELLED' : 'POSTPONED'}
  </div>
)}


<img
  src={event.mainphoto || 'https://via.placeholder.com/250'}
  alt={event.event_name}
  style={{ width: '100%', height: '150px', objectFit: 'cover' }}
/>
<h3>{event.event_name}</h3>
<p><strong>Ciudad:</strong> {event.city}</p>
<p><strong>País:</strong> {event.country}</p>
<p><strong>Categoría:</strong> {event.category_id}</p>

            {expandedEventId === event.id && (
              <div style={{ marginTop: '10px', fontSize: '0.9em' }}>
                <p><strong>Descripción:</strong> {event.description}</p>
                <p><strong>Correo de contacto:</strong> {event.contact_email}</p>
                <p><strong>Teléfono:</strong> {event.contact_phone}</p>
                <p><strong>Tel. alternativo:</strong> {event.alt_phone}</p>
                {event.website && (
                  <p><strong>Web:</strong> <a href={event.website} target="_blank" rel="noopener noreferrer">{event.website}</a></p>
                )}
                {event.facebook_url && (
                  <p><strong>Facebook:</strong> <a href={event.facebook_url} target="_blank" rel="noopener noreferrer">{event.facebook_url}</a></p>
                )}
                {event.instagram_url && (
                  <p><strong>Instagram:</strong> <a href={event.instagram_url} target="_blank" rel="noopener noreferrer">{event.instagram_url}</a></p>
                )}
                {event.linkedin_url && (
                  <p><strong>LinkedIn:</strong> <a href={event.linkedin_url} target="_blank" rel="noopener noreferrer">{event.linkedin_url}</a></p>
                )}
                {event.whatsapp_number && (
                  <p><strong>WhatsApp:</strong> <a href={`https://wa.me/${event.whatsapp_number}`} target="_blank" rel="noopener noreferrer">{event.whatsapp_number}</a></p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default EventsPage;