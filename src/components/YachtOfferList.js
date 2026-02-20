import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import supabase from '../supabase';
import Modal from './Modal';
import ChatPage from './ChatPage';
import FilterPanel from './FilterPanel';
import PreferencesPanel from './PreferencesPanel';
import OfferTimeline from './OfferTimeline';
import '../styles/YachtOfferList.css';
import ScrollToTopButton from '../components/ScrollToTopButton';
import { isInNativeApp, postShareToNative } from '../utils/nativeShare';
import { toast } from 'react-toastify';

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
const [showMatchPreview, setShowMatchPreview] = useState(false);
const [matchPreviewLoading, setMatchPreviewLoading] = useState(false);
const [matchPreviewScore, setMatchPreviewScore] = useState(null);
const [pendingApplyOfferId, setPendingApplyOfferId] = useState(null);
const [applySubmitting, setApplySubmitting] = useState(false);
const getMatchTone = (score) => {
  if (score == null || Number.isNaN(score)) return { color: '#9ca3af' };
  const pct = Number(score);
  if (pct >= 80) return { color: '#22c55e' };
  if (pct >= 60) return { color: '#84cc16' };
  if (pct >= 40) return { color: '#f59e0b' };
  return { color: '#ef4444' };
};
  const [appliedOfferIds, setAppliedOfferIds] = useState(new Set());
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
  const APPLIED_LS_KEY = currentUser?.id ? `job_applied_offers_${currentUser.id}` : null;

const readAppliedFromStorage = () => {
  if (!APPLIED_LS_KEY) return new Set();
  try {
    const raw = localStorage.getItem(APPLIED_LS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
};

const writeAppliedToStorage = (nextSet) => {
  if (!APPLIED_LS_KEY) return;
  try {
    localStorage.setItem(APPLIED_LS_KEY, JSON.stringify(Array.from(nextSet)));
  } catch {}
};

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

useEffect(() => {
  let cancelled = false;
  if (!currentUser?.id) {
    setAppliedOfferIds(new Set());
    return () => {
      cancelled = true;
    };
  }
  const localApplied = readAppliedFromStorage();
  if (!cancelled && localApplied.size) {
    setAppliedOfferIds(localApplied);
  }
  const fetchApplied = async () => {
    const { data, error } = await supabase
      .from('job_direct_applications')
      .select('offer_id')
      .eq('candidate_user_id', currentUser.id);
    if (cancelled) return;
    if (error) {
      console.warn('Failed to load applied offers', error);
      if (localApplied.size === 0) {
        setAppliedOfferIds(new Set());
      }
      return;
    }
    const ids = new Set((data || []).map((r) => r.offer_id));
    const merged = new Set([...localApplied, ...ids]);
    setAppliedOfferIds(merged);
    writeAppliedToStorage(merged);
  };
  fetchApplied();
  return () => {
    cancelled = true;
  };
}, [currentUser?.id]);


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

const handleStartChat = (offerId, employerId) => {
  if (offerId) {
    supabase
      .from('job_offer_events')
      .insert([{ offer_id: offerId, event_type: 'private_chat', actor_id: currentUser?.id || null }])
      .then(({ error }) => {
        if (error) console.warn('private_chat log error', error);
      });
  }
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

const submitDirectApply = async (offerId) => {
  const allowed = currentUser && directApplicationReady;
  if (!offerId) {
    toast.error('Offer not found. Please refresh and try again.');
    return;
  }
  if (appliedOfferIds.has(offerId)) {
    toast.info('Application already submitted.');
    return;
  }
  if (allowed && offerId) {
    const { error: rpcErr } = await supabase.rpc('rpc_submit_direct_application', {
      p_offer_id: offerId,
    });
    if (rpcErr) {
      console.warn('direct_apply rpc error', rpcErr);
      toast.error('Could not submit application. Please try again.');
      return;
    }

    const { error: logErr } = await supabase
      .from('job_offer_events')
      .insert([{ offer_id: offerId, event_type: 'direct_apply', actor_id: currentUser?.id || null }]);
    if (logErr) {
      console.warn('direct_apply log error', logErr);
    }
    setAppliedOfferIds((prev) => {
      const next = new Set(prev);
      next.add(offerId);
      writeAppliedToStorage(next);
      return next;
    });
  }
  setDirectApplyModalType(allowed ? 'success' : 'profile_required');
  setShowDirectApplyModal(true);
};

const handleDirectApply = async (offerId) => {
  const allowed = currentUser && directApplicationReady;
  if (!offerId) {
    toast.error('Offer not found. Please refresh and try again.');
    return;
  }
  if (appliedOfferIds.has(offerId)) {
    toast.info('Application already submitted.');
    return;
  }
  if (!allowed) {
    setDirectApplyModalType('profile_required');
    setShowDirectApplyModal(true);
    return;
  }

  setPendingApplyOfferId(offerId);
  setMatchPreviewLoading(true);
  setShowMatchPreview(true);
  setMatchPreviewScore(null);
  try {
    const { data, error } = await supabase.rpc('rpc_preview_direct_application_match', {
      p_offer_id: offerId,
    });
    if (error) {
      console.warn('direct_apply preview error', error);
      setMatchPreviewScore(null);
    } else {
      if (!data || (Array.isArray(data) && data.length === 0)) {
        console.warn('direct_apply preview empty result', data);
      }
      const row = Array.isArray(data) ? data[0] : data;
      const score = row?.match_score ?? row?.score ?? row?.match ?? null;
      setMatchPreviewScore(score != null ? Number(score) : null);
    }
  } catch (e) {
    setMatchPreviewScore(null);
  } finally {
    setMatchPreviewLoading(false);
  }
};

  const handleCloseDirectApply = () => {
    setShowDirectApplyModal(false);
    setDirectApplyModalType(null);
  };
  const handleCloseMatchPreview = () => {
    if (applySubmitting) return;
    setShowMatchPreview(false);
    setMatchPreviewLoading(false);
    setPendingApplyOfferId(null);
  };
  const handleProceedAfterPreview = async () => {
    if (!pendingApplyOfferId || applySubmitting) return;
    setApplySubmitting(true);
    await submitDirectApply(pendingApplyOfferId);
    setApplySubmitting(false);
    setShowMatchPreview(false);
    setPendingApplyOfferId(null);
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

  const lastExpandedRef = useRef(null);
  useEffect(() => {
    if (!expandedOfferId || expandedOfferId === lastExpandedRef.current) return;
    lastExpandedRef.current = expandedOfferId;
    supabase
      .from('job_offer_events')
      .insert([{ offer_id: expandedOfferId, event_type: 'view', actor_id: currentUser?.id || null }])
      .then(({ error }) => {
        if (error) console.warn('view log error', error);
      });
  }, [expandedOfferId, currentUser?.id]);

  return (
    <div>

      {showFilters && (
        <FilterPanel
          ref={filtersRef}
          filters={filters}
          setFilters={setFilters}
          toggleMultiSelect={toggleMultiSelect}
          toggleRegionCountries={toggleRegionCountries}
          regionOrder={regionOrder}
          countriesByRegion={countriesByRegion}
        />
      )}

{/* ======================= Job Preferences (controlado por openPanel) ======================= */}
      {isPrefsOpen && (
        <PreferencesPanel
          ref={prefsRef}
          safePrefs={safePrefs}
          prefsDisabled={prefsDisabled}
          hasCompletePrefs={hasCompletePrefs}
          togglePrefMulti={togglePrefMulti}
          setPrefMinSalary={setPrefMinSalary}
          clearPreferences={clearPreferences}
          handleToggleRegion={handleToggleRegion}
          toggleCountryPreference={toggleCountryPreference}
          setPreferences={setPreferences}
          regionOrder={regionOrder}
          countriesByRegion={countriesByRegion}
        />
      )}
{/* =================== /Job Preferences =================== */}

      <OfferTimeline
        groupedOffers={groupedOffers}
        expandedWeeks={expandedWeeks}
        expandedDays={expandedDays}
        toggleWeek={toggleWeek}
        toggleDay={toggleDay}
        expandedOfferId={expandedOfferId}
        toggleExpanded={toggleExpanded}
        cardRefs={cardRefs}
        authors={authors}
        authorAvatars={authorAvatars}
        isMobile={isMobile}
        showAvatarMobile={showAvatarMobile}
        handleCopy={handleCopy}
        copiedField={copiedField}
        markedOffers={markedOffers}
        toggleMark={toggleMark}
        showNativeShare={showNativeShare}
        handleShare={handleShare}
        handleWhatsApp={handleWhatsApp}
        handleCopyLink={handleCopyLink}
        handleDirectApply={handleDirectApply}
        handleRequestChat={handleRequestChat}
        handleShowChatLoginInfo={handleShowChatLoginInfo}
        offersLoading={offersLoading}
        currentUser={currentUser}
        appliedOfferIds={appliedOfferIds}
      />

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

      {showMatchPreview && (
  <Modal onClose={handleCloseMatchPreview}>
    <div style={{ maxWidth: 520 }}>
      <h3 style={{ marginTop: 0 }}>Match score</h3>
      {matchPreviewLoading ? (
        <p className="direct-apply-instruction">Calculating your match…</p>
      ) : (
        <>
          <p className="direct-apply-instruction">
            Your estimated match for this job is{' '}
            <strong>
              <span style={getMatchTone(matchPreviewScore)}>
                {matchPreviewScore == null || Number.isNaN(matchPreviewScore)
                  ? 'N/A'
                  : `${Math.round(matchPreviewScore)}%`}
              </span>
            </strong>.
          </p>
          <p className="direct-apply-instruction">
            If the percentage is not high, the chances of getting the job are low. The ideal is to apply
            to jobs where your match percentage is high.
          </p>
          <p className="direct-apply-instruction">
            Do you still want to proceed with your Direct Application?
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: 16 }}>
            <button className="landing-button" onClick={handleProceedAfterPreview} disabled={applySubmitting}>
              {applySubmitting ? 'Submitting…' : 'Proceed'}
            </button>
            <button
              className="landing-button"
              onClick={handleCloseMatchPreview}
              style={{ backgroundColor: '#ccc' }}
              disabled={applySubmitting}
            >
              Cancel
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

export default YachtOfferList;
