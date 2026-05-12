// src/pages/cv/PublicProfileView.js
import React, { useEffect, useMemo, useState, useCallback, useRef, useLayoutEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import supabase from '../../supabase';
import './PublicProfileView.css';
import { toBlob as htmlToImageBlob } from 'html-to-image';
import PublicCertDocsSection from './sections/certdocs';
import PublicExperienceSection from './sections/experience';
import PublicLanguagesSkillsSection from './sections/langskills';
import PublicLifestyleHabitsSection from './sections/lifestylehabits/PublicLifestyleHabitsSection';
import PublicReferencesSection from './sections/references';
import PublicMediaGallerySection from './sections/media';
import PublicEducationSection from './sections/education';
import PublicContactDetailsSection from './sections/contact';
import PublicCoverLetterSection from './sections/coverletter/PublicCoverLetterSection';
import PublicProfileBusinessCard from './PublicProfileBusinessCard';
import useEmitProfileView from '../../hooks/useEmitProfileView';
import { formatAvailability, hasValidAvailability } from '../../utils/availability';
import { toast } from 'react-toastify';
import {
  allDocFlagsSelected,
  blobToDataUrl,
  calcAge,
  clamp,
  clipRoundRect,
  createPdfBlobFromJpegDataUrl,
  docsMeetMin,
  fmtYM,
  hasDeptSkills,
  hasLanguagesWithLevel,
  inferTypeByName,
  loadImage,
  personalMeetsMin,
  setViewportContent,
  triggerBlobDownload,
} from './publicProfileView.utils';

const qs = (search) => new URLSearchParams(search || '');
const BUCKET = 'cv-docs';

const BASE_A4_WIDTH  = 900;
const BASE_A4_HEIGHT = Math.round(BASE_A4_WIDTH * (297 / 210));
const BASE_BUSINESS_CARD_WIDTH = 520;
const BASE_BUSINESS_CARD_HEIGHT = Math.round(BASE_BUSINESS_CARD_WIDTH * 0.647059);
const INTRO_FIXED_PX = Math.round(BASE_A4_HEIGHT * 0.10) + 14;
const MIN_SCALE = 0.42;
const MAX_SCALE = 1;
const BUSINESS_CARD_EXPORT_WIDTH = 1800;
const BUSINESS_CARD_EXPORT_HEIGHT = Math.round((BUSINESS_CARD_EXPORT_WIDTH * 55) / 85);
const BUSINESS_CARD_THEME_STORAGE_KEY = 'ydw.businessCardTheme';
const UNLIMITED_MEDIA_USER_IDS = new Set([
  'dc3c4ca6-e892-4c25-891f-287f43f9c182',
  '377caa8a-95ee-4959-adad-c9af2eae2171',
]);

function dateRange(aY, aM, bY, bM, isCurrent) {
  const a = fmtYM(aY, aM);
  const b = isCurrent ? 'Present' : fmtYM(bY, bM);
  return a ? (b ? `${a} — ${b}` : a) : '';
}

async function hydrateMediaItem(it) {
  if (!it) return null;
  const normalizeFrameValue = (value, fallback = 50) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(0, Math.min(100, n));
  };
  if (typeof it === 'string') {
    if (/^https?:\/\//i.test(it)) return { url: it, type: inferTypeByName(it), coverPositionX: 50, coverPositionY: 50 };
    return { url: it, type: inferTypeByName(it), coverPositionX: 50, coverPositionY: 50 };
  }
  const base = typeof it === 'object' ? it : {};
  if (base.url && /^https?:\/\//i.test(base.url)) {
    return {
      ...base,
      coverPositionX: normalizeFrameValue(base.coverPositionX, 50),
      coverPositionY: normalizeFrameValue(base.coverPositionY, 50),
    };
  }
  if (base.path && base.path.startsWith(`${BUCKET}/`)) {
    const objectKey = base.path.replace(`${BUCKET}/`, '');
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(objectKey, 3600);
    if (error) return base;
    return {
      ...base,
      url: data?.signedUrl || base.url,
      coverPositionX: normalizeFrameValue(base.coverPositionX, 50),
      coverPositionY: normalizeFrameValue(base.coverPositionY, 50),
    };
  }
  return {
    ...base,
    coverPositionX: normalizeFrameValue(base.coverPositionX, 50),
    coverPositionY: normalizeFrameValue(base.coverPositionY, 50),
  };
}

function formatYachtingExperienceLabel(totalMonths) {
  const m = Number(totalMonths || 0);
  if (!Number.isFinite(m) || m <= 0) return '—';
  if (m < 24) return `${m} month${m === 1 ? '' : 's'}`;
  const years = m / 12;
  return `${(Math.round(years * 10) / 10).toFixed(1)} years`;
}

export default function PublicProfileView() {
  const navigate = useNavigate();
  const { handle } = useParams();
  const { search } = useLocation();
  const isPreview = useMemo(() => qs(search).has('preview'), [search]);
  const isMock = useMemo(() => qs(search).has('mock'), [search]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [references, setReferences] = useState([]);
  const [education, setEducation] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cEmail, setCEmail] = useState('');
  const [cName, setCName] = useState('');
  const [cOrg, setCOrg] = useState('');
  const [cConsent, setCConsent] = useState(false);
  const [cCaptcha, setCCaptcha] = useState('');
  const [contactError, setContactError] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [yachtingMonths, setYachtingMonths] = useState(null);
  const [employmentStatus, setEmploymentStatus] = useState('');
  const [twoUp, setTwoUp] = useState(false);
  const a4Ref = useRef(null);
  const introRef = useRef(null);
  const businessCardRef = useRef(null);
  const businessCardExportRef = useRef(null);
  const businessCardStageRef = useRef(null);
  const [metaTop, setMetaTop] = useState(null);
  const [pageScale, setPageScale] = useState(1);
  const [businessCardScale, setBusinessCardScale] = useState(1);
  const wrapRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const lastWidthRef = useRef(typeof window !== 'undefined' ? window.innerWidth : BASE_A4_WIDTH);
  const hasLockedMetaTopRef = useRef(false);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [cardExportBusy, setCardExportBusy] = useState('');
  const [businessCardTheme, setBusinessCardTheme] = useState('light');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const storedTheme = window.localStorage.getItem(BUSINESS_CARD_THEME_STORAGE_KEY);
      if (storedTheme === 'light' || storedTheme === 'dark') {
        setBusinessCardTheme(storedTheme);
      }
    } catch (_) {
      // Ignore storage read failures and keep the default theme.
    }
  }, [computeScrollTargetTop]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(BUSINESS_CARD_THEME_STORAGE_KEY, businessCardTheme);
    } catch (_) {
      // Ignore storage write failures; the in-memory choice still works.
    }
  }, [businessCardTheme]);

  useEffect(() => {
    if (!downloadMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!businessCardRef.current?.contains(event.target)) {
        setDownloadMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [downloadMenuOpen]);

  useLayoutEffect(() => {
    function measure() {
      const node = businessCardStageRef.current;
      const viewportW = typeof window !== 'undefined' ? window.innerWidth : BASE_BUSINESS_CARD_WIDTH;
      const hostW = node ? node.clientWidth : viewportW;
      const horizontalSafety = 28;
      const safeViewportW = Math.max(220, viewportW - horizontalSafety);
      const safeHostW = Math.max(220, hostW - horizontalSafety);
      const availW = Math.max(220, Math.min(safeViewportW, safeHostW));
      const nextScale = Math.min(1, availW / BASE_BUSINESS_CARD_WIDTH);
      setBusinessCardScale(nextScale);
    }

    measure();

    function onResize() {
      measure();
    }

    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);

    let observer = null;
    if (typeof ResizeObserver !== 'undefined' && businessCardStageRef.current) {
      observer = new ResizeObserver(() => measure());
      observer.observe(businessCardStageRef.current);
    }

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      observer?.disconnect?.();
    };
  }, []);

  useLayoutEffect(() => {
    function measure(widthChanged = true) {
      const container = wrapRef.current;
      const viewportW = typeof window !== 'undefined' ? window.innerWidth : BASE_A4_WIDTH;
      const hostW = container ? container.clientWidth : viewportW;
      const availW = Math.max(320, Math.min(viewportW, hostW));

      let s = availW / BASE_A4_WIDTH;
      s = clamp(s, MIN_SCALE, MAX_SCALE);
      setPageScale(s);

      setMetaTop((prev) => {
        if (hasLockedMetaTopRef.current && prev != null) return prev;
        hasLockedMetaTopRef.current = true;
        return INTRO_FIXED_PX;
      });

      const vh = window.innerHeight || document.documentElement.clientHeight || 0;
      const scaledHeight = BASE_A4_HEIGHT * s;
      setTwoUp(scaledHeight + 24 <= vh);
    }

    measure(true);

    function onResize() {
      const w = window.innerWidth || 0;
      if (Math.abs(w - lastWidthRef.current) >= 1) {
        lastWidthRef.current = w;
        measure(true);
      }
    }
    function onOrientation() {
      lastWidthRef.current = window.innerWidth || lastWidthRef.current;
      hasLockedMetaTopRef.current = false;
      measure(true);
    }

    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onOrientation);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onOrientation);
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 720px)');
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener?.('change', apply);
    return () => mq.removeEventListener?.('change', apply);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function afterStable() {
      try {
        if (document?.fonts?.ready) {
          await document.fonts.ready;
        }
      } catch {}
      if (!cancelled) {
        hasLockedMetaTopRef.current = false;
        const container = wrapRef.current;
        const viewportW = typeof window !== 'undefined' ? window.innerWidth : BASE_A4_WIDTH;
        const hostW = container ? container.clientWidth : viewportW;
        const availW = Math.max(320, Math.min(viewportW, hostW));
        let s = availW / BASE_A4_WIDTH;
        s = clamp(s, MIN_SCALE, MAX_SCALE);
        setPageScale(s);
        setMetaTop((prev) => prev ?? INTRO_FIXED_PX);
      }
    }
    if (document.readyState === 'complete') afterStable();
    else window.addEventListener('load', afterStable, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener('load', afterStable, { once: true });
    };
  }, []);

  useEffect(() => {
    const { restore } = setViewportContent('width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes');
    return () => restore();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadMock() {
      const mock = {
        id: '00000000-0000-0000-0000-000000000000',
        handle: handle || 'demo1234',
        first_name: 'John',
        last_name: 'Doe',
        headline: 'Deckhand / OOW in progress',
        about_me:
          'Energetic deckhand with strong tender driving and guest-facing service. B1/B2. Available on short notice.',
        availability: 'Immediate',
        primary_department: 'Deck',
        primary_role: 'Deckhand',
        target_ranks: [{ department: 'Deck', rank: 'Lead Deckhand' }],
        locations: ['Palma de Mallorca', 'Antibes', 'Caribbean'],
        skills: ['Tender driving', 'Washdown', 'Line handling', 'Watchkeeping', 'Refit support'],
        languages: ['English:C1', { lang: 'Spanish', level: 'B2' }],
        birth_month: 7,
        birth_year: 1996,
        show_age_public: true,
        country: 'Spain',
        city_port: 'Palma',
        nationalities: ['Colombian'],
        gallery: [
          { url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc', type: 'image' },
          { url: 'https://images.unsplash.com/photo-1565430526608-893dc61c7f6f', type: 'image' },
        ],
        prefs_skills: {
          vesselTypes: ['Motor'],
          rotation: ['3:1'],
          programTypes: ['Private', 'Charter'],
          vesselSizeRange: { min: 30, max: 60, unit: 'm' },
        },
      };

      const mockXp = [
        {
          id: 'xp1',
          kind: 'yacht',
          department: 'Deck',
          role: 'Deckhand',
          vessel_name: 'M/Y Azure Sky',
          vessel_type: 'Motor',
          loa_m: 52,
          gt: 780,
          mode: 'Private',
          regions: ['Med'],
          start_year: 2024,
          start_month: 4,
          end_year: 2024,
          end_month: 9,
          is_current: false,
          notes: ['washdown', 'tender ops', 'guest ops'],
        },
      ];

      const mockDocs = [
        { id: 'd1', type: 'cv', title: 'CV — John Doe (PDF)', visibility: 'public', file_url: null, created_at: new Date().toISOString() },
      ];

      const mockRefs = [
        { id: 'r1', name: 'Capt. Jane Smith', role: 'Captain', organization: 'M/Y Azure Sky', contact_email: 'capt.jane@example.com' },
      ];

      const mockEdu = [
        { id: 'e1', institution: 'Warsash Maritime School', program: 'Deck Cadet', level_type: 'Maritime Academy', country: 'UK', start_month:'09', start_year:'2016', end_month:'06', end_year:'2019', current:false },
        { id: 'e2', institution: 'Southampton University', program: 'Naval Architecture', level_type: 'Bachelor’s Degree', country: 'UK', start_month:'09', start_year:'2019', end_month:'06', end_year:'2022', current:false },
        { id: 'e3', institution: 'RINA Course', program: 'Structural Analysis', level_type: 'Postgraduate Diploma / Certificate', country: 'UK', start_month:'10', start_year:'2023', end_month:null, end_year:null, current:true },
      ];

      mock.share_ready = true;
      
      setYachtingMonths(6);
      setEmploymentStatus(
        (mock?.prefs_skills && typeof mock.prefs_skills.status === 'string' && mock.prefs_skills.status.trim())
          ? mock.prefs_skills.status.trim()
          : ((mockXp || []).some(x => x.is_current) ? 'Employed' : 'Unemployed')
      );

      if (!cancelled) {
        setProfile(mock);
        setGallery(mock.gallery || []);
        setExperiences(mockXp);
        setDocuments(mockDocs);
        setReferences(mockRefs);
        setEducation(mockEdu);
        setLoading(false);
      }
    }

    async function loadReal() {
      setLoading(true);
      setError('');
      try {
        const { data, error } = await supabase.rpc('rpc_public_profile_preview', { handle_in: handle });
        if (error) throw error;
        const baseRow = Array.isArray(data) ? data[0] : data;
        if (!baseRow) throw new Error('Profile not found.');
        if (cancelled) return;

        const rawGallery = Array.isArray(baseRow.gallery) ? baseRow.gallery : [];
        const hydrated = await Promise.all(rawGallery.map(hydrateMediaItem));

        let nat = baseRow.nationalities ?? null;
        if (nat == null && baseRow.handle) {
          const { data: natRow } = await supabase
            .from('public_profiles')
            .select('nationalities')
            .eq('handle', baseRow.handle)
            .single();
          nat = natRow?.nationalities ?? null;
        }

        const { data: exposedRows, error: expErr } = await supabase
          .rpc('rpc_public_profile_exposed', { handle_in: baseRow.handle });
        if (expErr) throw expErr;
        const exposed = Array.isArray(exposedRows) ? (exposedRows[0] || {}) : (exposedRows || {});

        const { data: freshPR } = await supabase
          .from('public_profiles')
          .select('prefs_skills, prefs_skills_lite, prefs_skills_pro, languages, skills, share_ready, professional_statement, public_qr_id')
          .eq('handle', baseRow.handle)
          .single();

        // Merge prefs: los datos reales están en prefs_skills_lite (Lite) y prefs_skills_pro (Professional)
        // El CV debe leer de ambas fuentes para mostrar availability, languages, skills, lifestyle, etc.
        const liteData = freshPR && typeof freshPR.prefs_skills_lite === 'object' && freshPR.prefs_skills_lite !== null
          ? freshPR.prefs_skills_lite
          : {};
        const proData = freshPR && typeof freshPR.prefs_skills_pro === 'object' && freshPR.prefs_skills_pro !== null
          ? freshPR.prefs_skills_pro
          : {};
        const legacyPrefs = freshPR && typeof freshPR.prefs_skills === 'object' && freshPR.prefs_skills !== null
          ? freshPR.prefs_skills
          : (baseRow?.prefs_skills ?? {});
        const mergedPrefs =
          Object.keys(liteData).length || Object.keys(proData).length
            ? { ...legacyPrefs, ...proData, ...liteData }
            : (legacyPrefs && Object.keys(legacyPrefs).length ? legacyPrefs : (baseRow?.prefs_skills ?? null));
        const mergedLanguages =
          (freshPR && freshPR.languages != null) ? freshPR.languages
            : (baseRow?.languages ?? exposed?.languages ?? null);
        const mergedSkills =
          (freshPR && freshPR.skills != null) ? freshPR.skills
            : (baseRow?.skills ?? exposed?.skills ?? null);
        const shareReadyFlag =
          (freshPR && typeof freshPR.share_ready === 'boolean')
            ? freshPR.share_ready
            : (typeof baseRow?.share_ready === 'boolean'
              ? baseRow.share_ready
              : false);

        const row = {
          ...baseRow,
          ...exposed,
          prefs_skills: mergedPrefs,
          languages: mergedLanguages,
          skills: mergedSkills,
          nationalities: nat,
          professional_statement: freshPR?.professional_statement ?? baseRow?.professional_statement ?? exposed?.professional_statement ?? null,
        };

        const ps = row && typeof row.prefs_skills === 'object' ? row.prefs_skills : null;
        const bridged = { ...row };
          if (ps) {
          if (ps.availability != null) bridged.availability = ps.availability;
          if (Array.isArray(ps.contracts)) bridged.contract_types = ps.contracts;
          if (Array.isArray(ps.regionsSeasons)) bridged.regions = ps.regionsSeasons;
          if (ps.rateSalary != null) bridged.compensation = ps.rateSalary;
          if (Array.isArray(ps.languageLevels)) bridged.languages = ps.languageLevels;
          if (Array.isArray(ps.deptSpecialties)) bridged.skills = ps.deptSpecialties;
        }

        bridged.share_ready = !!shareReadyFlag;
        bridged.public_qr_id = freshPR?.public_qr_id ?? baseRow?.public_qr_id ?? null;

        setProfile(bridged);
        setGallery(hydrated);

        const pid = bridged.id;

        {
          const { data: xpRows } = await supabase
            .from('profile_experiences')
            .select('*')
            .eq('profile_id', pid)
            .order('start_year', { ascending: false })
            .order('start_month', { ascending: false });

          setExperiences(xpRows || []);

          const employed = (xpRows || []).some(x => x.is_current === true);
          const psStatus =
            row && row.prefs_skills && typeof row.prefs_skills.status === 'string'
              ? row.prefs_skills.status.trim()
              : '';
          setEmploymentStatus(psStatus || (employed ? 'Employed' : 'Unemployed'));
        }

        try {
          const { data: ymData, error: ymErr } = await supabase.rpc('rpc_yachting_months', { profile_uuid: pid });
          if (ymErr) throw ymErr;
          setYachtingMonths(typeof ymData === 'number' ? ymData : null);
        } catch {
          setYachtingMonths(null);
        }

        {
          const { data: rows, error: docsErr } = await supabase.rpc(
            'rpc_public_docs_with_exp',
            { profile_uuid: pid }
          );

          if (docsErr) {
            console.error('docs rpc error', docsErr);
            setDocuments([]);
          } else {
            setDocuments(rows || []);
          }
        }

        {
          const { data: refRows, error: refErr } = await supabase
            .rpc('rpc_public_references_by_handle', { handle_in: bridged.handle });

          if (refErr) {
            console.error('refs rpc error', refErr);
            setReferences([]);
          } else {
            const normalized = (refRows || []).map((r) => {
              const rawPath =
                r.attachment_path ?? r.file_url ?? null;
              const attachment_path = rawPath
                ? String(rawPath).replace(`${BUCKET}/`, '')
                : null;

              return {
                id: r.id,
                name: r.name || '',
                role: r.role || '',
                vessel_company: r.vessel_company || '',
                email: r.email || '',
                phone: r.phone || '',
                attachment_path,
                title: r.attachment_name || r.title || r.name || 'Reference document',
                created_at: r.created_at,
              };
            });

            setReferences(normalized);
          }
        }

        {
          const { data: eduRows, error: eduErr } = await supabase
            .rpc('rpc_public_education_by_handle', { handle_in: bridged.handle });

          if (eduErr) {
            console.error('edu RPC error:', eduErr);
            setEducation([]);
          } else {
            setEducation(eduRows || []);
          }
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load profile.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (isMock) loadMock();
    else loadReal();

    return () => { cancelled = true; };
  }, [handle, isMock, search]);

  const showAge =
    (profile?.visibility_settings?.show_age ?? profile?.show_age_public ?? true) === true;
  const age = calcAge(profile?.birth_month, profile?.birth_year);

  const displayName = useMemo(() => {
    const full = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim();
    return full || profile?.headline || 'Yacht Candidate';
  }, [profile?.first_name, profile?.last_name, profile?.headline]);

  const introNameClassName = useMemo(() => {
    const normalized = String(displayName || '').trim();
    if (!normalized) return 'ppv-introName';
    const compactLength = normalized.replace(/\s+/g, '').length;
    const longestWord = normalized
      .split(/\s+/)
      .reduce((max, word) => Math.max(max, word.length), 0);

    if (compactLength >= 24 || longestWord >= 12) {
      return 'ppv-introName ppv-introName--veryLong';
    }
    if (compactLength >= 18 || longestWord >= 9) {
      return 'ppv-introName ppv-introName--long';
    }
    return 'ppv-introName';
  }, [displayName]);

  const rankText = useMemo(() => {
    if (profile?.primary_role) return profile.primary_role;
    const tr = Array.isArray(profile?.target_ranks) ? profile.target_ranks : [];
    for (const t of tr) {
      if (typeof t === 'string' && t) return t;
      if (t && (t.rank || t.role)) return t.rank || t.role;
    }
    return '';
  }, [profile?.primary_role, profile?.target_ranks]);

  const availabilityText = useMemo(
    () => formatAvailability(profile?.availability),
    [profile?.availability]
  );

  const nationalityText = useMemo(() => {
    const val = profile?.nationalities;
    let list = [];
    if (Array.isArray(val)) {
      list = val
        .map((it) => {
          if (!it) return null;
          if (typeof it === 'string') return it;
          if (typeof it === 'object') return it.name || it.label || it.nationality || it.value || null;
          return null;
        })
        .filter(Boolean);
    } else if (typeof profile?.nationality === 'string') {
      list = [profile.nationality];
    }
    return list.join(' / ');
  }, [profile?.nationalities, profile?.nationality]);

  const currentLocationText = useMemo(() => {
    return [profile?.country, profile?.city_port].filter(Boolean).join(' / ');
  }, [profile?.country, profile?.city_port]);

  const businessCardLocation = useMemo(() => {
    const city = typeof profile?.city_port === 'string' ? profile.city_port.trim() : '';
    const country = typeof profile?.country === 'string' ? profile.country.trim() : '';
    return { city, country };
  }, [profile?.city_port, profile?.country]);

  const heroMedia = useMemo(() => {
    if (profile?.photo_url) return { url: profile.photo_url, coverPositionX: 50, coverPositionY: 50 };
    if (profile?.avatar_url) return { url: profile.avatar_url, coverPositionX: 50, coverPositionY: 50 };
    const firstImg = (gallery || []).find((g) => {
      const u = typeof g === 'string' ? g : g?.url;
      const t = typeof g === 'object' ? g?.type : '';
      const isVideo = /\.(mp4|webm|mov|m4v|avi|mkv)$/i.test(u || '') || t === 'video';
      return u && !isVideo;
    });
    if (typeof firstImg === 'string') {
      return { url: firstImg, coverPositionX: 50, coverPositionY: 50 };
    }
    return firstImg || { url: '', coverPositionX: 50, coverPositionY: 50 };
  }, [profile?.photo_url, profile?.avatar_url, gallery]);

  const heroSrc = heroMedia?.url || '';
  const heroObjectPosition = useMemo(() => {
    const x = Number.isFinite(Number(heroMedia?.coverPositionX)) ? Number(heroMedia.coverPositionX) : 50;
    const y = Number.isFinite(Number(heroMedia?.coverPositionY)) ? Number(heroMedia.coverPositionY) : 50;
    return `${x}% ${y}%`;
  }, [heroMedia?.coverPositionX, heroMedia?.coverPositionY]);

  const publicUrl = useMemo(() => {
    if (!profile?.public_qr_id && !profile?.handle) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    if (profile?.public_qr_id) {
      return `${origin}/cv/qr/${profile.public_qr_id}`;
    }
    return `${origin}/cv/${profile.handle}`;
  }, [profile?.handle, profile?.public_qr_id]);
  const businessCardPhone = useMemo(() => {
    const ccRaw = String(profile?.phone_cc || '').trim();
    const numberRaw = String(profile?.phone_number || '').trim();
    if (!ccRaw && !numberRaw) return '';
    const cc = ccRaw ? (ccRaw.startsWith('+') ? ccRaw : `+${ccRaw}`) : '';
    return [cc, numberRaw].filter(Boolean).join(' ');
  }, [profile?.phone_cc, profile?.phone_number]);
  const businessCardEmail = useMemo(
    () => String(profile?.email_public || profile?.email || '').trim(),
    [profile?.email_public, profile?.email]
  );
  const cardQrSrc = useMemo(() => {
    if (!publicUrl) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=0&data=${encodeURIComponent(publicUrl)}`;
  }, [publicUrl]);
  const businessCardLogoSrc =
    businessCardTheme === 'light' ? '/logos/yachtdaywork.png' : '/logos/yachtdayworkDarkMode.png';
  const businessCardRootClassName = useMemo(
    () => `ppv-businessCard ppv-businessCard--${businessCardTheme}`,
    [businessCardTheme]
  );
  const businessCardBodyProps = useMemo(() => ({
    businessCardEmail,
    businessCardLocation,
    businessCardLogoSrc,
    businessCardPhone,
    cardQrSrc,
    displayName,
    firstName: profile?.first_name,
    heroObjectPosition,
    heroSrc,
    rankText,
  }), [
    businessCardEmail,
    businessCardLocation,
    businessCardLogoSrc,
    businessCardPhone,
    cardQrSrc,
    displayName,
    heroObjectPosition,
    heroSrc,
    profile?.first_name,
    rankText,
  ]);

  const exportBusinessCardBlob = useCallback(async () => {
    if (!businessCardExportRef.current) throw new Error('Business card is not ready yet.');
    const blob = await htmlToImageBlob(businessCardExportRef.current, {
      cacheBust: true,
      pixelRatio: BUSINESS_CARD_EXPORT_WIDTH / BASE_BUSINESS_CARD_WIDTH,
      canvasWidth: BUSINESS_CARD_EXPORT_WIDTH,
      canvasHeight: BUSINESS_CARD_EXPORT_HEIGHT,
      backgroundColor: businessCardTheme === 'light' ? '#f4fbfb' : '#081525',
      skipFonts: false,
    });
    if (!blob) throw new Error('Could not create image.');
    return blob;
  }, [businessCardTheme]);

  const exportBusinessCardCanvas = useCallback(async () => {
    const blob = await exportBusinessCardBlob();
    const dataUrl = await blobToDataUrl(blob);
    const image = await loadImage(dataUrl);
    const canvas = document.createElement('canvas');
    canvas.width = BUSINESS_CARD_EXPORT_WIDTH;
    canvas.height = BUSINESS_CARD_EXPORT_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not create image canvas.');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    clipRoundRect(
      ctx,
      0,
      0,
      canvas.width,
      canvas.height,
      16 * (BUSINESS_CARD_EXPORT_WIDTH / BASE_BUSINESS_CARD_WIDTH)
    );
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    ctx.restore();
    return canvas;
  }, [exportBusinessCardBlob]);

  const handleCopyBusinessCardImage = useCallback(async () => {
    if (!navigator?.clipboard?.write || typeof window.ClipboardItem === 'undefined') {
      toast.error('Copy image is not supported in this browser.');
      return;
    }

    setDownloadMenuOpen(false);
    setCardExportBusy('copy');
    try {
      const canvas = await exportBusinessCardCanvas();
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Could not create image.');
      await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': blob })]);
      toast.success('Business card image copied.');
    } catch (e) {
      toast.error(e?.message || 'Could not copy image.');
    } finally {
      setCardExportBusy('');
    }
  }, [exportBusinessCardCanvas]);

  const handleShareBusinessCardImage = useCallback(async () => {
    setDownloadMenuOpen(false);
    setCardExportBusy('share');
    try {
      const canvas = await exportBusinessCardCanvas();
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Could not create image.');

      const file = new File([blob], `business-card-${profile?.handle || 'candidate'}.png`, {
        type: 'image/png',
      });

      if (navigator?.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({
          title: 'Business Card',
          text: 'Candidate business card',
          files: [file],
        });
        return;
      }

      triggerBlobDownload(blob, file.name);
      toast.success('PNG downloaded for sharing.');
    } catch (e) {
      if (e?.name !== 'AbortError') {
        toast.error(e?.message || 'Could not share image.');
      }
    } finally {
      setCardExportBusy('');
    }
  }, [exportBusinessCardCanvas, profile?.handle]);

  const handleDownloadBusinessCard = useCallback(async (format) => {
    setDownloadMenuOpen(false);
    setCardExportBusy(format);
    try {
      const canvas = await exportBusinessCardCanvas();

      if (format === 'png') {
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
        if (!blob) throw new Error('Could not create PNG.');
        triggerBlobDownload(blob, `business-card-${profile?.handle || 'candidate'}.png`);
        toast.success('Business card PNG downloaded.');
        return;
      }

      const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.96);
      const pdfBlob = createPdfBlobFromJpegDataUrl(
        jpegDataUrl,
        canvas.width,
        canvas.height,
        85,
        55
      );
      triggerBlobDownload(pdfBlob, `business-card-${profile?.handle || 'candidate'}.pdf`);
      toast.success('Business card PDF downloaded.');
    } catch (e) {
      toast.error(e?.message || 'Could not download business card.');
    } finally {
      setCardExportBusy('');
    }
  }, [exportBusinessCardCanvas, profile?.handle]);

function getStickyBarHeight() {
  const sticky = document.querySelector('.ppv-stickyBar');
  return sticky ? sticky.getBoundingClientRect().height : 0;
}

function getTopFixedHeaderHeight() {
  const selectors = [
    'header[role="banner"]',
    '.main-header',
    '.app-header',
    '.navbar',
    '.topbar',
  ];
  let maxBottom = 0;

  document.querySelectorAll(selectors.join(',')).forEach((el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (cs.position === 'fixed' && r.top <= 0 && r.bottom > 0) {
      maxBottom = Math.max(maxBottom, r.bottom);
    }
  });
  
  if (maxBottom === 0) {
    document.querySelectorAll('*').forEach((el) => {
      try {
        const cs = getComputedStyle(el);
        if (cs.position !== 'fixed') return;
        const r = el.getBoundingClientRect();
        if (r.height && r.width && r.top <= 0 && r.bottom > 0 && r.top > -200) {
          maxBottom = Math.max(maxBottom, r.bottom);
        }
      } catch {}
    });
  }
  return maxBottom;
}

function computeScrollTargetTop(el, extra = 12) {
  const absoluteTop = window.scrollY + el.getBoundingClientRect().top;
  const offset = getTopFixedHeaderHeight() + getStickyBarHeight() + extra;
  return Math.max(0, absoluteTop - offset);
}

  const scrollTo = useCallback((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const targetY = computeScrollTargetTop(el, 12);
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  }, []);

  async function startContact() {

    if (!cEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cEmail)) {
      setContactError('Please enter a valid email.');
      return;
    }
    if (!cCaptcha) {
      setContactError('Captcha token is required.');
      return;
    }

    setSubmitting(true);
    try {
      const resp = await fetch('/api/start_contact_anon', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          handle: profile?.handle,
          email: cEmail,
          full_name: cName || undefined,
          organization: cOrg || undefined,
          marketing_consent: !!cConsent,
          captcha_token: cCaptcha,
        }),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        setContactError(json?.error || 'Could not start contact.');
        return;
      }
      setContactInfo('Contact started. Opening chat…');
      if (json?.chatUrl) window.location.href = json.chatUrl;
    } catch {
      setContactError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const photoBackdropStyle = useMemo(() => {
    return heroSrc ? { ['--ppv-photo-url']: `url("${heroSrc}")` } : {};
  }, [heroSrc]);

  const docFlags = useMemo(() => {
    const ps = profile?.prefs_skills && typeof profile.prefs_skills === 'object' ? profile.prefs_skills : {};
    return (ps && typeof ps.docFlags === 'object') ? ps.docFlags : {};
  }, [profile?.prefs_skills]);

  const isShareReadyByData = useMemo(() => {
    if (!profile) return false;
    const ps = profile?.prefs_skills && typeof profile.prefs_skills === 'object' ? profile.prefs_skills : {};
    const languageLevels = Array.isArray(ps.languageLevels) ? ps.languageLevels : (profile?.languages || []);
    const deptSpecialties = Array.isArray(ps.deptSpecialties) ? ps.deptSpecialties : (profile?.skills || []);
    const lifestyleHabits = ps?.lifestyleHabits && typeof ps.lifestyleHabits === 'object' ? ps.lifestyleHabits : {};

    const meetsPersonalMin = personalMeetsMin(profile);
    const meetsDeptRanks = !!(profile?.primary_department && profile?.primary_role);
    const meetsExperienceMin = Array.isArray(experiences) && experiences.length > 0;
    const meetsAboutMin =
      !!(profile?.about_me && String(profile.about_me).trim()) ||
      !!(profile?.professional_statement && String(profile.professional_statement).trim());
    const meetsPrefsSkillsMin =
      !!(ps?.status && String(ps.status).trim()) &&
      hasValidAvailability(ps?.availability) &&
      hasLanguagesWithLevel(languageLevels) &&
      hasDeptSkills(deptSpecialties);
    const meetsLifestyleMin =
      !!(lifestyleHabits?.tattoosVisible && String(lifestyleHabits.tattoosVisible).trim()) &&
      !!(lifestyleHabits?.drugTestWilling && String(lifestyleHabits.drugTestWilling).trim()) &&
      !!(lifestyleHabits?.smoking && String(lifestyleHabits.smoking).trim()) &&
      !!(lifestyleHabits?.vaping && String(lifestyleHabits.vaping).trim()) &&
      !!(lifestyleHabits?.alcohol && String(lifestyleHabits.alcohol).trim()) &&
      Array.isArray(lifestyleHabits?.dietaryAllergies) && lifestyleHabits.dietaryAllergies.length > 0 &&
      !!(lifestyleHabits?.fitness && String(lifestyleHabits.fitness).trim());
    const meetsEducationMin = Array.isArray(education) && education.length > 0;
    const meetsDocumentsMin = docsMeetMin(documents) && allDocFlagsSelected(docFlags);
    const meetsReferencesMin = Array.isArray(references) && references.length > 0;
    const galleryImagesCount = Array.isArray(gallery)
      ? gallery.filter((it) => (it?.type || inferTypeByName(it?.name || it?.path || it?.url || '')) === 'image').length
      : 0;
    const meetsMediaMin = galleryImagesCount >= 3;

    return Boolean(
      meetsPersonalMin &&
      meetsDeptRanks &&
      meetsExperienceMin &&
      meetsAboutMin &&
      meetsPrefsSkillsMin &&
      meetsLifestyleMin &&
      meetsEducationMin &&
      meetsDocumentsMin &&
      meetsReferencesMin &&
      meetsMediaMin
    );
  }, [profile, experiences, documents, references, education, gallery, docFlags]);

  const allowPublicView = useMemo(
    () => isPreview || (profile?.share_ready === true) || isShareReadyByData,
    [isPreview, profile?.share_ready, isShareReadyByData]
  );
  const publicMediaMaxItems = useMemo(() => {
    if (profile?.user_id && UNLIMITED_MEDIA_USER_IDS.has(String(profile.user_id))) {
      return Math.max(Array.isArray(gallery) ? gallery.length : 0, 10);
    }
    return 10;
  }, [profile?.user_id, gallery]);
  useEmitProfileView(allowPublicView ? profile : null);

  const coverLetterText = String(profile?.professional_statement || '').trim();

  if (loading) {
    return (
      <div className={`ppv-wrap ${isPreview ? 'ppv--preview' : 'ppv--public'}`} style={{ paddingTop: isPreview ? 50 : 12 }}>
        <div className="ppv-card">
          <div className="ppv-skel h32 w40" />
          <div className="ppv-skel h16 w80" />
          <div className="ppv-skel h16 w60" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={`ppv-wrap ${isPreview ? 'ppv--preview' : 'ppv--public'}`} style={{ paddingTop: isPreview ? 50 : 12 }}>
        <div className="ppv-card">
          <h2 className="ppv-title">Profile not available</h2>
          <p>This CV link may be invalid, revoked, or not publicly previewable.</p>
          {error && <p className="ppv-error">Error: {error}</p>}
        </div>
      </div>
    );
  }

if (!allowPublicView && !isPreview) {
  return (
    <div className={`ppv-wrap ${isPreview ? 'ppv--preview' : 'ppv--public'}`} style={{ paddingTop: isPreview ? 50 : 12 }}>
      <div className="ppv-card">
        <h2 className="ppv-title">Profile unavailable / incomplete</h2>
        <p>This CV is not currently available because the minimum required fields have not been completed.</p>
      </div>
    </div>
  );
}

  const metaLabelStyle = {
    fontSize: 12,
    letterSpacing: '.12em',
    fontWeight: 700,
    opacity: 0.8,
    textTransform: 'uppercase',
  };

  const metaValueStyle = {
    fontSize: 14,
    fontWeight: 700,
    textAlign: 'center',
    justifySelf: 'center',
  };

  return (
    <div className={`ppv-wrap ${isPreview ? 'ppv--preview' : 'ppv--public'}`} style={{ paddingTop: isPreview ? 50 : 12 }}>
      {isPreview && (
        <div className="ppv-previewRibbon">
          This business card is for personal use only and will not be visible to recruiters. Your Digital CV below remains visible to recruiters. Use the buttons above to download the card for print or copy it for sharing across social media, email, messaging apps, and other platforms.
        </div>
      )}

      {/* Header (solo en modo Preview) */}
      {isPreview && (
        <PublicProfileBusinessCard
          baseBusinessCardHeight={BASE_BUSINESS_CARD_HEIGHT}
          businessCardBodyProps={businessCardBodyProps}
          businessCardExportRef={businessCardExportRef}
          businessCardRef={businessCardRef}
          businessCardRootClassName={businessCardRootClassName}
          businessCardScale={businessCardScale}
          businessCardStageRef={businessCardStageRef}
          businessCardTheme={businessCardTheme}
          cardExportBusy={cardExportBusy}
          downloadMenuOpen={downloadMenuOpen}
          handleCopyBusinessCardImage={handleCopyBusinessCardImage}
          handleDownloadBusinessCard={handleDownloadBusinessCard}
          handleShareBusinessCardImage={handleShareBusinessCardImage}
          isMobile={isMobile}
          setBusinessCardTheme={setBusinessCardTheme}
          setDownloadMenuOpen={setDownloadMenuOpen}
        />
      )}

      {/* Sticky action bar */}
      {isPreview && isMobile && (
        <div className="ppv-previewBack">
          <button
            type="button"
            className="ppv-btn ppv-back-btn"
            onClick={() => navigate('/profile?tab=cv')}
          >
            Back to Candidate Profile
          </button>
        </div>
      )}
      <div className="ppv-stickyBar" role="region" aria-label="Actions">
        <div className="ppv-stickyActions">
          <button className="ppv-btn" onClick={() => scrollTo('ppv-summary')}>Summary</button>
          <button className="ppv-btn" onClick={() => scrollTo('ppv-experience')}>Experience</button>
          <button className="ppv-btn" onClick={() => scrollTo('ppv-certdocs')}>Documents</button>
          <button className="ppv-btn" onClick={() => scrollTo('ppv-langskills')}>Languages</button>
          <button className="ppv-btn" onClick={() => scrollTo('ppv-lifestyle')}>Lifestyle</button>
          <button className="ppv-btn" onClick={() => scrollTo('ppv-refs')}>References</button>
          <button className="ppv-btn" onClick={() => scrollTo('ppv-media')}>Media</button>
          <button className="ppv-btn" onClick={() => scrollTo('ppv-education')}>Education</button>
          <button className="ppv-btn" onClick={() => scrollTo('ppv-contact')}>Contact</button>
          {coverLetterText && <button className="ppv-btn" onClick={() => scrollTo('ppv-cover-letter')}>Cover Letter</button>}
        </div>
      </div>

      {/* Páginas A4 (contenido envuelto en .ppv-pageInner para escalar solo en pantalla) */}
      <main className="ppv-body" ref={wrapRef}>
        <div
          className={`ppv-pages ${twoUp ? 'ppv-twoUp' : 'ppv-stacked'}`}
          role="region"
          aria-label="CV pages"
        >
          {/* Página 1 */}
          <div
            className="ppv-pageSizer"
            style={{ height: `${Math.round(BASE_A4_HEIGHT * pageScale)}px` }}
          >
            <div
              className="ppv-a4Page"
              role="region"
              aria-label="CV first page"
              ref={a4Ref}
              style={{
                width: BASE_A4_WIDTH,
                height: BASE_A4_HEIGHT,
                position: 'relative',
                left: '50%',
                transform: `translateX(-50%) scale(${pageScale})`,
                transformOrigin: 'top center',
                margin: '12px 0'
              }}
            >
              <div className="ppv-pageInner">
                {heroSrc && (
                  <aside className="ppv-a4Photo" aria-label="Profile photo">
                    <img
                      className="ppv-photoImg"
                      src={heroSrc}
                      alt={`${displayName} main`}
                      loading="lazy"
                      style={{ objectPosition: heroObjectPosition }}
                    />
                  </aside>
                )}

                <section
                  className="ppv-a4Intro"
                  aria-label="Intro"
                  ref={introRef}
                  style={{ zIndex: 2 }}
                >
                  <div className="ppv-introInner">
                    <div className={introNameClassName}>{displayName}</div>
                    {rankText && <div className="ppv-introRank">{rankText}</div>}
                  </div>
                </section>

                {/* ⬇️ ANCLA: SUMMARY */}
                <section
                  id="ppv-summary"
                  className="ppv-a4Meta"
                  style={{
                    position: 'absolute',
                    top: metaTop != null ? metaTop : 'calc(50% / 4)',
                    left: 0,
                    right: '33.333%',
                    height: 'auto',
                    padding: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    zIndex: 3,
                  }}
                  aria-label="Basic info and short summary"
                >
                  <div
                    className="ppv-metaGrid"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: 30,
                      width: '100%',
                      maxWidth: 720,
                      margin: '0 auto',
                      textAlign: 'center',
                      alignItems: 'start',
                    }}
                  >
                    <div className="ppv-metaItem" style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                      <div className="ppv-metaLabel" style={metaLabelStyle}>AGE</div>
                      <div className="ppv-metaValue" style={metaValueStyle}>
                        {(showAge && age != null) ? age : '—'}
                      </div>
                    </div>

                    <div className="ppv-metaItem" style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                      <div className="ppv-metaLabel" style={metaLabelStyle}>NATIONALITY</div>
                      <div className="ppv-metaValue" style={metaValueStyle}>
                        {nationalityText || '—'}
                      </div>
                    </div>

                    <div className="ppv-metaItem" style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                      <div className="ppv-metaLabel" style={metaLabelStyle}>CURRENT LOCATION</div>
                      <div className="ppv-metaValue" style={metaValueStyle}>
                        {currentLocationText || '—'}
                      </div>
                    </div>

                    <div className="ppv-metaItem" style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                      <div className="ppv-metaLabel" style={metaLabelStyle}>AVAILABILITY</div>
                      <div className="ppv-metaValue" style={metaValueStyle}>
                        {availabilityText || '—'}
                      </div>
                    </div>

                    <div className="ppv-metaItem" style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                      <div className="ppv-metaLabel" style={metaLabelStyle}>YACHTING EXPERIENCE</div>
                      <div className="ppv-metaValue" style={metaValueStyle}>
                        {yachtingMonths == null ? '—' : formatYachtingExperienceLabel(yachtingMonths)}
                      </div>
                    </div>

                    <div className="ppv-metaItem" style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                      <div className="ppv-metaLabel" style={metaLabelStyle}>STATUS</div>
                      <div className="ppv-metaValue" style={metaValueStyle}>
                        {employmentStatus || '—'}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      width: '100%',
                      maxWidth: 720,
                      margin: '0 auto',
                      paddingTop: 12,
                      borderTop: '1px solid rgba(0,0,0,.12)',
                      color: '#0b1220',
                      textAlign: 'left',
                    }}
                  >
                    <div
                      className="ppv-a4Title"
                      role="heading"
                      aria-level={2}
                    >
                      SHORT SUMMARY
                    </div>
                    <div
                      className="ppv-summaryText"
                      style={{
                        fontSize: 14,
                        lineHeight: 1.5,
                        whiteSpace: 'pre-line',
                        textAlign: 'justify',
                      }}
                    >
                      {(typeof profile?.about_me === 'string' ? profile.about_me.trim() : '') || '—'}
                    </div>
                  </div>
                </section>

                {/* ⬇️ ANCLA EXPERIENCE */}
                <div id="ppv-experience">
                  <PublicExperienceSection experiences={experiences} />
                </div>
              </div>
            </div>
          </div>

          {/* Página 2 */}
          <div
            className="ppv-pageSizer"
            style={{ height: `${Math.round(BASE_A4_HEIGHT * pageScale)}px` }}
          >
            <div
              className="ppv-a4Page"
              role="region"
              aria-label="CV second page"
              style={{
                width: BASE_A4_WIDTH,
                height: BASE_A4_HEIGHT,
                position: 'relative',
                left: '50%',
                transform: `translateX(-50%) scale(${pageScale})`,
                transformOrigin: 'top center',
                margin: '12px 0'
              }}
            >
              <div className="ppv-pageInner">
                {/* ⬇️ ANCLA CERTIFICATES & DOCS */}
                <div id="ppv-certdocs">
                  <PublicCertDocsSection
                    documents={documents}
                    docFlags={docFlags}
                    nationalities={profile?.nationalities}
                  />
                </div>

                {/* ⬇️ ANCLA LANGUAGES & SKILLS */}
                <div id="ppv-langskills">
                  <PublicLanguagesSkillsSection profile={profile} />
                </div>

                {/* ⬇️ ANCLA LIFESTYLE */}
                <div id="ppv-lifestyle">
                  <PublicLifestyleHabitsSection profile={profile} />
                </div>
              </div>
            </div>
          </div>

          {/* Página 3: References + Media + Education */}
          <div
            className="ppv-pageSizer"
            style={{ height: `${Math.round(BASE_A4_HEIGHT * pageScale)}px` }}
          >
            <div
              className="ppv-a4Page"
              role="region"
              aria-label="CV third page"
              style={{
                width: BASE_A4_WIDTH,
                height: BASE_A4_HEIGHT,
                position: 'relative',
                left: '50%',
                transform: `translateX(-50%) scale(${pageScale})`,
                transformOrigin: 'top center',
                margin: '12px 0'
              }}
            >
              <div className="ppv-pageInner">
                {/* ⬇️ ANCLA REFERENCES */}
                <div id="ppv-refs">
                  <PublicReferencesSection
                    profileId={profile?.id}
                    references={references}
                  />
                </div>

                {/* ⬇️ ANCLA MEDIA */}
                <div id="ppv-media">
                  <PublicMediaGallerySection
                    title="MEDIA"
                    subtitle="Photos & Videos"
                    gallery={gallery}
                    maxItems={publicMediaMaxItems}
                  />
                </div>

                {/* ⬇️ ANCLA EDUCATION */}
                <div id="ppv-education">
                  <PublicEducationSection
                    title="FORMAL STUDIES & DEGREES"
                    items={education}
                  />
                </div>

                {/* ⬇️ ANCLA CONTACT DETAILS */}
                <div id="ppv-contact">
                  <PublicContactDetailsSection profile={profile} />
                </div>
              </div>
            </div>
          </div>

          {coverLetterText && (
            <div
              className="ppv-pageSizer"
              style={{ height: `${Math.round(BASE_A4_HEIGHT * pageScale)}px` }}
            >
              <div
                className="ppv-a4Page"
                role="region"
                aria-label="Cover letter page"
                style={{
                  width: BASE_A4_WIDTH,
                  height: BASE_A4_HEIGHT,
                  position: 'relative',
                  left: '50%',
                  transform: `translateX(-50%) scale(${pageScale})`,
                  transformOrigin: 'top center',
                  margin: '12px 0'
                }}
              >
                <div className="ppv-pageInner">
                  <div id="ppv-cover-letter">
                    <PublicCoverLetterSection
                      profile={profile}
                      text={coverLetterText}
                      displayName={displayName}
                      rankText={rankText}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
