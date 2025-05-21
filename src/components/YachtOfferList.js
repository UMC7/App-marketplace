import React, { useEffect, useState, useMemo } from 'react';
import supabase from '../supabase';
import Modal from './Modal';
import ChatPage from './ChatPage';

const getRoleImage = (title) => {
  if (!title) return 'others';

  const lowerTitle = title.toLowerCase();

  if ([
    'captain', 'captain/engineer', 'skipper', 'chase boat captain', 'relief captain', 'chief officer', '2nd officer', '3rd officer', 'bosun', 'deck/engineer', 'mate', 'lead deckhand', 'deckhand', 'deck/steward(ess)', 'deck/carpenter', 'deck/divemaster'
  ].some(role => lowerTitle.includes(role))) return 'deckdepartment';

  if ([
    'chief engineer', '2nd engineer', '3rd engineer', 'solo engineer', 'electrician'
  ].some(role => lowerTitle.includes(role))) return 'enginedepartment';

  if ([
    'chief steward(ess)', '2nd steward(ess)', '3rd stewardess', 'solo steward(ess)', 'junior steward(ess)', 'cook/steward(ess)', 'stew/deck', 'laundry/steward(ess)', 'stew/masseur', 'masseur', 'hairdresser', 'barber'
  ].some(role => lowerTitle.includes(role))) return 'interiordepartment';

  if ([
    'head chef', 'sous chef', 'solo chef', 'cook/crew chef'
  ].some(role => lowerTitle.includes(role))) return 'galleydepartment';

  if (lowerTitle.includes('shore') || lowerTitle.includes('shore-based') || lowerTitle.includes('shorebased')) return 'shorebased';
  if (lowerTitle.includes('nanny')) return 'nanny';
  if (lowerTitle.includes('nurse')) return 'nurse';
  if (lowerTitle.includes('dayworker')) return 'dayworker';

return 'others';
};

function YachtOfferList({ offers, currentUser }) {
  const [authors, setAuthors] = useState({});
  const [expandedOfferId, setExpandedOfferId] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [expandedWeeks, setExpandedWeeks] = useState({});
  const [expandedDays, setExpandedDays] = useState({});

  const handleStartChat = (offerId, employerId) => {
    setActiveChat({ offerId, receiverId: employerId });
  };

  const toggleWeek = (week) => {
    setExpandedWeeks((prev) => ({
      ...prev,
      [week]: !prev[week],
    }));
  };

  const toggleDay = (dayKey) => {
    setExpandedDays((prev) => ({
      ...prev,
      [dayKey]: !prev[dayKey],
    }));
  };

  useEffect(() => {
    const fetchAuthors = async () => {
      const userIds = [...new Set(offers.map((o) => o.user_id))];
      if (userIds.length === 0) return;

      const { data, error } = await supabase
        .from('users')
        .select('id, nickname')
        .in('id', userIds);

      if (error) {
        console.error('Error al obtener usuarios:', error);
      } else {
        const map = {};
        data.forEach((u) => {
          map[u.id] = u.nickname;
        });
        setAuthors(map);
      }
    };

    if (offers.length) fetchAuthors();
  }, [offers]);

  const getWeekGroup = (dateStr) => {
  const msPerDay = 1000 * 60 * 60 * 24;
  const now = new Date();
  const createdAt = new Date(dateStr);

  const diffInDays = Math.floor(
    (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) -
     Date.UTC(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate())) / msPerDay
  );

  if (diffInDays <= 6) return 'Esta semana';
  if (diffInDays <= 13) return 'Semana pasada';
  if (diffInDays <= 20) return 'Hace 2 semanas';
  return 'Más antiguas';
};


  const groupedOffers = useMemo(() => {
  return offers
    .filter((offer) => offer.status === 'active')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .reduce((weeks, offer) => {
      const weekGroup = getWeekGroup(offer.created_at);
      const dateKey = new Date(offer.created_at).toLocaleDateString('es-ES', {
        weekday: 'long',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      if (!weeks[weekGroup]) weeks[weekGroup] = {};
      if (!weeks[weekGroup][dateKey]) weeks[weekGroup][dateKey] = [];
      weeks[weekGroup][dateKey].push(offer);

      return weeks;
    }, {});
}, [offers]);

    useEffect(() => {
  if (!offers.length) return;

  const dayToWeekMap = {};

  for (const [weekName, days] of Object.entries(groupedOffers)) {
    for (const dayKey of Object.keys(days)) {
      dayToWeekMap[dayKey] = weekName;
    }
  }

  const allDays = Object.keys(dayToWeekMap);

  if (allDays.length > 0) {
    const sortedDays = allDays.sort((a, b) => new Date(b) - new Date(a));
    const mostRecentDay = sortedDays[0];
    const correspondingWeek = dayToWeekMap[mostRecentDay];

    setExpandedWeeks(prev => ({
      ...prev,
      [correspondingWeek]: true
    }));

    setExpandedDays(prev => ({
      ...prev,
      [mostRecentDay]: true
    }));
  }
}, [offers]); // OJO: ya no depende de groupedOffers



  const toggleExpanded = (id) => {
    setExpandedOfferId((prev) => (prev === id ? null : id));
  };

  return (
    <div>
      {Object.entries(groupedOffers).map(([weekGroup, dates]) => (
        <div key={weekGroup} style={{ marginBottom: '30px' }}>
          <h3 style={{ cursor: 'pointer' }} onClick={() => toggleWeek(weekGroup)}>
            {expandedWeeks[weekGroup] ? '▼' : '►'} {weekGroup}
          </h3>

          {expandedWeeks[weekGroup] &&
            Object.entries(dates).map(([dayGroup, offers]) => (
              <div key={dayGroup} style={{ marginLeft: '20px', marginBottom: '15px' }}>
                <h4
                  style={{ textTransform: 'capitalize', cursor: 'pointer' }}
                  onClick={() => toggleDay(dayGroup)}
                >
                  {expandedDays[dayGroup] ? '▼' : '►'} {dayGroup}
                </h4>

                {expandedDays[dayGroup] &&
                  offers.map((offer) => {
                    const isOwner = currentUser?.id === offer.user_id;
                    const isExpanded = expandedOfferId === offer.id;
                    const authorNickname = authors[offer.user_id] || 'Usuario';

  return (
  <div
  key={offer.id}
  onClick={() => toggleExpanded(offer.id)}
  className={`offer-card ${isExpanded ? 'expanded' : ''}`}
>
 {isExpanded ? (
  <div className="offer-content">
    <div className="left-column">
      {offer.title && <p><strong>Rank:</strong> {offer.title}</p>}
      {offer.teammate_rank && <p><strong>Teammate Rank:</strong> {offer.teammate_rank}</p>}
      {(offer.is_doe || offer.salary) && (
        <p><strong>Salary:</strong> {offer.is_doe ? 'DOE' : `${offer.salary_currency || ''} ${offer.salary}`}</p>
      )}
      {offer.city && <p><strong>City:</strong> {offer.city}</p>}
      {offer.country && <p><strong>Country:</strong> {offer.country}</p>}
      {offer.type && <p><strong>Type:</strong> {offer.type}</p>}
      {offer.yacht_type && <p><strong>Yacht Type:</strong> {offer.yacht_type}</p>}
      {offer.yacht_size && <p><strong>Yacht Size:</strong> {offer.yacht_size}</p>}
    </div>

    <div className="right-column">
      {offer.language_1 && <p><strong>Language 1:</strong> {offer.language_1}</p>}
      {offer.language_2 && <p><strong>Language 2:</strong> {offer.language_2}</p>}
      {offer.start_date && <p><strong>Start:</strong> {formatDate(offer.start_date)}</p>}
      {offer.end_date && <p><strong>End:</strong> {formatDate(offer.end_date)}</p>}
      {offer.contact_email && <p><strong>Email:</strong> {offer.contact_email}</p>}
      {offer.contact_phone && <p><strong>Phone:</strong> {offer.contact_phone}</p>}
      {offer.link_facebook && (
        <p><strong>Facebook:</strong> <a href={offer.link_facebook} target="_blank" rel="noopener noreferrer">{offer.link_facebook}</a></p>
      )}
      {offer.link_instagram && (
        <p><strong>Instagram:</strong> <a href={offer.link_instagram} target="_blank" rel="noopener noreferrer">{offer.link_instagram}</a></p>
      )}
      {offer.link_x && (
        <p><strong>X:</strong> <a href={offer.link_x} target="_blank" rel="noopener noreferrer">{offer.link_x}</a></p>
      )}
      <p><strong>Posted:</strong> {formatTime(offer.created_at)}</p>
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
    </div>
  </div>
) : (
  <div className="collapsed-offer">
  <div className="collapsed-images">
    <img
      src={`/logos/roles/${offer.work_environment === 'Shore-based' ? 'shorebased' : getRoleImage(offer.title)}.png`}
      alt="role"
      className="role-icon"
    />
    {offer.team && offer.teammate_rank && (
      <img
        src={`/logos/roles/${getRoleImage(offer.teammate_rank)}.png`}
        alt="teammate role"
        className="role-icon"
      />
    )}
  </div>
  <div className="collapsed-info">
    {offer.team && <p><strong>Team:</strong> Yes</p>}
    {offer.title && <p><strong>Rank:</strong> {offer.title}</p>}
    {(offer.is_doe || offer.salary) && (
      <p><strong>Salary:</strong> {offer.is_doe ? 'DOE' : `${offer.salary_currency || ''} ${offer.salary}`}</p>
    )}
    {offer.city && <p><strong>City:</strong> {offer.city}</p>}
    {offer.country && <p><strong>Country:</strong> {offer.country}</p>}
    <p><strong>Posted:</strong> {formatTime(offer.created_at)}</p>
  </div>
</div>

)}
                      </div>
                    );
                  })}
              </div>
            ))}
        </div>
      ))}
      {activeChat && (
        <Modal onClose={() => setActiveChat(null)}>
          <ChatPage
            offerId={activeChat.offerId}
            receiverId={activeChat.receiverId}
          />
        </Modal>
      )}
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

export default YachtOfferList;