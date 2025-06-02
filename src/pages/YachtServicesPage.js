import React, { useState, useEffect } from 'react';
import supabase from '../supabase';

function YachtServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedServiceId, setExpandedServiceId] = useState(null);

  useEffect(() => {
    const fetchServices = async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando servicios:', error.message);
      } else {
        setServices(data || []);
      }
      setLoading(false);
    };

    fetchServices();
  }, []);

  const toggleExpand = (serviceId) => {
    setExpandedServiceId((prevId) => (prevId === serviceId ? null : serviceId));
  };

  if (loading) {
    return <p style={{ padding: '20px' }}>Cargando servicios...</p>;
  }

  if (services.length === 0) {
    return <p style={{ padding: '20px' }}>No hay servicios disponibles.</p>;
  }

  return (
    <div className="container">
      <h1>SeaServices</h1>
      <p>Where providers can list and display the services they offer.</p>

      <div className="responsive-grid">

        {services.map((service) => (
          <div
  key={service.id}
  className={`yacht-card ${expandedServiceId === service.id ? 'expanded' : ''}`}
  onClick={() => toggleExpand(service.id)}
>
            <img
              src={service.mainphoto || 'https://via.placeholder.com/250'}
              alt={service.company_name}
              style={{ width: '100%', height: '150px', objectFit: 'cover' }}
            />
            <h3>{service.company_name}</h3>
            <p><strong>City:</strong> {service.city}</p>
            <p><strong>Country:</strong> {service.country}</p>
            <p><strong>Category:</strong> {service.category_id}</p>

            {expandedServiceId === service.id && (
              <div style={{ marginTop: '10px', fontSize: '0.9em' }}>
                <p><strong>Description:</strong> {service.description}</p>
                <p><strong>Email:</strong> {service.contact_email}</p>
                <p><strong>Phone:</strong> {service.contact_phone}</p>
                <p><strong>Alternative Phone:</strong> {service.alt_phone}</p>
                {service.website && (
                  <p><strong>Web:</strong> <a href={service.website} target="_blank" rel="noopener noreferrer">{service.website}</a></p>
                )}
                {service.facebook_url && (
                  <p><strong>Facebook:</strong> <a href={service.facebook_url} target="_blank" rel="noopener noreferrer">{service.facebook_url}</a></p>
                )}
                {service.instagram_url && (
                  <p><strong>Instagram:</strong> <a href={service.instagram_url} target="_blank" rel="noopener noreferrer">{service.instagram_url}</a></p>
                )}
                {service.linkedin_url && (
                  <p><strong>LinkedIn:</strong> <a href={service.linkedin_url} target="_blank" rel="noopener noreferrer">{service.linkedin_url}</a></p>
                )}
                {service.whatsapp_number && (
                  <p><strong>WhatsApp:</strong> <a href={`https://wa.me/${service.whatsapp_number}`} target="_blank" rel="noopener noreferrer">{service.whatsapp_number}</a></p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default YachtServicesPage;