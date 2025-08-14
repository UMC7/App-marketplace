import React, { useEffect, useState, useMemo } from 'react';
import supabase from '../supabase';
import YachtOfferList from '../components/YachtOfferList';
import '../yachtworkspage.css';

const countriesByRegion = {
  'North America': ['Canada', 'United States', 'Mexico'],
  'Central America': ['Belize', 'Costa Rica', 'El Salvador', 'Guatemala', 'Honduras', 'Nicaragua', 'Panama'],
  'South America': ['Argentina', 'Brazil', 'Chile', 'Colombia', 'Ecuador', 'Paraguay', 'Peru', 'Uruguay', 'Venezuela'],
  'Caribbean': [
    'Anguilla', 'Antigua and Barbuda', 'Aruba', 'Bahamas', 'Barbados', 'Bonaire', 'Cuba', 'Curacao',
    'Dominica', 'Dominican Republic', 'Grenada', 'Jamaica', 'Saint Kitts and Nevis', 'Saint Lucia',
    'Saint Maarten', 'Saint Vincent and the Grenadines', 'Trinidad and Tobago'
  ],
  'North and Baltic Seas': [
    'Belgium', 'Denmark', 'Estonia', 'Finland', 'Germany', 'Latvia', 'Lithuania',
    'Netherlands', 'Norway', 'Poland', 'Sweden', 'United Kingdom'
  ],
  'Western Europe': ['France', 'Ireland', 'Italy', 'Malta', 'Monaco', 'Portugal', 'Spain'],
  'Eastern Europe': ['Albania', 'Bulgaria', 'Croatia', 'Cyprus', 'Greece', 'Montenegro', 'Romania', 'Turkey'],
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
  'North and Baltic Seas',
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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 820);
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
    selectedOnly: false,
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
    const nowMobile = window.innerWidth <= 820;
    setIsMobile(nowMobile);

  };

  window.addEventListener('resize', handleResize);
  handleResize();

  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);

  const filteredOffers = useMemo(() => {
  return offers.filter((offer) => {

    if (filters.selectedOnly) {
      const key = `markedOffers_user_${user?.id}`;
      const stored = localStorage.getItem(key);
      const parsed = stored ? JSON.parse(stored) : [];
      if (!parsed.includes(offer.id)) return false;
    }

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
    if (filters.languages.length && !filters.languages.some(lang => [offer.language_1, offer.language_2].includes(lang))) return false;
    if (filters.terms.length && !filters.terms.includes(offer.type)) return false;
    if (filters.yachtType && offer.yacht_type !== filters.yachtType) return false;
    if (filters.yachtSize && offer.yacht_size !== filters.yachtSize) return false;
    if (filters.use && offer.uses !== filters.use) return false;
    return true;
  });
}, [offers, filters, user]);

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
    <div className="module-header-wrapper">
      <div className="module-header-row">
      <h1>SeaJobs</h1>
      <span>Available Offers</span>
    </div>
  </div>

    {!isMobile && (
      <h3
        className="filter-toggle"
        onClick={() => setShowFilters(prev => !prev)}
        style={{ cursor: 'pointer' }}
      >
        {showFilters ? '▼ Filters' : '► Filters'}
      </h3>
    )}

    {isMobile && (
  <button
    className="navbar-toggle"
    onClick={() => setShowFilters((prev) => !prev)}
  >
    ☰ Filters
  </button>
)}

    

  <YachtOfferList
  offers={filteredOffers}
  currentUser={user}
  filters={filters}
  setFilters={setFilters}
  setShowFilters={setShowFilters}
  toggleMultiSelect={toggleMultiSelect}
  toggleRegionCountries={toggleRegionCountries}
  regionOrder={regionOrder}
  countriesByRegion={countriesByRegion}
  showFilters={showFilters}
/>
  </div>
);
}

export default YachtWorksPage;