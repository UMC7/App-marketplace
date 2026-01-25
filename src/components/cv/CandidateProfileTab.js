// src/components/cv/CandidateProfileTab.js
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CandidateProfileTab.css';
import supabase from '../../supabase';
import { toast } from 'react-toastify';
import {
  ProfileProgress,
} from './candidate';
import { useAuth } from '../../context/AuthContext';
import PreferencesSkills, { buildPrefsSkillsPayload } from './candidate/cvsections/PreferencesSkills';
import PersonalDetailsSection from './candidate/cvsections/PersonalDetailsSection';
import ExperienceSection from './candidate/cvsections/ExperienceSection';
import EducationSection from './candidate/cvsections/EducationSection';
import { DocumentsSectionController } from './candidate/cvsections';
import '../../styles/cv/docs.css';
import {
  ReferencesSection,
  MediaSection,
  DepartmentRankSection as DepartmentRankSectionNew,
} from './candidate/cvsections';
import AboutMeSection from './candidate/cvsections/aboutmesection';
import LifestyleHabitsSection from './candidate/cvsections/LifestyleHabitsSection';

function hasLanguagesWithLevel(languageLevels) {
  if (!Array.isArray(languageLevels)) return false;
  return languageLevels.some(ll => ll && ll.lang && String(ll.lang).trim() && ll.level && String(ll.level).trim());
}

function hasDeptSkills(deptSpecialties) {
  if (!Array.isArray(deptSpecialties)) return false;
  return deptSpecialties.some(it => {
    if (!it) return false;
    if (typeof it === 'string') return String(it).trim().length > 0;
    const deptOk = !!(it.department || it.dept || it.name);
    const skillsArr = it.skills || it.items || it.list || [];
    const skillsOk = Array.isArray(skillsArr) ? skillsArr.length > 0 : false;
    return deptOk && skillsOk;
  });
}

function allDocFlagsSelected(docFlags) {
  if (!docFlags || typeof docFlags !== 'object') return false;
  const keys = [
    'passport6m','schengenVisa','stcwBasic','seamansBook','eng1',
    'usVisa','drivingLicense','pdsd','covidVaccine'
  ];
  return keys.every(k => typeof docFlags[k] === 'boolean');
}

function docsMeetMin(docs) {
  if (!Array.isArray(docs) || docs.length < 3) return false;
  let valid = 0;
  for (const d of docs) {
    const titleOk = !!String(d?.title || '').trim();
    const issuedOk = !!String(d?.issuedOn || '').trim();
    const expiryOk = true;
    const visOk = !!String(d?.visibility || 'unlisted').trim();
    if (titleOk && issuedOk && expiryOk && visOk) valid++;
    if (valid >= 3) return true;
  }
  return false;
}

function personalMeetsMin(p) {
  if (!p) return false;
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(p.email_public || '').trim());
  const phoneCcOk = String(p.phone_cc || '').replace(/\D/g, '').length > 0;
  const phoneNumOk = String(p.phone_number || '').trim().length > 0;
  const natsOk = Array.isArray(p.nationalities) && p.nationalities.length > 0;
  return Boolean(
    String(p.first_name || '').trim() &&
    String(p.last_name || '').trim() &&
    emailOk &&
    phoneCcOk && phoneNumOk &&
    p.country &&
    String(p.city_port || '').trim() &&
    p.birth_month &&
    p.birth_year &&
    natsOk
  );
}

export default function CandidateProfileTab() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [profileMode, setProfileMode] = useState('professional');
  const [savingMode, setSavingMode] = useState(false);
  const [headline, setHeadline] = useState('');
  const [summary, setSummary] = useState('');
  const [primaryDepartment, setPrimaryDepartment] = useState('');
  const [primaryRank, setPrimaryRank] = useState('');
  const [targetRanks, setTargetRanks] = useState([]);
  const [availability, setAvailability] = useState('');
  const [locations, setLocations] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [skills, setSkills] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [rotation, setRotation] = useState([]);
  const [vesselTypes, setVesselTypes] = useState([]);
  const [vesselSizeRange, setVesselSizeRange] = useState([]);
  const [regionsSeasons, setRegionsSeasons] = useState([]);
  const [rateSalary, setRateSalary] = useState({
    currency: 'USD',
    dayRateMin: '',
    salaryMin: '',
  });
  const [status, setStatus] = useState('');
  const [languageLevels, setLanguageLevels] = useState([]);
  const [deptSpecialties, setDeptSpecialties] = useState([]);
  const [onboardPrefs, setOnboardPrefs] = useState({});
  const [programTypes, setProgramTypes] = useState([]);
  const [dietaryRequirements, setDietaryRequirements] = useState([]);

  const [lifestyleHabits, setLifestyleHabits] = useState({
    tattoosVisible: '',
    smoking: '',
    vaping: '',
    alcohol: '',
    dietaryAllergies: [],
    fitness: '',
  });

const DEFAULT_DOC_FLAGS = {
  passport6m: null,
  schengenVisa: null,
  stcwBasic: null,
  seamansBook: null,
  eng1: null,
  usVisa: null,
  drivingLicense: null,
  pdsd: null,
  covidVaccine: null,
};
const [docFlags, setDocFlags] = useState({ ...DEFAULT_DOC_FLAGS });

function buildFullPrefsSkillsPayload() {
  return {
    ...buildPrefsSkillsPayload({
      status,
      availability,
      regionsSeasons,
      contracts,
      languageLevels,
      deptSpecialties,
      rateSalary,
      rotation,
      vesselTypes,
      vesselSizeRange,
      programTypes,
      dietaryRequirements,
      onboardPrefs,
    }),

    lifestyleHabits,
    docFlags,
  };
}

  const [personal, setPersonal] = useState({
    first_name: '',
    last_name: '',
    email_public: '',
    phone_cc: '',
    phone_number: '',
    whatsapp_same: true,
    whatsapp_cc: '',
    whatsapp_number: '',
    country: '',
    city_port: '',
    nationalities: [],
    birth_month: null,
    birth_year: null,
    show_email_public: false,
    show_phone_public: false,
    show_age_public: false,
    contact_pref: '',
    linkedin: '',
    instagram: '',
    facebook: '',
    website: '',
    gender: '',
  });

  const [educationCount, setEducationCount] = useState(0);
  const [shareReadyPersistTimer, setShareReadyPersistTimer] = useState(null);
  const [docs, setDocs] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [savingDocFlags, setSavingDocFlags] = useState(false);
  const [savingGallery, setSavingGallery] = useState(false);

  useEffect(() => {
    const mode = currentUser?.app_metadata?.cv_mode;
    if (mode === 'lite' || mode === 'professional') {
      setProfileMode(mode);
    }
  }, [currentUser?.app_metadata?.cv_mode]);

  const handleModeChange = async (nextMode) => {
    if (!nextMode || nextMode === profileMode) return;
    if (nextMode === 'professional' && !isShareReady) return;
    const prev = profileMode;
    setProfileMode(nextMode);
    if (!currentUser?.id) return;
    setSavingMode(true);
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ cv_mode: nextMode, updated_at: new Date().toISOString() })
        .eq('id', currentUser.id);
      if (updateError) throw updateError;
    } catch (e) {
      setProfileMode(prev);
      toast.error('Could not save profile mode.');
    } finally {
      setSavingMode(false);
    }
  };

  const handleSaveDocFlags = async () => {
  if (!profile?.id) return;
  setSavingDocFlags(true);
  try {
    const payload = buildFullPrefsSkillsPayload();

    const { data, error } = await supabase.rpc('rpc_save_prefs_skills', { payload });
    if (error) throw error;
    const updated = Array.isArray(data) ? data[0] : null;
    if (updated) setProfile(updated);
    toast.success('Document flags saved');
  } catch (e) {
    toast.error(e.message || 'Could not save document flags');
  } finally {
    setSavingDocFlags(false);
  }
};

  const [persistedPaths, setPersistedPaths] = useState([]);
  const [expCount, setExpCount] = useState(0);
  const [refsCount, setRefsCount] = useState(0);
  const publicUrl = useMemo(() => {
    if (!profile?.handle) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/cv/${profile.handle}`;
  }, [profile?.handle]);

  const inferTypeByName = (nameOrPath = '') => (
    /\.(mp4|webm|mov|m4v|avi|mkv)$/i.test(nameOrPath) ? 'video' : 'image'
  );

  const hydrateGallery = async (items) => {
    const list = Array.isArray(items) ? items : [];
    return Promise.all(list.map(async (it) => {
      const base = typeof it === 'object' && it !== null ? it : {};
      if (base.url && /^https?:\/\//i.test(base.url)) {
        return {
          url: base.url,
          path: base.path || null,
          type: base.type || inferTypeByName(base.url),
          name: base.name || null,
          size: base.size ?? null,
        };
      }
      if (base.path && base.path.startsWith('cv-docs/')) {
        const filePath = base.path.replace(/^cv-docs\//, '');
        const { data, error } = await supabase.storage
          .from('cv-docs')
          .createSignedUrl(filePath, 3600);
        const signed = error ? '' : (data?.signedUrl || '');
        const fname = filePath.split('/').pop() || '';
        return {
          url: signed,
          path: base.path,
          type: base.type || inferTypeByName(filePath),
          name: base.name || fname,
          size: base.size ?? null,
        };
      }
      return base;
    }));
  };

  useEffect(() => {
    let cancelled = false;

    function normalizeLanguageLevels(arr) {
      if (!Array.isArray(arr)) return [];
      return arr.map((item) => {
        if (typeof item === 'string') {
          try {
            if (item.trim().startsWith('{')) {
              const obj = JSON.parse(item);
              if (obj && obj.lang) return { lang: obj.lang, level: obj.level || '' };
            }
            if (item.includes(':')) {
              const [lang, level] = item.split(':');
              return { lang: lang?.trim(), level: level?.trim() };
            }
            return { lang: item, level: '' };
          } catch {
            return { lang: item, level: '' };
          }
        }
        if (item && typeof item === 'object' && item.lang) {
          return { lang: item.lang, level: item.level || '' };
        }
        return { lang: String(item ?? ''), level: '' };
      });
    }

    async function init() {
      setLoading(true);
      setError('');
      try {
        const { data, error } = await supabase.rpc('rpc_create_or_get_profile');
        if (error) throw error;

        const rawGallery = Array.isArray(data?.gallery) ? data.gallery : [];
        const hydratedGallery = await hydrateGallery(rawGallery);

        if (!cancelled) {
          setProfile(data || null);
          setGallery(hydratedGallery);
          setPersistedPaths(rawGallery.map((g) => g?.path).filter(Boolean));

          setHeadline(data?.headline || '');
          setSummary(data?.summary || '');

          setPrimaryDepartment(data?.primary_department || '');
          setPrimaryRank(data?.primary_role || '');
          setTargetRanks(Array.isArray(data?.target_ranks) ? data.target_ranks : []);

          setAvailability(data?.availability || '');
          setLocations(Array.isArray(data?.locations) ? data.locations : []);
          setLanguages(Array.isArray(data?.languages) ? data.languages : []);
          setSkills(Array.isArray(data?.skills) ? data.skills : []);

          setContracts(Array.isArray(data?.contract_types) ? data.contract_types : []);
          setRegionsSeasons(Array.isArray(data?.regions) ? data.regions : []);
          setRateSalary(
            data?.compensation && typeof data.compensation === 'object'
              ? data.compensation
              : { currency: 'USD', dayRateMin: '', salaryMin: '' }
          );
          setLanguageLevels(normalizeLanguageLevels(data?.languages));
          setDeptSpecialties(Array.isArray(data?.skills) ? data.skills : []);

          const ps = (data && data.prefs_skills && typeof data.prefs_skills === 'object') ? data.prefs_skills : {};

          setAvailability(
            ps?.availability ?? (data?.availability || '')
          );

          setLanguageLevels(
            Array.isArray(ps?.languageLevels)
              ? ps.languageLevels
              : normalizeLanguageLevels(data?.languages)
          );

          setRegionsSeasons(
            Array.isArray(ps?.regionsSeasons)
              ? ps.regionsSeasons
              : (Array.isArray(data?.regions) ? data.regions : [])
          );

          setRateSalary(
            ps?.rateSalary && typeof ps.rateSalary === 'object'
              ? ps.rateSalary
              : (data?.compensation && typeof data.compensation === 'object'
                ? data.compensation
                : { currency: 'USD', dayRateMin: '', salaryMin: '' })
          );

          setContracts(
            Array.isArray(ps?.contracts)
              ? ps.contracts
              : (Array.isArray(data?.contract_types) ? data.contract_types : [])
          );

          setDeptSpecialties(
            Array.isArray(ps?.deptSpecialties)
              ? ps.deptSpecialties
              : (Array.isArray(data?.skills) ? data.skills : [])
          );

          setRotation(Array.isArray(ps?.rotation) ? ps.rotation : (ps?.rotation ? [ps.rotation] : []));
          setVesselTypes(Array.isArray(ps?.vesselTypes) ? ps.vesselTypes : []);
          setVesselSizeRange(ps?.vesselSizeRange ?? []); // acepta [] o {min,max,unit}
          setProgramTypes(Array.isArray(ps?.programTypes) ? ps.programTypes : []);
          setDietaryRequirements(Array.isArray(ps?.dietaryRequirements) ? ps.dietaryRequirements : []);
          setOnboardPrefs(ps?.onboardPrefs && typeof ps.onboardPrefs === 'object' ? ps.onboardPrefs : {});
          setStatus(ps?.status || '');
          setDocFlags({
            ...DEFAULT_DOC_FLAGS,
            ...(ps && typeof ps.docFlags === 'object' ? ps.docFlags : {}),
          });

          const lh = ps && typeof ps.lifestyleHabits === 'object' ? ps.lifestyleHabits : {};
          setLifestyleHabits({
            tattoosVisible: lh.tattoosVisible || '',
            smoking: lh.smoking || '',
            vaping: lh.vaping || '',
            alcohol: lh.alcohol || '',
            dietaryAllergies: Array.isArray(lh.dietaryAllergies) ? lh.dietaryAllergies : [],
            fitness: lh.fitness || '',
          });

          setPersonal((p) => ({
            ...p,
            first_name: data?.first_name || '',
            last_name: data?.last_name || '',
            email_public: data?.email_public || '',
            phone_cc: data?.phone_cc || '',
            phone_number: data?.phone_number || '',
            whatsapp_same: data?.whatsapp_same ?? true,
            whatsapp_cc: data?.whatsapp_cc || '',
            whatsapp_number: data?.whatsapp_number || '',
            country: data?.country || '',
            city_port: data?.city_port || '',
            nationalities: Array.isArray(data?.nationalities) ? data.nationalities : [],
            birth_month: data?.birth_month ?? null,
            birth_year: data?.birth_year ?? null,
            show_email_public: !!data?.show_email_public,
            show_phone_public: !!data?.show_phone_public,
            show_age_public: !!data?.show_age_public,
            contact_pref: data?.contact_pref || '',
            linkedin: data?.linkedin || '',
            instagram: data?.instagram || '',
            facebook: data?.facebook || '',
            website: data?.website || '',
            gender: data?.gender || '',
          }));
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load candidate profile.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const mapDbVisibilityToUi = (v) => {
    const s = String(v || '').toLowerCase();
    if (s === 'public') return 'public';
    if (s === 'private') return 'private';
    return 'unlisted';
  };

  async function loadDocsForProfile(profileId) {
    const { data: docsRows, error: docsErr } = await supabase
      .from('public_documents')
      .select('id, file_url, title, visibility, created_at')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (docsErr) throw docsErr;

    const { data: certRows, error: certErr } = await supabase
      .from('candidate_certificates')
      .select('file_url, issued_on, expires_on')
      .eq('profile_id', profileId);

    if (certErr) throw certErr;

    const certByPath = new Map(
      (certRows || []).map((c) => [String(c.file_url || ''), c])
    );

    return (docsRows || []).map((r) => {
      const cert = certByPath.get(String(r.file_url || ''));
      return {
        id: String(r.id),
        title: (r.title || 'Untitled document'),
        issuedOn: cert?.issued_on || undefined,
        expiresOn: cert?.expires_on || undefined,
        visibility: mapDbVisibilityToUi(r.visibility),
        mimeType: undefined,
        sizeBytes: undefined,
      };
    });
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!profile?.id) return;
      try {
        const loaded = await loadDocsForProfile(profile.id);
        if (!cancelled) setDocs(loaded);
      } catch (e) {
        if (!cancelled) console.warn('Load docs failed:', e);
      }
    })();
    return () => { cancelled = true; };
  }, [profile?.id]);

useEffect(() => {
  let cancelled = false;
  (async () => {
    if (!profile?.user_id) return;
    try {
      const { count, error } = await supabase
        .from('cv_education')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profile.user_id);
      if (!cancelled && !error) setEducationCount(count || 0);
    } catch {
      if (!cancelled) setEducationCount(0);
    }
  })();
  return () => { cancelled = true; };
}, [profile?.user_id]);

useEffect(() => {
  let cancelled = false;
  (async () => {
    if (!profile?.id) return;

    try {
      const { count, error } = await supabase
        .from('profile_experiences')
        .select('id', { count: 'exact', head: true })
        .eq('profile_id', profile.id);
      if (!cancelled && !error) setExpCount(count || 0);
    } catch {
      if (!cancelled) setExpCount(0);
    }

    try {
      const { count, error } = await supabase
        .from('public_references')
        .select('id', { count: 'exact', head: true })
        .eq('profile_id', profile.id);
      if (!cancelled && !error) setRefsCount(count || 0);
    } catch {
      if (!cancelled) setRefsCount(0);
    }
  })();
  return () => { cancelled = true; };
}, [profile?.id]);

  const openAnalytics = () => {
    const h = profile?.handle;
    if (h) navigate(`/cv/analytics?handle=${encodeURIComponent(h)}`);
    else navigate(`/cv/analytics`);
  };

  const handleCopy = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const handlePreview = () => {
    if (!publicUrl) return;
    const isMobile = window.innerWidth <= 720;
    if (isMobile) {
      window.location.href = `${publicUrl}?preview=1`;
      return;
    }
    window.open(`${publicUrl}?preview=1`, '_blank', 'noopener,noreferrer');
  };

const generateShortHandle = () => {
  try {
    const bytes = new Uint8Array(4);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < 4; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return Math.random().toString(16).slice(2, 10);
  }
};

  const handleRotate = async () => {
  if (!profile?.id) return;

  const ok = window.confirm(
    'Rotate link?\nYour current CV link will stop working and a new one will be generated.'
  );
  if (!ok) return;

  setSaving(true);
  try {
    for (let attempt = 0; attempt < 6; attempt++) {
      const nextHandle = generateShortHandle();

      const { data, error } = await supabase
        .from('public_profiles')
        .update({
          handle: nextHandle,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (!error) {
        setProfile(data || null);
        toast.success('Link rotated successfully');
        return;
      }

      const msg = `${error?.message || ''} ${error?.details || ''}`;
      if (!/duplicate|unique/i.test(msg)) throw error;
    }

    toast.error('Could not generate a unique link. Please try again.');
  } catch (e) {
    toast.error(e.message || 'Could not rotate link');
  } finally {
    setSaving(false);
  }
};

  const handleSavePersonal = async (e) => {
    e.preventDefault();
    if (!profile?.id) return;

    if (!personal.first_name?.trim() || !personal.last_name?.trim() || !personal.email_public?.trim()) {
      toast.error('Please complete first name, last name and email.');
      return;
    }

    const payload = {
      ...personal,
      ...(personal.whatsapp_same
        ? {
            whatsapp_cc: personal.phone_cc || null,
            whatsapp_number: personal.phone_number || null,
          }
        : {}),
      updated_at: new Date().toISOString(),
    };

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('public_profiles')
        .update(payload)
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      toast.success('Personal details saved');
    } catch (e) {
      toast.error(e.message || 'Could not save personal details');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDeptRanks = async (e) => {
    e.preventDefault();
    if (!profile?.id) return;

    if (!primaryDepartment) {
      toast.error('Please choose a department.');
      return;
    }
    if (!primaryRank) {
      toast.error('Please choose a primary rank.');
      return;
    }
    if (Array.isArray(targetRanks) && targetRanks.length > 3) {
      toast.error('You can select up to 3 target ranks.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        primary_department: primaryDepartment || null,
        primary_role: primaryRank || null,
        target_ranks: Array.isArray(targetRanks) ? targetRanks : null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('public_profiles')
        .update(payload)
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      toast.success('Department & ranks saved');
    } catch (e) {
      toast.error(e.message || 'Could not save department & ranks');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBasics = async (e) => {
    e.preventDefault();
    if (!profile?.id) return;

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('public_profiles')
        .update({
          headline: headline?.trim() || null,
          summary: summary?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      toast.success('Saved');
    } catch (e) {
      toast.error(e.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    if (!profile?.id) return;

  const payload = {
    ...buildPrefsSkillsPayload({
      status,
      availability,
      regionsSeasons,
      contracts,
      languageLevels,
      deptSpecialties,
      rateSalary,
      rotation,
      vesselTypes,
      vesselSizeRange,
      programTypes,
      dietaryRequirements,
      onboardPrefs,
    }),
    lifestyleHabits,
  };

    setSaving(true);
    try {
      const { data, error } = await supabase.rpc('rpc_save_prefs_skills', { payload });
      if (error) throw error;
      const updated = Array.isArray(data) ? data[0] : null;
      if (updated) setProfile(updated);
      toast.success('Preferences & Skills saved');
    } catch (e) {
      toast.error(e.message || 'Could not save Preferences & Skills');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadMedia = async (file) => {
    if (!profile?.user_id) throw new Error('Profile not loaded yet.');
    const uid = profile.user_id;

    const mediaId =
      (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    const safeName = (file?.name || 'upload')
      .normalize('NFC')
      .replace(/[^\w.\-]+/g, '_');

    const objectKey = `${uid}/media/${mediaId}/${safeName}`;

    const { error: upErr } = await supabase.storage
      .from('cv-docs')
      .upload(objectKey, file, { upsert: true, cacheControl: '3600' });
    if (upErr) throw upErr;

    const { data: signed, error: signErr } = await supabase.storage
      .from('cv-docs')
      .createSignedUrl(objectKey, 3600);
    if (signErr) throw signErr;

    const mt = (file?.type || '').toLowerCase();
    const isVideo = mt.startsWith('video/') || /\.(mp4|webm|mov|m4v|avi|mkv)$/i.test(safeName);
    const type = isVideo ? 'video' : 'image';

    return {
      url: signed.signedUrl,
      type,
      name: file?.name || safeName,
      size: file?.size ?? null,
      path: `cv-docs/${objectKey}`,
    };
  };

  const handleSaveAbout = async ({ about_me, professional_statement }) => {
    if (!profile?.id) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('public_profiles')
        .update({
          about_me: about_me || null,
          professional_statement: professional_statement || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      toast.success('Saved');
    } catch (e) {
      toast.error(e.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGallery = async () => {
    if (!profile?.id) return;
    setSavingGallery(true);
    try {
      const payload = (Array.isArray(gallery) ? gallery : [])
        .map(({ path, type, name, size, url }) => ({
          path: path || null,
          type: type || inferTypeByName(name || path || url || ''),
          name: name || null,
          size: Number.isFinite(size) ? size : null,
        }))
        .filter((it) => !!it.path);

      const prevSet = new Set(persistedPaths);
      const currSet = new Set(payload.map((it) => it.path));
      const removedPaths = [...prevSet].filter((p) => !currSet.has(p));

      const { data, error } = await supabase.rpc('rpc_save_gallery', { payload });
      if (error) throw error;

      setProfile(data);

      const hydrated = await hydrateGallery(Array.isArray(data?.gallery) ? data.gallery : []);
      setGallery(hydrated);

      const newPersisted = (Array.isArray(data?.gallery) ? data.gallery : [])
        .map((g) => g?.path)
        .filter(Boolean);
      setPersistedPaths(newPersisted);

      if (removedPaths.length) {
        const relative = removedPaths.map((p) => p.replace(/^cv-docs\//, ''));
        const { error: delErr } = await supabase.storage.from('cv-docs').remove(relative);
        if (delErr) {
          console.warn('Storage remove error', delErr);
          toast.warn('Some files could not be deleted from storage.');
        }
      }

      toast.success('Media saved');
    } catch (e) {
      toast.error(e.message || 'Could not save media');
    } finally {
      setSavingGallery(false);
    }
  };

  const handleSaveDocs = async (nextDocs = [], pendingFiles) => {
    try {
      setDocs(Array.isArray(nextDocs) ? nextDocs : []);

      if (!profile?.id || !profile?.user_id) {
        toast.error('Profile not loaded yet.');
        return;
      }
      const uid = profile.user_id;

      const fileMap = pendingFiles instanceof Map ? pendingFiles : new Map();

      let ok = 0;
      let fail = 0;

      for (const doc of Array.isArray(nextDocs) ? nextDocs : []) {
        const file = fileMap.get(doc.id);
        if (!file) continue;

        const objectKey = await uploadDocFile(uid, file);

        const docType = inferDocTypeFromDoc(doc, file);

        const insertDoc = {
          profile_id: profile.id,
          type: docType,
          file_url: `cv-docs/${objectKey}`,
          title: (doc.title || '').trim() || null,
          visibility: (doc.visibility || 'after_contact'),
        };

        const { error: docErr } = await supabase
          .from('public_documents')
          .insert([insertDoc]);

        if (docErr) {
          console.warn('public_documents insert error:', docErr);
          fail++;
          continue;
        }

        const hasDates = !!(doc.issuedOn || doc.expiresOn);
        if (hasDates) {
          const insertCert = {
            profile_id: profile.id,
            title: (doc.title || '').trim() || null,
            issuer: null,
            number: null,
            issued_on: doc.issuedOn || null,
            expires_on: doc.expiresOn || null,
            file_url: `cv-docs/${objectKey}`,
          };
          const { error: certErr } = await supabase
            .from('candidate_certificates')
            .insert([insertCert]);
          if (certErr) {
            console.warn('candidate_certificates insert error:', certErr);
          }
        }

        ok++;
      }

      if (ok && !fail) toast.success(`Saved ${ok} document(s).`);
      else if (ok && fail) toast.warn(`Saved ${ok} document(s), ${fail} failed.`);
      else if (!ok && !fail) toast.info('No new files to upload.');
      else toast.error('Could not save documents.');
    } catch (e) {
      console.error(e);
      toast.error(e.message || 'Could not save documents');
    }
  };

  const uploadDocFile = async (uid, file) => {
    const docId =
      (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const safeName = (file?.name || 'upload')
      .normalize('NFC')
      .replace(/[^\w.\-]+/g, '_');
    const objectKey = `${uid}/docs/${docId}/${safeName}`;
    const { error: upErr } = await supabase.storage
      .from('cv-docs')
      .upload(objectKey, file, { upsert: true, cacheControl: '3600' });
    if (upErr) throw upErr;
    return objectKey;
  };

  const inferDocTypeFromDoc = (doc, file) => {
    if (doc?.issuedOn || doc?.expiresOn) return 'certificate';
    const title = String(doc?.title || '').toLowerCase();
    const name = String(file?.name || '').toLowerCase();
    if (title.includes('cover') || name.includes('cover')) return 'cover';
    if (title.includes('cv') || title.includes('resume') || name.includes('cv') || name.includes('resume')) return 'cv';
    return 'cv';
  };

  const hasPersonal =
    !!(personal.first_name?.trim() && personal.last_name?.trim() && personal.email_public?.trim());

  const hasDeptRanks = !!(primaryDepartment && primaryRank);

  const hasExperienceHeuristic =
    (Array.isArray(profile?.experiences) && profile.experiences.length > 0) ||
    Number(profile?.experience_count || 0) > 0;

  const hasAbout =
    !!(profile?.about_me && String(profile.about_me).trim()) ||
    !!(profile?.professional_statement && String(profile.professional_statement).trim());

  const hasPrefsSkills =
    !!(availability && availability.trim()) ||
    (Array.isArray(locations) && locations.length > 0) ||
    (Array.isArray(languages) && languages.length > 0) ||
    (Array.isArray(skills) && skills.length > 0) ||
    (Array.isArray(contracts) && contracts.length > 0) ||
    (Array.isArray(rotation) && rotation.length > 0) ||
    (Array.isArray(vesselTypes) && vesselTypes.length > 0) ||
    (Array.isArray(vesselSizeRange) ? vesselSizeRange.length > 0
      : (vesselSizeRange && typeof vesselSizeRange === 'object' &&
         (vesselSizeRange.min || vesselSizeRange.max))) ||
    (Array.isArray(regionsSeasons) && regionsSeasons.length > 0) ||
    !!(rateSalary && (String(rateSalary.dayRateMin || '').trim() || String(rateSalary.salaryMin || '').trim())) ||
    (Array.isArray(languageLevels) && languageLevels.length > 0) ||
    (Array.isArray(deptSpecialties) && deptSpecialties.length > 0) ||
    (onboardPrefs && typeof onboardPrefs === 'object' && Object.values(onboardPrefs).some(Boolean)) ||
    (Array.isArray(programTypes) && programTypes.length > 0) ||
    (Array.isArray(dietaryRequirements) && dietaryRequirements.length > 0);

  const hasDocuments = Array.isArray(docs) && docs.length > 0;

  const hasReferencesHeuristic =
    (Array.isArray(profile?.references) && profile.references.length > 0) ||
    Number(profile?.references_count || 0) > 0;

  const hasMedia = Array.isArray(gallery) && gallery.length > 0;

  const isLite = profileMode === 'lite';
  const isProfessional = profileMode === 'professional';
  const showRequired = !isProfessional;
  const showOptional = !isLite;

  const personalProgress = isLite
    ? {
        first_name: !!personal.first_name?.trim(),
        last_name: !!personal.last_name?.trim(),
        email: !!personal.email_public?.trim(),
        phone_cc: !!personal.phone_cc,
        phone_number: !!personal.phone_number,
        country: !!personal.country,
        city_port: !!personal.city_port?.trim(),
        birth_month: !!personal.birth_month,
        birth_year: !!personal.birth_year,
        nationality: Array.isArray(personal.nationalities) && personal.nationalities.length > 0,
      }
    : {
        first_name: !!personal.first_name?.trim(),
        last_name: !!personal.last_name?.trim(),
        email: !!personal.email_public?.trim(),

        phone_cc: !!personal.phone_cc,
        phone_number: !!personal.phone_number,
        whatsapp_same: personal.whatsapp_same === true,
        whatsapp_cc: personal.whatsapp_same ? true : !!personal.whatsapp_cc,
        whatsapp_number: personal.whatsapp_same ? true : !!personal.whatsapp_number,

        residence_country: !!personal.residence_country,
        country: !!personal.country,
        city_port: !!personal.city_port?.trim(),
        contact_pref: !!personal.contact_pref,

        birth_month: !!personal.birth_month,
        birth_year: !!personal.birth_year,
        nationality: Array.isArray(personal.nationalities) && personal.nationalities.length > 0,

        gender: !!personal.gender,

        linkedin: personal.linkedin === '' || !!personal.linkedin,
        instagram: personal.instagram === '' || !!personal.instagram,
        facebook: personal.facebook === '' || !!personal.facebook,
        website: personal.website === '' || !!personal.website,
      };

  const deptRanksProgress = {
    count:
      (primaryDepartment ? 1 : 0) +
      (primaryRank ? 1 : 0) +
      (!isLite && Array.isArray(targetRanks) && targetRanks.length > 0 ? 1 : 0),
    total: isLite ? 2 : 3,
  };

const experienceProgress = { count: expCount > 0 ? 1 : 0, total: 1 };

  const aboutProgress = isLite
    ? { count: profile?.about_me?.trim() ? 1 : 0, total: 1 }
    : {
        count:
          (profile?.about_me?.trim() ? 1 : 0) +
          (profile?.professional_statement?.trim() ? 1 : 0),
        total: 2,
      };

  const lifestyleProgress = isLite
    ? {
        count:
          (lifestyleHabits?.tattoosVisible ? 1 : 0) +
          (Array.isArray(lifestyleHabits?.dietaryAllergies) &&
          lifestyleHabits.dietaryAllergies.length > 0
            ? 1
            : 0) +
          (lifestyleHabits?.fitness ? 1 : 0),
        total: 3,
      }
    : {
        count:
          (lifestyleHabits?.tattoosVisible ? 1 : 0) +
          (lifestyleHabits?.smoking ? 1 : 0) +
          (lifestyleHabits?.vaping ? 1 : 0) +
          (lifestyleHabits?.alcohol ? 1 : 0) +
          (Array.isArray(lifestyleHabits?.dietaryAllergies) &&
          lifestyleHabits.dietaryAllergies.length > 0
            ? 1
            : 0) +
          (lifestyleHabits?.fitness ? 1 : 0),
        total: 6,
      };

  const prefsSkillsDetail = isLite
    ? {
        status: !!(status && String(status).trim()),
        availability: !!(availability && availability.trim()),
        languageLevels: Array.isArray(languageLevels) && languageLevels.length > 0,
        deptSpecialties: Array.isArray(deptSpecialties) && deptSpecialties.length > 0,
      }
    : {
        status: !!(status && String(status).trim()),
        availability: !!(availability && availability.trim()),
        regionsSeasons: Array.isArray(regionsSeasons) && regionsSeasons.length > 0,
        contracts: Array.isArray(contracts) && contracts.length > 0,
        rotation: Array.isArray(rotation) && rotation.length > 0,
        vesselTypes: Array.isArray(vesselTypes) && vesselTypes.length > 0,
        vesselSizeRange: (vesselSizeRange && typeof vesselSizeRange === 'object'
          ? (vesselSizeRange.min != null && vesselSizeRange.max != null)
          : Array.isArray(vesselSizeRange) && vesselSizeRange.length > 0),
        rateSalary: !!(rateSalary && (
          String(rateSalary.dayRateMin || '').trim() ||
          String(rateSalary.salaryMin || '').trim()
        )),
        languageLevels: Array.isArray(languageLevels) && languageLevels.length > 0,
        deptSpecialties: Array.isArray(deptSpecialties) && deptSpecialties.length > 0,
        programTypes: Array.isArray(programTypes) && programTypes.length > 0,
        dietaryRequirements: Array.isArray(dietaryRequirements) && dietaryRequirements.length > 0,
        onboardPrefs: (onboardPrefs && typeof onboardPrefs === 'object' && Object.values(onboardPrefs).some(Boolean)),
      };
const prefsSkillsProgress = {
  count: Object.values(prefsSkillsDetail).filter(Boolean).length,
  total: Object.keys(prefsSkillsDetail).length,
};

const selectedDocFlags = Object.values(docFlags || {}).filter((v) => typeof v === 'boolean').length;
const documentsProgress = { count: selectedDocFlags, total: 9 };

const referencesProgress = { count: refsCount > 0 ? 1 : 0, total: 1 };

const educationProgress = { count: (educationCount || 0) > 0 ? 1 : 0, total: 1 };

const mediaProgress = {
  count: Math.min(gallery.length, isLite ? 3 : 9),
  total: isLite ? 3 : 9,
};

const galleryImagesCount = Array.isArray(gallery)
  ? gallery.filter((it) => (it?.type || inferTypeByName(it?.name || it?.path || it?.url || '')) === 'image').length
  : 0;
const meetsPhotosImagesMin = galleryImagesCount >= 3;

const progressSections = {
  personal: personalProgress,
  dept_ranks: deptRanksProgress,
  experience: experienceProgress,
  about_me: aboutProgress,
  lifestyle: lifestyleProgress,
  prefs_skills: prefsSkillsProgress,
  education: educationProgress,
  documents: documentsProgress,
  references: referencesProgress,
  photos_videos: mediaProgress,
};

const meetsPrefsMin =
  !!(status && String(status).trim()) &&
  !!(availability && String(availability).trim()) &&
  (Array.isArray(languageLevels) &&
    languageLevels.some((ll) => ll && ll.lang && ll.level)) &&
  (Array.isArray(deptSpecialties) && deptSpecialties.length > 0);

  const meetsLifestyleMin =
  !!(lifestyleHabits?.tattoosVisible && String(lifestyleHabits.tattoosVisible).trim()) &&
  Array.isArray(lifestyleHabits?.dietaryAllergies) && lifestyleHabits.dietaryAllergies.length > 0 &&
  !!(lifestyleHabits?.fitness && String(lifestyleHabits.fitness).trim());

  const meetsMediaMin = Array.isArray(gallery) && gallery.length >= 3;

  const meetsAboutMin = !!(profile?.about_me && String(profile.about_me).trim());

  const meetsPrefsSkillsMin =
    !!(status && String(status).trim()) &&
    !!(availability && String(availability).trim()) &&
    hasLanguagesWithLevel(languageLevels) &&
    hasDeptSkills(deptSpecialties);

  const meetsExperienceMin = Number(expCount || 0) >= 1;

  const meetsEducationMin = Number(educationCount || 0) >= 1;

  const meetsDocumentsMin = docsMeetMin(docs) && allDocFlagsSelected(docFlags);

  const meetsReferencesMin = Number(refsCount || 0) >= 1;

  const meetsPersonalMin = personalMeetsMin(personal);

  const isShareReady = Boolean(
    meetsPersonalMin &&
    hasDeptRanks &&
    meetsExperienceMin &&
    meetsAboutMin &&
    meetsPrefsSkillsMin &&
    meetsLifestyleMin &&
    meetsEducationMin &&
    meetsDocumentsMin &&
    meetsReferencesMin &&
    meetsMediaMin
  );

  useEffect(() => {
    if (!profile?.id) return;
    if (shareReadyPersistTimer) clearTimeout(shareReadyPersistTimer);
    const t = setTimeout(async () => {
      try {
        await supabase
          .from('public_profiles')
          .update({ share_ready: isShareReady, updated_at: new Date().toISOString() })
          .eq('id', profile.id);
      } catch (_e) {
        // silencioso
      }
    }, 600);
    setShareReadyPersistTimer(t);
    return () => clearTimeout(t);
  }, [
    profile?.id,
    isShareReady,
    personal, hasDeptRanks, expCount, status, availability,
    languageLevels, deptSpecialties, lifestyleHabits,
    educationCount, docs, docFlags, refsCount, gallery, profile?.about_me
  ]);

  return (
    <div className={`candidate-profile-tab ${isLite ? 'cp-mode-lite' : 'cp-mode-professional'}`}>
      <h2>Candidate Profile</h2>
      <div className="cp-mode-tabs" role="tablist" aria-label="Candidate profile mode">
        <button
          type="button"
          role="tab"
          aria-selected={isLite ? 'true' : 'false'}
          className={`cp-mode-tab ${isLite ? 'active' : ''}`}
          onClick={() => handleModeChange('lite')}
          disabled={savingMode}
        >
          Lite
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={!isLite ? 'true' : 'false'}
          className={`cp-mode-tab ${!isLite ? 'active' : ''}`}
          onClick={() => handleModeChange('professional')}
          disabled={savingMode || !isShareReady}
          title={!isShareReady ? 'Complete Lite before unlocking Professional' : undefined}
        >
          Professional
        </button>
      </div>

    {!isShareReady && !loading && !error && (
      <div className="ppv-previewRibbon" role="status" aria-live="polite">
        Your public link is disabled until you complete the minimum required fields across all sections.
      </div>
    )}

      <ProfileProgress sections={progressSections} />

      {loading && <p>Loading…</p>}
      {error && !loading && <p style={{ color: '#b00020' }}>Error: {error}</p>}

      {!loading && !error && (
        <>
          {/* Shareable link (AL TOPE) */}
          <div className="cp-card">
          <div className="cp-actions cp-shareActions" role="group" aria-label="Share actions">
            <button className="cp-btn" type="button" onClick={openAnalytics} disabled={saving}>
              Analytics
            </button>
            {/* Preview siempre habilitado si hay URL */}
            <button
              className="cp-btn"
              type="button"
              onClick={handlePreview}
              disabled={!publicUrl || saving}
              title={!publicUrl ? 'Link not generated yet' : undefined}
            >
              Preview
            </button>
            {/* Copy link: solo requiere tener URL y no estar guardando */}
            <button
              className="cp-btn"
              type="button"
              onClick={handleCopy}
              disabled={!publicUrl || saving || !isShareReady}
              title={
                !publicUrl
                  ? 'Link not generated yet'
                  : !isShareReady
                  ? 'Complete the minimum required fields to enable sharing'
                  : undefined
              }
            >
              Copy link
            </button>
            {/* Rotate link: solo requiere perfil cargado y no estar guardando */}
            <button
              className="cp-btn cp-rotate"
              type="button"
              onClick={handleRotate}
              disabled={!profile || saving || !isShareReady}
              title={
                !isShareReady
                  ? 'Complete the minimum required fields to enable rotate'
                  : 'Revoke current link and generate a new one'
              }
            >
              Rotate link
            </button>
          </div>
        </div>

          {/* Personal details */}
          <div className="cp-card">
            <h3 className="cp-h3">Personal details</h3>
            <PersonalDetailsSection
              profile={profile}
              onSaved={(data) => setProfile(data)}
              mode={profileMode}
            />
          </div>

          {/* Department & Ranks — NUEVA (cvsections) */}
          <div className="cp-card">
            <h3 className="cp-h3">Department & ranks</h3>
            <p className="cp-help">
              {showRequired
                ? 'Select your department and main rank. Target ranks are optional.'
                : 'Add optional target ranks (up to 3).'}
            </p>
            <form onSubmit={handleSaveDeptRanks} className="cp-form">
              <DepartmentRankSectionNew
                department={primaryDepartment}
                onDepartmentChange={(v) => setPrimaryDepartment(v)}
                role={primaryRank}
                onRoleChange={(v) => setPrimaryRank(v)}
                targets={targetRanks}
                onTargetsChange={(arr) => setTargetRanks(arr)}
                maxTargets={3}
                primaryDepartment={primaryDepartment}
                onChangePrimaryDepartment={(v) => setPrimaryDepartment(v)}
                primaryRank={primaryRank}
                onChangePrimaryRank={(v) => setPrimaryRank(v)}
                targetRanks={targetRanks}
                onChangeTargetRanks={(arr) => setTargetRanks(arr)}
                showTargets={showOptional}
                showPrimary={showRequired}
                showRequiredMark={!isLite}
              />
              <div className="cp-actions" style={{ marginTop: 10 }}>
                <button
                  type="submit"
                  disabled={saving || (showRequired && !hasDeptRanks)}
                  title={showRequired && !hasDeptRanks ? 'Please choose Primary department and Primary rank' : undefined}
                >
                  Save
                </button>
              </div>
            </form>
          </div>

          {/* Experience — NUEVA implementación desde cvsections */}
          {showRequired ? (
            <div className="cp-card">
              <h3 className="cp-h3">Experience</h3>
              <ExperienceSection
                profileId={profile?.id}
                onCountChange={(n) => setExpCount(Number(n) || 0)}
                mode="lite"
                showAllFields
              />
            </div>
          ) : null}

          {/* NUEVO: About me + Professional Statement (después de Experience) */}
          <div className="cp-card">
            <h3 className="cp-h3">About me</h3>
            <AboutMeSection
              profile={profile}
              onSave={handleSaveAbout}
              mode={profileMode}
            />
          </div>

          {/* Preferences & Skills */}
          <div className="cp-card">
            <h3 className="cp-h3">Preferences &amp; Skills</h3>
            <form onSubmit={handleSaveDetails} className="cp-form">
              <PreferencesSkills
                status={status}
                onChangeStatus={setStatus}
                availability={availability}
                onChangeAvailability={setAvailability}
                locations={locations}
                onChangeLocations={setLocations}
                languages={languages}
                onChangeLanguages={setLanguages}
                skills={skills}
                onChangeSkills={setSkills}
                contracts={contracts}
                onChangeContracts={setContracts}
                rotation={rotation}
                onChangeRotation={setRotation}
                vesselTypes={vesselTypes}
                onChangeVesselTypes={setVesselTypes}
                vesselSizeRange={vesselSizeRange}
                onChangeVesselSizeRange={setVesselSizeRange}
                regionsSeasons={regionsSeasons}
                onChangeRegionsSeasons={setRegionsSeasons}
                rateSalary={rateSalary}
                onChangeRateSalary={setRateSalary}
                languageLevels={languageLevels}
                onChangeLanguageLevels={setLanguageLevels}
                deptSpecialties={deptSpecialties}
                onChangeDeptSpecialties={setDeptSpecialties}
                onboardPrefs={onboardPrefs}
                onChangeOnboardPrefs={setOnboardPrefs}
                programTypes={programTypes}
                onChangeProgramTypes={setProgramTypes}
                dietaryRequirements={dietaryRequirements}
                onChangeDietaryRequirements={setDietaryRequirements}
                mode={profileMode}
              />
              <div className="cp-actions" style={{ marginTop: 12 }}>
                <button
                  type="submit"
                  disabled={saving || (showRequired && !meetsPrefsMin)}
                  title={
                    showRequired && !meetsPrefsMin
                      ? 'Complete Status, Availability, at least one Language with proficiency and at least one Specific skill'
                      : undefined
                  }
                >
                  Save
                </button>
              </div>
            </form>
          </div>

          {/* Lifestyle & Habits — solo Lite (sin duplicar con Professional) */}
          {isLite ? (
            <div className="cp-card">
              <h3 className="cp-h3">Lifestyle &amp; Habits</h3>
              <form onSubmit={handleSaveDetails} className="cp-form">
                <LifestyleHabitsSection
                  value={lifestyleHabits}
                  onChange={setLifestyleHabits}
                  mode={profileMode}
                />
                <div className="cp-actions" style={{ marginTop: 12 }}>
                  <button
                    type="submit"
                    disabled={saving || (showRequired && !meetsLifestyleMin)}
                    title={
                      showRequired && !meetsLifestyleMin
                        ? 'Complete: Visible tattoos, add at least one Dietary allergy (or “None”), and select Fitness / sport activity'
                        : undefined
                    }
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          {showRequired ? (
            <div className="cp-card">
              <h3 className="cp-h3">Education (Studies)</h3>
              <EducationSection showRequiredMark={!isLite} />
            </div>
          ) : null}

          {showRequired ? (
            <div className="cp-card">
              <h3 className="cp-h3">Documents &amp; Media</h3>
              <DocumentsSectionController
                initialDocs={docs}
                onSave={handleSaveDocs}
                initialDocFlags={docFlags}
                onDocFlagsChange={setDocFlags}
                onSaveDocFlags={handleSaveDocFlags}
                savingDocFlags={savingDocFlags}
              />
            </div>
          ) : null}

          {showRequired ? (
            <div className="cp-card">
              <h3 className="cp-h3">References</h3>
              <ReferencesSection
                profileId={profile?.id}
                onCountChange={(n) => setRefsCount(Number(n) || 0)}
                showRequiredMark={!isLite}
              />
            </div>
          ) : null}

          {showRequired ? (
            <div className="cp-card">
              <h3 className="cp-h3">Photos &amp; Videos</h3>
              <MediaSection
                value={gallery}
                onChange={setGallery}
                onUpload={handleUploadMedia}
              />
              <div className="cp-actions" style={{ marginTop: 12 }}>
                <button
                  type="button"
                  onClick={handleSaveGallery}
                  disabled={savingGallery || !meetsPhotosImagesMin}
                  title={!meetsPhotosImagesMin ? 'Add at least 3 images to enable Save' : undefined}
                >
                  Save
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
