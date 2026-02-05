import React, { useState, useEffect, useRef } from 'react';
import './EventsPage.css';
import ScrollToTopButton from '../components/ScrollToTopButton';
import supabase from '../supabase';
import { isInNativeApp, postShareToNative } from '../utils/nativeShare';

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

  // Aspect ratio natural por imagen (id -> w/h)
  const [imageRatios, setImageRatios] = useState({});
  // Aspect ratio del contenedor colapsado (id -> w/h)
  const [containerRatios, setContainerRatios] = useState({});
  const wrapRefs = useRef({}); // id -> DOM node de la imagen
  const cardRefs = useRef({}); // id -> DOM node de la tarjeta
  const collapseTargetRef = useRef(null);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .in('status', ['active', 'cancelled', 'postponed'])
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Error loading events:', error.message);
      } else {
        setEvents(data || []);
        setFilteredEvents(data || []);

        const countries = [...new Set((data || []).map((e) => e.country))];
        setAvailableCountries(countries);

        // Meses únicos 'YYYY-MM'
        const monthsSet = new Set();
        (data || []).forEach(e => {
          if (e.start_date) {
            const date = new Date(e.start_date);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            monthsSet.add(`${year}-${month}`);
          }
        });
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

  // Medir ratios del contenedor colapsado (ancho/alto actual)
  useEffect(() => {
    const measure = () => {
      const next = {};
      filteredEvents.forEach((e) => {
        const el = wrapRefs.current[e.id];
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            next[e.id] = rect.width / rect.height;
          }
        }
      });
      if (Object.keys(next).length) {
        setContainerRatios(prev => ({ ...prev, ...next }));
      }
    };

    // Medir al montar y cuando cambian las tarjetas
    measure();

    // Observar cambios de tamaño por responsivo
    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => measure());
      Object.values(wrapRefs.current).forEach((el) => el && ro.observe(el));
    } else {
      // Fallback
      window.addEventListener('resize', measure);
    }

    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener('resize', measure);
    };
  }, [filteredEvents, showFilters]);

  // Deep link: expandir automáticamente si viene ?event=<id>
  useEffect(() => {
    if (loading) return;
    const params = new URLSearchParams(window.location.search);
    const targetId = params.get('event');
    if (targetId) {
      setExpandedEventId(targetId);
    }
  }, [loading]);

  const getScrollOffset = () => {
    const nav = document.querySelector('.navbar-container');
    const navHeight = nav ? nav.getBoundingClientRect().height : 0;
    return navHeight + 8;
  };

  useEffect(() => {
    if (!expandedEventId) return;
    const el = cardRefs.current[expandedEventId];
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - getScrollOffset();
    window.scrollTo({ top, behavior: 'smooth' });
  }, [expandedEventId]);

  useEffect(() => {
    if (expandedEventId) return;
    const id = collapseTargetRef.current;
    if (!id) return;
    collapseTargetRef.current = null;
    const el = cardRefs.current[id] || document.getElementById(`event-${id}`);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - getScrollOffset();
    window.scrollTo({ top, behavior: 'smooth' });
  }, [expandedEventId]);

  const updateUrlParam = (eventIdOrNull) => {
    const url = new URL(window.location.href);
    if (eventIdOrNull) {
      url.searchParams.set('event', eventIdOrNull);
    } else {
      url.searchParams.delete('event');
    }
    window.history.replaceState({}, '', url.toString());
  };

  const getShareUrl = (eventId) =>
    `${window.location.origin}/api/event-og?event=${encodeURIComponent(eventId)}`;

  const getShareData = (event) => ({
    title: event.event_name || 'SeaEvents',
    text: `${event.event_name}${event.city ? ' · ' + event.city : ''} — ${formatDateRange(event.start_date, event.end_date, event.is_single_day)}`,
    url: getShareUrl(event.id),
  });

  const handleCopyLink = async (eventId) => {
    const shareUrl = getShareUrl(eventId);
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied!');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = shareUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      alert('Link copied!');
    }
  };

  const handleWhatsApp = (event) => {
    const data = getShareData(event);
    const msg = `🎉 ${data.text}\n${data.url}`;
    const wa = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(wa, '_blank', 'noopener,noreferrer');
  };

  const handleShare = async (event, e) => {
    e.stopPropagation();
    const data = getShareData(event);
    if (isInNativeApp()) {
      postShareToNative(data);
      return;
    }
    if (navigator.share) {
      try {
        await navigator.share(data);
      } catch (err) {
        // Ignorar AbortError cuando el usuario cierra la hoja nativa
        if (err && err.name !== 'AbortError') {
          console.error('Share failed', err);
        }
      }
    }
  };

  const toggleExpand = (eventId) => {
    setExpandedEventId((prevId) => {
      const next = prevId === eventId ? null : eventId;
      updateUrlParam(next);
      if (!next) {
        collapseTargetRef.current = eventId;
      }
      return next;
    });
  };

  const formatMonthLabel = (value) => {
    const [year] = value.split('-');
    const date = new Date(`${value}-01`);
    return `${date.toLocaleString('en-US', { month: 'long' })} ${year}`;
  };

  if (loading) {
    return <p style={{ padding: '20px' }}>Loading events...</p>;
  }

  if (events.length === 0) {
    return <p style={{ padding: '20px' }}>No events available.</p>;
  }

  // Margen para comparar contra el contenedor (evita parpadeos en límites)
  const RATIO_MARGIN = 0.05; // 5%

  const supportsWebShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const showNativeShare = supportsWebShare || isInNativeApp();

  // estilos inline mínimos para no tocar tu CSS global
  const iconBarStyle = { display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 };
  const roundBtn = {
    width: 44, height: 44, borderRadius: '9999px', border: '1px solid rgba(0,0,0,0.1)',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    background: '#fff', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,.06)'
  };
  const waBtn = { ...roundBtn, background: '#25D366', border: 'none' };
  const iconImg = { width: 22, height: 22, display: 'block' };
  const shareIcon = { fontSize: 22, color: '#111' };

  // ✅ Clear filters
  const clearFilters = () => {
    setSearchDate('');
    setSelectedCountry('');
    setSelectedCity('');
    setFilteredEvents(events);
  };
  const hasActiveFilters = Boolean(searchDate || selectedCountry || selectedCity);

  return (
    <div className="container">
      <div className="module-header-wrapper">
        <div className="module-header-row">
          <h1>SeaEvents</h1>
          <span>Explore all events shared by the community.</span>
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

            {/* ✅ Clear Filters button (columna 4) */}
            <button
              type="button"
              className="category-select clear-filters-btn"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              title="Clear all filters"
              aria-label="Clear all filters"
            >
              Clear filters
            </button>
          </div>
        </div>
      )}

      <div className="responsive-grid">
        {filteredEvents.map((event) => {
          const isExpanded = expandedEventId === event.id;
          const imgRatio = imageRatios[event.id];       // w/h
          const contRatio = containerRatios[event.id];  // w/h (colapsado)
          const hasRatios = typeof imgRatio === 'number' && typeof contRatio === 'number';

          const isPortrait = hasRatios ? imgRatio < 1 : false;

          // Decidir cuándo usar contain + blur (sin recortes) vs cover
          // Usamos contain+blur cuando la imagen es significativamente distinta
          // al contenedor en cualquiera de los dos sentidos, pero nunca para retratos.
          const muchWider = hasRatios && imgRatio > contRatio * (1 + RATIO_MARGIN);
          const muchNarrower = hasRatios && imgRatio < contRatio * (1 - RATIO_MARGIN);
          const useContainBlur = hasRatios && !isPortrait && (muchWider || muchNarrower);

          // En expandido + retrato: crecer para mostrar la imagen completa
          const wrapStyle = isExpanded && isPortrait ? { height: 'auto' } : undefined;

          // Colapsado:
          // - retrato => cover (sin barras; lo recortado se ve al expandir)
          // - paisajes con desajuste notable => contain + blur (evita sobre-zoom y huecos)
          // - resto => cover
          const collapsedFit = useContainBlur ? 'contain' : 'cover';
          const objectPosition = isPortrait ? 'top center' : 'center';

          const imgStyle = isExpanded && isPortrait
            ? { width: '100%', height: 'auto', display: 'block' } // mostrar completa
            : {
                width: '100%',
                height: '100%',
                objectFit: collapsedFit,
                objectPosition,
                display: 'block',
              };

          return (
            <div
              key={event.id}
              id={`event-${event.id}`}
              className={`event-card ${isExpanded ? 'expanded' : ''}`}
              onClick={() => toggleExpand(event.id)}
              ref={(el) => { cardRefs.current[event.id] = el; }}
            >
              {event.status !== 'active' && (
                <div
                  style={{
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
                  }}
                >
                  {event.status === 'cancelled' ? 'CANCELLED' : 'POSTPONED'}
                </div>
              )}

              <div
                className="event-image-wrap"
                style={wrapStyle}
                ref={(el) => { wrapRefs.current[event.id] = el; }}
              >
                {/* Fondo difuso solo si estamos en colapsado y la imagen requiere contain */}
                {(!isExpanded && useContainBlur) && (
                  <img
                    src={event.mainphoto || 'https://via.placeholder.com/250'}
                    alt=""
                    aria-hidden="true"
                    className="event-image-blur"
                    loading="lazy"
                  />
                )}

                <img
                  src={event.mainphoto || 'https://via.placeholder.com/250'}
                  alt={event.event_name}
                  className="event-image"
                  loading="lazy"
                  style={imgStyle}
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    const r = img.naturalWidth / img.naturalHeight;
                    setImageRatios((prev) =>
                      prev[event.id] ? prev : { ...prev, [event.id]: r }
                    );
                  }}
                />
              </div>

              <h3>{event.event_name}</h3>

              {event.city && (
                <p>
                  <strong>City:</strong> {event.city}
                </p>
              )}
              {event.country && (
                <p>
                  <strong>Country:</strong> {event.country}
                </p>
              )}
              {event.start_date && (
                <p>
                  <strong>Date:</strong>{' '}
                  {formatDateRange(
                    event.start_date,
                    event.end_date,
                    event.is_single_day
                  )}
                </p>
              )}

              {/* Barra de compartir solo cuando está expandida */}
              {isExpanded && (
                <div style={iconBarStyle} onClick={(e) => e.stopPropagation()}>
                  {showNativeShare ? (
                    <button
                      type="button"
                      onClick={(e) => handleShare(event, e)}
                      style={roundBtn}
                      aria-label="Share"
                      title="Share"
                    >
                      {/* Material Icons ya está cargado en index.html */}
                      <span className="material-icons" style={shareIcon}>ios_share</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleWhatsApp(event); }}
                        style={waBtn}
                        aria-label="Share on WhatsApp"
                        title="Share on WhatsApp"
                      >
                        <img src="/icons/whatsapp.svg" alt="" style={iconImg} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleCopyLink(event.id); }}
                        style={roundBtn}
                        aria-label="Copy share link"
                        title="Copy link"
                      >
                        <img src="/icons/link.svg" alt="" style={iconImg} />
                      </button>
                    </>
                  )}
                </div>
              )}

              {isExpanded && (
                <div className="event-details">
                  {event.description && (
                    <p className="description-text">
                      <strong>Description:</strong> {event.description}
                    </p>
                  )}

                  {event.start_time && (
                    <p>
                      <strong>Start Time:</strong> {formatTime(event.start_time)}
                    </p>
                  )}
                  {event.end_time && (
                    <p>
                      <strong>End Time:</strong> {formatTime(event.end_time)}
                    </p>
                  )}

                  {event.location_details && (
                    <p>
                      <strong>Location:</strong> {event.location_details}
                    </p>
                  )}

                  {event.is_free ? (
                    <p>
                      <strong>Participation:</strong> Free admission
                    </p>
                  ) : (
                    event.cost && (
                      <p>
                        <strong>Cost:</strong> {event.cost} {event.currency}
                      </p>
                    )
                  )}

                  {event.contact_email && (
                    <p>
                      <strong>Email:</strong> {event.contact_email}
                    </p>
                  )}
                  {event.contact_phone && (
                    <p>
                      <strong>Phone:</strong> {event.contact_phone}
                    </p>
                  )}
                  {event.alt_phone && (
                    <p>
                      <strong>Alternative Phone:</strong> {event.alt_phone}
                    </p>
                  )}

                  {event.website && (
                    <p>
                      <strong>Web:</strong>{' '}
                      <a
                        href={event.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {event.website}
                      </a>
                    </p>
                  )}
                  {event.facebook_url && (
                    <p>
                      <strong>Facebook:</strong>{' '}
                      <a
                        href={event.facebook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {event.facebook_url}
                      </a>
                    </p>
                  )}
                  {event.instagram_url && (
                    <p>
                      <strong>Instagram:</strong>{' '}
                      <a
                        href={event.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {event.instagram_url}
                      </a>
                    </p>
                  )}
                  {event.whatsapp_number && (
                    <p>
                      <strong>WhatsApp:</strong>{' '}
                      <a
                        href={`https://wa.me/${event.whatsapp_number}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {event.whatsapp_number}
                      </a>
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <ScrollToTopButton />
    </div>
  );
}

export default EventsPage;
