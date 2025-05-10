import React, { useEffect, useState } from 'react';
import supabase from '../supabase'; // ✅ Ruta corregida

function YachtOfferList({ offers, currentUser }) {
  const [authors, setAuthors] = useState({});

  useEffect(() => {
    const fetchAuthors = async () => {
      const userIds = [...new Set(offers.map(o => o.user_id))];
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

  return (
    <div>
      {offers.length === 0 ? (
        <p>No hay ofertas disponibles aún.</p>
      ) : (
        offers.map((offer) => {
          const isOwner = currentUser?.id === offer.user_id;
          const authorNickname = authors[offer.user_id] || 'Usuario';

          return (
            <div key={offer.id} style={offerBoxStyle}>
              <h3>{offer.title}</h3>
              <p><strong>Publicado por:</strong> {authorNickname}</p>
              <p><strong>Tipo:</strong> {offer.type}</p>
              <p><strong>Ubicación:</strong> {offer.city}, {offer.country}</p>
              <p><strong>Inicio:</strong> {formatDate(offer.start_date)}</p>
              {offer.end_date && <p><strong>Fin:</strong> {formatDate(offer.end_date)}</p>}
              {offer.is_doe ? (
                <p><strong>Salario:</strong> DOE</p>
              ) : (
                offer.salary && <p><strong>Salario:</strong> ${offer.salary}</p>
              )}
              {offer.years_in_rank && <p><strong>Años en el cargo:</strong> {offer.years_in_rank === 6 ? '>5' : offer.years_in_rank}</p>}
              {offer.description && <p><strong>Descripción:</strong> {offer.description}</p>}
              {!isOwner && currentUser && (
                <button onClick={() => handleStartChat(offer.id, offer.user_id)}>
                  Iniciar chat privado
                </button>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

const formatDate = (dateStr) => {
  const options = { day: '2-digit', month: 'short', year: '2-digit' };
  return new Date(dateStr).toLocaleDateString('es-ES', options);
};

const offerBoxStyle = {
  border: '1px solid #ccc',
  padding: '16px',
  borderRadius: '8px',
  marginBottom: '20px',
  backgroundColor: '#f9f9f9',
};

const handleStartChat = (offerId, employerId) => {
  // Este será el punto de conexión con ChatPage
  // Por ejemplo: window.location.href = `/chat?offer=${offerId}&to=${employerId}`;
  alert(`Chat privado con el empleador aún no implementado (oferta ${offerId})`);
};

export default YachtOfferList;