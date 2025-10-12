// src/components/cv/CandidateProfileTab.js
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CandidateProfileTab.css';
import supabase from '../../supabase';
import { toast } from 'react-toastify';
import {
  ProfileProgress,
} from './candidate';
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

export default function CandidateProfileTab() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [headline, setHeadline] = useState('');
  const [summary, setSummary] = useState('');
  const [primaryDepartment, setPrimaryDepartment] = useState(''); // Deck / Engine / Interior / Galley / Others
  const [primaryRank, setPrimaryRank] = useState('');             // Rank principal dependiente del depto
  const [targetRanks, setTargetRanks] = useState([]);             // [{ department, rank }] (máx. 3)
  const [availability, setAvailability] = useState('');
  const [locations, setLocations] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [skills, setSkills] = useState([]);
  const [contracts, setContracts] = useState([]);                // string[]
  const [rotation, setRotation] = useState([]);                  // AHORA: string[]
  const [vesselTypes, setVesselTypes] = useState([]);            // string[]
  const [vesselSizeRange, setVesselSizeRange] = useState([]);    // puede ser [] o {min,max,unit}
  const [regionsSeasons, setRegionsSeasons] = useState([]);      // string[]
  const [rateSalary, setRateSalary] = useState({                 // { currency, dayRateMin, salaryMin }
    currency: 'USD',
    dayRateMin: '',
    salaryMin: '',
  });
  const [languageLevels, setLanguageLevels] = useState([]);      // Array<{ lang, level }>
  const [deptSpecialties, setDeptSpecialties] = useState([]);    // string[]
  const [onboardPrefs, setOnboardPrefs] = useState({});          // { flags booleanos }
  const [programTypes, setProgramTypes] = useState([]);          // string[]
  const [dietaryRequirements, setDietaryRequirements] = useState([]); // string[]

    // Lifestyle & Habits
  const [lifestyleHabits, setLifestyleHabits] = useState({
    tattoosVisible: '',
    smoking: '',
    vaping: '',
    alcohol: '',
    dietaryAllergies: [],
    fitness: '',
  });

  // Personal details (nuevo bloque)
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

  // NUEVO: Docs & Media (estado local — sin persistencia aún)
  const [docs, setDocs] = useState([]);

  // NUEVO: estado controlado de la galería + guardado local
  const [gallery, setGallery] = useState([]);
  const [savingGallery, setSavingGallery] = useState(false);
  // NUEVO: paths actualmente persistidos (para saber qué borrar en storage)
  const [persistedPaths, setPersistedPaths] = useState([]);

  // NUEVO: banderas de completitud consultadas en el padre (sin tocar hijos)
  const [expCount, setExpCount] = useState(0);
  const [refsCount, setRefsCount] = useState(0);

  const publicUrl = useMemo(() => {
    if (!profile?.handle) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/cv/${profile.handle}`;
  }, [profile?.handle]);

  // util: inferir tipo por nombre o mimetype
  const inferTypeByName = (nameOrPath = '') => (
    /\.(mp4|webm|mov|m4v|avi|mkv)$/i.test(nameOrPath) ? 'video' : 'image'
  );

  // hidratar paths -> signed URLs (1h)
  const hydrateGallery = async (items) => {
    const list = Array.isArray(items) ? items : [];
    return Promise.all(list.map(async (it) => {
      const base = typeof it === 'object' && it !== null ? it : {};
      // si ya viene url http(s), la usamos tal cual
      if (base.url && /^https?:\/\//i.test(base.url)) {
        return {
          url: base.url,
          path: base.path || null,
          type: base.type || inferTypeByName(base.url),
          name: base.name || null,
          size: base.size ?? null,
        };
      }
      // si viene path del bucket privado
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
      // fallback
      return base;
    }));
  };

  // Carga inicial de perfil + galería hidratada
  useEffect(() => {
    let cancelled = false;

    // Normaliza languages: text[] con strings tipo '{"lang":"..","level":".."}' o 'English:C1'
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

        // hidratar galería ANTES de setear estados que la usen
        const rawGallery = Array.isArray(data?.gallery) ? data.gallery : [];
        const hydratedGallery = await hydrateGallery(rawGallery);

        if (!cancelled) {
          setProfile(data || null);
          setGallery(hydratedGallery);
          setPersistedPaths(rawGallery.map((g) => g?.path).filter(Boolean));

          // Basics
          setHeadline(data?.headline || '');
          setSummary(data?.summary || '');

          // Department & ranks
          setPrimaryDepartment(data?.primary_department || '');
          setPrimaryRank(data?.primary_role || '');
          setTargetRanks(Array.isArray(data?.target_ranks) ? data.target_ranks : []);

          // Preferences & Skills (legacy)
          setAvailability(data?.availability || '');
          setLocations(Array.isArray(data?.locations) ? data.locations : []);
          setLanguages(Array.isArray(data?.languages) ? data.languages : []);
          setSkills(Array.isArray(data?.skills) ? data.skills : []);

          // >>> Precarga desde columnas legacy adicionales
          setContracts(Array.isArray(data?.contract_types) ? data.contract_types : []);
          setRegionsSeasons(Array.isArray(data?.regions) ? data.regions : []);
          setRateSalary(
            data?.compensation && typeof data.compensation === 'object'
              ? data.compensation
              : { currency: 'USD', dayRateMin: '', salaryMin: '' }
          );
          setLanguageLevels(normalizeLanguageLevels(data?.languages));
          setDeptSpecialties(Array.isArray(data?.skills) ? data.skills : []);

          // >>> Precarga desde prefs_skills (JSONB)
          const ps = (data && data.prefs_skills && typeof data.prefs_skills === 'object') ? data.prefs_skills : {};
          // rotation puede venir como string o como array -> normalizamos a array
          setRotation(Array.isArray(ps?.rotation) ? ps.rotation : (ps?.rotation ? [ps.rotation] : []));
          setVesselTypes(Array.isArray(ps?.vesselTypes) ? ps.vesselTypes : []);
          setVesselSizeRange(ps?.vesselSizeRange ?? []); // acepta [] o {min,max,unit}
          setProgramTypes(Array.isArray(ps?.programTypes) ? ps.programTypes : []);
          setDietaryRequirements(Array.isArray(ps?.dietaryRequirements) ? ps.dietaryRequirements : []);
          setOnboardPrefs(ps?.onboardPrefs && typeof ps.onboardPrefs === 'object' ? ps.onboardPrefs : {});

                    // Lifestyle & Habits (JSONB dentro de prefs_skills)
          const lh = ps && typeof ps.lifestyleHabits === 'object' ? ps.lifestyleHabits : {};
          setLifestyleHabits({
            tattoosVisible: lh.tattoosVisible || '',
            smoking: lh.smoking || '',
            vaping: lh.vaping || '',
            alcohol: lh.alcohol || '',
            dietaryAllergies: Array.isArray(lh.dietaryAllergies) ? lh.dietaryAllergies : [],
            fitness: lh.fitness || '',
          });

          // Personal details
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

  // ⬇️ Cargar documentos cuando ya tenemos profile.id
  const mapDbVisibilityToUi = (v) => {
    const s = String(v || '').toLowerCase();
    if (s === 'public') return 'public';
    if (s === 'private') return 'private';
    // 'after_contact' u otros → 'unlisted'
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

// ⬇️ NUEVO: conteo directo (numérico) para Experience y References
useEffect(() => {
  let cancelled = false;
  (async () => {
    if (!profile?.id) return;

    // EXPERIENCES (usar la tabla real que lista las experiencias)
    try {
      const { count, error } = await supabase
        .from('profile_experiences')
        .select('id', { count: 'exact', head: true })
        .eq('profile_id', profile.id);
      if (!cancelled && !error) setExpCount(count || 0);
    } catch {
      if (!cancelled) setExpCount(0);
    }

    // REFERENCES
    try {
      const { count, error } = await supabase
        .from('candidate_references')
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
    window.open(`${publicUrl}?preview=1`, '_blank', 'noopener,noreferrer');
  };

  // --- helper: generar un handle corto único (8 hex) ---
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
    // fallback
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
    // Reintenta varias veces por si choca con la UNIQUE(public_profiles.handle)
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
        setProfile(data || null); // esto refresca publicUrl
        toast.success('Link rotated successfully');
        return;
      }

      const msg = `${error?.message || ''} ${error?.details || ''}`;
      // Si el error NO es por unique/duplicate, detenemos
      if (!/duplicate|unique/i.test(msg)) throw error;
      // si es duplicado, sigue al siguiente intento
    }

    toast.error('Could not generate a unique link. Please try again.');
  } catch (e) {
    toast.error(e.message || 'Could not rotate link');
  } finally {
    setSaving(false);
  }
};

  // Guardar PERSONAL DETAILS
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

  // Guardar Department + Ranks
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

  // Guardar "Basics" (compat)
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

  // Guardar Preferences & Skills con RPC
  const handleSaveDetails = async (e) => {
    e.preventDefault();
    if (!profile?.id) return;

    const payload = {
  ...buildPrefsSkillsPayload({
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

  // —— handler para subir media (cv-docs)
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

  // —— guardar About me / Professional Statement ——
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

  // —— guardar galería (rpc_save_gallery) —
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

  // —— persistencia de Documents & Media ——
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

  // ---------- Progreso (8 secciones visibles) ----------
  const hasPersonal =
    !!(personal.first_name?.trim() && personal.last_name?.trim() && personal.email_public?.trim());

  const hasDeptRanks = !!(primaryDepartment && primaryRank);

  // heurísticas por si el RPC ya trae arrays/conteos;
  // las banderas expComplete/refsComplete (consultadas arriba) prevalecen.
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

  const personalProgress = {
  first_name: !!personal.first_name?.trim(),
  last_name: !!personal.last_name?.trim(),
  email: !!personal.email_public?.trim(),
  country: !!personal.country,
  city_port: !!personal.city_port?.trim(),
  phone: !!(personal.phone_cc && personal.phone_number),
  nationality: Array.isArray(personal.nationalities) && personal.nationalities.length > 0,
  gender: !!personal.gender,
};

// Department & Ranks: 3 pasos (dept, rank, al menos 1 target opcional)
const deptRanksProgress = {
  count:
    (primaryDepartment ? 1 : 0) +
    (primaryRank ? 1 : 0) +
    (Array.isArray(targetRanks) && targetRanks.length > 0 ? 1 : 0),
  total: 3,
};

// Experience: cap a 3 experiencias para 100%
const experienceProgress = { count: Math.min(expCount, 3), total: 3 };

// About me: 2 campos (about_me y professional_statement)
const aboutProgress = {
  count:
    (profile?.about_me?.trim() ? 1 : 0) +
    (profile?.professional_statement?.trim() ? 1 : 0),
  total: 2,
};

// Preferences & Skills: 10 “slots” representativos
const prefsSkillsCount = [
  !!(availability && availability.trim()),
  Array.isArray(regionsSeasons) && regionsSeasons.length > 0,
  Array.isArray(contracts) && contracts.length > 0,
  Array.isArray(rotation) && rotation.length > 0,
  Array.isArray(vesselTypes) && vesselTypes.length > 0,
  Array.isArray(vesselSizeRange)
    ? vesselSizeRange.length > 0
    : (vesselSizeRange && typeof vesselSizeRange === 'object' &&
       (vesselSizeRange.min || vesselSizeRange.max)),
  !!(rateSalary && (String(rateSalary.dayRateMin || '').trim() || String(rateSalary.salaryMin || '').trim())),
  Array.isArray(languageLevels) && languageLevels.length > 0,
  Array.isArray(deptSpecialties) && deptSpecialties.length > 0,
  // agrupamos “otros” para no sobredimensionar la sección
  (onboardPrefs && typeof onboardPrefs === 'object' && Object.values(onboardPrefs).some(Boolean)) ||
    (Array.isArray(programTypes) && programTypes.length > 0) ||
    (Array.isArray(dietaryRequirements) && dietaryRequirements.length > 0),
].filter(Boolean).length;

const prefsSkillsProgress = { count: prefsSkillsCount, total: 10 };

// Documents: cap a 3 (CV + 2 docs/certs)
const documentsProgress = { count: Math.min(docs.length, 3), total: 3 };

// References: cap a 3
const referencesProgress = { count: Math.min(refsCount, 3), total: 3 };

// Media: cap a 6 ítems (fotos/videos)
const mediaProgress = { count: Math.min(gallery.length, 6), total: 6 };

// Objeto final para ProfileProgress (acepta booleans, ratios u objetos {count,total})
const progressSections = {
  personal: personalProgress,
  dept_ranks: deptRanksProgress,
  experience: experienceProgress,
  about_me: aboutProgress,
  prefs_skills: prefsSkillsProgress,
  documents_media: documentsProgress,
  references: referencesProgress,
  photos_videos: mediaProgress,
};

  return (
    <div className="candidate-profile-tab">
      <h2>Candidate Profile</h2>

      <ProfileProgress sections={progressSections} />

      {loading && <p>Loading…</p>}
      {error && !loading && <p style={{ color: '#b00020' }}>Error: {error}</p>}

      {!loading && !error && (
        <>
          {/* Shareable link (AL TOPE) */}
          <div className="cp-card">
            <h3 className="cp-h3">Your shareable link</h3>
            <p className="cp-muted" style={{ wordBreak: 'break-all' }}>
              {publicUrl || '—'}
            </p>
            <div className="cp-actions">
              <button type="button" onClick={openAnalytics} disabled={saving}>
                Analytics
              </button>
              <button type="button" onClick={handlePreview} disabled={!publicUrl || saving}>
                Preview
              </button>
              <button type="button" onClick={handleCopy} disabled={!publicUrl || saving}>
                Copy link
              </button>
              <button
                type="button"
                onClick={handleRotate}
                disabled={!profile || saving}
                className="cp-rotate"
                title="Revoke current link and generate a new one"
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
            />
          </div>

          {/* Department & Ranks — NUEVA (cvsections) */}
          <div className="cp-card">
            <h3 className="cp-h3">Department & ranks</h3>
            <p className="cp-help">
              Select your department, main rank, and up to 3 optional target ranks (they can be from other departments).
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
                /* Back-compat */
                primaryDepartment={primaryDepartment}
                onChangePrimaryDepartment={(v) => setPrimaryDepartment(v)}
                primaryRank={primaryRank}
                onChangePrimaryRank={(v) => setPrimaryRank(v)}
                targetRanks={targetRanks}
                onChangeTargetRanks={(arr) => setTargetRanks(arr)}
              />
              <div className="cp-actions" style={{ marginTop: 10 }}>
                <button type="submit" disabled={saving}>Save</button>
              </div>
            </form>
          </div>

          {/* Experience — NUEVA implementación desde cvsections */}
          <div className="cp-card">
            <h3 className="cp-h3">Experience</h3>
            <ExperienceSection
              profileId={profile?.id}
              onCountChange={(n) => setExpCount(Number(n) || 0)}
            />
          </div>

          {/* NUEVO: About me + Professional Statement (después de Experience) */}
          <div className="cp-card">
            <h3 className="cp-h3">About me</h3>
            <AboutMeSection
              profile={profile}
              onSave={handleSaveAbout}
            />
          </div>

          {/* Preferences & Skills */}
          <div className="cp-card">
            <h3 className="cp-h3">Preferences &amp; Skills</h3>
            <form onSubmit={handleSaveDetails} className="cp-form">
              <PreferencesSkills
                /* Compat antiguos */
                availability={availability}
                onChangeAvailability={setAvailability}
                locations={locations}
                onChangeLocations={setLocations}
                languages={languages}
                onChangeLanguages={setLanguages}
                skills={skills}
                onChangeSkills={setSkills}
                /* NUEVOS estados para que “Add” funcione */
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
              />
              <div className="cp-actions" style={{ marginTop: 12 }}>
                <button type="submit" disabled={saving}>Save</button>
              </div>
            </form>
          </div>

          {/* Lifestyle & Habits — después de Preferences & Skills */}
          <div className="cp-card">
            <h3 className="cp-h3">Lifestyle &amp; Habits</h3>
            <form onSubmit={handleSaveDetails} className="cp-form">
              <LifestyleHabitsSection
                value={lifestyleHabits}
                onChange={setLifestyleHabits}
              />
              <div className="cp-actions" style={{ marginTop: 12 }}>
                <button type="submit" disabled={saving}>Save</button>
              </div>
            </form>
          </div>

          {/* Education (Studies) — después de Preferences & Skills */}
          <div className="cp-card">
          <h3 className="cp-h3">Education (Studies)</h3>
            <EducationSection />
          </div>

          {/* Documents & Media */}
          <div className="cp-card">
            <h3 className="cp-h3">Documents &amp; Media</h3>
            <DocumentsSectionController
              initialDocs={docs}
              onSave={handleSaveDocs}
            />
          </div>

          {/* References */}
          <div className="cp-card">
            <h3 className="cp-h3">References</h3>
            <ReferencesSection
              profileId={profile?.id}
              onCountChange={(n) => setRefsCount(Number(n) || 0)}
            />
          </div>

          {/* NEW: Photos & Videos (álbum del candidato) */}
          <div className="cp-card">
            <h3 className="cp-h3">Photos &amp; Videos</h3>
            <MediaSection
              value={gallery}
              onChange={setGallery}
              onUpload={handleUploadMedia}
            />
            <div className="cp-actions" style={{ marginTop: 12 }}>
              <button type="button" onClick={handleSaveGallery} disabled={savingGallery}>
                Save
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}