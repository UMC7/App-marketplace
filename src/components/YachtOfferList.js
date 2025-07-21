import React, { useEffect, useState, useMemo } from 'react';
import supabase from '../supabase';
import Modal from './Modal';
import ChatPage from './ChatPage';
import ScrollToTopButton from '../components/ScrollToTopButton';

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
  setShowFilters,
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
  const [copiedField, setCopiedField] = useState(null);
  const setFiltersVisible = setShowFilters; // alias interno para claridad

const handleCopy = (text, field) => {
  navigator.clipboard.writeText(text);
  setCopiedField(field);
  setTimeout(() => setCopiedField(null), 1500);
};

 
  const [markedOffers, setMarkedOffers] = useState(() => {
    if (currentUser?.id) {
      const key = `markedOffers_user_${currentUser.id}`;
      try {
        const storedMarked = localStorage.getItem(key);
        return storedMarked ? JSON.parse(storedMarked) : [];
      } catch (error) {
        console.error("Error parsing marked offers from localStorage", error);
        return [];
      }
    }
    return [];
  });

  // Función para marcar/desmarcar ofertas:
  // Solo guarda en localStorage si hay un usuario logueado.
  const toggleMark = (offerId) => {
    setMarkedOffers(prevMarked => {
      const updated = prevMarked.includes(offerId)
        ? prevMarked.filter(id => id !== offerId)
        : [...prevMarked, offerId];

      if (currentUser?.id) {
        const key = `markedOffers_user_${currentUser.id}`;
        try {
          localStorage.setItem(key, JSON.stringify(updated));
        } catch (error) {
          console.error("Error saving marked offers to localStorage", error);
        }
      }
      return updated;
    });
  };

  // Efecto para manejar el cambio de usuario o la carga inicial:
  // Carga las marcas del usuario actual desde localStorage.
  // Si el usuario cierra sesión (currentUser se vuelve null), limpia las marcas en memoria.
  useEffect(() => {
    if (currentUser?.id) {
      const key = `markedOffers_user_${currentUser.id}`;
      try {
        const storedMarked = localStorage.getItem(key);
        setMarkedOffers(storedMarked ? JSON.parse(storedMarked) : []);
      } catch (error) {
        console.error("Error loading marked offers from localStorage on user change", error);
        setMarkedOffers([]);
      }
    } else {
      setMarkedOffers([]); // Limpia las marcas si no hay usuario o se cerró sesión
    }
  }, [currentUser]); // Depende de `currentUser` para reaccionar a cambios de sesión

  // Efecto para limpiar las marcas al cerrar sesión (usando el listener de Supabase):
  useEffect(() => {
    // Suscribirse a los cambios de estado de autenticación de Supabase
    // La corrección clave: desestructurar 'data' para obtener 'subscription'
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          // Si el usuario cierra sesión, limpia las marcas en la UI
          setMarkedOffers([]);
          // Opcional: podrías limpiar la entrada específica de localStorage si tuvieras el ID del usuario anterior
          // const lastUserId = ...; // Necesitarías una forma de guardar el ID antes del logout
          // if (lastUserId) localStorage.removeItem(`markedOffers_user_${lastUserId}`);
        }
        // No es necesario manejar SIGNED_IN/INITIAL_SESSION aquí,
        // ya que el useEffect de arriba (que depende de currentUser) ya lo hace.
      }
    );

    // Asegurarse de limpiar la suscripción al desmontar el componente
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []); // Se ejecuta solo una vez al montar el componente

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
  }, [offers]);


  const toggleExpanded = (id) => {
    setExpandedOfferId((prev) => (prev === id ? null : id));
  };

  return (
    <div>

      {showFilters && (
        <div className={`filter-body expanded`}>

          <div className="filters-container filters-panel show" style={{ marginBottom: '20px' }}>
            <h3 style={{ gridColumn: '1 / -1' }}>Job Filters</h3>

            <input
              type="text"
              className="search-input"
              placeholder="Position"
              value={filters.rank}
              onChange={(e) => setFilters({ ...filters, rank: e.target.value })}
            />

            <input
              type="text"
              className="search-input"
              placeholder="City"
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            />

            <input
              type="number"
              className="search-input"
              placeholder="Salary From"
              value={filters.minSalary}
              onChange={(e) => setFilters({ ...filters, minSalary: e.target.value })}
            />

            <select
              className="category-select"
              value={filters.team}
              onChange={(e) => setFilters({ ...filters, team: e.target.value })}
            >
              <option value="">¿Team?</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>

            <select
              className="category-select"
              value={filters.yachtType}
              onChange={(e) => setFilters({ ...filters, yachtType: e.target.value })}
            >
              <option value="">Yacht Type</option>
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
              <option value="">Size</option>
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
              <option value="">Use</option>
              <option value="Private">Private</option>
              <option value="Charter">Charter</option>
              <option value="Private/Charter">Private/Charter</option>
            </select>

            <details style={{ gridColumn: '1 / -1' }}>
              <summary style={{ fontWeight: 'bold', cursor: 'pointer' }}>Country</summary>
              <div style={{ marginTop: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                {regionOrder.map((region) => {
                  const countryList = countriesByRegion[region];
                  const allSelected = countryList.every((c) => filters.country.includes(c));
                  return (
                    <details key={region} style={{ marginBottom: '12px' }}>
  <summary style={{ cursor: 'pointer', fontWeight: 'bold', userSelect: 'none' }}>
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <input
        type="checkbox"
        checked={allSelected}
        onClick={(e) => e.stopPropagation()}
        onChange={() => toggleRegionCountries(region)}
        style={{ verticalAlign: 'middle', marginBottom: '1px' }}
      />
      {region}
    </span>
  </summary>

  <div style={{ marginLeft: '20px', marginTop: '8px' }}>
    {countryList.map((country) => (
      <label key={country} className="filter-checkbox-label">
        <input
          type="checkbox"
          checked={filters.country.includes(country)}
          onChange={() => toggleMultiSelect('country', country)}
        />
        {country}
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
                {['Arabic', 'Dutch', 'English', 'French', 'German', 'Greek', 'Italian', 'Mandarin', 'Portuguese', 'Russian', 'Spanish', 'Turkish', 'Ukrainian'].map((lang) => (
                 <label key={lang} className="filter-checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.languages.includes(lang)}
                      onChange={() => toggleMultiSelect('languages', lang)}
                    />
                    {lang}
                  </label>
                ))}
              </div>
            </details>

            <details style={{ gridColumn: '1 / -1' }}>
              <summary style={{ fontWeight: 'bold', cursor: 'pointer' }}>Terms</summary>
              <div style={{ marginTop: '8px' }}>
                {['Rotational', 'Permanent', 'Temporary', 'Seasonal', 'Relief', 'Delivery', 'Cruising', 'DayWork'].map((term) => (
                 <label key={term} className="filter-checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.terms.includes(term)}
                      onChange={() => toggleMultiSelect('terms', term)}
                    />
                    {term}
                  </label>
                ))}
              </div>
            </details>
            <label
  htmlFor="selectedOnly"
  className="filter-checkbox-label"
  style={{ gridColumn: '1 / -1', marginBottom: '10px' }}
>
  <input
    id="selectedOnly"
    type="checkbox"
    checked={filters.selectedOnly}
    onChange={() => setFilters({ ...filters, selectedOnly: !filters.selectedOnly })}
  />
  <span><strong>Only Selected</strong></span>
</label>
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
                selectedOnly: false,
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
              <div
  key={dayGroup}
  style={{
    margin: '0 auto 15px',
    padding: '0 10px',
    maxWidth: '100%',
    boxSizing: 'border-box'
  }}
>
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
                        className={`offer-card ${isExpanded ? 'expanded' : ''} ${markedOffers.includes(offer.id) ? 'marked' : ''}`}
                      >
                        {isExpanded ? (
  <div className="offer-content">
    <div className="top-row">
      <div className={`expanded-block block1 ${
  offer.team
    ? offer.is_doe
      ? offer.years_in_rank !== null && offer.years_in_rank !== undefined
        ? 'case3'
        : 'case4'
      : offer.years_in_rank !== null && offer.years_in_rank !== undefined
        ? 'case1'
        : 'case2'
    : ''
} ${offer.teammate_rank && (offer.teammate_experience === null || offer.teammate_experience === undefined) ? 'no-rank2' : ''}`}>
  <div className="field-pair">
    {offer.title && (
      <div className="field-group position">
        <div className="field-label">Position</div>
        <div className="field-value">{offer.title}</div>
      </div>
    )}

    {(offer.years_in_rank !== null && offer.years_in_rank !== undefined) && (
      <div className="field-group time-in-rank">
        <div className="field-label">Time in Rank</div>
        <div className="field-value">
          {offer.years_in_rank === 0 ? 'Green' : `> ${offer.years_in_rank}`}
        </div>
      </div>
    )}

    {(offer.is_doe || offer.salary) && (
      <div className="field-group salary">
        <div className="field-label">Salary</div>
        <div className="field-value">
          {offer.is_doe ? 'DOE' : `${offer.salary_currency || ''} ${Number(offer.salary).toLocaleString('en-US')}`}
        </div>
      </div>
    )}

    {offer.teammate_rank && (
  <div className="field-group position2">
    <div className="field-label">Position (2)</div>
    <div className="field-value">{offer.teammate_rank}</div>
  </div>
)}

{(offer.teammate_experience === null || offer.teammate_experience === undefined) && offer.teammate_salary && (
  <div className="field-group salary2">
    <div className="field-label">Salary (2)</div>
    <div className="field-value">
      {`${offer.salary_currency || ''} ${Number(offer.teammate_salary).toLocaleString('en-US')}`}
    </div>
  </div>
)}

{(offer.teammate_experience !== null && offer.teammate_experience !== undefined) && (
  <div className="field-group time-in-rank2">
    <div className="field-label">Time in Rank</div>
    <div className="field-value">
      {offer.teammate_experience === 0 ? 'Green' : `> ${offer.teammate_experience}`}
    </div>
  </div>
)}

{(offer.teammate_experience !== null && offer.teammate_experience !== undefined) && offer.teammate_salary && (
  <div className="field-group salary2">
    <div className="field-label">Salary (2)</div>
    <div className="field-value">
      {`${offer.salary_currency || ''} ${Number(offer.teammate_salary).toLocaleString('en-US')}`}
    </div>
  </div>
)}

    {offer.type && (
      <div className="field-group terms">
        <div className="field-label">Terms</div>
        <div className="field-value">{offer.type}</div>
      </div>
    )}
  </div>
</div>


      {(offer.yacht_type ||
  (offer.yacht_size && offer.work_environment !== 'Shore-based') ||
  offer.flag ||
  offer.homeport ||
  offer.uses ||
  offer.season_type) && (

  <div className="expanded-block block2">
  <div className="field-pair">
    {offer.yacht_type && (
      <div className="field-group">
        <div className="field-label">Yacht Type</div>
        <div className="field-value">{offer.yacht_type}</div>
      </div>
    )}

    {offer.yacht_size && offer.work_environment !== 'Shore-based' && (
      <div className="field-group">
        <div className="field-label">Size</div>
        <div className="field-value">{offer.yacht_size}</div>
      </div>
    )}

    {offer.flag && (
      <div className="field-group">
        <div className="field-label">Flag</div>
        <div className="field-value">{offer.flag}</div>
      </div>
    )}

    {offer.homeport && (
      <div className="field-group">
        <div className="field-label">Homeport</div>
        <div className="field-value">{offer.homeport}</div>
      </div>
    )}

    {offer.uses && (
      <div className="field-group">
        <div className="field-label">Use</div>
        <div className="field-value">{offer.uses}</div>
      </div>
    )}

    {offer.season_type && (
      <div className="field-group">
        <div className="field-label">Season Type</div>
        <div className="field-value">{offer.season_type}</div>
      </div>
    )}
  </div>
</div>
)}

      {(offer.language_1 || offer.language_1_fluency || offer.language_2 || offer.language_2_fluency) && (
  <div className="expanded-block block3">
    <div className="field-pair">
      {offer.language_1 && (
        <div className="field-group">
          <div className="field-label">Language</div>
          <div className="field-value">{offer.language_1}</div>
        </div>
      )}

      {offer.language_1_fluency && (
        <div className="field-group">
          <div className="field-label">Fluency</div>
          <div className="field-value">{offer.language_1_fluency}</div>
        </div>
      )}

      {offer.language_2 && (
        <div className="field-group">
          <div className="field-label">2nd Language</div>
          <div className="field-value">{offer.language_2}</div>
        </div>
      )}

      {offer.language_2_fluency && (
        <div className="field-group">
          <div className="field-label">Fluency</div>
          <div className="field-value">{offer.language_2_fluency}</div>
        </div>
      )}
    </div>
  </div>
)}

      <div className="expanded-block block4">
  <div className="field-pair">
    {(offer.is_asap || offer.start_date) && (
      <div className="field-group">
        <div className="field-label">Start Date</div>
        <div className="field-value">
          {offer.is_asap ? 'ASAP' : formatDate(offer.start_date)}
        </div>
      </div>
    )}

    {offer.end_date && (
      <div className="field-group">
        <div className="field-label">End Date</div>
        <div className="field-value">{formatDate(offer.end_date)}</div>
      </div>
    )}

    {offer.liveaboard && (
      <div className="field-group">
        <div className="field-label">Liveaboard</div>
        <div className="field-value">{offer.liveaboard}</div>
      </div>
    )}

    {offer.holidays && (
      <div className="field-group">
        <div className="field-label">Holidays</div>
        <div className="field-value">{offer.holidays}</div>
      </div>
    )}
  </div>
</div>

      <div className="expanded-block block5">
  <div className="field-pair">
    {offer.city && (
      <div className="field-group">
        <div className="field-label">City</div>
        <div className="field-value">{offer.city}</div>
      </div>
    )}

    {offer.country && (
      <div className="field-group">
        <div className="field-label">Country</div>
        <div className="field-value">{offer.country}</div>
      </div>
    )}

    {offer.contact_email && (
  <div className="field-group" style={{ gridColumn: '1 / -1' }}>
    <div
      className="field-label"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        whiteSpace: 'nowrap',
        position: 'relative',
      }}
    >
      <span>Email</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleCopy(offer.contact_email, 'email');
        }}
        title="Copy email"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1em',
          color: '#007BFF',
          padding: 0,
          marginLeft: '4px',
          lineHeight: 1,
          display: 'inline-block',
        }}
      >
        📋
      </button>
      {copiedField === 'email' && (
        <span
          style={{
            position: 'absolute',
            top: '-1.5em',
            left: '0',
            fontSize: '0.75rem',
            color: 'green',
          }}
        >
          Copied!
        </span>
      )}
    </div>
    <div className="field-value email" style={{ overflowWrap: 'break-word' }}>
      {offer.contact_email}
    </div>
  </div>
)}

    {offer.contact_phone && (
  <div className="field-group" style={{ gridColumn: '1 / -1' }}>
    <div
      className="field-label"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        whiteSpace: 'nowrap',
        position: 'relative',
      }}
    >
      <span>Phone</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleCopy(offer.contact_phone, 'phone');
        }}
        title="Copy phone"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1em',
          color: '#007BFF',
          padding: 0,
          marginLeft: '4px',
          lineHeight: 1,
          display: 'inline-block',
        }}
      >
        📋
      </button>
      {copiedField === 'phone' && (
        <span
          style={{
            position: 'absolute',
            top: '-1.5em',
            left: '0',
            fontSize: '0.75rem',
            color: 'green',
          }}
        >
          Copied!
        </span>
      )}
    </div>
    <div className="field-value email" style={{ overflowWrap: 'break-word' }}>
      {offer.contact_phone}
    </div>
  </div>
)}
  </div>
</div>
    </div>

    {offer.description && (
  <div className="expanded-block block6">
    <div className="field-label">Remarks</div>
    <div className="field-value remarks-content">
      {offer.description.split(/\n{2,}/).map((paragraph, index) => (
        <p
          key={index}
          style={{
            whiteSpace: 'pre-line',
            marginBottom: '12px',
            textAlign: 'justify',
          }}
        >
          {paragraph}
        </p>
      ))}
    </div>
  </div>
)}

    <div className="expanded-block block7">
      {!isOwner && currentUser && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleStartChat(offer.id, offer.user_id);
          }}
        >
          Start private chat
        </button>
      )}
    </div>
  </div>
) : (
                          <div className={`collapsed-offer${offer.team ? ' team' : ''}`}>
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
                            <div className="collapsed-info-row">
                              {isMobile ? (

  <div className="collapsed-column collapsed-primary">
    {/* Rank */}
    <span className="rank-fixed">{offer.title}</span>

    {/* Salary */}
    <div className="salary-line">
      <strong>Salary:</strong>{' '}
      {offer.is_doe
        ? 'DOE'
        : `${offer.salary_currency || ''} ${Number(offer.salary).toLocaleString('en-US')}`}
    </div>

    {/* Rank 2 */}
    {offer.team && offer.teammate_rank && (
      <div className="rank-fixed">{offer.teammate_rank}</div>
    )}


    {/* Salary 2 */}
    {offer.team && offer.teammate_salary && (
      <div className="salary-line">
        <strong>Salary:</strong>{' '}
        {`${offer.salary_currency || ''} ${Number(offer.teammate_salary).toLocaleString('en-US')}`}
      </div>
    )}

    {/* SHORE-BASED */}
    {offer.work_environment === 'Shore-based' ? (
      <>
        <div className="salary-line">
          <strong>Work Location:</strong> {offer.city ? 'On-Site' : 'Remote'}
        </div>
        {offer.city && (
          <div className="salary-line">
            <strong>City:</strong> {offer.city}
          </div>
        )}
        {offer.city && offer.country && (
          <div className="salary-line">
            <strong>Country:</strong> {offer.country}
          </div>
        )}
      </>
    ) : (
      <>
        {/* NO Shore-based */}
        {offer.yacht_type && (
          <div className="salary-line">
            <strong>Yacht Type:</strong> {offer.yacht_type}
          </div>
        )}
        {offer.yacht_size && (
          <div className="salary-line">
            <strong>Size:</strong> {offer.yacht_size}
          </div>
        )}
        {offer.city && (
          <div className="salary-line">
            <strong>City:</strong> {offer.city}
          </div>
        )}
        {offer.country && (
          <div className="salary-line">
            <strong>Country:</strong> {offer.country}
          </div>
        )}
      </>
    )}
  </div>
) : (
  // 🔸 VERSIÓN PARA PANTALLAS GRANDES — SIN CAMBIOS
  <div className="collapsed-column collapsed-primary">
    <span className="rank-fixed">{offer.title}</span>
    {offer.team && offer.teammate_rank && (
      <div className="rank-fixed">{offer.teammate_rank}</div>
    )}
    {offer.work_environment === 'Shore-based' && (
      <div className="salary-line">
        <strong>Work Location:</strong> {offer.city ? 'On-Site' : 'Remote'}
      </div>
    )}
    {offer.yacht_type && (
      <div className="salary-line">
        <strong>Yacht Type:</strong> {offer.yacht_type}
      </div>
    )}
    {offer.city && (
      <div className="salary-line">
        <strong>City:</strong> {offer.city}
      </div>
    )}
  </div>
)}

  {!isMobile && (
  <div className="collapsed-column collapsed-secondary">
    {offer.team ? (
      <>
        {/* Línea 1: Salary */}
        <div className="salary-line">
          <strong>Salary:</strong>{' '}
          {offer.is_doe
            ? 'DOE'
            : `${offer.salary_currency || ''} ${Number(offer.salary).toLocaleString('en-US')}`}
        </div>

        {/* Línea 2: Teammate Salary o espacio vacío */}
        <div className="salary-line">
          {offer.teammate_salary ? (
            <>
              <strong>Salary:</strong>{' '}
              {`${offer.salary_currency || ''} ${Number(offer.teammate_salary).toLocaleString('en-US')}`}
            </>
          ) : (
            '\u00A0'
          )}
        </div>

        {/* Línea 3: Size (reservada si shore-based) */}
        <div className="salary-line">
          {offer.work_environment !== 'Shore-based' && offer.yacht_size ? (
            <>
              <strong>Size:</strong> {offer.yacht_size}
            </>
          ) : (
            '\u00A0'
          )}
        </div>

        {/* Línea 4: Country (ocultar si shore-based && remote) */}
        {!(offer.work_environment === 'Shore-based' && !offer.city) && (
          <div className="salary-line">
            <strong>Country:</strong> {offer.country}
          </div>
        )}
      </>
    ) : (
      <>
        {/* Línea 1: Salary */}
        <div className="salary-line">
          <strong>Salary:</strong>{' '}
          {offer.is_doe
            ? 'DOE'
            : `${offer.salary_currency || ''} ${Number(offer.salary).toLocaleString('en-US')}`}
        </div>

        {/* Línea 2: Size (reservada si shore-based) */}
        <div className="salary-line">
          {offer.work_environment !== 'Shore-based' && offer.yacht_size ? (
            <>
              <strong>Size:</strong> {offer.yacht_size}
            </>
          ) : (
            '\u00A0'
          )}
        </div>

        {/* Línea 3: Country (ocultar si shore-based && remote) */}
        {!(offer.work_environment === 'Shore-based' && !offer.city) && (
          <div className="salary-line">
            <strong>Country:</strong> {offer.country}
          </div>
        )}
      </>
    )}
  </div>
)}

<div className="collapsed-footer">
  {isTodayLocal(offer.created_at) && (
    <div className="posted-timestamp-collapsed">
      <strong>Posted:</strong> {formatTime(offer.created_at)}
    </div>
  )}
  <div
    className="tick-marker"
    onClick={(e) => {
      e.stopPropagation();
      toggleMark(offer.id);
    }}
  >
    {markedOffers.includes(offer.id) ? '✔' : ''}
  </div>
</div>
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

      {Object.keys(groupedOffers).length === 0 && (
  <p style={{ marginTop: '20px', fontStyle: 'italic' }}>
    No matching offers found.
  </p>
)}

      {activeChat && (
        <Modal onClose={() => setActiveChat(null)}>
          <ChatPage
            offerId={activeChat.offerId}
            receiverId={activeChat.receiverId}
          />
        </Modal>
      )}
       <ScrollToTopButton />
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
    minute: '2-digit',
    hourCycle: 'h23'
  });
};

const isTodayLocal = (timestamp) => {
  const offerDate = new Date(timestamp);
  const now = new Date();

  return (
    offerDate.getDate() === now.getDate() &&
    offerDate.getMonth() === now.getMonth() &&
    offerDate.getFullYear() === now.getFullYear()
  );
};

export default YachtOfferList;