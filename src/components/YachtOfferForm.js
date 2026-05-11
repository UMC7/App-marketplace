import React, { useState, useRef, useEffect } from 'react';
import supabase from '../supabase';
import { toast } from 'react-toastify';
import '../styles/float.css';
import {
  YACHT_EXPERIENCE_PREFERRED,
  OPEN_TO_GREEN_CREW,
  NEW_IN_RANK_WELCOME,
  PROVEN_EXPERIENCE_REQUIRED,
  SIMILAR_SIZE_RANK_REQUIRED,
  yearsOptions,
  titles,
  ENGINEERING_RANKS,
  DECK_LICENSE_RANKS,
  GALLEY_DEPARTMENT_RANKS,
  ENGINEERING_LICENSE_FIELD_RANKS,
  ENGINEERING_LICENSE_FIELD_OPTIONS,
  REQUIRED_DOCUMENT_GROUPS,
  CAPTAIN_TIER_DECK_RANKS,
  RANK_SPECIFIC_REQUIRED_DOCUMENT_GROUPS,
  GALLEY_REQUIRED_DOCUMENT_GROUPS,
  GALLEY_CULINARY_DOCUMENT_GROUP,
  DECK_MCA_MODULES_DOCUMENT_GROUP,
  INTERIOR_DEPARTMENT_RANKS,
  INTERIOR_REQUIRED_DOCUMENT_GROUPS,
  OTHERS_DEPARTMENT_RANKS,
  OTHERS_REQUIRED_DOCUMENT_GROUPS,
  DEFAULT_YACHT_SIZES,
  CHASE_BOAT_SIZES,
} from './yachtOfferForm.constants';
import YachtOfferFormOnboardFields from './YachtOfferFormOnboardFields';
import YachtOfferFormShoreBasedFields from './YachtOfferFormShoreBasedFields';
import {
  getInferredYear,
  getDaysInMonth,
  isDayRangeValue,
  readJsonResponse,
  resolveDayValueForDate,
  adjustRemarksTextareaHeight,
  getEngineeringLicenseOptionsForRank,
  getDeckLicenseOptionsForRank,
  getDeckDocumentOptionsForRank,
} from './yachtOfferForm.utils';

const BASE_REQUIRED_DOCUMENTS = ['ENG1 Seafarer Medical Certificate', 'STCW Basic Training (A-VI/1)'];

const initialState = {
  work_environment: '',
  title: '',
  city: '',
  country: '',
  type: '',
  start_date: '',
  start_month: '',
  start_day: '',
  end_date: '',
  end_month: '',
  end_day: '',
  required_license: '',
  engineering_license: '',
  required_documents: BASE_REQUIRED_DOCUMENTS,
  required_skills: [],
  teammate_required_skills: [],
  salary: '',
  is_doe: false,
  is_tips: false,
  is_flexible: false,
  is_smoke_free_yacht: false,
  is_dry_boat: false,
  is_no_visible_tattoos: false,
  is_random_drug_testing: false,
  is_charter_experience_required: false,
  local_candidates_only: false,
  years_in_rank: '',
  gender: '',
  description: '',
  contact_email: '',
  contact_phone: '',
  link_facebook: '',
  link_instagram: '',
  link_x: '',
  posting_duration: '1 month',
  team: 'No',
  teammate_rank: '',
  teammate_required_license: '',
  teammate_engineering_license: '',
  teammate_required_documents: BASE_REQUIRED_DOCUMENTS,
  teammate_salary: '',
  teammate_experience: '',
  flag: 'Foreign Flag',
  yacht_size: '',
  yacht_type: '',
  propulsion_type: '',
  uses: '',
  homeport: '',
  liveaboard: '',
  season_type: '',
  holidays: '',
  is_asap: false,
  language_1: 'English',
  language_1_fluency: 'Fluent',
  language_2: '',
  language_2_fluency: '',
  salary_currency: '',
  teammate_salary_currency: '',
  visas: [],
  is_private_chat_enabled: true,
};



/** Evita value=null en selects/inputs: normaliza null/undefined a '' o [] según el tipo en initialState */
function normalizeInitialValues(row) {
  if (!row || typeof row !== 'object') return {};
  return Object.fromEntries(
    Object.keys(row)
      .filter((k) => k in initialState)
      .map((k) => {
        const v = row[k];
        const def = initialState[k];
        if (v == null) {
          if (Array.isArray(def)) return [k, [...def]];
          if (typeof def === 'string') {
            if (k === 'posting_duration') return [k, def];
            return [k, ''];
          }
          if (typeof def === 'number') return [k, ''];
          if (typeof def === 'boolean') return [k, !!def];
        }
        if (Array.isArray(def) && !Array.isArray(v)) return [k, [...def]];
        if (k === 'required_documents' && Array.isArray(v)) {
          return [k, Array.from(new Set([...(v || []), ...BASE_REQUIRED_DOCUMENTS]))];
        }
        return [k, v];
      })
  );
}

function YachtOfferForm({ user, onOfferPosted, initialValues, mode }) {
  const [formData, setFormData] = useState(
    initialValues ? { ...initialState, ...normalizeInitialValues(initialValues) } : initialState
  );
  const onboardBaseDocsSeededRef = useRef(false);
  // Normaliza team para edición: boolean -> 'Yes'/'No'
useEffect(() => {
  if (initialValues && typeof initialValues.team !== 'undefined') {
    setFormData(prev => ({
      ...prev,
      team: (initialValues.team === true || initialValues.team === 'Yes') ? 'Yes' : 'No',
    }));
  }
}, [initialValues]);

useEffect(() => {
  if (!initialValues?.start_date) return;
  const parsed = new Date(initialValues.start_date);
  if (Number.isNaN(parsed.getTime())) return;
  const month = String(parsed.getMonth() + 1);
  const day = String(parsed.getDate());
  setFormData(prev => ({
    ...prev,
    start_month: month,
    start_day: initialValues.start_date_month_only ? '' : (initialValues.start_day_range || day),
  }));
}, [initialValues]);

  useEffect(() => {
  if (!initialValues?.end_date) return;
  const parsed = new Date(initialValues.end_date);
  if (Number.isNaN(parsed.getTime())) return;
  const month = String(parsed.getMonth() + 1);
  const day = String(parsed.getDate());
  setFormData(prev => ({
    ...prev,
    end_month: month,
    end_day: initialValues.end_date_month_only ? '' : (initialValues.end_day_range || day),
  }));
  }, [initialValues]);

useEffect(() => {
  if (!initialValues) return;
  const yr = initialValues.years_in_rank;
  const te = initialValues.teammate_experience;
  const next = {};
  if (yr !== undefined && yr !== null) {
    next.years_in_rank = yr === 0 ? OPEN_TO_GREEN_CREW
      : yr === -1 ? NEW_IN_RANK_WELCOME
      : yr === -2 ? YACHT_EXPERIENCE_PREFERRED
      : yr === -3 ? PROVEN_EXPERIENCE_REQUIRED
      : yr === -4 ? SIMILAR_SIZE_RANK_REQUIRED
      : yr;
  }
  if (te !== undefined && te !== null) {
    next.teammate_experience = te === 0 ? OPEN_TO_GREEN_CREW
      : te === -1 ? NEW_IN_RANK_WELCOME
      : te === -2 ? YACHT_EXPERIENCE_PREFERRED
      : te === -3 ? PROVEN_EXPERIENCE_REQUIRED
      : te === -4 ? SIMILAR_SIZE_RANK_REQUIRED
      : te;
  }
  if (Object.keys(next).length === 0) return;
  setFormData(prev => ({ ...prev, ...next }));
}, [initialValues]);

useEffect(() => {
  if (!Array.isArray(initialValues?.required_licenses)) return;
  setFormData(prev => ({
    ...prev,
    required_license: initialValues.required_licenses[0] || '',
  }));
}, [initialValues]);

useEffect(() => {
  const arr = Array.isArray(initialValues?.required_engineering_licenses)
    ? initialValues.required_engineering_licenses
    : Array.isArray(initialValues?.engineering_license)
      ? [initialValues.engineering_license]
      : null;
  if (!arr) return;
  setFormData(prev => ({
    ...prev,
    engineering_license: arr[0] || '',
  }));
}, [initialValues]);

useEffect(() => {
  if (!Array.isArray(initialValues?.required_documents)) return;
  setFormData(prev => ({
    ...prev,
    required_documents: Array.from(new Set([...(initialValues.required_documents || []), ...BASE_REQUIRED_DOCUMENTS])),
  }));
}, [initialValues]);

useEffect(() => {
  if (formData.work_environment !== 'Onboard') {
    onboardBaseDocsSeededRef.current = false;
    return;
  }

  if (onboardBaseDocsSeededRef.current) return;

  onboardBaseDocsSeededRef.current = true;
  setFormData(prev => ({
    ...prev,
    required_documents: Array.from(
      new Set([...(Array.isArray(prev.required_documents) ? prev.required_documents : []), ...BASE_REQUIRED_DOCUMENTS])
    ),
  }));
}, [formData.work_environment]);

useEffect(() => {
  if (!Array.isArray(initialValues?.required_skills)) return;
  setFormData(prev => ({
    ...prev,
    required_skills: initialValues.required_skills || [],
  }));
}, [initialValues]);

useEffect(() => {
  if (!Array.isArray(initialValues?.teammate_required_skills)) return;
  setFormData(prev => ({
    ...prev,
    teammate_required_skills: initialValues.teammate_required_skills || [],
  }));
}, [initialValues]);

useEffect(() => {
  if (!initialValues) return;
  const tr = initialValues.teammate_required_licenses;
  const te = initialValues.teammate_required_engineering_licenses;
  const td = initialValues.teammate_required_documents;
  setFormData(prev => ({
    ...prev,
    ...(Array.isArray(tr) && tr[0] != null && { teammate_required_license: tr[0] }),
    ...(Array.isArray(te) && te[0] != null && { teammate_engineering_license: te[0] }),
    ...(Array.isArray(td) && { teammate_required_documents: td }),
  }));
}, [initialValues?.teammate_required_licenses, initialValues?.teammate_required_engineering_licenses, initialValues?.teammate_required_documents]);
  const [loading, setLoading] = useState(false);
  const [rewriteLoading, setRewriteLoading] = useState(false);
  const [previousRemarks, setPreviousRemarks] = useState('');
  const [remarksAiUsed, setRemarksAiUsed] = useState(false);
  const [remarksTyping, setRemarksTyping] = useState(false);
  const [showMissing, setShowMissing] = useState(false);
  const [jobText, setJobText] = useState('');
  const [showPaste, setShowPaste] = useState(false);
  const [showVisas, setShowVisas] = useState(false);
  const [showRequiredDocs, setShowRequiredDocs] = useState(false);
  const [showTeammateRequiredDocs, setShowTeammateRequiredDocs] = useState(false);

  // close the visas dropdown on outside click or ESC
const visasRef = useRef(null);
const requiredDocsRef = useRef(null);
  const teammateRequiredDocsRef = useRef(null);
const remarksRef = useRef(null);
const remarksTypingTimer = useRef(null);
useEffect(() => {
  const handleClickOutside = (e) => {
    if (visasRef.current && !visasRef.current.contains(e.target)) {
      setShowVisas(false);
    }
    if (requiredDocsRef.current && !requiredDocsRef.current.contains(e.target)) {
      setShowRequiredDocs(false);
    }
    if (teammateRequiredDocsRef.current && !teammateRequiredDocsRef.current.contains(e.target)) {
      setShowTeammateRequiredDocs(false);
    }
  };
  const handleEsc = (e) => {
    if (e.key === 'Escape') {
      setShowVisas(false);
      setShowRequiredDocs(false);
      setShowTeammateRequiredDocs(false);
    }
  };
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleEsc);
  return () => {
    document.removeEventListener('click', handleClickOutside);
    document.removeEventListener('keydown', handleEsc);
  };
}, []);

// YachtOfferForm.js
const autoFillFromText = async () => {
  if (!jobText.trim()) {
    toast.error('Paste a job post first.');
    return;
  }

  setLoading(true);

  try {
    const res = await fetch('/api/parse-job', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: jobText }),
    });
    const data = await readJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'Parse failed.');

    setFormData(prev => {
      const merged = { ...prev };

      const normalizeTitle = (val) => {
        if (!val) return "";
        const v = String(val).trim().toLowerCase();
        const hit = titles.find(t => t.toLowerCase() === v);
        return hit || "";
      };

      // Recorremos con defensiva
      for (const [k, vRaw] of Object.entries(data || {})) {
        if (vRaw == null) continue;
        const v = (typeof vRaw === "string") ? vRaw.trim() : vRaw;

        // rank → title
        if (k === "rank") {
          const norm = normalizeTitle(v);
          if (!merged.title) merged.title = norm;
          continue;
        }

        // booleanos
        if (k === "is_asap" || k === "is_doe" || k === "is_flexible" || k === "is_tips") {
          if (typeof v === "boolean" && v !== merged[k]) merged[k] = v;
          continue;
        }

        // visas (array): solo escribir si está vacío en el form
        if (k === "visas") {
          const arr = Array.isArray(v) ? v : [];
          if (!Array.isArray(merged.visas) || merged.visas.length === 0) {
            merged.visas = arr;
          }
          continue;
        }

        if (k === "required_documents") {
          const arr = Array.isArray(v) ? v : [];
          merged.required_documents = Array.from(new Set([...(Array.isArray(merged.required_documents) ? merged.required_documents : []), ...BASE_REQUIRED_DOCUMENTS, ...arr]));
          continue;
        }

        if (k === "start_date" && v) {
          const parsed = new Date(v);
          if (!Number.isNaN(parsed.getTime())) {
            const month = String(parsed.getMonth() + 1);
            const day = String(parsed.getDate());
            if (!merged.start_month) merged.start_month = month;
            if (!merged.start_day) merged.start_day = day;
          }
          continue;
        }

        // regla general: no sobreescribir si ya hay valor
        const cur = merged[k];
        const isEmpty =
          cur === "" ||
          cur == null ||
          (Array.isArray(cur) && cur.length === 0) ||
          (typeof cur === "number" && Number.isNaN(cur));

        if (isEmpty) merged[k] = v;
      }

            // ⬇️ Forzar escalado de Team si el parser detectó pareja (captain+chef, etc.)
      if ((data.team === "Yes" || data.team === true) && merged.team !== "Yes") {
        merged.team = "Yes";
      }

      // Coherencia DOE
      if (data.is_doe === true || (merged.salary_currency && !merged.salary)) {
        merged.is_doe = true;
        merged.salary = "";
        merged.teammate_salary = "";
        merged.salary_currency = merged.salary_currency || data.salary_currency || "";
        merged.teammate_salary_currency = "";
      }

      if (merged.work_environment === 'Onboard' || data.work_environment === 'Onboard') {
        merged.required_documents = Array.from(new Set([...(Array.isArray(merged.required_documents) ? merged.required_documents : []), ...BASE_REQUIRED_DOCUMENTS]));
      }

      if (!merged.required_license && typeof data.required_license === 'string' && data.required_license.trim()) {
        merged.required_license = data.required_license.trim();
      }

      if (
        !merged.required_license &&
        merged.title === 'Chief Engineer' &&
        /\bstcw\s*iii\s*\/?\s*2\b/i.test(jobText)
      ) {
        merged.required_license = 'Chief Engineer Unlimited - STCW III/2';
      }

      return merged;
    });

    toast.success('Auto-filled from job post.');
  } catch (err) {
    console.error(err);
    toast.error(err.message || 'Could not parse.');
  } finally {
    setLoading(false);
  }
};

const improveRemarks = async () => {
  if (remarksAiUsed) {
    toast.error('AI improvement already used for this form.');
    return;
  }
  const current = String(formData.description || '').trim();
  if (!current) {
    toast.error('Add remarks first.');
    return;
  }

  const context = [
    formData.work_environment ? `Work environment: ${formData.work_environment}` : '',
    formData.title ? `Position: ${formData.title}` : '',
    formData.yacht_type ? `Yacht type: ${formData.yacht_type}` : '',
    formData.yacht_size ? `Yacht size: ${formData.yacht_size}` : '',
    formData.city ? `City: ${formData.city}` : '',
    formData.country ? `Country: ${formData.country}` : ''
  ].filter(Boolean).join(' | ');

  setRewriteLoading(true);
  try {
    const res = await fetch('/api/rewrite-remarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: current, context }),
    });
    const data = await readJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'Rewrite failed.');

    const nextText = String(data.text || '').trim();
    if (!nextText) throw new Error('Empty suggestion.');

    setPreviousRemarks(current);
    setRemarksAiUsed(true);
    setFormData(prev => ({ ...prev, description: nextText }));
    toast.success('Remarks updated with AI suggestion.');

    setTimeout(() => {
      if (remarksRef.current) {
        remarksRef.current.style.height = 'auto';
        remarksRef.current.style.height = `${remarksRef.current.scrollHeight}px`;
      }
    }, 0);
  } catch (err) {
    console.error(err);
    toast.error(err.message || 'Could not rewrite remarks.');
  } finally {
    setRewriteLoading(false);
  }
};

const undoRemarks = () => {
  if (!previousRemarks) return;
  setFormData(prev => ({ ...prev, description: previousRemarks }));
  setPreviousRemarks('');
  toast.success('Remarks restored.');
  setTimeout(() => {
    if (remarksRef.current) {
      remarksRef.current.style.height = 'auto';
      remarksRef.current.style.height = `${remarksRef.current.scrollHeight}px`;
    }
  }, 0);
};

const isDayworker = formData.title === 'Dayworker';
const needsEngineeringLicense = ENGINEERING_RANKS.includes(formData.title);
const needsDeckLicense = DECK_LICENSE_RANKS.includes(formData.title);
const showLicenseFields = needsEngineeringLicense || needsDeckLicense;
const showEngineeringLicenseField = ENGINEERING_LICENSE_FIELD_RANKS.includes(formData.title);
const licenseOptions = needsEngineeringLicense
  ? getEngineeringLicenseOptionsForRank(formData.title)
  : needsDeckLicense
    ? getDeckLicenseOptionsForRank(formData.title)
    : [];
const engineeringLicenseFieldOptions = ENGINEERING_LICENSE_FIELD_OPTIONS;
const isCaptainTierDeckRank = CAPTAIN_TIER_DECK_RANKS.includes(formData.title);
const DISABLE_DECK_DOC_INSERT_RANKS = new Set(['Mate/Engineer']);
const deckDocumentOptions =
  needsDeckLicense &&
  !isCaptainTierDeckRank &&
  !DISABLE_DECK_DOC_INSERT_RANKS.has(formData.title)
    ? getDeckDocumentOptionsForRank(formData.title)
    : [];
const isOnboard = formData.work_environment === 'Onboard';
const isShoreBased = formData.work_environment === 'Shore-based';
const INTERIOR_RANKS_WITH_GALLEY_SUBGROUP = new Set([
  'Chef/Stew/Deck',
  'Cook/Stew/Deck',
  'Cook/Steward(ess)',
  'Deck/Cook',
]);

const getRequiredDocumentGroupsForRank = (rank) => {
  if (!rank) return [];
  const specialRequiredDocumentGroups = RANK_SPECIFIC_REQUIRED_DOCUMENT_GROUPS[rank];
  if (specialRequiredDocumentGroups) return specialRequiredDocumentGroups;
  if (GALLEY_DEPARTMENT_RANKS.includes(rank)) return GALLEY_REQUIRED_DOCUMENT_GROUPS;
  if (INTERIOR_DEPARTMENT_RANKS.includes(rank)) return INTERIOR_REQUIRED_DOCUMENT_GROUPS;
  if (OTHERS_DEPARTMENT_RANKS.includes(rank)) return OTHERS_REQUIRED_DOCUMENT_GROUPS;
  return REQUIRED_DOCUMENT_GROUPS;
};

const appendGalleyCulinarySubgroup = (groups, rank) => {
  if (!INTERIOR_RANKS_WITH_GALLEY_SUBGROUP.has(rank)) return groups;
  if (groups.some((group) => group.label === GALLEY_CULINARY_DOCUMENT_GROUP.label)) return groups;
  return [...groups, GALLEY_CULINARY_DOCUMENT_GROUP];
};

const RANKS_WITH_DECK_MCA_SUBGROUP = new Set(['Chef/Deck']);

const appendDeckMcaSubgroup = (groups, rank) => {
  if (!RANKS_WITH_DECK_MCA_SUBGROUP.has(rank)) return groups;
  if (groups.some((group) => group.label === DECK_MCA_MODULES_DOCUMENT_GROUP.label)) return groups;
  return [...groups, DECK_MCA_MODULES_DOCUMENT_GROUP];
};

const requiredDocumentGroups = appendDeckMcaSubgroup(
  appendGalleyCulinarySubgroup(
    getRequiredDocumentGroupsForRank(formData.title),
    formData.title
  ),
  formData.title
);

const teammateRank = formData.teammate_rank || '';
const teammateRequiredDocumentGroups = appendDeckMcaSubgroup(
  appendGalleyCulinarySubgroup(
    getRequiredDocumentGroupsForRank(teammateRank),
    teammateRank
  ),
  teammateRank
);
const needsTeammateDeckLicense = teammateRank && DECK_LICENSE_RANKS.includes(teammateRank);
const needsTeammateEngineeringLicense = teammateRank && ENGINEERING_RANKS.includes(teammateRank);
const showTeammateLicenseFields = needsTeammateDeckLicense || needsTeammateEngineeringLicense;
const showTeammateEngineeringLicenseField = teammateRank && ENGINEERING_LICENSE_FIELD_RANKS.includes(teammateRank);
const teammateLicenseOptions = needsTeammateEngineeringLicense
  ? getEngineeringLicenseOptionsForRank(teammateRank)
  : needsTeammateDeckLicense
    ? getDeckLicenseOptionsForRank(teammateRank)
    : [];
const isTeammateCaptainTierDeck = teammateRank && CAPTAIN_TIER_DECK_RANKS.includes(teammateRank);
const teammateDeckDocumentOptions =
  needsTeammateDeckLicense &&
  !isTeammateCaptainTierDeck &&
  !DISABLE_DECK_DOC_INSERT_RANKS.has(teammateRank)
    ? getDeckDocumentOptionsForRank(teammateRank)
    : [];

const renderRequiredDocsSummary = () => null;

const highlightClass = (missing) => (missing ? 'missing-required' : '');
const autoResizeTextarea = (e) => adjustRemarksTextareaHeight(e.target);

  const handleRemarksInput = (e) => {
    autoResizeTextarea(e);
    setRemarksTyping(true);
    if (remarksTypingTimer.current) {
      clearTimeout(remarksTypingTimer.current);
    }
    remarksTypingTimer.current = setTimeout(() => {
      setRemarksTyping(false);
    }, 600);
  };

const formReady = (() => {
  if (!formData.work_environment) return false;

  if (isOnboard) {
    if (
      !formData.title ||
      (!formData.salary_currency && !formData.is_doe) ||
      (!formData.salary && !formData.is_doe) ||
      !formData.type ||
      !formData.yacht_type ||
      !formData.yacht_size ||
      (!formData.start_month && !formData.is_asap && !formData.is_flexible) ||
      !formData.country ||
      (formData.team === 'Yes' && (!formData.teammate_rank || (!formData.teammate_salary && !formData.is_doe)))
    ) return false;
  }

  if (isShoreBased) {
    if (
      !formData.title ||
      (!formData.salary_currency && !formData.is_doe) ||
      (!formData.salary && !formData.is_doe) ||
      (!formData.start_month && !formData.is_asap && !formData.is_flexible) ||
      !formData.work_location ||
      (formData.work_location === 'On - site' && (!formData.city || !formData.country))
    ) return false;
  }

  return true;
})();

  const yachtSizeOptions =
  formData.yacht_type === 'Chase Boat' ? CHASE_BOAT_SIZES : DEFAULT_YACHT_SIZES;

  const handleChange = (e) => {
  const { name, value, type, checked } = e.target;

  if (name === 'start_month' || name === 'start_day') {
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'start_month') {
        if (!value) {
          next.start_day = '';
        } else {
          const maxDay = getDaysInMonth(value);
          if (next.start_day && !isDayRangeValue(next.start_day) && Number(next.start_day) > maxDay) {
            next.start_day = '';
          }
        }
      }
      if (value) {
        next.is_asap = false;
        next.is_flexible = false;
      }
      return next;
    });
    return;
  }

  if (name === 'end_month' || name === 'end_day') {
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'end_month') {
        if (!value) {
          next.end_day = '';
        } else {
          const maxDay = getDaysInMonth(value);
          if (next.end_day && !isDayRangeValue(next.end_day) && Number(next.end_day) > maxDay) {
            next.end_day = '';
          }
        }
      }
      return next;
    });
    return;
  }

  if (name === 'required_documents') {
    setFormData(prev => {
      const current = prev.required_documents || [];
      const next = checked
        ? [...current, value]
        : current.filter((v) => v !== value);
      return { ...prev, required_documents: next };
    });
    return;
  }

  if (name === 'teammate_required_documents') {
    setFormData(prev => {
      const current = prev.teammate_required_documents || [];
      const next = checked
        ? [...current, value]
        : current.filter((v) => v !== value);
      return { ...prev, teammate_required_documents: next };
    });
    return;
  }

  if (name === 'visas') {
    setFormData(prev => {
      const currentVisas = prev.visas || [];
      const newVisas = checked
        ? [...currentVisas, value] // Agrega la visa si está marcada
        : currentVisas.filter(v => v !== value); // Elimina la visa si no está marcada
      return { ...prev, visas: newVisas };
    });
  } else {
    setFormData(prev => {
      const nextValue =
        name === 'contact_email' && typeof value === 'string'
          ? value.trim()
          : value;
      const newState = {
        ...prev,
        [name]: type === 'checkbox' ? checked : nextValue,
      };

      // 🔹 Si cambia salary_currency y hay team
      if (name === 'salary_currency' && prev.team === 'Yes') {
        newState.teammate_salary_currency = value;
      }

      if (name === 'team' && value !== 'Yes') {
        newState.teammate_rank = '';
        newState.teammate_required_license = '';
        newState.teammate_engineering_license = '';
        newState.teammate_required_documents = [];
        newState.teammate_required_skills = [];
        newState.teammate_salary = '';
        newState.teammate_salary_currency = '';
        newState.teammate_experience = '';
      }
      if (name === 'team' && value === 'Yes') {
        newState.teammate_required_documents = Array.from(
          new Set([
            ...(Array.isArray(prev.teammate_required_documents) ? prev.teammate_required_documents : []),
            ...BASE_REQUIRED_DOCUMENTS,
          ])
        );
      }

      if (name === 'yacht_type') {
        const nextYachtSizeOptions = value === 'Chase Boat' ? CHASE_BOAT_SIZES : DEFAULT_YACHT_SIZES;
        if (prev.yacht_size && !nextYachtSizeOptions.includes(prev.yacht_size)) {
          newState.yacht_size = '';
        }
      }

      // 🔹 Si selecciona Dayworker → autoasigna DayWork
      if (name === 'title' && value === 'Dayworker') {
        newState.type = 'DayWork';
      }
      if (name === 'title' && !ENGINEERING_RANKS.includes(value) && !DECK_LICENSE_RANKS.includes(value)) {
        newState.required_license = '';
      }
      if (name === 'title' && !ENGINEERING_LICENSE_FIELD_RANKS.includes(value)) {
        newState.engineering_license = '';
      }
      if (name === 'teammate_rank') {
        newState.teammate_required_license = '';
        newState.teammate_engineering_license = '';
        newState.teammate_required_documents = [...BASE_REQUIRED_DOCUMENTS];
        newState.teammate_required_skills = [];
      }
      if (name === 'teammate_rank' && !DECK_LICENSE_RANKS.includes(value) && !ENGINEERING_RANKS.includes(value)) {
        newState.teammate_required_license = '';
      }
      if (name === 'teammate_rank' && !ENGINEERING_LICENSE_FIELD_RANKS.includes(value)) {
        newState.teammate_engineering_license = '';
      }

      // 🔹 Si marca ASAP → limpiar fecha
      if (name === 'is_asap') {
        newState.start_month = checked ? '' : prev.start_month;
        newState.start_day = checked ? '' : prev.start_day;
        if (checked) {
          newState.is_flexible = false;
        }
      }

      if (name === 'is_flexible') {
        newState.start_month = checked ? '' : prev.start_month;
        newState.start_day = checked ? '' : prev.start_day;
        if (checked) {
          newState.is_asap = false;
        }
      }

      // 🔹 Si cambia Start Date → desmarcar ASAP
      return newState;
    });
  }
};

const coerceOptionalNumber = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/** Payload solo con columnas de la tabla (evita 400 por columnas/formato incorrecto) */
const buildOfferPayload = (sanitizedData, { forUpdate = false } = {}) => {
  const isTeamJob = sanitizedData.team === 'Yes' || sanitizedData.team === true;
  const base = {
    work_environment: sanitizedData.work_environment,
    work_location: sanitizedData.work_location || null,
    title: sanitizedData.title,
    city: sanitizedData.city ?? '',
    country: sanitizedData.country ?? '',
    type: sanitizedData.type || null,
    start_date: sanitizedData.is_asap || (sanitizedData.is_flexible && !sanitizedData.start_date)
      ? new Date().toISOString().split('T')[0]
      : sanitizedData.start_date || null,
    start_day_range: sanitizedData.start_day_range || null,
    start_date_month_only: !!sanitizedData.start_date_month_only,
    end_date_month_only: !!sanitizedData.end_date_month_only,
    end_day_range: sanitizedData.end_day_range || null,
    end_date:
      sanitizedData.type === 'Permanent'
        ? null
        : sanitizedData.end_date || null,
    is_doe: !!sanitizedData.is_doe,
    salary: sanitizedData.is_doe ? null : coerceOptionalNumber(sanitizedData.salary),
    salary_currency: sanitizedData.is_doe ? null : (sanitizedData.salary_currency || null),
    years_in_rank: sanitizedData.years_in_rank,
    description: sanitizedData.description || null,
    posting_duration: sanitizedData.posting_duration || '1 month',
    contact_email: sanitizedData.contact_email || null,
    contact_phone: sanitizedData.contact_phone || null,
    team: isTeamJob,
    teammate_rank: isTeamJob ? (sanitizedData.teammate_rank || null) : null,
    teammate_salary: isTeamJob ? coerceOptionalNumber(sanitizedData.teammate_salary) : null,
    teammate_salary_currency: isTeamJob ? (sanitizedData.teammate_salary_currency || null) : null,
    teammate_experience: isTeamJob ? sanitizedData.teammate_experience : null,
    flag: sanitizedData.flag || null,
    yacht_size: sanitizedData.yacht_size || null,
    yacht_type: sanitizedData.yacht_type || null,
    uses: sanitizedData.uses || null,
    required_licenses: Array.isArray(sanitizedData.required_licenses) ? sanitizedData.required_licenses : [],
    required_engineering_licenses: Array.isArray(sanitizedData.required_engineering_licenses) ? sanitizedData.required_engineering_licenses : [],
    required_documents: Array.isArray(sanitizedData.required_documents) ? sanitizedData.required_documents : [],
    required_skills: Array.isArray(sanitizedData.required_skills) ? sanitizedData.required_skills : [],
    teammate_required_licenses: isTeamJob && Array.isArray(sanitizedData.teammate_required_licenses) ? sanitizedData.teammate_required_licenses : [],
    teammate_required_engineering_licenses: isTeamJob && Array.isArray(sanitizedData.teammate_required_engineering_licenses) ? sanitizedData.teammate_required_engineering_licenses : [],
    teammate_required_documents: isTeamJob && Array.isArray(sanitizedData.teammate_required_documents) ? sanitizedData.teammate_required_documents : [],
    teammate_required_skills: isTeamJob && Array.isArray(sanitizedData.teammate_required_skills) ? sanitizedData.teammate_required_skills : [],
    homeport: sanitizedData.homeport || null,
    liveaboard: sanitizedData.liveaboard || null,
    season_type: sanitizedData.season_type || null,
    is_asap: !!sanitizedData.is_asap,
    is_tips: !!sanitizedData.is_tips,
    is_flexible: !!sanitizedData.is_flexible,
    is_smoke_free_yacht: !!sanitizedData.is_smoke_free_yacht,
    is_dry_boat: !!sanitizedData.is_dry_boat,
    is_no_visible_tattoos: !!sanitizedData.is_no_visible_tattoos,
    is_random_drug_testing: !!sanitizedData.is_random_drug_testing,
    is_charter_experience_required: !!sanitizedData.is_charter_experience_required,
    local_candidates_only: !!sanitizedData.local_candidates_only,
    holidays: coerceOptionalNumber(sanitizedData.holidays),
    language_1: sanitizedData.language_1 || null,
    language_1_fluency: sanitizedData.language_1_fluency || null,
    language_2: sanitizedData.language_2 || null,
    language_2_fluency: sanitizedData.language_2_fluency || null,
    propulsion_type: sanitizedData.propulsion_type || null,
    gender: sanitizedData.gender || null,
    visas: Array.isArray(sanitizedData.visas) ? sanitizedData.visas : [],
    is_private_chat_enabled: !!sanitizedData.is_private_chat_enabled,
  };
  if (forUpdate) return base;
  return { ...base };
};

const handleSubmit = async (e) => {
    e.preventDefault();
    const isOnboard = formData.work_environment === 'Onboard';
const isShoreBased = formData.work_environment === 'Shore-based';

if (!formData.work_environment) {
  toast.error('Work environment.');
  return;
}

if (isOnboard) {
  if (
    !formData.title ||
    !formData.salary_currency && !formData.is_doe ||
    !formData.salary && !formData.is_doe ||
    !formData.type ||
    !formData.yacht_type ||
    !formData.yacht_size ||
    (!formData.start_month && !formData.is_asap && !formData.is_flexible) ||
    !formData.country ||
    (formData.team === 'Yes' && (!formData.teammate_rank || (!formData.teammate_salary && !formData.is_doe)))
  ) {
    toast.error('Fill in all required fields marked with *.');
    return;
  }
}

if (isShoreBased) {
  if (
    !formData.title ||
    !formData.salary_currency && !formData.is_doe ||
    !formData.salary && !formData.is_doe ||
    (!formData.start_month && !formData.is_asap && !formData.is_flexible) ||
    !formData.work_location ||
    (formData.work_location === 'On - site' && (!formData.city || !formData.country))
  ) {
    toast.error('Fill in all required fields marked with *.');
    return;
  }
}

const {
  start_month,
  start_day,
  end_month,
  end_day,
  required_license,
  engineering_license,
  required_documents,
  required_skills,
  ...restForm
} = formData;
const startDateMonthOnly = !!start_month && !start_day;
const endDateMonthOnly = !!end_month && !end_day;
const startDayRange = isDayRangeValue(start_day) ? String(start_day).toLowerCase() : null;
const endDayRange = isDayRangeValue(end_day) ? String(end_day).toLowerCase() : null;
const requiredLicenses = required_license ? [required_license] : [];
const engineeringLicensesArray = engineering_license ? [engineering_license] : [];
const derivedStartDate = (() => {
  if (!start_month) return null;
  const year = getInferredYear(start_month);
  if (!year) return null;
  const month = String(start_month).padStart(2, '0');
  const day = resolveDayValueForDate(start_day, start_month);
  return `${year}-${month}-${day}`;
})();
const derivedEndDate = (() => {
  if (!end_month) return null;
  const year = getInferredYear(end_month);
  if (!year) return null;
  const month = String(end_month).padStart(2, '0');
  const day = resolveDayValueForDate(end_day, end_month);
  return `${year}-${month}-${day}`;
})();

  const sanitizedData = {
    ...restForm,
    start_date: derivedStartDate,
    end_date: derivedEndDate,
    start_day_range: startDateMonthOnly ? null : startDayRange,
    end_day_range: endDateMonthOnly ? null : endDayRange,
    start_date_month_only: startDateMonthOnly,
    end_date_month_only: endDateMonthOnly,
    required_licenses: requiredLicenses,
    required_engineering_licenses: engineeringLicensesArray,
    required_documents: Array.isArray(required_documents) ? required_documents : [],
    required_skills: Array.isArray(required_skills) ? required_skills : [],
    years_in_rank:
      formData.years_in_rank === OPEN_TO_GREEN_CREW
        ? 0
      : formData.years_in_rank === NEW_IN_RANK_WELCOME
        ? -1
      : formData.years_in_rank === YACHT_EXPERIENCE_PREFERRED
        ? -2
      : formData.years_in_rank === PROVEN_EXPERIENCE_REQUIRED
        ? -3
      : formData.years_in_rank === SIMILAR_SIZE_RANK_REQUIRED
        ? -4
      : formData.years_in_rank
      ? Number(formData.years_in_rank)
      : null,
    teammate_experience:
      formData.teammate_experience === OPEN_TO_GREEN_CREW
        ? 0
      : formData.teammate_experience === NEW_IN_RANK_WELCOME
        ? -1
      : formData.teammate_experience === YACHT_EXPERIENCE_PREFERRED
        ? -2
      : formData.teammate_experience === PROVEN_EXPERIENCE_REQUIRED
        ? -3
      : formData.teammate_experience === SIMILAR_SIZE_RANK_REQUIRED
        ? -4
      : formData.teammate_experience
      ? Number(formData.teammate_experience)
      : null,
    teammate_required_licenses: formData.team === 'Yes' ? (formData.teammate_required_license ? [formData.teammate_required_license] : []) : [],
    teammate_required_engineering_licenses: formData.team === 'Yes' ? (formData.teammate_engineering_license ? [formData.teammate_engineering_license] : []) : [],
    teammate_required_documents: formData.team === 'Yes' ? (Array.isArray(formData.teammate_required_documents) ? formData.teammate_required_documents : []) : [],
    teammate_required_skills: formData.team === 'Yes' ? (Array.isArray(formData.teammate_required_skills) ? formData.teammate_required_skills : []) : [],
};

    setLoading(true);

    const payload = buildOfferPayload(sanitizedData, { forUpdate: mode === 'edit' });

    if (mode === 'edit') {
      await onOfferPosted(payload);
    } else {
      const { error } = await supabase.from('yacht_work_offers').insert([{
        user_id: user.id,
        ...payload,
      }]);

  if (error) {
    console.error('Error posting the offer:', error);
    toast.error('Something went wrong. Please try again.');
  } else {
    toast.success('Offer posted successfully.');
    setFormData(initialState);
    onOfferPosted(); // en modo creación esto puede ser una recarga o mensaje
  }
}

    setLoading(false);
};

  return (
  <>
    {loading && (
      <div className="form-loading-overlay">
        <img
          src="/logos/Iniciales.png"
          alt="Loading logo"
          className="floating-logo"
        />
        <p style={{
          marginTop: 20,
          fontSize: 20,
          color: '#ffffff',
          fontWeight: 700,
          fontFamily: 'sans-serif',
          textShadow: '1px 1px 3px rgba(0, 0, 0, 0.6)',
        }}>
          Almost there...
        </p>
      </div>
    )}
    
    <div className="container modal-flat-form-shell yacht-offer-form-shell">

    <div className="login-form modal-flat-form-card yacht-offer-form-card">
    <h2 style={{ textAlign: 'center', color: 'var(--primary-color)', marginBottom: '20px' }}>
    Job Offer Form
    </h2>
    <form onSubmit={handleSubmit}>

    {/* === Paste job post (optional) === */}
<div style={{ marginBottom: 16, borderBottom: '1px solid #eee', paddingBottom: 12 }}>
  <button
    type="button"
    onClick={() => setShowPaste((v) => !v)}
    className="btn btn-light"
    style={{ marginBottom: 8 }}
  >
    {showPaste ? 'Hide Smart Paste' : 'Smart Paste (Optional)'}
  </button>

  {showPaste && (
    <div>
      <p style={{ margin: '6px 0 8px', fontSize: 13, color: '#666' }}>
        Paste the job text. <b>Smart Paste</b> will automatically fill the form fields for you.
      </p>
      <textarea
        className="form-control"
        rows={5}
        value={jobText}
        onChange={(e) => setJobText(e.target.value)}
        placeholder="Paste the job post here…"
        style={{ width: '100%' }}
      />
      <div>
        <button
          type="button"
          onClick={autoFillFromText}
          className="btn btn-secondary"
          style={{ marginTop: 8 }}
        >
          Auto-Fill Fields
        </button>
      </div>
    </div>
  )}
</div>

    {mode !== 'edit' && (
  <>
    <label>Work Environment:</label>
    <select
      name="work_environment"
      value={formData.work_environment}
      onChange={handleChange}
      className={highlightClass(!formData.work_environment)}
      required
    >
      <option value="">Select...</option>
      <option value="Onboard">Onboard</option>
      <option value="Shore-based">Shore-based</option>
    </select>
  </>
)}

    {/* Mostrar solo si ya se seleccionó un entorno */}
    {formData.work_environment === '' && (
      <p style={{ marginTop: '1em', fontStyle: 'italic' }}>
        Select a work environment to continue...
      </p>
    )}

    {formData.work_environment === 'Onboard' && (
      <YachtOfferFormOnboardFields
        formData={formData}
        onChange={handleChange}
        highlightClass={highlightClass}
        showLicenseFields={showLicenseFields}
        licenseOptions={licenseOptions}
        showEngineeringLicenseField={showEngineeringLicenseField}
        engineeringLicenseFieldOptions={engineeringLicenseFieldOptions}
        showRequiredDocs={showRequiredDocs}
        setShowRequiredDocs={setShowRequiredDocs}
        requiredDocumentGroups={requiredDocumentGroups}
        deckDocumentOptions={deckDocumentOptions}
        requiredDocsRef={requiredDocsRef}
        showTeammateLicenseFields={showTeammateLicenseFields}
        teammateLicenseOptions={teammateLicenseOptions}
        showTeammateEngineeringLicenseField={showTeammateEngineeringLicenseField}
        showTeammateRequiredDocs={showTeammateRequiredDocs}
        teammateRequiredDocumentGroups={teammateRequiredDocumentGroups}
        teammateDeckDocumentOptions={teammateDeckDocumentOptions}
        teammateRequiredDocsRef={teammateRequiredDocsRef}
        setShowTeammateRequiredDocs={setShowTeammateRequiredDocs}
        yearsOptions={yearsOptions}
        yachtSizeOptions={yachtSizeOptions}
        isDayworker={isDayworker}
        showVisas={showVisas}
        setShowVisas={setShowVisas}
        visasRef={visasRef}
        handleRemarksInput={handleRemarksInput}
        autoResizeTextarea={autoResizeTextarea}
        remarksRef={remarksRef}
        previousRemarks={previousRemarks}
        remarksAiUsed={remarksAiUsed}
        remarksTyping={remarksTyping}
        rewriteLoading={rewriteLoading}
        undoRemarks={undoRemarks}
        improveRemarks={improveRemarks}
        renderRequiredDocsSummary={renderRequiredDocsSummary}
        onRequiredSkillsChange={(arr) => setFormData((prev) => ({ ...prev, required_skills: arr }))}
        onTeammateRequiredSkillsChange={(arr) => setFormData((prev) => ({ ...prev, teammate_required_skills: arr }))}
      />
    )}

    {formData.work_environment === 'Shore-based' && (
      <YachtOfferFormShoreBasedFields
        formData={formData}
        onChange={handleChange}
        highlightClass={highlightClass}
        yearsOptions={yearsOptions}
        isDayworker={isDayworker}
        handleRemarksInput={handleRemarksInput}
        autoResizeTextarea={autoResizeTextarea}
        remarksRef={remarksRef}
        previousRemarks={previousRemarks}
        remarksAiUsed={remarksAiUsed}
        remarksTyping={remarksTyping}
        rewriteLoading={rewriteLoading}
        undoRemarks={undoRemarks}
        improveRemarks={improveRemarks}
      />
    )}

    {/* Private Chat – mismo estilo que ThemeToggle (pill + handle), solo si ya eligió Onboard o Shore-based */}
    {(formData.work_environment === 'Onboard' || formData.work_environment === 'Shore-based') && (
      <div className="private-chat-field">
        <div className="private-chat-row">
          <label htmlFor="private-chat-toggle" className="private-chat-label">Private Chat</label>
          <div
            id="private-chat-toggle"
            role="switch"
            aria-checked={formData.is_private_chat_enabled}
            aria-label="Private Chat"
            title={formData.is_private_chat_enabled ? 'Private chat on' : 'Private chat off'}
            className={`private-chat-toggle ${formData.is_private_chat_enabled ? 'on' : 'off'}`}
            onClick={() => setFormData((prev) => ({ ...prev, is_private_chat_enabled: !prev.is_private_chat_enabled }))}
          >
            <span className="private-chat-toggle-off" aria-hidden>OFF</span>
            <span className="private-chat-toggle-on" aria-hidden>ON</span>
            <div className="private-chat-toggle-handle" aria-hidden />
          </div>
        </div>
      </div>
    )}

    {/* Submit */}
    <p style={{ fontStyle: 'italic', marginTop: '1.5em' }}><span style={{ color: 'red' }}>*</span> Required</p>
    <div style={{ position: 'relative' }}>
      <button
        type="submit"
        className="landing-button"
        disabled={loading || !formReady}
      >
        {loading ? (mode === 'edit' ? 'Updating...' : 'Posting...') : (mode === 'edit' ? 'Update Offer' : 'Post Offer')}
      </button>
      {!loading && !formReady && (
        <div
          onClick={() => setShowMissing(true)}
          style={{
            position: 'absolute',
            inset: 0,
            cursor: 'not-allowed',
            background: 'transparent',
          }}
          aria-hidden="true"
        />
      )}
    </div>
    {showMissing && !formReady && (
      <p style={{ marginTop: 8, color: '#b00020' }}>
        Some required fields are missing. Please complete them to post the offer.
      </p>
    )}
  </form>
  </div>
  </div>
  </>
  );
}

export default YachtOfferForm;
