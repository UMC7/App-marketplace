import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import supabase from '../supabase';
import Modal from './Modal';
import ChatPage from './ChatPage';
import ThemeLogo from './ThemeLogo';
import Avatar from '../components/Avatar';
import '../styles/YachtOfferList.css';
import ScrollToTopButton from '../components/ScrollToTopButton';
import MatchBorder from '../components/MatchBorder';
import { isInNativeApp, postShareToNative } from '../utils/nativeShare';

const REMARKS_DISCLAIMER = 'Disclaimer:\nYacht Daywork Ltd. connects employers and crew directly and is not involved in hiring decisions or private agreements. Please communicate responsibly and remain cautious when applying.';

const formatSalaryValue = (currency, amount, withTips) => {
  const base = `${currency || ''} ${Number(amount).toLocaleString('en-US')}`;
  return withTips ? `${base} + Tips` : base;
};

const formatSalary = (offer) => {
  if (!offer) return '';
  const base = offer.is_doe
    ? 'DOE'
    : formatSalaryValue(offer.salary_currency, offer.salary, false);
  return offer.is_tips ? `${base} + Tips` : base;
};

const getRoleImage = (title) => {
  if (!title) return 'others';

  const lowerTitle = title.toLowerCase();

  if ([
    'captain', 'captain/engineer', 'skipper', 'chase boat captain', 'relief captain', 'chief officer', '2nd officer', '3rd officer', 'bosun', 'deck/engineer', 'mate', 'lead deckhand', 'deckhand', 'deck/steward(ess)', 'deck/carpenter', 'deck/divemaster'
  ].some(role => lowerTitle.includes(role))) return 'deckdepartment';

  if ([
    'chief engineer', '2nd engineer', '3rd engineer', 'solo engineer', 'engineer', 'electrician'
  ].some(role => lowerTitle.includes(role))) return 'enginedepartment';

  if ([
    'chef', 'head chef', 'sous chef', 'solo chef', 'cook', 'cook/crew chef', 'cook/steward(ess)', 'deck/cook'
  ].some(role => lowerTitle.includes(role))) return 'galleydepartment';
  if ([
    'chief steward(ess)', '2nd steward(ess)', '2nd stewardess', '3rd steward(ess)', '3rd stewardess',
    '4th steward(ess)', '4th stewardess', 'steward(ess)', 'stewardess', 'steward', 'solo steward(ess)',
    'junior steward(ess)', 'stew/deck', 'laundry/steward(ess)', 'stew/masseur',
    'masseur', 'hairdresser', 'barber', 'butler', 'housekeeper', 'cook/stew/deck'
  ].some(role => lowerTitle.includes(role))) return 'interiordepartment';

  if (lowerTitle.includes('shore') || lowerTitle.includes('shore-based') || lowerTitle.includes('shorebased')) return 'shorebased';

  if (lowerTitle.includes('nanny')) return 'nanny';
  if (lowerTitle.includes('nurse')) return 'nurse';
  if (lowerTitle.includes('dayworker')) return 'dayworker';

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
  offersLoading = false,
  currentUser,
  filters,
  setFilters,
  setShowFilters,
  toggleMultiSelect,
  toggleRegionCountries,
  regionOrder,
  countriesByRegion,
  showFilters,
  preferences,
  setPreferences,
  openPanel,
  setOpenPanel,
}) {
  const location = useLocation();
  const navigate = useNavigate();

const isPrefsOpen = openPanel === 'prefs';

const filtersRef = useRef(null);
const prefsRef   = useRef(null);

useEffect(() => {
  const handleClickOutside = (e) => {

    if (e.target.closest('.filter-toggle, .prefs-toggle, .navbar-toggle')) return;

    const clickedInsideFilters = filtersRef.current?.contains(e.target);
    const clickedInsidePrefs   = prefsRef.current?.contains(e.target);

    if (!clickedInsideFilters && !clickedInsidePrefs) {
      setOpenPanel(null);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  document.addEventListener('touchstart', handleClickOutside);

  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
    document.removeEventListener('touchstart', handleClickOutside);
  };
}, [setOpenPanel]);

const safePrefs = {
  positions: [],
  terms: [],
  countries: [],
  minSalary: '',
  selectedRegion: null,
  flag: '',
  ...(preferences || {}),
};

const prefsDisabled = !currentUser;

const hasCompletePrefs = Boolean(
  (safePrefs.positions?.length > 0) &&
  (safePrefs.terms?.length > 0) &&
  (
    (typeof safePrefs.selectedRegion === 'string' && safePrefs.selectedRegion.length > 0) ||
    (safePrefs.countries?.length > 0)
  ) &&
  (safePrefs.minSalary !== '' && safePrefs.minSalary !== null && safePrefs.minSalary !== undefined) &&
  (typeof safePrefs.flag === 'string' && safePrefs.flag.length > 0) &&
  !prefsDisabled
);

const [authors, setAuthors] = useState({});
const [authorAvatars, setAuthorAvatars] = useState({});
const [expandedOfferId, setExpandedOfferId] = useState(null);
const [showChatIntro, setShowChatIntro] = useState(false);
const [showChatLoginInfo, setShowChatLoginInfo] = useState(false);
const [chatIntroSeen, setChatIntroSeen] = useState(false);
const [pendingChat, setPendingChat] = useState(null);
  const [openJobId, setOpenJobId] = useState(null);
  const [openHandled, setOpenHandled] = useState(false);
  const [chatOfferFromQuery, setChatOfferFromQuery] = useState(null);
  const [chatUserFromQuery, setChatUserFromQuery] = useState(null);
  const [chatQueryHandled, setChatQueryHandled] = useState(false);
const [showDirectApplyModal, setShowDirectApplyModal] = useState(false);
const [directApplyModalType, setDirectApplyModalType] = useState(null);
const [directApplicationReady, setDirectApplicationReady] = useState(false);
const [activeChat, setActiveChat] = useState(null);
const [expandedWeeks, setExpandedWeeks] = useState({});
const [expandedDays, setExpandedDays] = useState({});
const [copiedField, setCopiedField] = useState(null);
const [prefsLoaded, setPrefsLoaded] = useState(false);
const cardRefs = useRef({});
const chatIntroTimerRef = useRef(null);
const chatIntroScheduledRef = useRef(false);
  const collapseTargetRef = useRef(null);
  const CHAT_INTRO_KEY = 'seajobs_private_chat_intro_seen';
  const CHAT_INTRO_DELAY_MS = 5000;

const getScrollOffset = () => {
  const nav = document.querySelector('.navbar-container');
  const navHeight = nav ? nav.getBoundingClientRect().height : 0;
  const base = 8;
  return navHeight + base;
};

useEffect(() => {
  if (!expandedOfferId) return;
  const el = cardRefs.current[expandedOfferId];
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - getScrollOffset();
  window.scrollTo({ top, behavior: 'smooth' });
}, [expandedOfferId]);

useEffect(() => {
  if (expandedOfferId) return;
  const id = collapseTargetRef.current;
  if (!id) return;
  collapseTargetRef.current = null;
  const el = cardRefs.current[id] || document.getElementById(`offer-${id}`);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - getScrollOffset();
  window.scrollTo({ top, behavior: 'smooth' });
}, [expandedOfferId]);

useEffect(() => {
  try {
    const seen = localStorage.getItem(CHAT_INTRO_KEY);
    setChatIntroSeen(!!seen);
  } catch {}
}, []);

useEffect(() => {
  if (!expandedOfferId) return;
  if (chatIntroSeen || showChatIntro || chatIntroScheduledRef.current) return;
  chatIntroScheduledRef.current = true;
  chatIntroTimerRef.current = setTimeout(() => {
    chatIntroScheduledRef.current = false;
    setShowChatIntro(true);
  }, CHAT_INTRO_DELAY_MS);
}, [expandedOfferId, chatIntroSeen, showChatIntro]);

useEffect(() => {
  return () => {
    if (chatIntroTimerRef.current) {
      clearTimeout(chatIntroTimerRef.current);
      chatIntroTimerRef.current = null;
    }
  };
}, []);

useEffect(() => {
  const params = new URLSearchParams(location.search);
  const q = params.get('open');
  if (q) {
    setOpenJobId(q);
    setOpenHandled(false);
  } else {
    setOpenJobId(null);
  }
}, [location.search, chatOfferFromQuery, chatUserFromQuery]);

useEffect(() => {
  const params = new URLSearchParams(location.search);
  const chatOfferParam = params.get('chatOffer');
  const chatUserParam = params.get('chatUser');
  if (chatOfferParam && chatUserParam) {
    setChatOfferFromQuery(chatOfferParam);
    setChatUserFromQuery(chatUserParam);
    setChatQueryHandled(false);
    return;
  }

  if (chatOfferFromQuery || chatUserFromQuery) {
    setChatOfferFromQuery(null);
    setChatUserFromQuery(null);
    setChatQueryHandled(false);
  }
}, [location.search, chatOfferFromQuery, chatUserFromQuery]);

useEffect(() => {
  if (!openJobId || openHandled || !offers?.length) return;

  const target = offers.find((o) => String(o.id) === String(openJobId));
  if (!target) return;

  const weekMonday = getMonday(new Date(target.created_at)).toDateString();
  const thisMonday = getMonday(new Date()).toDateString();
  const lastMonday = getMonday(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).toDateString();

  const weekGroup =
    weekMonday === thisMonday
      ? 'This week'
      : weekMonday === lastMonday
      ? 'Last week'
      : new Date(weekMonday).toLocaleDateString('en-US', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });

  const dayGroup = new Date(target.created_at).toLocaleDateString('en-US', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  setExpandedWeeks((prev) => ({ ...prev, [weekGroup]: true }));
  setExpandedDays((prev) => ({ ...prev, [dayGroup]: true }));
  setExpandedOfferId(target.id);

  setTimeout(() => {
    const el = cardRefs.current[target.id] || document.getElementById(`offer-${target.id}`);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - getScrollOffset();
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, 50);

  setOpenHandled(true);
}, [openJobId, openHandled, offers]);

useEffect(() => {
  if (!chatOfferFromQuery || !chatUserFromQuery || chatQueryHandled || !offers?.length || !currentUser?.id) return;
  const offer = offers.find((o) => String(o.id) === String(chatOfferFromQuery));
  if (!offer) return;
  const isParticipant =
    currentUser.id === offer.user_id || currentUser.id === chatUserFromQuery;
  if (!isParticipant) return;
  setActiveChat({ offerId: chatOfferFromQuery, receiverId: chatUserFromQuery });
  setChatQueryHandled(true);
}, [chatOfferFromQuery, chatUserFromQuery, chatQueryHandled, offers, currentUser?.id, setActiveChat]);

useEffect(() => {
  let cancelled = false;
  if (!currentUser?.id) {
    setDirectApplicationReady(false);
    return () => {
      cancelled = true;
    };
  }

  const fetchShareReady = async () => {
    try {
      const { data } = await supabase
        .from('public_profiles')
        .select('share_ready')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (cancelled) return;
      setDirectApplicationReady(Boolean(data?.share_ready));
    } catch (e) {
      if (!cancelled) setDirectApplicationReady(false);
    }
  };

  fetchShareReady();
  return () => {
    cancelled = true;
  };
}, [currentUser?.id]);

const RANKS = [
  "Captain", "Captain/Engineer", "Skipper", "Chase Boat Captain", "Relief Captain",
  "Chief Officer", "2nd Officer", "3rd Officer", "Bosun", "Deck/Engineer", "Mate",
  "Lead Deckhand", "Deckhand", "Deck/Steward(ess)", "Deck/Carpenter", "Deck/Divemaster", "Deck/Cook",
  "Dayworker", "Chief Engineer", "2nd Engineer", "3rd Engineer", "Solo Engineer", "Electrician", "Chef",
  "Head Chef", "Sous Chef", "Solo Chef", "Cook/Crew Chef", "Crew Chef/Stew", "Steward(ess)", "Chief Steward(ess)", "2nd Steward(ess)",
  "3rd Steward(ess)", "4th Steward(ess)", "Solo Steward(ess)", "Junior Steward(ess)", "Housekeeper", "Head of Housekeeping", "Cook/Stew/Deck", "Cook/Steward(ess)", "Stew/Deck",
  "Laundry/Steward(ess)", "Stew/Masseur", "Masseur", "Hairdresser/Barber", "Nanny", "Videographer", "Yoga/Pilates Instructor",
  "Personal Trainer", "Dive Instrutor", "Water Sport Instrutor", "Nurse", "Other"
];

const TERMS = ['Rotational', 'Permanent', 'Temporary', 'Seasonal', 'Relief', 'Delivery', 'Crossing', 'DayWork'];

const togglePrefMulti = (key, value) => {
  setPreferences(prev => {
    const arr = prev[key] || [];
    const exists = arr.includes(value);
    if (exists) {
      return { ...prev, [key]: arr.filter(v => v !== value) };
    }
    if (arr.length >= 3) {

      return prev;
    }
    return { ...prev, [key]: [...arr, value] };
  });
};

const setPrefMinSalary = (val) => {
  setPreferences(prev => ({ ...prev, minSalary: val }));
};

const clearPreferences = () => {
  setPreferences({
    positions: [],
    terms: [],
    countries: [],
    minSalary: '',
    selectedRegion: null,
    flag: '',
  });
};

const handleToggleRegion = (region) => {
  const isActive = safePrefs.selectedRegion === region;
  if (isActive) {

    setPreferences(prev => ({ ...prev, selectedRegion: null, countries: [] }));
  } else {
    const list = countriesByRegion[region] || [];
    setPreferences(prev => ({ ...prev, selectedRegion: region, countries: list }));
  }
};

const toggleCountryPreference = (country) => {
  if (safePrefs.selectedRegion) return;
  setPreferences(prev => {
    const arr = prev.countries || [];
    const exists = arr.includes(country);
    if (exists) return { ...prev, countries: arr.filter(c => c !== country) };
    if (arr.length >= 3) return prev;
    return { ...prev, countries: [...arr, country] };
  });
};

const PREF_LS_KEY = currentUser?.id ? `job_prefs_user_${currentUser.id}` : null;
const hasLoadedPrefsRef = useRef(false);

const prefsHaveData = (p) =>
  (p?.positions?.length || 0) > 0 ||
  (p?.terms?.length || 0) > 0 ||
  (p?.countries?.length || 0) > 0 ||
  (typeof p?.selectedRegion === 'string' && p.selectedRegion.length > 0) ||
  (p?.minSalary !== '' && p?.minSalary != null) ||
  (typeof p?.flag === 'string' && p.flag.length > 0);

useEffect(() => {
  hasLoadedPrefsRef.current = false;
  const load = async () => {
    if (!currentUser?.id) {
      setPrefsLoaded(true);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('job_preferences')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (!error && data && data.job_preferences) {
        setPreferences(prev => ({ ...prev, ...data.job_preferences }));
        try { if (PREF_LS_KEY) localStorage.setItem(PREF_LS_KEY, JSON.stringify(data.job_preferences)); } catch {}
        hasLoadedPrefsRef.current = true;
      } else {
        let usedLocal = false;
        if (PREF_LS_KEY) {
          const raw = localStorage.getItem(PREF_LS_KEY);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              setPreferences(prev => ({ ...prev, ...parsed }));
              usedLocal = true;
              hasLoadedPrefsRef.current = true;
            } catch (_) {}
          }
        }
        if (usedLocal && PREF_LS_KEY) {
          const toSave = JSON.parse(localStorage.getItem(PREF_LS_KEY) || '{}');
          await supabase.from('settings').upsert(
            { user_id: currentUser.id, job_preferences: toSave, updated_at: new Date().toISOString() },
            { onConflict: 'user_id' }
          );
        }
      }
    } catch (e) {
      if (PREF_LS_KEY) {
        const raw = localStorage.getItem(PREF_LS_KEY);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            setPreferences(prev => ({ ...prev, ...parsed }));
            hasLoadedPrefsRef.current = true;
          } catch (_) {}
        }
      }
    } finally {
      setPrefsLoaded(true);
    }
  };

  load();
}, [currentUser?.id, PREF_LS_KEY, setPreferences]);

useEffect(() => {
  if (!currentUser?.id) return;
  if (!prefsLoaded) return;
  if (!hasLoadedPrefsRef.current && !prefsHaveData(preferences)) return;

  const t = setTimeout(async () => {
    if (PREF_LS_KEY) {
      try { localStorage.setItem(PREF_LS_KEY, JSON.stringify(preferences)); } catch {}
    }

    try {
      const { data, error } = await supabase
        .from('settings')
        .update({
          job_preferences: preferences,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', currentUser.id)
        .select('user_id');

      if (error) throw error;

      if (!data || data.length === 0) {
        await supabase.from('settings').insert({
          user_id: currentUser.id,
          job_preferences: preferences,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error('Persist prefs failed:', e);
    }
  }, 300);

  return () => clearTimeout(t);
}, [preferences, currentUser?.id, prefsLoaded, PREF_LS_KEY]);

const handleCopy = (text, field) => {
  navigator.clipboard.writeText(text);
  setCopiedField(field);
  setTimeout(() => setCopiedField(null), 1500);
};

  const getShareUrl = (offerId) =>
    `${window.location.origin}/api/job-og?offer=${encodeURIComponent(offerId)}`;

  const getShareData = (offer) => {
    const title = offer?.title || 'SeaJobs';
    const locationText = [offer?.city, offer?.country].filter(Boolean).join(' - ');
    return {
      title,
      text: `${title}${locationText ? ' · ' + locationText : ''}`,
      url: getShareUrl(offer.id),
    };
  };

  const handleCopyLink = async (offerId) => {
    const shareUrl = getShareUrl(offerId);
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied!');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = shareUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      alert('Link copied!');
    }
  };

  const handleWhatsApp = (offer) => {
    const data = getShareData(offer);
    const msg = `SeaJobs: ${data.text}\n${data.url}`;
    const wa = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(wa, '_blank', 'noopener,noreferrer');
  };

  const handleShare = async (offer, e) => {
    e.stopPropagation();
    const data = getShareData(offer);
    if (isInNativeApp()) {
      postShareToNative(data);
      return;
    }
    if (navigator.share) {
      try {
        await navigator.share(data);
      } catch (err) {
        if (err && err.name !== 'AbortError') {
          console.error('Share failed', err);
        }
      }
    }
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
      setMarkedOffers([]);
    }
  }, [currentUser]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          setMarkedOffers([]);
        }
      }
    );

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

const isMobile = window.innerWidth <= 768;
  
const [showAvatarMobile, setShowAvatarMobile] = useState(false);
useEffect(() => {
  if (!isMobile) return;
  const duration = showAvatarMobile ? 3000 : 5000;
  const id = setTimeout(() => setShowAvatarMobile(v => !v), duration);
  return () => clearTimeout(id);
}, [isMobile, showAvatarMobile]);

  const supportsWebShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const showNativeShare = supportsWebShare || isInNativeApp();
  const iconBarStyle = { display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 };
  const roundBtn = {
    width: 44, height: 44, borderRadius: '9999px', border: '1px solid rgba(0,0,0,0.1)',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    background: '#fff', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,.06)'
  };
  const waBtn = { ...roundBtn, background: '#25D366', border: 'none' };
  const iconImg = { width: 22, height: 22, display: 'block' };
  const shareIcon = { fontSize: 22, color: '#111' };

  const handleStartChat = (offerId, employerId) => {
    setActiveChat({ offerId, receiverId: employerId });
  };

  const handleRequestChat = (offerId, employerId) => {
    if (!chatIntroSeen) {
      if (chatIntroTimerRef.current) {
        clearTimeout(chatIntroTimerRef.current);
        chatIntroTimerRef.current = null;
      }
      chatIntroScheduledRef.current = false;
      setPendingChat({ offerId, receiverId: employerId });
      setShowChatIntro(true);
      return;
    }
    handleStartChat(offerId, employerId);
  };

  const handleShowChatLoginInfo = () => {
    setShowChatIntro(false);
    setShowChatLoginInfo(true);
  };

  const handleCloseChatLoginInfo = () => {
    setShowChatLoginInfo(false);
  };

  const handleCloseChatIntro = () => {
    try {
      localStorage.setItem(CHAT_INTRO_KEY, '1');
    } catch {}
    setChatIntroSeen(true);
    setShowChatIntro(false);
    if (chatIntroTimerRef.current) {
      clearTimeout(chatIntroTimerRef.current);
      chatIntroTimerRef.current = null;
    }
    chatIntroScheduledRef.current = false;
    if (pendingChat) {
      const next = pendingChat;
      setPendingChat(null);
      handleStartChat(next.offerId, next.receiverId);
    }
  };

  const handleDirectApply = () => {
    const allowed = currentUser && directApplicationReady;
    setDirectApplyModalType(allowed ? 'success' : 'profile_required');
    setShowDirectApplyModal(true);
  };

  const handleCloseDirectApply = () => {
    setShowDirectApplyModal(false);
    setDirectApplyModalType(null);
  };

  const handleGoToCandidateProfile = () => {
    setShowDirectApplyModal(false);
    setDirectApplyModalType(null);
    navigate('/profile?tab=cv');
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
        .select('id, nickname, avatar_url')
        .in('id', userIds);

      if (error) {
        console.error('Error al obtener usuarios:', error);
      } else {
        const map = {};
        const avatarMap = {};
        data.forEach((u) => {
          map[u.id] = u.nickname;
          avatarMap[u.id] = u.avatar_url || null;
        });
        setAuthors(map);
        setAuthorAvatars(avatarMap);
      }
    };

    if (offers.length) fetchAuthors();
  }, [offers]);

  const getMonday = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
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
  if (!offers.length) {
    setExpandedWeeks({});
    setExpandedDays({});
    return;
  }

  const hasFilters =
    filters.rank ||
    filters.city ||
    filters.minSalary ||
    filters.team ||
    filters.yachtType ||
    filters.yachtSize ||
    filters.use ||
    (filters.country && filters.country.length > 0) ||
    (filters.languages && filters.languages.length > 0) ||
    (filters.terms && filters.terms.length > 0) ||
    filters.selectedOnly;

  if (hasFilters) {
    const newExpandedWeeks = {};
    const newExpandedDays = {};

    for (const [weekName, days] of Object.entries(groupedOffers)) {
      newExpandedWeeks[weekName] = true;
      for (const dayKey of Object.keys(days)) {
        newExpandedDays[dayKey] = true;
      }
    }

    setExpandedWeeks(newExpandedWeeks);
    setExpandedDays(newExpandedDays);
  } else {
    const dayToWeekMap = {};

    for (const [weekName, days] of Object.entries(groupedOffers)) {
      for (const dayKey of Object.keys(days)) {
        dayToWeekMap[dayKey] = weekName;
      }
    }

    const allDays = Object.keys(dayToWeekMap);
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 6);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    const newExpandedWeeks = {};
    const newExpandedDays = {};

    for (const dayKey of allDays) {
      const dayDate = new Date(dayKey);
      if (Number.isNaN(dayDate.getTime())) continue;
      if (dayDate >= start && dayDate <= end) {
        const weekName = dayToWeekMap[dayKey];
        newExpandedWeeks[weekName] = true;
        newExpandedDays[dayKey] = true;
      }
    }

    if (Object.keys(newExpandedDays).length > 0) {
      setExpandedWeeks(newExpandedWeeks);
      setExpandedDays(newExpandedDays);
    } else if (allDays.length > 0) {
      const sortedDays = allDays.sort((a, b) => new Date(b) - new Date(a));
      const mostRecentDay = sortedDays[0];
      const correspondingWeek = dayToWeekMap[mostRecentDay];

      setExpandedWeeks({ [correspondingWeek]: true });
      setExpandedDays({ [mostRecentDay]: true });
    }
  }
}, [offers, groupedOffers, filters]);


  const toggleExpanded = (id) => {
    setExpandedOfferId((prev) => {
      if (prev === id) {
        collapseTargetRef.current = id;
        return null;
      }
      return id;
    });
  };

  return (
    <div>

      {showFilters && (
        <div ref={filtersRef} className={`filter-body expanded`}>
          <div className="filters-container filters-panel show" style={{ marginBottom: '20px' }}>
  <h3 style={{ gridColumn: '1 / -1' }}>Job Filters</h3>

  {/* Team */}
  <select
    className="category-select"
    value={filters.team}
    onChange={(e) => setFilters({ ...filters, team: e.target.value })}
  >
    <option value="">¿Team?</option>
    <option value="Yes">Yes</option>
    <option value="No">No</option>
  </select>

  {/* Position */}
  <input
    type="text"
    className="search-input"
    placeholder="Position"
    value={filters.rank}
    onChange={(e) => setFilters({ ...filters, rank: e.target.value })}
  />

  {/* Department */}
  <select
    className="category-select"
    value={filters.department}
    onChange={(e) => setFilters({ ...filters, department: e.target.value })}
  >
    <option value="">Department</option>
    <option value="Deck">Deck</option>
    <option value="Engine">Engine</option>
    <option value="Interior">Interior</option>
    <option value="Galley">Galley</option>
    <option value="Shore-based">Shore-based</option>
    <option value="Others">Others</option>
  </select>

  {/* Yacht Type */}
  <select
    className="category-select"
    value={filters.yachtType}
    onChange={(e) => setFilters({ ...filters, yachtType: e.target.value })}
  >
    <option value="">Yacht Type</option>
    <option value="Motor Yacht">Motor Yacht</option>
    <option value="Sailing Yacht">Sailing Yacht</option>
    <option value="Chase Boat">Chase Boat</option>
    <option value="Sailing Catamaran">Sailing Catamaran</option>
    <option value="Motor Catamaran">Motor Catamaran</option>
    <option value="Support Yacht">Support Yacht</option>
    <option value="Expedition Yacht">Expedition Yacht</option>
  </select>

  {/* Size */}
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
    <option value="71 - 100m">71 - 100m</option>
    <option value=">100m">>100m</option>
  </select>

  {/* Use */}
  <select
    className="category-select"
    value={filters.use}
    onChange={(e) => setFilters({ ...filters, use: e.target.value })}
  >
    <option value="">Use</option>
    <option value="Private">Private</option>
    <option value="Charter (only)">Charter (only)</option>
    <option value="Private/Charter">Private/Charter</option>
  </select>

  {/* Flag */}
  <select
    className="category-select"
    value={filters.flag}
    onChange={(e) => setFilters({ ...filters, flag: e.target.value })}
  >
    <option value="">Flag</option>
    <option value="Foreign Flag">Foreign Flag</option>
    <option value="United States">United States</option>
  </select>

  {/* Salary From */}
  <input
    type="number"
    className="search-input"
    placeholder="Salary From"
    value={filters.minSalary}
    onChange={(e) => setFilters({ ...filters, minSalary: e.target.value })}
  />

  {/* City */}
  <input
    type="text"
    className="search-input"
    placeholder="City"
    value={filters.city}
    onChange={(e) => setFilters({ ...filters, city: e.target.value })}
  />

  {/* Country (full width) */}
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

  {/* Terms (full width) */}
  <details style={{ gridColumn: '1 / -1' }}>
    <summary style={{ fontWeight: 'bold', cursor: 'pointer' }}>Terms</summary>
    <div style={{ marginTop: '8px' }}>
      {['Rotational', 'Permanent', 'Temporary', 'Seasonal', 'Relief', 'Delivery', 'Crossing', 'DayWork'].map((term) => (
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

  {/* Languages (full width) */}
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

  {/* Only Selected (full width) */}
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
    <span><strong>Only highlighted</strong></span>
  </label>

  {/* Clear Filters (full width) */}
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

{/* ======================= Job Preferences (controlado por openPanel) ======================= */}
{(
  <>
    {/* Toggle SOLO para mobile. En desktop el título vive en YachtWorksPage */}


    {isPrefsOpen && (
      <div ref={prefsRef} className={`filter-body expanded`}>
        <div className="filters-container filters-panel show" style={{ marginBottom: '20px' }}>
          <h3 style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8 }}>
            Job Preferences
            <span style={{
              fontSize: 12,
              padding: '2px 8px',
              borderRadius: 999,
              background: prefsDisabled ? '#f5f5f5' : hasCompletePrefs ? '#e6ffed' : '#fff5f5',
              color: prefsDisabled ? '#666' : hasCompletePrefs ? '#067d3f' : '#a40000',
              border: `1px solid ${prefsDisabled ? '#ddd' : hasCompletePrefs ? '#a9e6bc' : '#f0b3b3'}`
            }}>
              {prefsDisabled ? 'Sign in to use' : hasCompletePrefs ? 'Ready' : 'Complete all fields'}
            </span>
          </h3>
          {prefsDisabled && (
            <p style={{ gridColumn: '1 / -1', marginTop: -2, color: '#666' }}>
              Sign in to enable and save your preferences.
            </p>
          )}

          {/* Positions (max 3) */}
          <details style={{ gridColumn: '1 / -1' }}>
            <summary style={{ fontWeight: 'bold', cursor: 'pointer' }}>
              Preferred Positions
            </summary>
            <div className="prefs-scroll positions-grid" style={{ marginTop: '8px' }}>
              {RANKS.map((rank) => {
                const selected = safePrefs.positions.includes(rank);
                const atCap = !selected && safePrefs.positions.length >= 3;
                return (
                  <label
                    key={rank}
                    className="filter-checkbox-label prefs-item"
                    style={{ opacity: atCap ? 0.55 : 1 }}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => togglePrefMulti('positions', rank)}
                      disabled={prefsDisabled || atCap}
                    />
                    {rank}
                  </label>
                );
              })}
            </div>
          </details>

          {/* Terms (max 3) */}
          <details style={{ gridColumn: '1 / -1' }}>
            <summary style={{ fontWeight: 'bold', cursor: 'pointer' }}>
              Preferred Terms
            </summary>
            <div style={{ marginTop: '8px' }}>
              {TERMS.map((term) => {
                const selected = safePrefs.terms.includes(term);
                const atCap = !selected && safePrefs.terms.length >= 3;
                return (
                  <label key={term} className="filter-checkbox-label" style={{ opacity: atCap ? 0.55 : 1 }}>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => togglePrefMulti('terms', term)}
                      disabled={prefsDisabled || atCap}
                    />
                    {term}
                  </label>
                );
              })}
            </div>
          </details>

          {/* Countries (max 3) */}
          <details style={{ gridColumn: '1 / -1' }}>
            <summary style={{ fontWeight: 'bold', cursor: 'pointer' }}>
              Preferred Countries or Region
            </summary>

            <div style={{ marginTop: '8px', maxHeight: '300px', overflowY: 'auto' }}>
              {regionOrder.map((region) => {
                const list = countriesByRegion[region] || [];
                const regionActive = safePrefs.selectedRegion === region;
                const anyRegionActive = !!safePrefs.selectedRegion;

                return (
                  <details key={region} style={{ marginBottom: '12px', opacity: anyRegionActive && !regionActive ? 0.6 : 1 }}>
                    <summary
                      style={{ cursor: 'pointer', fontWeight: 'bold', userSelect: 'none' }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="checkbox"
                          checked={regionActive}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => handleToggleRegion(region)}
                          disabled={prefsDisabled}
                        />
                        {region}
                      </span>
                    </summary>

                    <div style={{ marginLeft: '20px', marginTop: '8px' }}>
                      {list.map((country) => {
                        const selected = safePrefs.countries.includes(country);
                        const atCap = !selected && safePrefs.countries.length >= 3 && !anyRegionActive;

                        return (
                          <label
                            key={country}
                            className="filter-checkbox-label"
                            style={{ opacity: (anyRegionActive || atCap) ? 0.55 : 1 }}
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleCountryPreference(country)}
                              disabled={prefsDisabled || anyRegionActive || atCap}
                            />
                            {country}
                          </label>
                        );
                      })}
                    </div>
                  </details>
                );
              })}
            </div>
          </details>

          {/* Flag */}
          <select
            className="category-select"
            value={safePrefs.flag}
            onChange={(e) => setPreferences(prev => ({ ...prev, flag: e.target.value }))}
            disabled={prefsDisabled}
          >
            <option value="">Preferred Flag</option>
            <option value="Foreign Flag">Foreign Flag</option>
            <option value="United States">United States</option>
          </select>

          {/* Minimum Salary */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="filter-checkbox-label" style={{ justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 'bold' }}>Minimum Salary</span>
              <input
                type="number"
                className="search-input"
                placeholder="e.g. 3000"
                value={safePrefs.minSalary || ''}
                onChange={(e) => setPrefMinSalary(e.target.value)}
                style={{ maxWidth: 200 }}
                disabled={prefsDisabled}
              />
            </label>
          </div>

          {/* Clear Preferences */}
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
            onClick={clearPreferences}
            disabled={prefsDisabled}
          >
            Clear Preferences
          </button>
        </div>
      </div>
    )}
  </>
)}
{/* =================== /Job Preferences =================== */}

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
                    const primaryScore = Number(String(offer.match_primary_score).replace('%','')) || 0;
                    const teammateScore = Number(String(offer.match_teammate_score).replace('%','')) || 0;
                    const normalizedRequiredDocs = (() => {
                      const raw = offer.required_documents;
                      const docs = Array.isArray(raw)
                        ? raw
                        : typeof raw === 'string'
                          ? raw.split(',').map((doc) => doc.trim()).filter(Boolean)
                          : [];
                      const engineLic = Array.isArray(offer.required_engineering_licenses)
                        ? offer.required_engineering_licenses[0]
                        : null;
                      return [
                        ...(engineLic ? [engineLic] : []),
                        ...docs,
                      ];
                    })();
                    const remarkParagraphs = (() => {
                      const description = offer.description || '';
                      return description
                        .split(/\n{2,}/)
                        .map((paragraph) => paragraph.trim())
                        .filter(Boolean);
                    })();
                    return (
                      <div
                        key={offer.id}
                        id={`offer-${offer.id}`}
                        ref={(el) => { if (el) cardRefs.current[offer.id] = el; }}
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
} ${offer.teammate_rank && (offer.teammate_experience === null || offer.teammate_experience === undefined) ? 'no-rank2' : ''} ${Array.isArray(offer.required_licenses) && offer.required_licenses.length > 0 ? 'has-license' : ''} ${(offer.years_in_rank !== null && offer.years_in_rank !== undefined) ? 'has-time-in-rank' : ''}`}>
  <div className="field-pair">
    {offer.title && (
      <div className="field-group position">
        <div className="field-label">Position</div>
        <div className="field-value">{offer.title}</div>
      </div>
    )}

    {Array.isArray(offer.required_licenses) && offer.required_licenses.length > 0 && (
      <div className="field-group license">
        <div className="field-label">License</div>
        <div className="field-value">{offer.required_licenses[0]}</div>
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
        <div className="field-value">{formatSalary(offer)}</div>
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
      {formatSalaryValue(offer.salary_currency, offer.teammate_salary, offer.is_tips)}
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
      {formatSalaryValue(offer.salary_currency, offer.teammate_salary, offer.is_tips)}
    </div>
  </div>
)}

    {offer.type && (
      <div className="field-group terms">
        <div className="field-label">Terms</div>
        <div className="field-value">{offer.type}</div>
      </div>
    )}
    {/* Sex (al final del bloque 1) */}
{!offer.team && offer.gender && (
  <div className="field-group gender">
    <div className="field-label">Sex</div>
    <div className="field-value">{offer.gender}</div>
  </div>
)}
  </div>
</div>


      {(offer.yacht_type ||
  (offer.yacht_size && offer.work_environment !== 'Shore-based') ||
  offer.propulsion_type ||
  offer.flag ||
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

    {offer.propulsion_type &&
  offer.work_environment !== 'Shore-based' &&
  ['captain', 'relief captain', 'skipper', 'captain/engineer'].some(t =>
    (offer.title || '').toLowerCase().includes(t)
  ) && (
    <div className="field-group propulsion">
      <div className="field-label">Propulsion</div>
      <div className="field-value">{offer.propulsion_type}</div>
    </div>
)}

    {offer.flag && (
      <div className="field-group">
        <div className="field-label">Flag</div>
        <div className="field-value">{offer.flag}</div>
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

      {/* Visa(s) — al final del bloque 3 */}
      {Array.isArray(offer.visas) && offer.visas.length > 0 && (
        <div className="field-group visas">
          <div className="field-label">Visa(s)</div>
          <div className="field-value">{offer.visas.join(', ')}</div>
        </div>
      )}
    </div>
  </div>
)}

      <div className="expanded-block block4">
  <div className="field-pair">
    {offer.homeport && (
      <div className="field-group">
        <div className="field-label">Homeport</div>
        <div className="field-value">{offer.homeport}</div>
      </div>
    )}
    
    {offer.is_smoke_free_yacht && (
      <div className="field-group">
        <div className="field-label">Smoke-free yacht</div>
        <div className="field-value">Yes</div>
      </div>
    )}

    {offer.is_dry_boat && (
      <div className="field-group">
        <div className="field-label">Dry boat</div>
        <div className="field-value">Yes</div>
      </div>
    )}

    {(offer.is_asap || offer.start_date) && (
      <div className="field-group">
        <div className="field-label">Start Date</div>
        <div className="field-value">
          {offer.is_asap
            ? 'ASAP'
            : offer.is_flexible
              ? 'Flexible'
              : formatDate(offer.start_date, offer.start_date_month_only)}
        </div>
      </div>
    )}

    {offer.end_date && (
      <div className="field-group">
        <div className="field-label">End Date</div>
        <div className="field-value">{formatDate(offer.end_date, offer.end_date_month_only)}</div>
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
        <div className="field-label">Holidays per year</div>
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

    {normalizedRequiredDocs.length > 0 && (
  <div className="expanded-block block6 required-docs-block">
    <div className="field-label">Required Documents / Certifications</div>
    <div className="field-value">
      <div className="required-docs-grid">
        {normalizedRequiredDocs.map((doc, index) => (
          <span key={`${doc}-${index}`} className="required-doc-chip">
            {doc}
          </span>
        ))}
      </div>
    </div>
  </div>
)}

    <div className="expanded-block block6">
      <div className="field-label">Remarks</div>
      <div className="field-value remarks-content">
        {remarkParagraphs.map((paragraph, index) => (
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
        <p className="remarks-disclaimer">
          {REMARKS_DISCLAIMER}
        </p>
      </div>
    </div>

    <div className="expanded-block block7">
  <div className="job-share-bar" style={iconBarStyle} onClick={(e) => e.stopPropagation()}>
    {showNativeShare ? (
      <button
        type="button"
        onClick={(e) => handleShare(offer, e)}
        style={roundBtn}
        aria-label="Share"
        title="Share"
      >
        <span className="material-icons" style={shareIcon}>ios_share</span>
      </button>
    ) : (
      <>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleWhatsApp(offer); }}
          style={waBtn}
          aria-label="Share on WhatsApp"
          title="Share on WhatsApp"
        >
          <img src="/icons/whatsapp.svg" alt="" style={iconImg} />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleCopyLink(offer.id); }}
          style={roundBtn}
          aria-label="Copy share link"
          title="Copy link"
        >
          <img src="/icons/link.svg" alt="" style={iconImg} />
        </button>
      </>
    )}
  </div>
  {!isOwner && (
    <div className="chat-actions">
      <button
        className="direct-apply-btn"
        onClick={(e) => {
          e.stopPropagation();
          handleDirectApply();
        }}
        type="button"
      >
        Direct Application
      </button>
      <button
        className="start-chat-btn"
        onClick={(e) => {
          e.stopPropagation();
          if (currentUser) {
            handleRequestChat(offer.id, offer.user_id);
          } else {
            handleShowChatLoginInfo();
          }
        }}
        aria-disabled={!currentUser}
        title={!currentUser ? 'Sign in to start a private chat.' : undefined}
        style={!currentUser ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
      >
        Start Private Chat
      </button>
    </div>
  )}
</div>
  </div>
) : (
<div className={`collapsed-offer${offer.team ? ' team' : ''}`}>
<div className="collapsed-images">
  {isMobile ? (
    offer.team ? (
      showAvatarMobile ? (
        <MatchBorder score={primaryScore}>
          <div className="mobile-team-avatar role-icon">
            <Avatar
              nickname={authors[offer.user_id] || 'User'}
              srcUrl={authorAvatars[offer.user_id] || null}
              size={96}
              shape="square"
              radius={0}
              style={{
              width: '100%',
              height: '100%',
              display: 'block'
            }}
          />
          </div>
        </MatchBorder>
      ) : (
        <>
  <MatchBorder score={primaryScore}>
    <ThemeLogo
      light={`/logos/roles/${offer.work_environment === 'Shore-based' ? 'shorebased' : getRoleImage(offer.title)}.png`}
      dark={`/logos/roles/${offer.work_environment === 'Shore-based' ? 'shorebasedDM' : getRoleImage(offer.title) + 'DM'}.png`}
      alt="role"
      className="role-icon"
    />
  </MatchBorder>

  {offer.team && offer.teammate_rank && (
    <MatchBorder score={teammateScore}>
      <ThemeLogo
        light={`/logos/roles/${getRoleImage(offer.teammate_rank)}.png`}
        dark={`/logos/roles/${getRoleImage(offer.teammate_rank)}DM.png`}
        alt="teammate role"
        className="role-icon"
      />
    </MatchBorder>
  )}
</>
      )
    ) : (
    showAvatarMobile ? (
    <MatchBorder score={primaryScore}>
      <div className="mobile-avatar-slot role-icon">
        <Avatar
          nickname={authors[offer.user_id] || 'User'}
          srcUrl={authorAvatars[offer.user_id] || null}
          size={96}
          shape="square"
          radius={0}
          style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />
      </div>
    </MatchBorder>
      ) : (
        <MatchBorder score={primaryScore}>
      <ThemeLogo
        light={`/logos/roles/${offer.work_environment === 'Shore-based' ? 'shorebased' : getRoleImage(offer.title)}.png`}
        dark={`/logos/roles/${offer.work_environment === 'Shore-based' ? 'shorebasedDM' : getRoleImage(offer.title) + 'DM'}.png`}
        alt="role"
        className="role-icon"
      />
    </MatchBorder>
  )
)
  ) : (
  <>
    <MatchBorder score={primaryScore}>
      <ThemeLogo
        light={`/logos/roles/${offer.work_environment === 'Shore-based' ? 'shorebased' : getRoleImage(offer.title)}.png`}
        dark={`/logos/roles/${offer.work_environment === 'Shore-based' ? 'shorebasedDM' : getRoleImage(offer.title) + 'DM'}.png`}
        alt="role"
        className="role-icon"
      />
    </MatchBorder>

    {offer.team && offer.teammate_rank && (
      <MatchBorder score={teammateScore}>
        <ThemeLogo
          light={`/logos/roles/${getRoleImage(offer.teammate_rank)}.png`}
          dark={`/logos/roles/${getRoleImage(offer.teammate_rank)}DM.png`}
          alt="teammate role"
          className="role-icon"
        />
      </MatchBorder>
    )}

    {!isMobile && (
      <div className="recruiter-tile">
        <div className="recruiter-label">RECRUITER</div>
        <div className="recruiter-avatar-wrap">
          <Avatar
            nickname={authors[offer.user_id] || 'User'}
            srcUrl={authorAvatars[offer.user_id] || null}
            size={96}
            shape="square"
            radius={0}
            style={{
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              borderTopRightRadius: 0,
              borderBottomRightRadius: 12,
              display: 'block'
            }}
          />
        </div>
      </div>
    )}
  </>
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
      {formatSalary(offer)}
    </div>

    {/* Rank 2 */}
    {offer.team && offer.teammate_rank && (
      <div className="rank-fixed">{offer.teammate_rank}</div>
    )}


    {/* Salary 2 */}
    {offer.team && offer.teammate_salary && (
      <div className="salary-line">
        <strong>Salary:</strong>{' '}
        {formatSalaryValue(offer.salary_currency, offer.teammate_salary, offer.is_tips)}
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
          {formatSalary(offer)}
        </div>

        {/* Línea 2: Teammate Salary o espacio vacío */}
        <div className="salary-line">
          {offer.teammate_salary ? (
            <>
              <strong>Salary:</strong>{' '}
              {formatSalaryValue(offer.salary_currency, offer.teammate_salary, offer.is_tips)}
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
          {formatSalary(offer)}
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

      {offersLoading && (
        <p style={{ marginTop: '20px', fontStyle: 'italic' }}>
          Loading offers...
        </p>
      )}
      {!offersLoading && Object.keys(groupedOffers).length === 0 && (
        <p style={{ marginTop: '20px', fontStyle: 'italic' }}>
          No matching offers found.
        </p>
      )}

      {showChatIntro && (
  <Modal onClose={handleCloseChatIntro}>
    <div style={{ maxWidth: 520 }}>
      <h3 style={{ marginTop: 0 }}>🔒 Private Chat – How it works</h3>
      <p>Use Private Chat to contact employers directly and professionally.</p>
      <p>💬 Start a private conversation with the person who posted the job.</p>
      <p>📎 Share your CV, references, and additional information securely.</p>
      <p>🔐 Your communication stays private inside Yacht Daywork — no phone numbers or personal contact details required.</p>
      <p>This is the ideal first step to connect with employers before moving to direct communication if requested.</p>
      <p>👉 Chat safely. Connect professionally.</p>
      <button className="landing-button" onClick={handleCloseChatIntro}>
        Got it
      </button>
    </div>
  </Modal>
)}

      {showChatLoginInfo && (
  <Modal onClose={handleCloseChatLoginInfo}>
    <div style={{ maxWidth: 520 }}>
      <h3 style={{ marginTop: 0 }}>Sign in required</h3>
      <p>Private Chat is available only for registered users. Please sign in to start a private conversation.</p>
      <button className="landing-button" onClick={handleCloseChatLoginInfo}>
        Close
      </button>
    </div>
  </Modal>
)}

      {showDirectApplyModal && (
  <Modal onClose={handleCloseDirectApply}>
    <div style={{ maxWidth: 520 }}>
      {directApplyModalType === 'success' ? (
        <>
          <h3 style={{ marginTop: 0 }}>Application submitted 🚀</h3>
          <p className="direct-apply-instruction">
            Your application has been successfully sent.
          </p>
          <p className="direct-apply-instruction">
            The employer will receive your Candidate Profile and may contact you via Private Chat or using the contact details on your profile.
          </p>
          <p className="direct-apply-instruction">
            Thank you for applying. Please keep an eye on YachtDaywork for any updates or messages from the hiring team ⚓
          </p>
          <button className="landing-button" onClick={handleCloseDirectApply}>
            Close
          </button>
        </>
      ) : (
        <>
          <h3 style={{ marginTop: 0 }}>One more step before applying</h3>
          <p className="direct-apply-instruction">
            Direct Application is only enabled once both your Lite and Professional Candidate Profiles are 100% complete, so employers can instantly review your information.
          </p>
          <img
            src="/images/Digital CV sample.png"
            alt="Digital CV sample"
            style={{ width: '50%', borderRadius: 8, marginTop: 12, display: 'block', marginLeft: 'auto', marginRight: 'auto' }}
          />
          <p className="direct-apply-link">
            📍 You can find it under Profile → Candidate Profile.
          </p>
          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              marginTop: 16,
            }}
          >
            <button className="landing-button" onClick={handleGoToCandidateProfile}>
              Go to Candidate Profile
            </button>
            <button className="landing-button" onClick={handleCloseDirectApply} style={{ backgroundColor: '#ccc' }}>
              Maybe later
            </button>
          </div>
        </>
      )}
    </div>
  </Modal>
)}

      {activeChat && (
  <Modal onClose={() => setActiveChat(null)}>
    <ChatPage
      offerId={activeChat.offerId}
      receiverId={activeChat.receiverId}
      onBack={() => setActiveChat(null)} // ?. ESTO ES LO QUE FALTABA
      onClose={() => setActiveChat(null)}
    />
  </Modal>
)}
       <ScrollToTopButton />
    </div>
  );
}

const formatDate = (dateStr, monthOnly = false) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return String(dateStr);
  const options = monthOnly
    ? { month: 'short', year: 'numeric' }
    : { day: '2-digit', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
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
