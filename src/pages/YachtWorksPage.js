import React, { useEffect, useState, useMemo } from 'react';
import supabase from '../supabase';
import YachtOfferList from '../components/YachtOfferList';
import '../yachtworkspage.css';

const countriesByRegion = {
  'North America': ['Bermuda (UK)', 'Canada', 'United States', 'Mexico'],
  'Central America': ['Belize', 'Costa Rica', 'El Salvador', 'Guatemala', 'Honduras', 'Nicaragua', 'Panama'],
  'South America': ['Argentina', 'Brazil', 'Chile', 'Colombia', 'Ecuador', 'Paraguay', 'Peru', 'Uruguay', 'Venezuela'],
  'Caribbean': [
    'Anguilla', 'Antigua and Barbuda', 'Aruba', 'Bahamas', 'Barbados', 'Bonaire', 'BVI (UK)',
    'Cayman Islands (UK)', 'Cuba', 'Curacao', 'Dominica', 'Dominican Republic', 'Grenada', 'Jamaica',
    'Saint Barthélemy', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Maarten', 'Saint Vincent and the Grenadines',
    'Trinidad and Tobago'
  ],
  'North and Baltic Seas': [
    'Belgium', 'Denmark', 'Estonia', 'Finland', 'Germany', 'Guernsey (UK)', 'Isle of Man (UK)', 'Jersey (UK)',
    'Latvia', 'Lithuania', 'Netherlands', 'Norway', 'Poland', 'Sweden', 'United Kingdom'
  ],
  'Western Europe': ['France', 'Gibraltar (UK)', 'Ireland', 'Italy', 'Malta', 'Monaco', 'Portugal', 'Spain'],
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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 820);

  // -------- Acordeón exclusivo --------
  // 'filters' | 'prefs' | null
  const [openPanel, setOpenPanel] = useState(null);
  const togglePanel = (panel) => {
    setOpenPanel((prev) => (prev === panel ? null : panel));
  };
  const isFiltersOpen = openPanel === 'filters';
  const isPrefsOpen  = openPanel === 'prefs';

  // Compatibilidad para hijos que esperaban booleano/actualizador de filtros
  const setShowFilters = (next) => {
    if (typeof next === 'function') {
      const resolved = next(isFiltersOpen);
      setOpenPanel(resolved ? 'filters' : null);
    } else {
      setOpenPanel(next ? 'filters' : null);
    }
  };

  // country como array
  const [filters, setFilters] = useState({
    rank: '',
    city: '',
    country: [],
    minSalary: '',
    team: '',
    languages: [],
    terms: [],
    yachtType: '',
    yachtSize: '',
    use: '',
    flag: '',
    selectedOnly: false,
  });

  const [preferences, setPreferences] = useState({
    positions: [],
    terms: [],
    countries: [],
    minSalary: '',
    selectedRegion: null,
    flag: '',
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
        !filters.country.some((c) => (offer.country || '').toLowerCase() === String(c).toLowerCase())
      ) return false;

      if (filters.minSalary && (!offer.salary || offer.salary < parseFloat(filters.minSalary))) return false;

      if (filters.team && ((filters.team === 'Yes' && !offer.team) || (filters.team === 'No' && offer.team))) return false;

      if (filters.languages.length && !filters.languages.some(lang => [offer.language_1, offer.language_2].includes(lang))) return false;

      if (filters.terms.length && !filters.terms.includes(offer.type)) return false;

      if (filters.yachtType && offer.yacht_type !== filters.yachtType) return false;

      if (filters.yachtSize && offer.yacht_size !== filters.yachtSize) return false;

      if (filters.use && offer.uses !== filters.use) return false;

      if (filters.flag) {
        const offerFlag = String(offer.flag || '');
        const isUSFlag = ['United States', 'US Flag', 'USA'].includes(offerFlag);
        if (filters.flag === 'United States') {
          if (!isUSFlag) return false;
        } else if (filters.flag === 'Foreign Flag') {
          if (isUSFlag) return false;
        } else if (offerFlag !== filters.flag) {
          return false;
        }
      }

      return true;
    });
  }, [offers, filters, user]);

  const prefsReady = useMemo(() => {
    const posOK = (preferences.positions || []).length > 0;
    const termOK = (preferences.terms || []).length > 0;
    const geoOK  = (
      (typeof preferences.selectedRegion === 'string' && preferences.selectedRegion.length > 0) ||
      (preferences.countries || []).length > 0
    );
    const salOK  = preferences.minSalary !== '' && preferences.minSalary !== null && preferences.minSalary !== undefined;
    const flagOK = typeof preferences.flag === 'string' && preferences.flag.length > 0;
    return posOK && termOK && geoOK && salOK && flagOK;
  }, [preferences]);

  const scoredOffers = useMemo(() => {
    const posMatch = (title, list = []) => {
      const t = String(title || '').toLowerCase();
      return (list || []).some(p => t.includes(String(p || '').toLowerCase()));
    };
    const pct = (ok) => (ok ? 1 : 0);

    return filteredOffers.map((o) => {
      if (!prefsReady) {
        return { ...o, match_primary_score: 0, match_teammate_score: 0 };
      }

      const pPos = pct(posMatch(o.title, preferences.positions));

      const pCountry = pct(
        (preferences.countries || []).some(
          c => String(o.country || '').toLowerCase() === String(c || '').toLowerCase()
        )
      );

      const pTerm = pct((preferences.terms || []).includes(String(o.type || ''))); // 20%

      const wantsMin = preferences.minSalary !== '' && preferences.minSalary !== null && preferences.minSalary !== undefined;
      const isDOE = !!o.is_doe;
      const salaryNum = Number(o.salary || 0);
      const pPay = pct(wantsMin ? (isDOE || salaryNum >= Number(preferences.minSalary)) : false); // 10%

      const offerFlag = String(o.flag || '');
      const isUSFlag = ['United States', 'US Flag', 'USA'].includes(offerFlag);
      const pFlag = pct(
        preferences.flag === 'United States'
          ? isUSFlag
          : preferences.flag === 'Foreign Flag'
            ? !isUSFlag
            : false
      );

      const primaryScore = Math.round(100 * (0.35*pPos + 0.25*pCountry + 0.2*pTerm + 0.1*pPay + 0.1*pFlag));

      const tPos = pct(posMatch(o.teammate_rank, preferences.positions));
      const teammateScore = o.team && o.teammate_rank
        ? Math.round(100 * (0.55*tPos + 0.25*pCountry + 0.1*pTerm + 0.1*pFlag))
        : 0;

      return {
        ...o,
        match_primary_score: primaryScore,
        match_teammate_score: teammateScore,
      };
    });
  }, [filteredOffers, preferences, prefsReady]);

  const toggleMultiSelect = (key, value) => {
    setFilters((prev) => {
      const current = prev[key];
      return {
        ...prev,
        [key]: current.includes(value)
          ? current.filter((v) => v !== value)
          : [...prev[key], value],
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
        <div
          className="filters-prefs-row"
          style={{ display: 'flex', gap: '24px', alignItems: 'center' }}
        >
          <h3
            className="filter-toggle"
            onClick={() => togglePanel('filters')}
            style={{ cursor: 'pointer', margin: 0 }}
          >
            {isFiltersOpen ? '▼ Filters' : '► Filters'}
          </h3>

          <h3
            className="prefs-toggle"
            onClick={() => togglePanel('prefs')}
            style={{ cursor: 'pointer', margin: 0 }}
          >
            {isPrefsOpen ? '▼ Job Preferences' : '► Job Preferences'}
          </h3>
        </div>
      )}

      {isMobile && (
        <button
          className="navbar-toggle"
          onClick={() => togglePanel('filters')}
        >
          ☰ Filters
        </button>
      )}

      <YachtOfferList
        offers={scoredOffers}
        currentUser={user}
        filters={filters}
        setFilters={setFilters}

        setShowFilters={setShowFilters}
        showFilters={isFiltersOpen}

        openPanel={openPanel}
        setOpenPanel={setOpenPanel}

        toggleMultiSelect={toggleMultiSelect}
        toggleRegionCountries={toggleRegionCountries}
        regionOrder={regionOrder}
        countriesByRegion={countriesByRegion}
        preferences={preferences}
        setPreferences={setPreferences}
        isMobile={isMobile}
      />
    </div>
  );
}

export default YachtWorksPage;
