import React, { useEffect, useState } from 'react';
import supabase from '../supabase';

function YachtOfferList({ offers, currentUser }) {
  const [authors, setAuthors] = useState({});
  const [expandedOfferId, setExpandedOfferId] = useState(null);

  useEffect(() => {
    const fetchAuthors = async () => {
      const userIds = [...new Set(offers.map(o => o.user_id))];
      if (userIds.length === 0) return;

      const { data, error } = await supabase
        .from('users')
        .select('id, nickname')
        .in('id', userIds);

      if (error) {
        console.error('Error al obtener usuarios:', error);
      } else {
        const map = {};
        data.forEach(u => {
          map[u.id] = u.nickname;
        });
        setAuthors(map);
      }
    };

    if (offers.length) fetchAuthors();
  }, [offers]);

  const getWeekGroup = (dateStr) => {
    const now = new Date();
    const createdAt = new Date(dateStr);
    const diffInDays = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));

    if (diffInDays <= 6) return 'Esta semana';
    if (diffInDays <= 13) return 'Semana pasada';
    if (diffInDays <= 20) return 'Hace 2 semanas';
    return 'Más antiguas';
  };

  const groupedOffers = offers
  .filter(offer => offer.status === 'active')
  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  .reduce((weeks, offer) => {
    const weekGroup = getWeekGroup(offer.created_at);
    const dateKey = new Date(offer.created_at).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    if (!weeks[weekGroup]) weeks[weekGroup] = {};
    if (!weeks[weekGroup][dateKey]) weeks[weekGroup][dateKey] = [];
    weeks[weekGroup][dateKey].push(offer);

    return weeks;
  }, {});

  const toggleExpanded = (id) => {
    setExpandedOfferId(prev => (prev === id ? null : id));
  };

  return (
  <div>
    {Object.entries(groupedOffers).map(([weekGroup, dates]) => (
      <div key={weekGroup} style={{ marginBottom: '30px' }}>
        <h3>{weekGroup}</h3>
        {Object.entries(dates).map(([dayGroup, offers]) => (
          <div key={dayGroup} style={{ marginLeft: '20px', marginBottom: '15px' }}>
            <h4 style={{ textTransform: 'capitalize' }}>{dayGroup}</h4>
            {offers.map((offer) => {
              const isOwner = currentUser?.id === offer.user_id;
              const isExpanded = expandedOfferId === offer.id;
              const authorNickname = authors[offer.user_id] || 'Usuario';

              return (
                <div
                  key={offer.id}
                  onClick={() => toggleExpanded(offer.id)}
                  style={{
                    ...offerBoxStyle,
                    cursor: 'pointer',
                    backgroundColor: isExpanded ? '#eef5ff' : '#f9f9f9'
                  }}
                >
                  {isExpanded ? (
                    <>
                      {offer.team && <p><strong>Team:</strong> Yes</p>}
                      {offer.title && <p><strong>Rank:</strong> {offer.title}</p>}
                      {offer.years_in_rank !== null && (
                        <p><strong>Años en el cargo:</strong> {offer.years_in_rank === 0 ? 'Green' : `>${offer.years_in_rank}`}</p>
                      )}
                      {(offer.is_doe || offer.salary) && (
                        <p><strong>Salary:</strong> {offer.is_doe ? 'DOE' : `$${offer.salary}`}</p>
                      )}
                      {offer.teammate_rank && <p><strong>Teammate Rank:</strong> {offer.teammate_rank}</p>}
                      {offer.team && offer.teammate_experience !== null && (
                        <p><strong>Teammate Experience:</strong> {offer.teammate_experience === 0 ? 'Green' : `>${offer.teammate_experience}`}</p>
                      )}
                      {offer.teammate_salary && <p><strong>Teammate Salary:</strong> ${offer.teammate_salary}</p>}
                      {offer.city && <p><strong>Ciudad:</strong> {offer.city}</p>}
                      {offer.country && <p><strong>País:</strong> {offer.country}</p>}
                      {offer.type && <p><strong>Tipo:</strong> {offer.type}</p>}
                      {offer.yacht_type && <p><strong>Yacht Type:</strong> {offer.yacht_type}</p>}
                      {offer.yacht_size && <p><strong>Yacht Size:</strong> {offer.yacht_size}</p>}
                      {offer.flag && <p><strong>Flag:</strong> {offer.flag}</p>}
                      {offer.start_date && <p><strong>Inicio:</strong> {formatDate(offer.start_date)}</p>}
                      {offer.end_date && <p><strong>Fin:</strong> {formatDate(offer.end_date)}</p>}
                      {offer.description && <p><strong>Descripción:</strong> {offer.description}</p>}
                      {offer.contact_email && <p><strong>Email de contacto:</strong> {offer.contact_email}</p>}
                      {offer.contact_phone && <p><strong>Teléfono:</strong> {offer.contact_phone}</p>}
                      {offer.link_facebook && (
                        <p><strong>Facebook:</strong> <a href={offer.link_facebook} target="_blank" rel="noopener noreferrer">{offer.link_facebook}</a></p>
                      )}
                      {offer.link_instagram && (
                        <p><strong>Instagram:</strong> <a href={offer.link_instagram} target="_blank" rel="noopener noreferrer">{offer.link_instagram}</a></p>
                      )}
                      {offer.link_x && (
                        <p><strong>X:</strong> <a href={offer.link_x} target="_blank" rel="noopener noreferrer">{offer.link_x}</a></p>
                      )}
                      {!isOwner && currentUser && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartChat(offer.id, offer.user_id);
                          }}
                        >
                          Iniciar chat privado
                        </button>
                      )}
                      <p><strong>Publicado por:</strong> {authorNickname}</p>
                      <p><strong>Publicado:</strong> {formatTime(offer.created_at)}</p>
                    </>
                  ) : (
                    <>
                      {offer.team && <p><strong>Team:</strong> Yes</p>}
                      {offer.title && <p><strong>Rank:</strong> {offer.title}</p>}
                      {(offer.is_doe || offer.salary) && (
                        <p><strong>Salary:</strong> {offer.is_doe ? 'DOE' : `$${offer.salary}`}</p>
                      )}
                      {offer.teammate_rank && <p><strong>Teammate Rank:</strong> {offer.teammate_rank}</p>}
                      {offer.teammate_salary && <p><strong>Teammate Salary:</strong> ${offer.teammate_salary}</p>}
                      {offer.city && <p><strong>Ciudad:</strong> {offer.city}</p>}
                      {offer.country && <p><strong>País:</strong> {offer.country}</p>}
                      <p><strong>Publicado:</strong> {formatTime(offer.created_at)}</p>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    ))}
  </div>
);
}

const formatDate = (dateStr) => {
  const options = { day: '2-digit', month: 'short', year: '2-digit' };
  return new Date(dateStr).toLocaleDateString('es-ES', options);
};

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const offerBoxStyle = {
  border: '1px solid #ccc',
  padding: '16px',
  borderRadius: '8px',
  marginBottom: '20px',
  backgroundColor: '#f9f9f9',
};

const handleStartChat = (offerId, employerId) => {
  alert(`Chat privado con el empleador aún no implementado (oferta ${offerId})`);
};

export default YachtOfferList;