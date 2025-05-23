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

  // Categoría Others explícita
  if ([
    'videographer',
    'yoga/pilates instructor',
    'personal trainer',
    'dive instructor',
    'water sport instructor',
    'other'
  ].some(role => lowerTitle.includes(role))) return 'others';

  return 'others';
};

function YachtOfferList({
  offers,
  currentUser,
  filters,
  setFilters,
  toggleMultiSelect,
  toggleRegionCountries,
  regionOrder,
  countriesByRegion,
  showFilters
}) {

  const [authors, setAuthors] = useState({});
  const [expandedOfferId, setExpandedOfferId] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [expandedWeeks, setExpandedWeeks] = useState({});
  const [expandedDays, setExpandedDays] = useState({});
  const [showDesktopFilters, setShowDesktopFilters] = useState(false);
  const isMobile = window.innerWidth <= 768;

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

  const getMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 (domingo) a 6 (sábado)
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // si es domingo, ir al lunes anterior
  return new Date(d.setDate(diff));
};

  const getWeekGroup = (dateStr) => {
  const monday = getMonday(new Date(dateStr));
  return monday.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};


  const groupedOffers = useMemo(() => {
  return offers
    .filter((offer) => offer.status === 'active')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .reduce((weeks, offer) => {
      const weekMonday = getMonday(new Date(offer.created_at)).toDateString();
const thisMonday = getMonday(new Date()).toDateString();
const lastMonday = getMonday(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).toDateString();

const weekGroup = weekMonday === thisMonday
  ? 'This week'
  : weekMonday === lastMonday
  ? 'Last week'
  : new Date(weekMonday).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
      const dateKey = new Date(offer.created_at).toLocaleDateString('en-US', {
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
    {!isMobile && (
  <h3
    className="filter-toggle"
    onClick={() => setShowDesktopFilters(prev => !prev)}
    style={{ cursor: 'pointer' }}
  >
    {showDesktopFilters ? '▼ Filters' : '► Filters'}
  </h3>
)}

   {((isMobile && showFilters) || (!isMobile && showDesktopFilters)) && (
  <div className={`filter-body ${isMobile ? '' : showDesktopFilters ? 'expanded' : 'collapsed'}`}> 

        <div className="filters-container filters-panel show" style={{ marginBottom: '20px' }}>
          <h3 style={{ gridColumn: '1 / -1' }}>Filtrar ofertas</h3>

          <input
            type="text"
            className="search-input"
            placeholder="Rank"
            value={filters.rank}
            onChange={(e) => setFilters({ ...filters, rank: e.target.value })}
          />

          <input
            type="text"
            className="search-input"
            placeholder="Ciudad"
            value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
          />

          <input
            type="number"
            className="search-input"
            placeholder="Salario mínimo"
            value={filters.minSalary}
            onChange={(e) => setFilters({ ...filters, minSalary: e.target.value })}
          />

          <select
            className="category-select"
            value={filters.team}
            onChange={(e) => setFilters({ ...filters, team: e.target.value })}
          >
            <option value="">¿En equipo?</option>
            <option value="Yes">Sí</option>
            <option value="No">No</option>
          </select>

          <select
            className="category-select"
            value={filters.yachtType}
            onChange={(e) => setFilters({ ...filters, yachtType: e.target.value })}
          >
            <option value="">Tipo de Yate</option>
            <option value="Motor Yacht">Motor Yacht</option>
            <option value="Sailing Yacht">Sailing Yacht</option>
            <option value="Chase Boat">Chase Boat</option>
            <option value="Catamaran">Catamaran</option>
          </select>

          <select
            className="category-select"
            value={filters.yachtSize}
            onChange={(e) => setFilters({ ...filters, yachtSize: e.target.value })}
          >
            <option value="">Tamaño</option>
            <option value="0 - 30m">0 - 30m</option>
            <option value="31 - 40m">31 - 40m</option>
            <option value="41 - 50m">41 - 50m</option>
            <option value="51 - 70m">51 - 70m</option>
            <option value="> 70m">{'> 70m'}</option>
          </select>

          <select
            className="category-select"
            value={filters.use}
            onChange={(e) => setFilters({ ...filters, use: e.target.value })}
          >
            <option value="">Uso</option>
            <option value="Private">Private</option>
            <option value="Charter">Charter</option>
            <option value="Private/Charter">Private/Charter</option>
          </select>

          <details style={{ gridColumn: '1 / -1' }}>
            <summary style={{ fontWeight: 'bold', cursor: 'pointer' }}>País</summary>
            <div style={{ marginTop: '8px', maxHeight: '300px', overflowY: 'auto' }}>
              {regionOrder.map((region) => {
                const countryList = countriesByRegion[region];
                const allSelected = countryList.every((c) => filters.country.includes(c));
                return (
                  <details key={region} style={{ marginBottom: '12px' }}>
                    <summary
                      style={{
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                      }}
                    >
                      {region}
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => toggleRegionCountries(region)}
                      />
                    </summary>
                    <div style={{ marginLeft: '20px', marginTop: '8px' }}>
                      {countryList.map((country) => (
                        <label key={country} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          {country}
                          <input
                            type="checkbox"
                            checked={filters.country.includes(country)}
                            onChange={() => toggleMultiSelect('country', country)}
                          />
                        </label>
                      ))}
                    </div>
                  </details>
                );
              })}
            </div>
          </details>

          <details style={{ gridColumn: '1 / -1' }}>
            <summary style={{ fontWeight: 'bold', cursor: 'pointer' }}>Languages</summary>
            <div style={{ marginTop: '8px' }}>
              {['English', 'Spanish', 'Italian', 'French', 'German', 'Portuguese', 'Greek', 'Russian', 'Dutch'].map((lang) => (
                <label key={lang} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  {lang}
                  <input
                    type="checkbox"
                    checked={filters.languages.includes(lang)}
                    onChange={() => toggleMultiSelect('languages', lang)}
                  />
                </label>
              ))}
            </div>
          </details>

          <details style={{ gridColumn: '1 / -1' }}>
            <summary style={{ fontWeight: 'bold', cursor: 'pointer' }}>Terms</summary>
            <div style={{ marginTop: '8px' }}>
              {['Rotational', 'Permanent', 'Temporary', 'Seasonal', 'Relief', 'Delivery', 'Cruising', 'DayWork'].map((term) => (
                <label key={term} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  {term}
                  <input
                    type="checkbox"
                    checked={filters.terms.includes(term)}
                    onChange={() => toggleMultiSelect('terms', term)}
                  />
                </label>
              ))}
            </div>
          </details>
          <button
  style={{ gridColumn: '1 / -1', marginBottom: '10px' }}
  onClick={() => setFilters({
    rank: '',
    city: '',
    minSalary: '',
    team: '',
    yachtType: '',
    yachtSize: '',
    use: '',
    country: [],
    languages: [],
    terms: [],
  })}
>
  Clear All Filters
</button>
        </div>
      </div>
    )}

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
  return new Date(dateStr).toLocaleDateString('en-US', options);
};

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default YachtOfferList;