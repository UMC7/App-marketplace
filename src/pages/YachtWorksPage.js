import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import supabase from '../supabase';
import YachtOfferList from '../components/YachtOfferList';
import SeaCrewList from '../components/SeaCrewList';
import SeaJobsAnalytics from '../components/SeaJobsAnalytics';
import ChatPage from '../components/ChatPage';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import '../yachtworkspage.css';
import { getOfferDepartment } from '../utils/offerDepartment';
import { normalizeYachtUse } from '../components/cv/candidate/shared/experienceCatalogs';
import { isOfferVisibleOnJobBoard } from '../utils/jobOfferVisibility';
import { inferTypeByName } from './cv/publicProfileView.utils';
import { useLocation } from 'react-router-dom';

const SEACREW_PAGE_SIZE = 18;
const SEACREW_MAX_PAGE_BATCHES = 6;

const countriesByRegion = {
  'North America': ['Bermuda (UK)', 'Canada', 'United States', 'Mexico'],
  'Central America': ['Belize', 'Costa Rica', 'El Salvador', 'Guatemala', 'Honduras', 'Nicaragua', 'Panama'],
  'South America': ['Argentina', 'Brazil', 'Chile', 'Colombia', 'Ecuador', 'Paraguay', 'Peru', 'Uruguay', 'Venezuela'],
  'Caribbean': [
    'Anguilla', 'Antigua and Barbuda', 'Aruba', 'Bahamas', 'Barbados', 'Bonaire', 'BVI (UK)',
    'Cayman Islands (UK)', 'Cuba', 'Curacao', 'Dominica', 'Dominican Republic', 'Grenada', 'Jamaica', 'Puerto Rico', 'USVI (US)',
    'Saint Barthélemy', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Maarten', 'Saint Vincent and the Grenadines',
    'Trinidad and Tobago'
  ],
  'North and Baltic Seas': [
    'Belgium', 'Denmark', 'Estonia', 'Finland', 'Germany', 'Guernsey (UK)', 'Isle of Man (UK)', 'Jersey (UK)',
    'Latvia', 'Lithuania', 'Netherlands', 'Norway', 'Poland', 'Sweden', 'United Kingdom'
  ],
  'Western Europe': ['France', 'Gibraltar (UK)', 'Ireland', 'Italy', 'Malta', 'Monaco', 'Portugal', 'Spain'],
  'Eastern Europe': ['Albania', 'Bulgaria', 'Croatia', 'Cyprus', 'Greece', 'Montenegro', 'Romania', 'Slovenia', 'Turkey'],
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

const normalizeLocationKey = (value) => String(value || '').trim().toLowerCase();

const LOCATION_TO_PREFERENCE_REGIONS = {
  'asia': ['Asia'],
  'caribbean': ['Caribbean'],
  'baltic': ['North and Baltic Seas'],
  'north sea': ['North and Baltic Seas'],
  'mediterranean': ['Western Europe', 'Eastern Europe'],
  'indian ocean': ['Asia'],
  'red sea': ['Persian Gulf'],
  'pacific': ['Oceania'],
};

const LOCATION_TO_COUNTRIES = Object.fromEntries(
  Object.entries(LOCATION_TO_PREFERENCE_REGIONS).map(([locationKey, regions]) => [
    locationKey,
    Array.from(
      new Set(
        regions.flatMap((region) => (countriesByRegion[region] || []).map(normalizeLocationKey))
      )
    ),
  ])
);

function parseJsonIfNeeded(value) {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function normalizeGalleryValue(gallery) {
  const parsed = parseJsonIfNeeded(gallery);
  return Array.isArray(parsed) ? parsed : [];
}

function normalizePrefsValue(value) {
  const parsed = parseJsonIfNeeded(value);
  return typeof parsed === 'object' && parsed !== null ? parsed : {};
}

function normalizePublicProfileForProgress(profile) {
  const liteData = normalizePrefsValue(profile?.prefs_skills_lite);
  const proData = normalizePrefsValue(profile?.prefs_skills_pro);
  const legacyPrefs = normalizePrefsValue(profile?.prefs_skills);

  const mergedPrefs = Object.keys(liteData).length || Object.keys(proData).length
    ? { ...legacyPrefs, ...proData, ...liteData }
    : legacyPrefs;

  return {
    ...profile,
    prefs_skills_lite: mergedPrefs,
    gallery: normalizeGalleryValue(profile?.gallery),
  };
}

function getSeaCrewUserLookupKeys(profile) {
  return [
    profile?.user_id,
    profile?.owner_user_id,
    profile?.id,
  ]
    .map((value) => String(value || '').trim())
    .filter(Boolean);
}

const UUID_LIKE_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuidLike(value) {
  return UUID_LIKE_RE.test(String(value || '').trim());
}

function countGalleryImages(gallery) {
  const items = normalizeGalleryValue(gallery);
  return items.filter((item) => {
    const source = typeof item === 'string'
      ? item
      : item?.url || item?.path || item?.name || '';
    const type = inferTypeByName(source);
    return type === 'image';
  }).length;
}

function buildSeaCrewReadyProfiles(profiles) {
  return profiles.filter((profile) => {
    const handle = String(profile?.handle || '').trim();
    const galleryImageCount = countGalleryImages(profile?.gallery);
    const statusValue = getSeaCrewStatusValue(profile).toLowerCase();
    const isSeaCrewVisible = (profile?.visibility_settings?.show_in_seacrew ?? true) === true;
    return (
      Boolean(handle) &&
      profile?.share_ready === true &&
      galleryImageCount > 0 &&
      statusValue !== 'not available' &&
      isSeaCrewVisible
    );
  });
}

function chunkArray(items, size = 100) {
  const safeSize = Math.max(1, Number(size) || 100);
  const chunks = [];
  for (let index = 0; index < items.length; index += safeSize) {
    chunks.push(items.slice(index, index + safeSize));
  }
  return chunks;
}

function getSeaCrewRankValue(profile) {
  return String(
    profile?.prefs_skills_lite?.rank ||
    profile?.prefs_skills?.rank ||
    profile?.primary_role ||
    profile?.rank ||
    profile?.primary_department ||
    ''
  ).trim();
}

function getSeaCrewCityValue(profile) {
  return String(profile?.city || profile?.city_port || '').trim();
}

function getSeaCrewCountryValue(profile) {
  return String(profile?.country || '').trim();
}

function getSeaCrewStatusValue(profile) {
  return String(profile?.prefs_skills_lite?.status || profile?.prefs_skills?.status || '').trim();
}

function mapSeaCrewProfileRows(rows) {
  const safeRows = Array.isArray(rows) ? rows : [];
  return safeRows.map((row) => {
    const baseProfile = normalizePublicProfileForProgress(
      row?.profile && typeof row.profile === 'object' ? row.profile : {}
    );
    const rawMonths = Number(row?.yachting_months);
    return {
      ...baseProfile,
      userNickname: String(row?.user_nickname || '').trim(),
      yachtingMonths: Number.isFinite(rawMonths) ? rawMonths : null,
      employmentStatus: String(row?.employment_status || '').trim(),
      chatReceiverId: String(row?.chat_receiver_id || '').trim(),
    };
  });
}

function mergeUniqueSeaCrewProfiles(existingProfiles, incomingProfiles) {
  const seen = new Set();
  const merged = [];

  [...(Array.isArray(existingProfiles) ? existingProfiles : []), ...(Array.isArray(incomingProfiles) ? incomingProfiles : [])]
    .forEach((profile) => {
      const profileId = String(profile?.id || '').trim();
      if (!profileId || seen.has(profileId)) return;
      seen.add(profileId);
      merged.push(profile);
    });

  return merged;
}

async function fetchSeaCrewProfilesLegacy() {
  const { data, error } = await supabase
    .from('public_profiles')
    .select('*')
    .not('handle', 'is', null)
    .neq('handle', '')
    .eq('share_ready', true)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const profiles = Array.isArray(data) ? data : [];
  const normalizedProfiles = profiles.map(normalizePublicProfileForProgress);
  const profileIds = normalizedProfiles
    .map((profile) => (isUuidLike(profile.id) ? profile.id : null))
    .filter(Boolean);
  const nicknameIds = Array.from(
    new Set(
      normalizedProfiles.flatMap((profile) => getSeaCrewUserLookupKeys(profile).filter(isUuidLike))
    )
  );

  const nicknameMap = new Map();
  for (const idChunk of chunkArray(nicknameIds)) {
    try {
      const { data: userRows, error: usersError } = await supabase
        .from('users')
        .select('id, nickname')
        .in('id', idChunk);

      if (usersError) {
        console.warn('SeaCrew nickname batch lookup failed:', usersError);
        continue;
      }

      (userRows || []).forEach((row) => {
        const nickname = String(row?.nickname || '').trim();
        if (nickname) nicknameMap.set(String(row.id), nickname);
      });
    } catch (nicknameError) {
      console.warn('SeaCrew nickname batch lookup failed:', nicknameError);
    }
  }

  if (nicknameIds.length && nicknameMap.size === 0 && window.location.hostname !== 'localhost') {
    try {
      const response = await fetch('/api/seacrew-nicknames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: nicknameIds }),
      });
      const payload = await response.json();
      if (response.ok && payload?.nicknames && typeof payload.nicknames === 'object') {
        Object.entries(payload.nicknames).forEach(([id, nickname]) => {
          const safeNickname = String(nickname || '').trim();
          if (safeNickname) nicknameMap.set(id, safeNickname);
        });
      }
    } catch (nicknameError) {
      console.warn('Error loading SeaCrew nicknames from API:', nicknameError);
    }
  }

  const experienceMap = new Map();
  for (const profileIdChunk of chunkArray(profileIds)) {
    try {
      const { data: experienceRows, error: experiencesError } = await supabase
        .from('profile_experiences')
        .select('profile_id, start_year, start_month, end_year, end_month, is_current')
        .in('profile_id', profileIdChunk);

      if (experiencesError) {
        console.warn('SeaCrew experience batch lookup failed:', experiencesError);
        continue;
      }

      (experienceRows || []).forEach((row) => {
        const key = String(row.profile_id || '').trim();
        if (!key) return;
        const current = experienceMap.get(key) || [];
        current.push(row);
        experienceMap.set(key, current);
      });
    } catch (experiencesError) {
      console.warn('SeaCrew experience batch lookup failed:', experiencesError);
    }
  }

  const yachtingMonthsMap = new Map();
  for (const profileIdChunk of chunkArray(profileIds, 25)) {
    try {
      const yachtingEntries = await Promise.all(
        profileIdChunk.map(async (profileId) => {
          const { data: monthsData, error: monthsError } = await supabase.rpc('rpc_yachting_months', {
            profile_uuid: profileId,
          });
          if (monthsError) {
            console.warn('SeaCrew yachting months lookup failed for', profileId, monthsError);
            return [profileId, null];
          }
          return [profileId, typeof monthsData === 'number' ? monthsData : null];
        })
      );

      yachtingEntries.forEach(([profileId, months]) => {
        yachtingMonthsMap.set(profileId, months);
      });
    } catch (monthsError) {
      console.warn('SeaCrew yachting months batch lookup failed:', monthsError);
    }
  }

  const enrichedProfiles = normalizedProfiles.map((profile) => {
    const nicknameLookupKeys = getSeaCrewUserLookupKeys(profile).filter(isUuidLike);
    const userNickname =
      nicknameLookupKeys
        .map((id) => nicknameMap.get(id) || '')
        .find((value) => String(value || '').trim()) || '';

    const profileExperiences = isUuidLike(profile.id)
      ? experienceMap.get(profile.id) || []
      : [];
    const yachtingMonths = isUuidLike(profile.id)
      ? yachtingMonthsMap.get(profile.id) ?? null
      : null;
    const chatReceiverId =
      nicknameLookupKeys.find((value) => value !== String(profile.id || '').trim()) ||
      nicknameLookupKeys[0] ||
      '';

    return {
      ...profile,
      userNickname,
      profile_experiences: profileExperiences,
      yachtingMonths,
      chatReceiverId,
    };
  });

  return buildSeaCrewReadyProfiles(enrichedProfiles);
}

async function fetchSeaCrewProfilesRpc() {
  const { data, error } = await supabase.rpc('rpc_seacrew_profiles');
  if (error) throw error;

  return normalizeSeaCrewProfileRows(data);
}

function normalizeSeaCrewProfileRows(rows) {
  return buildSeaCrewReadyProfiles(mapSeaCrewProfileRows(rows));
}

async function fetchSeaCrewProfilesPageFullRpc({ offset = 0, limit = SEACREW_PAGE_SIZE } = {}) {
  const { data, error } = await supabase.rpc('rpc_seacrew_profiles_page_full', {
    page_offset: offset,
    page_limit: limit,
  });
  if (error) throw error;
  const normalizedRows = mapSeaCrewProfileRows(data);
  return {
    rawCount: Array.isArray(data) ? data.length : 0,
    items: buildSeaCrewReadyProfiles(normalizedRows),
  };
}

async function fetchSeaCrewProfilesPageWindow({
  offset = 0,
  bufferedProfiles = [],
  targetCount = SEACREW_PAGE_SIZE,
  batchSize = SEACREW_PAGE_SIZE,
  maxBatches = SEACREW_MAX_PAGE_BATCHES,
} = {}) {
  let nextOffset = Math.max(0, Number(offset) || 0);
  let queue = Array.isArray(bufferedProfiles) ? [...bufferedProfiles] : [];
  let hasMore = true;
  let batchCount = 0;

  while (queue.length < targetCount && hasMore && batchCount < maxBatches) {
    const { rawCount, items } = await fetchSeaCrewProfilesPageFullRpc({
      offset: nextOffset,
      limit: batchSize,
    });

    queue = mergeUniqueSeaCrewProfiles(queue, items);
    nextOffset += rawCount;
    hasMore = rawCount === batchSize;
    batchCount += 1;

    if (rawCount === 0) break;
  }

  return {
    items: queue.slice(0, targetCount),
    bufferedProfiles: queue.slice(targetCount),
    nextOffset,
    hasMore: hasMore || queue.length > targetCount,
  };
}

async function fetchSeaCrewFilterOptionsRpc() {
  const { data, error } = await supabase.rpc('rpc_seacrew_filter_options');
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    ranks: Array.isArray(row?.ranks) ? row.ranks.filter(Boolean) : [],
    cities: Array.isArray(row?.cities) ? row.cities.filter(Boolean) : [],
    countries: Array.isArray(row?.countries) ? row.countries.filter(Boolean) : [],
  };
}

async function fetchSeaCrewProfiles() {
  try {
    return await fetchSeaCrewProfilesRpc();
  } catch (rpcError) {
    console.warn('SeaCrew RPC fetch failed, falling back to legacy loader:', rpcError);
    return fetchSeaCrewProfilesLegacy();
  }
}

const SeaCrewFilterPanel = React.forwardRef(({
  filters,
  setFilters,
  rankOptions,
  cityOptions,
  countryOptions,
}, ref) => {
  return (
    <div ref={ref} className="filter-body expanded">
      <div className="filters-container filters-panel show seacrew-filters-panel" style={{ marginBottom: '20px' }}>
        <h3 style={{ gridColumn: '1 / -1' }}>Crew Filters</h3>

        <select
          className="category-select"
          value={filters.rank}
          onChange={(e) => setFilters((prev) => ({ ...prev, rank: e.target.value }))}
        >
          <option value="">Rank</option>
          {rankOptions.map((rank) => (
            <option key={rank} value={rank}>{rank}</option>
          ))}
        </select>

        <select
          className="category-select"
          value={filters.city}
          onChange={(e) => setFilters((prev) => ({ ...prev, city: e.target.value }))}
        >
          <option value="">City</option>
          {cityOptions.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>

        <select
          className="category-select"
          value={filters.country}
          onChange={(e) => setFilters((prev) => ({ ...prev, country: e.target.value }))}
        >
          <option value="">Country</option>
          {countryOptions.map((country) => (
            <option key={country} value={country}>{country}</option>
          ))}
        </select>

        <label
          htmlFor="crewSelectedOnly"
          className="filter-checkbox-label seacrew-highlight-inline"
          style={{ marginBottom: 0 }}
        >
          <input
            id="crewSelectedOnly"
            type="checkbox"
            checked={Boolean(filters.selectedOnly)}
            onChange={() => setFilters((prev) => ({ ...prev, selectedOnly: !prev.selectedOnly }))}
          />
          <span><strong>Only highlighted</strong></span>
        </label>

        <button
          className="clear-filters"
          style={{
            gridColumn: '1 / -1',
            margin: '10px 0',
            width: '100%',
            display: 'block',
            padding: '14px 16px',
            borderRadius: '10px',
            fontWeight: 600,
          }}
          onClick={() => setFilters({ rank: '', city: '', country: '', selectedOnly: false })}
        >
          Clear All Filters
        </button>
      </div>
    </div>
  );
});

SeaCrewFilterPanel.displayName = 'SeaCrewFilterPanel';

function YachtWorksPage() {
  const location = useLocation();
  const requestedTab = new URLSearchParams(location.search).get('tab');
  const [offers, setOffers] = useState([]);
  const [user, setUser] = useState(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 820);
  const [offersLoading, setOffersLoading] = useState(true);
  const [crewProfiles, setCrewProfiles] = useState(null);
  const [crewLoading, setCrewLoading] = useState(false);
  const [crewError, setCrewError] = useState('');
  const [crewHasMore, setCrewHasMore] = useState(false);
  const [crewFilterOptions, setCrewFilterOptions] = useState({ ranks: [], cities: [], countries: [] });
  const [activeTab, setActiveTab] = useState(requestedTab === 'crew' ? 'crew' : 'jobs');
  const [showPrefsIntro, setShowPrefsIntro] = useState(false);
  const [prefsIntroSeen, setPrefsIntroSeen] = useState(false);
  const [showCrewChatIntro, setShowCrewChatIntro] = useState(false);
  const [showCrewChatLoginInfo, setShowCrewChatLoginInfo] = useState(false);
  const [crewChatIntroSeen, setCrewChatIntroSeen] = useState(false);
  const [pendingCrewChat, setPendingCrewChat] = useState(null);
  const [activeCrewChat, setActiveCrewChat] = useState(null);
  const PREFS_INTRO_KEY = 'seajobs_prefs_intro_seen';
  const CREW_CHAT_INTRO_KEY = 'seacrew_private_chat_intro_seen';
  const PREFS_INTRO_DELAY_MS = 20000;
  const prefsIntroTimer = React.useRef(null);
  const crewFiltersRef = React.useRef(null);
  const crewDesktopToggleRef = React.useRef(null);
  const crewMobileToggleRef = React.useRef(null);
  const crewLoadMoreSentinelRef = useRef(null);

  // -------- Acordeón exclusivo --------
  // 'filters' | 'prefs' | null
  const [openPanel, setOpenPanel] = useState(null);
  const togglePanel = (panel) => {
    setOpenPanel((prev) => (prev === panel ? null : panel));
  };

  useEffect(() => {
    if (requestedTab === 'crew') {
      setActiveTab('crew');
      return;
    }
    if (requestedTab === 'jobs') {
      setActiveTab('jobs');
    }
  }, [requestedTab]);
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
    department: '',
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
  const [crewFilters, setCrewFilters] = useState({
    rank: '',
    city: '',
    country: '',
    selectedOnly: false,
  });
  const crewRequestIdRef = React.useRef(0);
  const crewNextOffsetRef = React.useRef(0);
  const crewBufferedProfilesRef = React.useRef([]);

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
      setUserLoaded(true);
    };
    getUser();
  }, []);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(PREFS_INTRO_KEY);
      setPrefsIntroSeen(!!seen);
      if (!seen) {
        prefsIntroTimer.current = setTimeout(() => {
          setShowPrefsIntro(true);
        }, PREFS_INTRO_DELAY_MS);
      }
    } catch {
      prefsIntroTimer.current = setTimeout(() => {
        setShowPrefsIntro(true);
      }, PREFS_INTRO_DELAY_MS);
    }
    return () => {
      if (prefsIntroTimer.current) {
        clearTimeout(prefsIntroTimer.current);
        prefsIntroTimer.current = null;
      }
    };
  }, []);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(CREW_CHAT_INTRO_KEY);
      setCrewChatIntroSeen(!!seen);
    } catch {
      setCrewChatIntroSeen(false);
    }
  }, []);

  useEffect(() => {
    if (prefsIntroSeen || showPrefsIntro) return;
    if (openPanel === 'prefs') {
      if (prefsIntroTimer.current) {
        clearTimeout(prefsIntroTimer.current);
        prefsIntroTimer.current = null;
      }
      setShowPrefsIntro(true);
    }
  }, [openPanel, prefsIntroSeen, showPrefsIntro]);

  useEffect(() => {
    const fetchOffers = async () => {
      setOffersLoading(true);
      const { data, error } = await supabase
        .from('yacht_work_offers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching offers:', error);
      } else {
        setOffers(data);
      }
      setOffersLoading(false);
    };
    fetchOffers();
  }, []);

  useEffect(() => {
    if (activeTab !== 'crew' || !userLoaded) return;

    let cancelled = false;
    const loadOptions = async () => {
      try {
        const options = await fetchSeaCrewFilterOptionsRpc();
        if (!cancelled) setCrewFilterOptions(options);
      } catch (error) {
        console.warn('SeaCrew filter options RPC failed:', error);
      }
    };

    loadOptions();
    return () => {
      cancelled = true;
    };
  }, [activeTab, userLoaded]);

  const hasCrewFiltersApplied = useMemo(
    () => (
      Boolean(crewFilters.selectedOnly) ||
      String(crewFilters.rank || '').trim().length > 0 ||
      String(crewFilters.city || '').trim().length > 0 ||
      String(crewFilters.country || '').trim().length > 0
    ),
    [crewFilters]
  );

  useEffect(() => {
    if (activeTab !== 'crew' || !userLoaded) return;

    const requestId = ++crewRequestIdRef.current;
    const loadCrewProfiles = async () => {
      setCrewLoading(true);
      setCrewError('');
      try {
        if (hasCrewFiltersApplied) {
          crewNextOffsetRef.current = 0;
          crewBufferedProfilesRef.current = [];
          const readyProfiles = await fetchSeaCrewProfiles();
          if (crewRequestIdRef.current !== requestId) return;
          setCrewProfiles(readyProfiles);
          setCrewHasMore(false);
        } else {
          try {
            const firstPage = await fetchSeaCrewProfilesPageWindow({
              offset: 0,
              bufferedProfiles: [],
              targetCount: SEACREW_PAGE_SIZE,
            });
            if (crewRequestIdRef.current !== requestId) return;
            crewNextOffsetRef.current = firstPage.nextOffset;
            crewBufferedProfilesRef.current = firstPage.bufferedProfiles;
            setCrewProfiles(firstPage.items);
            setCrewHasMore(firstPage.hasMore);
          } catch (pageError) {
            console.warn('SeaCrew paged RPC failed, falling back to full loader:', pageError);
            const readyProfiles = await fetchSeaCrewProfiles();
            if (crewRequestIdRef.current !== requestId) return;
            crewNextOffsetRef.current = readyProfiles.length;
            crewBufferedProfilesRef.current = [];
            setCrewProfiles(readyProfiles.slice(0, SEACREW_PAGE_SIZE));
            setCrewHasMore(readyProfiles.length > SEACREW_PAGE_SIZE);
          }
        }
      } catch (error) {
        const message = error.message || 'Failed to load SeaCrew profiles.';
        console.error('Error fetching SeaCrew profiles:', error);
      setCrewError(message);
      crewNextOffsetRef.current = 0;
      crewBufferedProfilesRef.current = [];
      setCrewProfiles([]);
      setCrewHasMore(false);
    } finally {
        if (crewRequestIdRef.current === requestId) {
          setCrewLoading(false);
        }
      }
    };

    loadCrewProfiles();
  }, [activeTab, userLoaded, hasCrewFiltersApplied]);

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

  useEffect(() => {
    if (activeTab !== 'crew' || openPanel !== 'filters') return undefined;

    const handleClickOutside = (event) => {
      const clickedInsideFilters = crewFiltersRef.current?.contains(event.target);
      const clickedDesktopToggle = crewDesktopToggleRef.current?.contains(event.target);
      const clickedMobileToggle = crewMobileToggleRef.current?.contains(event.target);

      if (!clickedInsideFilters && !clickedDesktopToggle && !clickedMobileToggle) {
        setOpenPanel(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeTab, openPanel]);

  const filteredOffers = useMemo(() => {
    return offers.filter((offer) => {
      if (!isOfferVisibleOnJobBoard(offer)) return false;

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

      if (filters.department) {
        const dept = getOfferDepartment(offer);
        if (dept !== filters.department) return false;
      }

      if (filters.city && !offer.city?.toLowerCase().includes(filters.city.toLowerCase())) return false;

      if (
        filters.country.length &&
        !filters.country.some((c) => (offer.country || '').toLowerCase() === String(c).toLowerCase())
      ) return false;

      if (filters.minSalary && (!offer.salary || offer.salary < parseFloat(filters.minSalary))) return false;

      if (filters.team && ((filters.team === 'Yes' && !offer.team) || (filters.team === 'No' && offer.team))) return false;

      if (
        filters.languages.length &&
        !filters.languages.some((lang) => [offer.language_1, offer.language_2, offer.language_3].includes(lang))
      ) return false;

      if (filters.terms.length && !filters.terms.includes(offer.type)) return false;

      if (filters.yachtType && offer.yacht_type !== filters.yachtType) return false;

      if (filters.yachtSize && offer.yacht_size !== filters.yachtSize) return false;

      if (filters.use && normalizeYachtUse(offer.uses) !== normalizeYachtUse(filters.use)) return false;

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

  const crewRankOptions = useMemo(() => {
    const source = crewFilterOptions.ranks.length
      ? crewFilterOptions.ranks
      : (Array.isArray(crewProfiles) ? crewProfiles : []).map(getSeaCrewRankValue).filter(Boolean);
    return Array.from(new Set(source)).sort((a, b) => a.localeCompare(b));
  }, [crewFilterOptions.ranks, crewProfiles]);

  const crewCityOptions = useMemo(() => {
    const source = crewFilterOptions.cities.length
      ? crewFilterOptions.cities
      : (Array.isArray(crewProfiles) ? crewProfiles : []).map(getSeaCrewCityValue).filter(Boolean);
    return Array.from(new Set(source)).sort((a, b) => a.localeCompare(b));
  }, [crewFilterOptions.cities, crewProfiles]);

  const crewCountryOptions = useMemo(() => {
    const source = crewFilterOptions.countries.length
      ? crewFilterOptions.countries
      : (Array.isArray(crewProfiles) ? crewProfiles : []).map(getSeaCrewCountryValue).filter(Boolean);
    return Array.from(new Set(source)).sort((a, b) => a.localeCompare(b));
  }, [crewFilterOptions.countries, crewProfiles]);

  const filteredCrewProfiles = useMemo(() => {
    const items = Array.isArray(crewProfiles) ? crewProfiles : [];
    const rankFilter = String(crewFilters.rank || '').trim().toLowerCase();
    const cityFilter = String(crewFilters.city || '').trim().toLowerCase();
    const countryFilter = String(crewFilters.country || '').trim().toLowerCase();
    const selectedOnly = Boolean(crewFilters.selectedOnly);
    let markedProfiles = [];

    if (selectedOnly && user?.id) {
      try {
        const stored = localStorage.getItem(`markedSeaCrewProfiles_user_${user.id}`);
        markedProfiles = stored ? JSON.parse(stored) : [];
      } catch (error) {
        console.error('Error loading marked SeaCrew profiles for filtering', error);
        markedProfiles = [];
      }
    }

    return items.filter((profile) => {
      const rank = getSeaCrewRankValue(profile).toLowerCase();
      const city = getSeaCrewCityValue(profile).toLowerCase();
      const country = getSeaCrewCountryValue(profile).toLowerCase();

      if (selectedOnly && !markedProfiles.includes(profile.id)) return false;
      if (rankFilter && rank !== rankFilter) return false;
      if (cityFilter && city !== cityFilter) return false;
      if (countryFilter && country !== countryFilter) return false;
      return true;
    });
  }, [crewFilters, crewProfiles, user]);

  const visibleCrewProfiles = useMemo(() => filteredCrewProfiles, [filteredCrewProfiles]);

  const hasMoreCrewProfiles = !hasCrewFiltersApplied && crewHasMore;

  const handleLoadMoreCrew = useCallback(async () => {
    if (crewLoading || hasCrewFiltersApplied || !crewHasMore) return;
    const requestId = ++crewRequestIdRef.current;
    setCrewLoading(true);
    setCrewError('');
    try {
      const nextPage = await fetchSeaCrewProfilesPageWindow({
        offset: crewNextOffsetRef.current,
        bufferedProfiles: crewBufferedProfilesRef.current,
        targetCount: SEACREW_PAGE_SIZE,
      });
      if (crewRequestIdRef.current !== requestId) return;
      crewNextOffsetRef.current = nextPage.nextOffset;
      crewBufferedProfilesRef.current = nextPage.bufferedProfiles;
      setCrewProfiles((prev) => mergeUniqueSeaCrewProfiles(prev, nextPage.items));
      setCrewHasMore(nextPage.hasMore);
    } catch (error) {
      const message = error.message || 'Failed to load more SeaCrew profiles.';
      console.error('Error loading more SeaCrew profiles:', error);
      setCrewError(message);
    } finally {
      if (crewRequestIdRef.current === requestId) {
        setCrewLoading(false);
      }
    }
  }, [crewHasMore, crewLoading, hasCrewFiltersApplied]);

  useEffect(() => {
    if (activeTab !== 'crew' || hasCrewFiltersApplied || !hasMoreCrewProfiles) return undefined;
    if (typeof IntersectionObserver === 'undefined') return undefined;

    const sentinel = crewLoadMoreSentinelRef.current;
    if (!sentinel) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          handleLoadMoreCrew();
        }
      },
      { rootMargin: '420px 0px' }
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [activeTab, handleLoadMoreCrew, hasCrewFiltersApplied, hasMoreCrewProfiles]);

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

    const prefCountriesSet = new Set((preferences.countries || []).map(normalizeLocationKey));

    return filteredOffers.map((o) => {
      if (!prefsReady) {
        return { ...o, match_primary_score: 0, match_teammate_score: 0 };
      }

      const pPos = pct(posMatch(o.title, preferences.positions));

      const normalizedOfferLocation = normalizeLocationKey(o.country);
      const regionFallback = normalizedOfferLocation ? LOCATION_TO_COUNTRIES[normalizedOfferLocation] : undefined;
      const offerMatchesCountry =
        !!normalizedOfferLocation && (
          prefCountriesSet.has(normalizedOfferLocation) ||
          (regionFallback && regionFallback.some((country) => prefCountriesSet.has(country)))
        );
      const pCountry = pct(offerMatchesCountry);

      const pTerm = pct((preferences.terms || []).includes(String(o.type || ''))); // 20%

      const wantsMin = preferences.minSalary !== '' && preferences.minSalary !== null && preferences.minSalary !== undefined;
      const isDOE = !!o.is_doe;
      const isTips = !!o.is_tips;
      const salaryNum = Number(o.salary || 0);
      const pPay = pct(wantsMin ? (isDOE || isTips || salaryNum >= Number(preferences.minSalary)) : false); // 10%

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

  const handleClosePrefsIntro = () => {
    try {
      localStorage.setItem(PREFS_INTRO_KEY, '1');
    } catch {}
    setShowPrefsIntro(false);
    setPrefsIntroSeen(true);
    if (prefsIntroTimer.current) {
      clearTimeout(prefsIntroTimer.current);
      prefsIntroTimer.current = null;
    }
  };

  const handleStartCrewChat = (receiverId) => {
    if (!receiverId) return;
    setActiveCrewChat({ offerId: null, receiverId });
  };

  const handleRequestCrewChat = (receiverId) => {
    if (!receiverId) return;
    if (!user?.id) {
      setShowCrewChatLoginInfo(true);
      return;
    }
    if (receiverId === user.id) return;
    if (!crewChatIntroSeen) {
      setPendingCrewChat({ receiverId });
      setShowCrewChatIntro(true);
      return;
    }
    handleStartCrewChat(receiverId);
  };

  const handleCloseCrewChatIntro = () => {
    try {
      localStorage.setItem(CREW_CHAT_INTRO_KEY, '1');
    } catch {}
    setCrewChatIntroSeen(true);
    setShowCrewChatIntro(false);
    if (pendingCrewChat?.receiverId) {
      const nextReceiverId = pendingCrewChat.receiverId;
      setPendingCrewChat(null);
      handleStartCrewChat(nextReceiverId);
      return;
    }
    setPendingCrewChat(null);
  };

  const handleCloseCrewChatLoginInfo = () => {
    setShowCrewChatLoginInfo(false);
  };

  if (offersLoading) {
    return <LoadingSpinner message="Loading offers..." />;
  }

  return (
    <div className="container">
      {showPrefsIntro && (
        <Modal onClose={handleClosePrefsIntro}>
          <div style={{ maxWidth: 520 }}>
            <h3 style={{ marginTop: 0 }}>🔔 Job Preferences – How it works</h3>
            <p>Set your Job Preferences to help SeaJobs work for you.</p>
            <p>📝 Choose the positions, terms, locations, and conditions you’re interested in.</p>
            <p>✨ Jobs that match your preferences will be highlighted in the list.</p>
            <p>🔔 You’ll also receive notifications when new opportunities fit what you’re looking for.</p>
            <p>Unlike filters, Job Preferences stay active and help you discover the best opportunities automatically.</p>
            <p>👉 Update your preferences anytime.</p>
            <button className="landing-button" onClick={handleClosePrefsIntro}>
              Got it
            </button>
          </div>
        </Modal>
      )}
      {showCrewChatIntro && (
        <Modal onClose={handleCloseCrewChatIntro}>
          <div style={{ maxWidth: 520 }}>
            <h3 style={{ marginTop: 0 }}>🔒 Private Chat – How it works</h3>
            <p>Use Private Chat to contact candidates directly and professionally.</p>
            <p>💬 Start a private conversation with the candidate behind the SeaCrew card.</p>
            <p>📎 Share role details, answer questions, and continue the conversation securely inside Yacht Daywork.</p>
            <p>🔐 Your communication stays private inside the platform without requiring personal contact details.</p>
            <p>👉 Chat safely. Connect professionally.</p>
            <button className="landing-button" onClick={handleCloseCrewChatIntro}>
              Got it
            </button>
          </div>
        </Modal>
      )}
      {showCrewChatLoginInfo && (
        <Modal onClose={handleCloseCrewChatLoginInfo}>
          <div style={{ maxWidth: 520 }}>
            <h3 style={{ marginTop: 0 }}>Sign in required</h3>
            <p>Private Chat is available only for registered users. Please sign in to start a private conversation.</p>
            <button className="landing-button" onClick={handleCloseCrewChatLoginInfo}>
              Close
            </button>
          </div>
        </Modal>
      )}
      {activeCrewChat && (
        <Modal onClose={() => setActiveCrewChat(null)}>
          <ChatPage
            offerId={activeCrewChat.offerId}
            receiverId={activeCrewChat.receiverId}
            onBack={() => setActiveCrewChat(null)}
            onClose={() => setActiveCrewChat(null)}
          />
        </Modal>
      )}
      <div className="module-header-wrapper">
        <div className="module-header-row">
          <h1>{activeTab === 'crew' ? 'SeaCrew' : 'SeaJobs'}</h1>
          <span>{activeTab === 'crew' ? 'Available Crew' : 'Available Offers'}</span>
        </div>
      </div>

      <div className="seacrew-tabs">
        <button
          type="button"
          className={`seacrew-tab${activeTab === 'jobs' ? ' active' : ''}`}
          onClick={() => setActiveTab('jobs')}
        >
          Available Offers
        </button>
        <button
          type="button"
          className={`seacrew-tab${activeTab === 'crew' ? ' active' : ''}`}
          onClick={() => setActiveTab('crew')}
        >
          Available Crew
        </button>
      </div>
      {activeTab === 'crew' && crewError && (
        <div style={{ marginBottom: 14, color: '#f8b4b4', fontSize: 14 }}>
          SeaCrew load error: {crewError}
        </div>
      )}

      {activeTab === 'jobs' && !offersLoading && (
        <SeaJobsAnalytics offers={offers} isMobile={isMobile} />
      )}

      {activeTab === 'jobs' && !isMobile && (
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

      {activeTab === 'jobs' && isMobile && (
        <div className="filters-prefs-row-mobile">
          <button
            className="navbar-toggle"
            onClick={() => togglePanel('filters')}
            aria-expanded={isFiltersOpen}
          >
            ☰ Filters
          </button>
          <button
            className="navbar-toggle"
            onClick={() => togglePanel('prefs')}
            aria-expanded={isPrefsOpen}
          >
            ☰ Job Preferences
          </button>
        </div>
      )}

      {activeTab === 'crew' && !isMobile && (
        <div
          className="filters-prefs-row"
          style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '18px' }}
        >
          <h3
            ref={crewDesktopToggleRef}
            className="filter-toggle"
            onClick={() => togglePanel('filters')}
            style={{ cursor: 'pointer', margin: 0 }}
          >
            {isFiltersOpen ? '▼ Filters' : '► Filters'}
          </h3>
        </div>
      )}

      {activeTab === 'crew' && isMobile && (
        <div className="filters-prefs-row-mobile" style={{ marginBottom: '18px' }}>
          <button
            ref={crewMobileToggleRef}
            className="navbar-toggle"
            onClick={() => togglePanel('filters')}
            aria-expanded={isFiltersOpen}
          >
            ☰ Filters
          </button>
        </div>
      )}

      {activeTab === 'jobs' ? (
        <YachtOfferList
          offers={scoredOffers}
          offersLoading={offersLoading}
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
      ) : (
        <>
          {isFiltersOpen && (
            <SeaCrewFilterPanel
              ref={crewFiltersRef}
              filters={crewFilters}
              setFilters={setCrewFilters}
              rankOptions={crewRankOptions}
              cityOptions={crewCityOptions}
              countryOptions={crewCountryOptions}
            />
          )}
          <SeaCrewList
            profiles={visibleCrewProfiles}
            loading={crewLoading && !Array.isArray(crewProfiles)}
            currentUserId={user?.id || ''}
            onRequestChat={handleRequestCrewChat}
          />
          {hasMoreCrewProfiles && (
            <div
              ref={crewLoadMoreSentinelRef}
              className="seacrew-loadmore-sentinel"
              aria-hidden="true"
            >
              {crewLoading && (
                <div className="seacrew-inline-loader" aria-label="Loading more crew">
                  <div className="seacrew-inline-loader-spinner" />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default YachtWorksPage;
