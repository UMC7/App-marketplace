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
    .reduce((groups, offer) => {
      const group = getWeekGroup(offer.created_at);
      if (!groups[group]) groups[group] = [];
      groups[group].push(offer);
      return groups;
    }, {});

  const toggleExpanded = (id) => {
    setExpandedOfferId(prev => (prev === id ? null : id));
  };

  return (
    <div>
      {Object.entries(groupedOffers).map(([groupName, offers]) => (
        <div key={groupName} style={{ marginBottom: '30px' }}>
          <h3>{groupName}</h3>
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
                <h4>{offer.title}</h4>
                <p><strong>Ciudad:</strong> {offer.city} | <strong>País:</strong> {offer.country}</p>
                {offer.is_doe ? (
                  <p><strong>Salario:</strong> DOE</p>
                ) : (
                  offer.salary && <p><strong>Salario:</strong> ${offer.salary}</p>
                )}
                <p><strong>Publicado:</strong> {formatTime(offer.created_at)}</p>

                {isExpanded && (
                  <>
                    <p><strong>Publicado por:</strong> {authorNickname}</p>
                    <p><strong>Tipo:</strong> {offer.type}</p>
                    <p><strong>Inicio:</strong> {formatDate(offer.start_date)}</p>
                    {offer.end_date && <p><strong>Fin:</strong> {formatDate(offer.end_date)}</p>}
                    {offer.years_in_rank && (
                      <p><strong>Años en el cargo:</strong> {offer.years_in_rank === 6 ? '>5' : `>${offer.years_in_rank}`}</p>
                    )}
                    {offer.description && <p><strong>Descripción:</strong> {offer.description}</p>}

                    {/* Campos de contacto adicionales */}
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
                  </>
                )}
              </div>
            );
          })}
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