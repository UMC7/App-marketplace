import React, { useState, useEffect } from 'react';
import './EventsPage.css';
import supabase from '../supabase';

const formatDate = (dateStr) => {
  const options = { day: '2-digit', month: 'short', year: 'numeric' };
  return new Date(dateStr).toLocaleDateString('es-ES', options);
};

const formatDateRange = (start, end, isSingleDay) => {
  if (isSingleDay || !end) return formatDate(start);

  const startDate = new Date(start);
  const endDate = new Date(end);

  const sameYear = startDate.getFullYear() === endDate.getFullYear();
  const sameMonth = sameYear && startDate.getMonth() === endDate.getMonth();

  const day = (date) => date.toLocaleDateString('es-ES', { day: '2-digit' });
  const month = (date) => date.toLocaleDateString('es-ES', { month: 'short' });
  const year = (date) => date.getFullYear();

  if (sameMonth) {
    return `${day(startDate)} - ${day(endDate)} ${month(startDate)} ${year(startDate)}`;
  }

  if (sameYear) {
    return `${day(startDate)} ${month(startDate)} - ${day(endDate)} ${month(endDate)} ${year(startDate)}`;
  }

  return `${formatDate(start)} - ${formatDate(end)}`;
};

const formatTime = (timeStr) => {
  const [hour, minute] = timeStr.split(':');
  return `${hour}:${minute}`;
};

function EventsPage() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedEventId, setExpandedEventId] = useState(null);

  const [searchDate, setSearchDate] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [availableCountries, setAvailableCountries] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .in('status', ['active', 'cancelled', 'postponed'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading events:', error.message);
      } else {
        setEvents(data || []);
        setFilteredEvents(data || []);

        const countries = [...new Set((data || []).map((e) => e.country))];
        setAvailableCountries(countries);

        // Extraer meses únicos en formato 'YYYY-MM'
        const monthsSet = new Set();
        (data || []).forEach(e => {
          if (e.start_date) {
            const date = new Date(e.start_date);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            monthsSet.add(`${year}-${month}`);
          }
        });

        // Ordenar y guardar como array
        const sortedMonths = Array.from(monthsSet).sort();
        setAvailableMonths(sortedMonths);
      }

      setLoading(false);
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    let filtered = [...events];

    if (searchDate) {
      filtered = filtered.filter(e => e.start_date && e.start_date.startsWith(searchDate));
    }

    if (selectedCountry) {
      filtered = filtered.filter(e => e.country === selectedCountry);
    }

    if (selectedCity) {
      filtered = filtered.filter(e =>
        e.city?.toLowerCase().includes(selectedCity.toLowerCase())
      );
    }

    setFilteredEvents(filtered);
  }, [searchDate, selectedCountry, selectedCity, events]);

  const toggleExpand = (eventId) => {
    setExpandedEventId((prevId) => (prevId === eventId ? null : eventId));
  };

  const formatMonthLabel = (value) => {
    const [year, month] = value.split('-');
    const date = new Date(`${value}-01`);
    return `${date.toLocaleString('en-US', { month: 'long' })} ${year}`;
  };

  if (loading) {
    return <p style={{ padding: '20px' }}>Loading events...</p>;
  }

  if (events.length === 0) {
    return <p style={{ padding: '20px' }}>No events available.</p>;
  }

  return (
    <div className="container">
      <div className="module-header-wrapper">
        <div className="module-header-row">
        <h1>SeaEvents</h1>
        <span>Where you can explore all events shared by the community.</span>
      </div>
    </div>

      <h3
        className="filter-toggle"
        onClick={() => setShowFilters((prev) => !prev)}
      >
        {showFilters ? 'Hide Filters ▲' : 'Show Filters ▼'}
      </h3>

      <button
        className="navbar-toggle"
        onClick={() => setShowFilters((prev) => !prev)}
        style={{
          marginBottom: '10px',
          padding: '10px 20px',
          fontSize: '16px',
          cursor: 'pointer',
        }}
      >
        ☰ Filters
      </button>

      {showFilters && (
        <div className="filter-body expanded">
          <div className="filters-container filters-panel show">
            <select
              className="category-select"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
            >
              <option value="">Filter by month</option>
              {availableMonths.map((value) => (
                <option key={value} value={value}>
                  {formatMonthLabel(value)}
                </option>
              ))}
            </select>

            <select
              className="category-select"
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
            >
              <option value="">Filter by country</option>
              {availableCountries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>

            <input
              type="text"
              className="search-input"
              placeholder="Filter by city"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="responsive-grid">
        {filteredEvents.map((event) => (
          <div
            key={event.id}
            className={`event-card ${expandedEventId === event.id ? 'expanded' : ''}`}
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

            {event.city && <p><strong>City:</strong> {event.city}</p>}
            {event.country && <p><strong>Country:</strong> {event.country}</p>}
            {event.start_date && (
              <p>
                <strong>Date:</strong>{' '}
                {formatDateRange(event.start_date, event.end_date, event.is_single_day)}
              </p>
            )}

            {expandedEventId === event.id && (
              <div className="event-details">
                {event.description && <p className="description-text"><strong>Description:</strong> {event.description}</p>}

                {event.start_time && <p><strong>Start Time:</strong> {formatTime(event.start_time)}</p>}
                {event.end_time && <p><strong>End Time:</strong> {formatTime(event.end_time)}</p>}

                {event.location_details && (
                  <p><strong>Location:</strong> {event.location_details}</p>
                )}

                {event.is_free
                  ? <p><strong>Participation:</strong> Free admission</p>
                  : event.cost && <p><strong>Cost:</strong> {event.cost} {event.currency}</p>
                }

                {event.contact_email && <p><strong>Email:</strong> {event.contact_email}</p>}
                {event.contact_phone && <p><strong>Phone:</strong> {event.contact_phone}</p>}
                {event.alt_phone && <p><strong>Alternative Phone:</strong> {event.alt_phone}</p>}

                {event.website && (
                  <p><strong>Web:</strong> <a href={event.website} target="_blank" rel="noopener noreferrer">{event.website}</a></p>
                )}
                {event.facebook_url && (
                  <p><strong>Facebook:</strong> <a href={event.facebook_url} target="_blank" rel="noopener noreferrer">{event.facebook_url}</a></p>
                )}
                {event.instagram_url && (
                  <p><strong>Instagram:</strong> <a href={event.instagram_url} target="_blank" rel="noopener noreferrer">{event.instagram_url}</a></p>
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