import React, { useEffect, useState, useMemo } from 'react';
import supabase from '../supabase';
import YachtOfferList from '../components/YachtOfferList';

const countriesByRegion = {
  'North America': ['Canada', 'United States', 'Mexico'],
  'Central America': ['Belize', 'Costa Rica', 'El Salvador', 'Guatemala', 'Honduras', 'Nicaragua', 'Panama'],
  'South America': ['Argentina', 'Brazil', 'Chile', 'Colombia', 'Ecuador', 'Paraguay', 'Peru', 'Uruguay', 'Venezuela'],
  'Caribbean': [
    'Anguilla', 'Antigua and Barbuda', 'Aruba', 'Bahamas', 'Barbados', 'Bonaire', 'Cuba', 'Curacao',
    'Dominica', 'Dominican Republic', 'Grenada', 'Jamaica', 'Saint Kitts and Nevis', 'Saint Lucia',
    'Saint Maarten', 'Saint Vincent and the Grenadines', 'Trinidad and Tobago'
  ],
  'North Sea and Baltic Sea': [
    'Belgium', 'Denmark', 'Estonia', 'Finland', 'Germany', 'Latvia', 'Lithuania',
    'Netherlands', 'Norway', 'Poland', 'Sweden', 'United Kingdom'
  ],
  'Western Europe': ['France', 'Ireland', 'Italy', 'Malta', 'Monaco', 'Portugal', 'Spain'],
  'Eastern Europe': ['Bulgaria', 'Croatia', 'Cyprus', 'Greece', 'Montenegro', 'Turkey'],
  'Asia': [
    'Brunei', 'China', 'India', 'Indonesia', 'Israel', 'Japan', 'Malaysia',
    'Maldives', 'Myanmar', 'Philippines', 'Singapore', 'South Korea',
    'Taiwan', 'Thailand', 'Vietnam'
  ],
  'Persian Gulf': ['Kuwait', 'Saudi Arabia', 'United Arab Emirates', 'Qatar'],
  'Oceania': [
    'Australia', 'Fiji', 'Kiribati', 'Marshall Islands', 'Micronesia',
    'New Zealand', 'Samoa', 'Solomon Islands', 'Vanuatu'
  ]
};

const regionOrder = [
  'Western Europe',
  'Eastern Europe',
  'North Sea and Baltic Sea',
  'Caribbean',
  'North America',
  'Central America',
  'South America',
  'Persian Gulf',
  'Asia',
  'Oceania'
];

function YachtWorksPage() {
  const [offers, setOffers] = useState([]);
  const [user, setUser] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    rank: '',
    city: '',
    country: '',
    minSalary: '',
    team: '',
    languages: [],
    terms: [],
    yachtType: '',
    yachtSize: '',
    use: '',
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    const fetchOffers = async () => {
      const { data, error } = await supabase
        .from('yacht_work_offers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching offers:', error);
      } else {
        setOffers(data);
      }
    };
    fetchOffers();
  }, []);

  useEffect(() => {
  const handleResize = () => {
    if (window.innerWidth > 768) {
      setShowFilters(true);
    }
  };

  window.addEventListener('resize', handleResize);

  // Ejecuta una vez al cargar también
  handleResize();

  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);

  const filteredOffers = useMemo(() => {
    return offers.filter((offer) => {
      if (
        filters.rank &&
        !(
        offer.title?.toLowerCase().includes(filters.rank.toLowerCase()) ||
        offer.teammate_rank?.toLowerCase().includes(filters.rank.toLowerCase())
        )
      ) return false;
      if (filters.city && !offer.city?.toLowerCase().includes(filters.city.toLowerCase())) return false;
      if (
        filters.country.length &&
        !filters.country.some((c) => offer.country?.toLowerCase() === c.toLowerCase())
        ) return false;
      if (filters.minSalary && (!offer.salary || offer.salary < parseFloat(filters.minSalary))) return false;
      if (filters.team && ((filters.team === 'Yes' && !offer.team) || (filters.team === 'No' && offer.team))) return false;
      if (filters.languages.length && !filters.languages.every(lang => [offer.language_1, offer.language_2].includes(lang))) return false;
      if (filters.terms.length && !filters.terms.includes(offer.type)) return false;
      if (filters.yachtType && offer.yacht_type !== filters.yachtType) return false;
      if (filters.yachtSize && offer.yacht_size !== filters.yachtSize) return false;
      if (filters.use && offer.uses !== filters.use) return false;
      return true;
    });
  }, [offers, filters]);

  const toggleMultiSelect = (key, value) => {
    setFilters((prev) => {
      const current = prev[key];
      return {
        ...prev,
        [key]: current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value],
      };
    });
  };

  const toggleRegionCountries = (region) => {
  const countries = countriesByRegion[region];
  const allSelected = countries.every((c) => filters.country.includes(c));
  setFilters((prev) => ({
    ...prev,
    country: allSelected
      ? prev.country.filter((c) => !countries.includes(c))
      : [...new Set([...prev.country, ...countries])]
  }));
};

  return (
  <div className="container">
    <h1>YACHT WORKS</h1>
    <h2>Ofertas disponibles</h2>

    <button
  className="navbar-toggle"
  onClick={() => setShowFilters((prev) => !prev)}
>
  ☰ Filtros
</button>

    {(window.innerWidth > 768 || showFilters) && (
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

    {/* Región / país */}
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

    {/* Idiomas */}
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

    {/* Terms */}
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
  </div>
)}

    <YachtOfferList offers={filteredOffers} currentUser={user} />
  </div>
);
}

export default YachtWorksPage;