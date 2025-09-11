import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import supabase from '../supabase';
import './EventsPage.css';

// Utilidades de formato (mismas que usas en EventsPage)
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const options = { day: '2-digit', month: 'short', year: 'numeric' };
  return new Date(dateStr).toLocaleDateString('es-ES', options);
};

const formatDateRange = (start, end, isSingleDay) => {
  if (!start) return '';
  if (isSingleDay || !end) return formatDate(start);

  const s = new Date(start);
  const e = new Date(end);
  const sameYear = s.getFullYear() === e.getFullYear();
  const sameMonth = sameYear && s.getMonth() === e.getMonth();

  const day = (d) => d.toLocaleDateString('es-ES', { day: '2-digit' });
  const month = (d) => d.toLocaleDateString('es-ES', { month: 'short' });
  const year = (d) => d.getFullYear();

  if (sameMonth) return `${day(s)} - ${day(e)} ${month(s)} ${year(s)}`;
  if (sameYear) return `${day(s)} ${month(s)} - ${day(e)} ${month(e)} ${year(s)}`;
  return `${formatDate(start)} - ${formatDate(end)}`;
};

function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

export default function EventDetail() {
  const params = useParams(); // soporta /events/:id o /event/:slug si luego lo agregas
  const query = useQuery();   // soporta ?event=<id>
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  const idFromQuery = query.get('event');
  const identifier = params.id || params.slug || idFromQuery;

  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!identifier) {
        setLoading(false);
        return;
      }

      // Buscar por id (uuid) o por slug
      let q = supabase
        .from('events')
        .select('*')
        .eq('status', 'active')
        .limit(1);

      if (/^[0-9a-f-]{16,}$/i.test(identifier)) {
        q = q.eq('id', identifier);
      } else {
        q = q.eq('slug', identifier);
      }

      const { data, error } = await q.single();
      if (isMounted) {
        if (!error) setEvent(data);
        setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [identifier]);

  if (loading) return <div className="container" style={{ padding: 20 }}>Loading…</div>;
  if (!event) {
    return (
      <div className="container" style={{ padding: 20 }}>
        <p>Event not found.</p>
        <Link to="/events">← Back to events</Link>
      </div>
    );
  }

  const shareUrl = `${window.location.origin}/api/event-og?event=${encodeURIComponent(event.id)}`;

  return (
    <div className="container" style={{ padding: 20 }}>
      <div className="event-card" style={{ maxWidth: 720 }}>
        <div className="event-image-wrap" style={{ height: 300 }}>
          <img
            src={event.mainphoto || 'https://via.placeholder.com/600x400'}
            alt={event.event_name}
            className="event-image"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
          />
        </div>

        <h2 style={{ textAlign: 'center', marginTop: 12 }}>{event.event_name}</h2>

        <p><strong>City:</strong> {event.city || '-'}</p>
        <p><strong>Country:</strong> {event.country || '-'}</p>
        {event.start_date && (
          <p>
            <strong>Date:</strong>{' '}
            {formatDateRange(event.start_date, event.end_date, event.is_single_day)}
          </p>
        )}
        {event.description && (
          <p className="description-text" style={{ marginTop: 10 }}>
            <strong>Description:</strong> {event.description}
          </p>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
              `🎉 ${event.event_name} — ${event.city ? event.city + ' · ' : ''}${formatDateRange(event.start_date, event.end_date, event.is_single_day)}\n${shareUrl}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
            style={{ padding: '10px 14px', borderRadius: 8, background: '#25D366', color: '#fff' }}
          >
            Share on WhatsApp
          </a>
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(shareUrl);
                alert('Link copied!');
              } catch {
                // Fallback
                const ta = document.createElement('textarea');
                ta.value = shareUrl;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                ta.remove();
                alert('Link copied!');
              }
            }}
            className="btn"
            style={{ padding: '10px 14px', borderRadius: 8 }}
          >
            Copy Link
          </button>
          <Link to="/events" className="btn" style={{ padding: '10px 14px', borderRadius: 8 }}>
            ← Back to events
          </Link>
        </div>
      </div>
    </div>
  );
}