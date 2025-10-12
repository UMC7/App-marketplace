// src/pages/cv/PublicProfileView.js
import React, { useEffect, useMemo, useState, useCallback, useRef, useLayoutEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import supabase from '../../supabase';
import './PublicProfileView.css';
import PublicCertDocsSection from './sections/certdocs';
import PublicExperienceSection from './sections/experience';
import PublicLanguagesSkillsSection from './sections/langskills';
import PublicLifestyleHabitsSection from './sections/lifestylehabits/PublicLifestyleHabitsSection';
import PublicReferencesSection from './sections/references';
import PublicMediaGallerySection from './sections/media';
import PublicEducationSection from './sections/education';
import PublicContactDetailsSection from './sections/contact';

const qs = (search) => new URLSearchParams(search || '');
const BUCKET = 'cv-docs';

const pad2 = (n) => String(n).padStart(2, '0');
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

function calcAge(month, year) {
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);
  if (!y || isNaN(y) || !m || isNaN(m) || m < 1 || m > 12) return null;
  const now = new Date();
  let age = now.getFullYear() - y;
  const currentMonth = now.getMonth() + 1;
  if (currentMonth < m) age -= 1;
  if (age < 0 || age > 120) return null;
  return age;
}

function fmtYM(y, m) {
  if (!y) return '';
  if (!m) return String(y);
  const d = new Date(`${y}-${pad2(m)}-01T00:00:00Z`);
  return d.toLocaleString(undefined, { year: 'numeric', month: 'short' });
}
function dateRange(aY, aM, bY, bM, isCurrent) {
  const a = fmtYM(aY, aM);
  const b = isCurrent ? 'Present' : fmtYM(bY, bM);
  return a ? (b ? `${a} — ${b}` : a) : '';
}

function inferTypeByName(nameOrPath = '') {
  return /\.(mp4|webm|mov|m4v|avi|mkv)$/i.test(nameOrPath) ? 'video' : 'image';
}

/** Intenta hidratar un item de galería (si es path privado → signed URL) */
async function hydrateMediaItem(it) {
  if (!it) return null;
  if (typeof it === 'string') {
    if (/^https?:\/\//i.test(it)) return { url: it, type: inferTypeByName(it) };
    return { url: it, type: inferTypeByName(it) };
  }
  const base = typeof it === 'object' ? it : {};
  if (base.url && /^https?:\/\//i.test(base.url)) return base;
  if (base.path && base.path.startsWith(`${BUCKET}/`)) {
    const objectKey = base.path.replace(`${BUCKET}/`, '');
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(objectKey, 3600);
    if (error) return base;
    return { ...base, url: data?.signedUrl || base.url };
  }
  return base;
}

/** Mapea visibilidad DB → UI */
function mapDbVisToUi(v) {
  const s = (v || '').toString().toLowerCase();
  if (s === 'public') return 'public';
  if (s === 'private') return 'private';
  return 'unlisted';
}

// --- Hidrata datos de contacto desde public_profiles (id -> handle -> user_id) y fallback a users ---
async function hydrateContactFields({ profileId, userId, handle }) {
  let contact = {};

  async function fetchPR(where) {
    const { data } = await supabase
      .from('public_profiles')
      .select(`
        email_public,
        email,
        phone_cc,
        phone_number,
        whatsapp_same,
        whatsapp_cc,
        whatsapp_number,
        contact_pref,
        show_email_public,
        show_phone_public,
        show_age_public,
        linkedin,
        instagram,
        facebook,
        website
      `)
      .match(where)
      .single();
    return data || null;
  }

  contact = (profileId && await fetchPR({ id: profileId })) || contact;
  if (!contact && handle) contact = await fetchPR({ handle });
  if (!contact && userId) contact = await fetchPR({ user_id: userId });
  contact = contact || {};

  if (userId) {
    const { data: u } = await supabase
      .from('users')
      .select(`
        email,
        phone_cc,
        phone_number,
        whatsapp_cc,
        whatsapp_number,
        linkedin,
        instagram,
        facebook,
        website
      `)
      .eq('id', userId)
      .single();

    if (u) {
      contact = { ...u, ...contact };
      if (!contact.email_public && contact.email) {
        contact.email_public = contact.email;
      }
    }
  }

  contact.show_email_public = (contact.show_email_public ?? true) === true;
  contact.show_phone_public = (contact.show_phone_public ?? true) === true;

  return contact;
}

/** Parse robusto para strings JSON con comillas simples/dobles */
function parseMaybeJson(s) {
  let t = String(s || '').trim();
  if (!t) return null;

  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    t = t.slice(1, -1);
  }

  if (t.includes(':') && t.includes("'") && !t.includes('"')) {
    t = t.replace(/'/g, '"');
  }

  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}

/** Normaliza idiomas a "Lang (Level)" */
function normalizeLanguages(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((item) => {
      if (!item) return null;

      if (typeof item === 'object') {
        const lang = item.lang || item.language || item.name || '';
        const level = item.level || item.proficiency || '';
        return [lang, level && `(${level})`].filter(Boolean).join(' ').trim() || null;
      }

      const s = String(item).trim();
      if (!s) return null;

      if (s.startsWith('{') || (s.includes('lang') && s.includes(':'))) {
        const obj = parseMaybeJson(s);
        if (obj && (obj.lang || obj.language)) {
          const lang = obj.lang || obj.language || '';
          const level = obj.level || obj.proficiency || '';
          return [lang, level && `(${level})`].filter(Boolean).join(' ');
        }
      }

      if (s.includes(':')) {
        const [lang, level] = s.split(':');
        return [lang?.trim(), level && `(${level.trim()})`].filter(Boolean).join(' ');
      }

      return s;
    })
    .filter(Boolean);
}

// Formatea "Yachting experience"
function formatYachtingExperienceLabel(totalMonths) {
  const m = Number(totalMonths || 0);
  if (!Number.isFinite(m) || m <= 0) return '—';
  if (m < 24) return `${m} month${m === 1 ? '' : 's'}`;
  const years = m / 12;
  return `${(Math.round(years * 10) / 10).toFixed(1)} years`;
}

/* ----------------------------------
   Componente
---------------------------------- */
export default function PublicProfileView() {
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
  const [education, setEducation] = useState([]);        // ⬅️ NUEVO
  const [error, setError] = useState('');

  // Contact form
  const [contactOpen, setContactOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cEmail, setCEmail] = useState('');
  const [cName, setCName] = useState('');
  const [cOrg, setCOrg] = useState('');
  const [cConsent, setCConsent] = useState(false);
  const [cCaptcha, setCCaptcha] = useState('');
  const [contactError, setContactError] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [yachtingMonths, setYachtingMonths] = useState(null);
  const [employmentStatus, setEmploymentStatus] = useState(''); // 'Employed' | 'Unemployed' | ''
  const [twoUp, setTwoUp] = useState(false);
  const a4Ref = useRef(null);
  const introRef = useRef(null);
  const [metaTop, setMetaTop] = useState(null);

  useLayoutEffect(() => {
    function measure() {
      const page = a4Ref.current;
      const intro = introRef.current;
      if (!page) return;

      const pageRect = page.getBoundingClientRect();

      if (intro) {
        const introRect = intro.getBoundingClientRect();
        setMetaTop(introRect.bottom - pageRect.top);
      }
      const vh = window.innerHeight || document.documentElement.clientHeight || 0;
      const fits = pageRect.height + 24 <= vh;
      setTwoUp(fits);
    }

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  /* ----- Carga (mock/real) ----- */
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

      setYachtingMonths(6);
      setEmploymentStatus((mockXp || []).some(x => x.is_current) ? 'Employed' : 'Unemployed');

      if (!cancelled) {
        setProfile(mock);
        setGallery(mock.gallery || []);
        setExperiences(mockXp);
        setDocuments(mockDocs);
        setReferences(mockRefs);
        setEducation(mockEdu); // mock
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
        if (nat == null && baseRow.id) {
          const { data: natRow } = await supabase
            .from('public_profiles')
            .select('nationalities')
            .eq('id', baseRow.id)
            .single();
          nat = natRow?.nationalities ?? null;
        }

        const { data: exposedRows, error: expErr } = await supabase
          .rpc('rpc_public_profile_exposed', { handle_in: baseRow.handle });
        if (expErr) throw expErr;
        const exposed = Array.isArray(exposedRows) ? (exposedRows[0] || {}) : (exposedRows || {});

        const row = {
          ...baseRow,
          ...exposed,
          nationalities: nat,
        };

        setProfile(row);
        setGallery(hydrated);

        const pid = row.id;

        // EXPERIENCES
        {
          const { data: xpRows } = await supabase
            .from('profile_experiences')
            .select('*')
            .eq('profile_id', pid)
            .order('start_year', { ascending: false })
            .order('start_month', { ascending: false });

          setExperiences(xpRows || []);

          const employed = (xpRows || []).some(x => x.is_current === true);
          setEmploymentStatus(employed ? 'Employed' : 'Unemployed');
        }

        // Yachting months
        try {
          const { data: ymData, error: ymErr } = await supabase.rpc('rpc_yachting_months', { profile_uuid: pid });
          if (ymErr) throw ymErr;
          setYachtingMonths(typeof ymData === 'number' ? ymData : null);
        } catch {
          setYachtingMonths(null);
        }

        // DOCUMENTS
        {
          const { data: docRows } = await supabase
            .from('public_documents')
            .select('id, type, title, visibility, file_url, created_at')
            .eq('profile_id', pid)
            .order('created_at', { ascending: false });

          const { data: certRows } = await supabase
            .from('candidate_certificates')
            .select('file_url, issued_on, expires_on')
            .eq('profile_id', pid);

          const certByPath = new Map((certRows || []).map(c => [String(c.file_url || ''), c]));
          const docs = (docRows || []).map(r => {
            const cert = certByPath.get(String(r.file_url || ''));
            return {
              ...r,
              visibility: mapDbVisToUi(r.visibility),
              issued_on: cert?.issued_on || null,
              expires_on: cert?.expires_on || null,
            };
          });
          setDocuments(docs);
        }

        // REFERENCES
        {
          const { data: refRows } = await supabase
            .from('candidate_references')
            .select(`
              id,
              name,
              role,
              vessel_company,
              organization,
              contact_email,
              contact_phone,
              email,
              phone,
              file_url,
              attachment_url,
              document_url,
              file
            `)
            .eq('profile_id', pid)
            .order('created_at', { ascending: false });

          const normalized = (refRows || []).map(r => ({
            ...r,
            vessel_company: r.vessel_company || r.organization || '',
            email: r.contact_email || r.email || '',
            phone: r.contact_phone || r.phone || '',
            file_url: r.file_url || r.attachment_url || r.document_url || r.file || null,
          }));

          setReferences(normalized);
        }

        // EDUCATION
        {
          let authUserId = row.user_id || row.auth_user_id || null;
          if (!authUserId && pid) {
            const { data: pr } = await supabase
              .from('public_profiles')
              .select('user_id')
              .eq('id', pid)
              .single();
            authUserId = pr?.user_id || null;
          }

          let eduRows = [];
          if (authUserId) {
            const { data: r1 } = await supabase
              .from('cv_education')
              .select('id,institution,program,level_type,country,start_month,start_year,end_month,end_year,current,created_at')
              .eq('user_id', authUserId)
              .order('start_year', { ascending: false })
              .order('start_month', { ascending: false })
              .order('created_at', { ascending: false });
            eduRows = r1 || [];
          } else {
            const { data: r2 } = await supabase
              .from('cv_education')
              .select('id,institution,program,level_type,country,start_month,start_year,end_month,end_year,current,created_at')
              .eq('profile_id', pid)
              .order('start_year', { ascending: false })
              .order('start_month', { ascending: false })
              .order('created_at', { ascending: false });
            eduRows = r2 || [];
          }

          setEducation(eduRows);
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

  /* ----- Memos y handlers ----- */
  const showAge =
    (profile?.visibility_settings?.show_age ?? profile?.show_age_public ?? true) === true;
  const age = calcAge(profile?.birth_month, profile?.birth_year);

  const displayName = useMemo(() => {
    const full = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim();
    return full || profile?.headline || 'Yacht Candidate';
  }, [profile?.first_name, profile?.last_name, profile?.headline]);

  const langsText = useMemo(() => {
    const list = normalizeLanguages(profile?.languages || []);
    return list.length ? list.join(' · ') : '';
  }, [profile?.languages]);

  const primaryLine = useMemo(() => {
    const dept = profile?.primary_department || '';
    const role = profile?.primary_role || '';
    return [dept, role].filter(Boolean).join(' • ');
  }, [profile?.primary_department, profile?.primary_role]);

  const targetRanks = useMemo(() => {
    const arr = Array.isArray(profile?.target_ranks) ? profile.target_ranks : [];
    return arr
      .map((r) => (typeof r === 'string' ? r : [r?.department, r?.rank].filter(Boolean).join(' • ')))
      .filter(Boolean);
  }, [profile?.target_ranks]);

  const rankText = useMemo(() => {
    if (profile?.primary_role) return profile.primary_role;
    const tr = Array.isArray(profile?.target_ranks) ? profile.target_ranks : [];
    for (const t of tr) {
      if (typeof t === 'string' && t) return t;
      if (t && (t.rank || t.role)) return t.rank || t.role;
    }
    return '';
  }, [profile?.primary_role, profile?.target_ranks]);

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

  const heroSrc = useMemo(() => {
    if (profile?.photo_url) return profile.photo_url;
    if (profile?.avatar_url) return profile.avatar_url;
    const firstImg = (gallery || []).find((g) => {
      const u = typeof g === 'string' ? g : g?.url;
      const t = typeof g === 'object' ? g?.type : '';
      const isVideo = /\.(mp4|webm|mov|m4v|avi|mkv)$/i.test(u || '') || t === 'video';
      return u && !isVideo;
    });
    return typeof firstImg === 'string' ? firstImg : firstImg?.url || '';
  }, [profile?.photo_url, profile?.avatar_url, gallery]);

  const publicUrl = useMemo(() => {
    if (!profile?.handle) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/cv/${profile.handle}`;
  }, [profile?.handle]);

  const cvDoc = useMemo(() => {
    const list = Array.isArray(documents) ? documents : [];
    const pub = list.find((d) => (d.type || '').toLowerCase() === 'cv' && d.visibility === 'public');
    if (pub) return pub;
    const unl = list.find((d) => (d.type || '').toLowerCase() === 'cv' && d.visibility === 'unlisted');
    if (unl) return unl;
    return list.find((d) => (d.type || '').toLowerCase() === 'cv') || null;
  }, [documents]);

  const handleDownloadDoc = useCallback(async (doc) => {
    if (!doc?.file_url) return;
    try {
      const objectKey = String(doc.file_url).replace(`${BUCKET}/`, '');
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(objectKey, 3600);
      if (error) throw error;
      const url = data?.signedUrl;
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      alert(e.message || 'Could not open document.');
    }
  }, []);

  function openContact() {
    setContactOpen(true);
    setTimeout(() => {
      const el = document.getElementById('ppv-contact');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  // ⬇️ helper genérico para hacer scroll a secciones
  const scrollTo = useCallback((id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  async function startContact(e) {
    e.preventDefault();
    setContactError('');
    setContactInfo('');

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

  /* ----- UI ----- */
  if (loading) {
    return (
      <div className="ppv-wrap" style={{ paddingTop: 50 }}>
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
      <div className="ppv-wrap" style={{ paddingTop: 50 }}>
        <div className="ppv-card">
          <h2 className="ppv-title">Profile not available</h2>
          <p>This CV link may be invalid, revoked, or not publicly previewable.</p>
          {error && <p className="ppv-error">Error: {error}</p>}
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
    <div className="ppv-wrap" style={{ paddingTop: 50 }}>
      {isPreview && <div className="ppv-previewRibbon">Preview mode — recruiters won’t see this label</div>}

      {/* Header */}
      <header className="ppv-header">
        <div className="ppv-hero">
          {heroSrc ? (
            <img className="ppv-heroImg" src={heroSrc} alt={`${profile?.first_name || 'Candidate'} photo`} />
          ) : (
            <div className="ppv-heroFallback">CV</div>
          )}
        </div>

        <div className="ppv-headInfo">
          <h1 className="ppv-title">{displayName}</h1>

          <div className="ppv-badges" style={{ marginTop: 6 }}>
            {profile?.primary_department && <span className="ppv-badge">{profile.primary_department}</span>}
            {profile?.primary_role && <span className="ppv-badge">{profile.primary_role}</span>}
          </div>

          <div className="ppv-badges">
            {profile?.availability && <span className="ppv-badge">Availability: {profile.availability}</span>}
            {(profile?.city_port || profile?.country) && (
              <span className="ppv-badge">{[profile.city_port, profile.country].filter(Boolean).join(', ')}</span>
            )}
            {(profile?.visibility_settings?.show_age ?? profile?.show_age_public ?? true) && age != null && (
              <span className="ppv-badge">Age: {age}</span>
            )}
            {langsText && <span className="ppv-badge">Languages: {langsText}</span>}
          </div>

          <div className="ppv-subtle">Link: {publicUrl.replace(/^https?:\/\//, '')}</div>
        </div>

        <div className="ppv-brand">
          <small>CV powered by</small>
          <div className="ppv-logo">Yacht Daywork</div>
        </div>
      </header>

      {/* Sticky action bar */}
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
        </div>
      </div>

      {/* Páginas A4 (contenido envuelto en .ppv-pageInner para escalar solo en pantalla) */}
      <main className="ppv-body">
        <div
          className={`ppv-pages ${twoUp ? 'ppv-twoUp' : 'ppv-stacked'}`}
          role="region"
          aria-label="CV pages"
        >
          {/* Página 1 */}
          <div className="ppv-a4Page" role="region" aria-label="CV first page" ref={a4Ref}>
            <div className="ppv-pageInner">
              {heroSrc && (
                <aside className="ppv-a4Photo" aria-label="Profile photo">
                  <img
                    className="ppv-photoImg"
                    src={heroSrc}
                    alt={`${displayName} main`}
                    loading="lazy"
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
                  <div className="ppv-introName">{displayName}</div>
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
                  zIndex: 1,
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
                      {profile?.availability || '—'}
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

          {/* Página 2 */}
          <div className="ppv-a4Page" role="region" aria-label="CV second page">
            <div className="ppv-pageInner">
              {/* ⬇️ ANCLA CERTIFICATES & DOCS */}
              <div id="ppv-certdocs">
                <PublicCertDocsSection documents={documents} />
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

          {/* Página 3: References + Media + Education */}
          <div className="ppv-a4Page" role="region" aria-label="CV third page">
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
                  maxItems={14}
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
      </main>
    </div>
  );
}