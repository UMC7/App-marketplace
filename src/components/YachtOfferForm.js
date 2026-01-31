import React, { useState, useRef, useEffect } from 'react';
import supabase from '../supabase';
import { toast } from 'react-toastify';
import '../styles/float.css';

const defaultYachtSizes = [
  "0 - 30m", "31 - 40m", "41 - 50m", "51 - 70m", "71 - 100m", ">100m"
];

const chaseBoatSizes = [
  "<10m", "10 - 15m", "15 - 20m", ">20m"
];

const visaOptions = [
  'Green card or US Citizen',
  'B1/B2',
  'C1/D',
  'Schengen',
  'European Passport'
];

const MONTHS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' }
];

const getInferredYear = (monthValue) => {
  const month = Number(monthValue);
  if (!month) return null;
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  return month >= currentMonth ? now.getFullYear() : now.getFullYear() + 1;
};

const getDaysInMonth = (monthValue) => {
  const month = Number(monthValue);
  if (!month) return 31;
  const year = getInferredYear(monthValue) || new Date().getFullYear();
  return new Date(year, month, 0).getDate();
};

const ENGINEERING_RANKS = [
  'Chief Engineer',
  '2nd Engineer',
  '3rd Engineer',
  'Solo Engineer',
  'Engineer',
  'Electrician',
];

const COMMAND_RANKS = ENGINEERING_RANKS;

const ENGINEERING_LICENSE_OPTIONS = [
  'Chief Engineer Unlimited - STCW III/2',
  'Second Engineer Unlimited - STCW III/2',
  'Engineering Officer of the Watch (EOOW) - STCW III/1',
  'Y1 - Yacht Engineer (Unlimited)',
  'Y2 - Yacht Engineer ≤3000 GT',
  'Y3 - Yacht Engineer ≤500 GT',
  'Y4 - Yacht Engineer ≤200 GT',
  'Small Vessel Chief Engineer - MCA SV',
  'AEC 2 - Approved Engine Course 2',
  'AEC 1 - Approved Engine Course 1',
  'MEOL (Yachts) - Marine Engine Operator Licence',
];

const ELECTRICIAN_LICENSE_OPTIONS = [
  'Engineering Officer of the Watch (EOOW) - STCW III/1',
  'MEO (Yachts) - Marine Engine Operator Licence',
  'AEC 2 - Approved Engine Course 2',
  'AEC 1 - Approved Engine Course 1',
];

const SOLO_ENGINEER_EXCLUSIONS = new Set([
  'Chief Engineer Unlimited - STCW III/2',
  'Engineering Officer of the Watch (EOOW) - STCW III/1',
  'Y1 - Yacht Engineer (Unlimited)',
  'Second Engineer Unlimited - STCW III/2',
]);

const ENGINEERING_LICENSE_EXCLUSIONS = {
  'Chief Engineer': new Set([
    'AEC 2 - Approved Engine Course 2',
    'AEC 1 - Approved Engine Course 1',
    'Engineering Officer of the Watch (EOOW) - STCW III/1',
    'Second Engineer Unlimited - STCW III/2',
  ]),
  '3rd Engineer': new Set([
    'Chief Engineer Unlimited - STCW III/2',
    'Y1 - Yacht Engineer (Unlimited)',
  ]),
  'Solo Engineer': SOLO_ENGINEER_EXCLUSIONS,
  Engineer: SOLO_ENGINEER_EXCLUSIONS,
};

const getEngineeringLicenseOptionsForRank = (rank) => {
  if (rank === 'Electrician') {
    return ELECTRICIAN_LICENSE_OPTIONS;
  }
  const exclusions = ENGINEERING_LICENSE_EXCLUSIONS[rank];
  if (!exclusions) {
    return ENGINEERING_LICENSE_OPTIONS;
  }
  return ENGINEERING_LICENSE_OPTIONS.filter((opt) => !exclusions.has(opt));
};

const DECK_LICENSE_RANKS = [
  'Captain',
  'Captain/Engineer',
  'Skipper',
  'Chase Boat Captain',
  'Relief Captain',
  'Chief Officer',
  '2nd Officer',
  '3rd Officer',
  'Bosun',
  'Deck/Engineer',
  'Mate',
  'Lead Deckhand',
  'Deckhand',
  'Deck/Steward(ess)',
  'Deck/Carpenter',
  'Deck/Divemaster',
  'Deck/Cook',
];

const DECK_LICENSE_MAP = {
  Captain: [
    'Master Unlimited',
    'Master Yachts 3000 GT',
    'Master Yachts 500 GT',
    'Master Yachts 200 GT',
    'Yachtmaster',
  ],
  'Captain/Engineer': [
    'Master Unlimited',
    'Master Yachts 3000 GT',
    'Master Yachts 500 GT',
    'Master Yachts 200 GT',
    'Yachtmaster',
  ],
  Skipper: [
    'Master Yachts 200 GT',
    'Yachtmaster',
  ],
  'Relief Captain': [
    'Master Unlimited',
    'Master Yachts 3000 GT',
    'Master Yachts 500 GT',
    'Master Yachts 200 GT',
    'Yachtmaster',
  ],
  'Chase Boat Captain': [
    'Master Yachts 200 GT',
    'Yachtmaster',
  ],
  'Chief Officer': [
    'Master Yachts 3000 GT',
    'Chief Mate Unlimited',
    'Chief Mate Yachts 3000 GT',
    'OOW Unlimited',
    'OOW Yachts 3000 GT',
    'Yachtmaster',
  ],
  '2nd Officer': [
    'Chief Mate Yachts 3000 GT',
    'OOW Unlimited',
    'OOW Yachts 3000 GT',
    'Yachtmaster',
  ],
  '3rd Officer': [
    'Chief Mate Yachts 3000 GT',
    'OOW Unlimited',
    'OOW Yachts 3000 GT',
    'Yachtmaster',
  ],
  Mate: [
    'Chief Mate Yachts 3000 GT',
    'OOW Unlimited',
    'OOW Yachts 3000 GT',
    'Yachtmaster',
  ],
  Bosun: [
    'OOW Yachts 3000 GT',
    'Yachtmaster',
  ],
  'Deck/Engineer': [
    'OOW Yachts 3000 GT',
    'Yachtmaster',
  ],
  'Lead Deckhand': [
    'OOW Yachts 3000 GT',
    'Yachtmaster',
  ],
  Deckhand: [
    'OOW Yachts 3000 GT',
    'Yachtmaster',
  ],
  'Deck/Steward(ess)': ['Yachtmaster'],
  'Deck/Carpenter': ['Yachtmaster'],
  'Deck/Divemaster': ['Yachtmaster'],
  'Deck/Cook': ['Yachtmaster'],
};

const getDeckLicenseOptionsForRank = (rank) => DECK_LICENSE_MAP[rank] || [];

const ENGINEERING_LICENSE_FIELD_RANKS = ['Captain/Engineer', 'Deck/Engineer'];
const ENGINEERING_LICENSE_FIELD_OPTIONS = [
  'Y4 – Yacht Engineer ≤200 GT',
  'MEO (Yachts) – Marine Engine Operator',
  'AEC 2 – Approved Engine Course 2',
  'AEC 1 – Approved Engine Course 1',
];

const DECK_DOCUMENT_MAP = {
  Captain: ['GMDSS GOC', 'GMDSS ROC', 'VHF SRC'],
  'Captain/Engineer': ['GMDSS GOC', 'GMDSS ROC', 'VHF SRC'],
  Skipper: ['GMDSS ROC', 'VHF SRC'],
  'Relief Captain': ['GMDSS GOC', 'GMDSS ROC', 'VHF SRC'],
  'Chase Boat Captain': ['GMDSS ROC', 'VHF SRC'],
  'Chief Officer': ['GMDSS GOC', 'GMDSS ROC', 'VHF SRC'],
  '2nd Officer': ['GMDSS GOC', 'GMDSS ROC', 'VHF SRC'],
  '3rd Officer': ['GMDSS GOC', 'GMDSS ROC', 'VHF SRC'],
  Mate: ['GMDSS GOC', 'GMDSS ROC', 'VHF SRC'],
  Bosun: ['VHF SRC'],
  'Lead Deckhand': ['VHF SRC'],
  Deckhand: ['VHF SRC (preferred / plus)'],
  'Deck/Steward(ess)': ['VHF SRC (optional)'],
  'Deck/Carpenter': ['VHF SRC (optional)'],
  'Deck/Divemaster': ['VHF SRC (optional)'],
  'Deck/Cook': ['VHF SRC (optional)'],
  'Deck/Engineer': ['VHF SRC'],
};
const getDeckDocumentOptionsForRank = (rank) => DECK_DOCUMENT_MAP[rank] || [];

const REQUIRED_DOCUMENT_GROUPS = [
  {
    label: 'Commonly Required',
    options: [
      'Valid Passport (>=6 months validity)',
      "Seaman's Book",
      'ENG1 Seafarer Medical Certificate',
      'STCW Basic Training (A-VI/1)',
      "Driver's License",
    ],
  },
  {
    label: 'Administrative / Compliance',
    options: [
      'Flag State Endorsement',
      'Background Check - DBS / Police Clearance',
    ],
  },
  {
    label: 'Travel & Health',
    options: ['Vaccination - Yellow Fever'],
  },
];

const GALLEY_DEPARTMENT_RANKS = [
  'Chef',
  'Head Chef',
  'Sous Chef',
  'Solo Chef',
  'Cook/Crew Chef',
  'Crew Chef/Stew',
  'Chef/Steward(ess)',
];

const GALLEY_REQUIRED_DOCUMENT_GROUPS = [
  {
    label: 'Commonly Required',
    options: [
      'Valid Passport (>6 months validity)',
      'Reference Letter',
      "Seaman's Book",
      'ENG1 Seafarer Medical Certificate',
      'STCW Basic Training (A-VI/1)',
      "Driver's License",
    ],
  },
  {
    label: 'Administrative / Compliance',
    options: ['Background Check - DBS / Police Clearance'],
  },
  {
    label: 'Travel / Health',
    options: ['Vaccination - Yellow Fever', 'Vaccination - COVID'],
  },
  {
    label: 'Galley (Culinary)',
    options: [
      "Ship's Cook Certificate",
      'Food Hygiene / HACCP Level 2',
      'Food Hygiene / HACCP Level 3',
      'Menu Portfolio',
      'Wine List / Beverage Program',
      'Culinary Photo Portfolio',
    ],
  },
  {
    label: 'Interior (Service & Hospitality)',
    options: ['Silver Service', 'Mixology / Bartender', 'Barista'],
  },
];

const INTERIOR_DEPARTMENT_RANKS = [
  'Butler',
  'Steward(ess)',
  'Chief Steward(ess)',
  '2nd Steward(ess)',
  '3rd Steward(ess)',
  '4th Steward(ess)',
  'Solo Steward(ess)',
  'Junior Steward(ess)',
  'Housekeeper',
  'Head of Housekeeping',
  'Laundry/Steward(ess)',
  'Stew/Masseur',
  'Masseur',
  'Hairdresser/Barber',
  'Steward(ess)/Nanny',
  'Nanny',
];

const INTERIOR_REQUIRED_DOCUMENT_GROUPS = [
  {
    label: 'Commonly Required',
    options: [
      'Valid Passport (>6 months validity)',
      'Reference Letter',
      "Seaman's Book",
      'ENG1 Seafarer Medical Certificate',
      'STCW Basic Training (A-VI/1)',
      "Driver's License",
    ],
  },
  {
    label: 'Administrative / Compliance',
    options: ['Background Check - DBS / Police Clearance'],
  },
  {
    label: 'Travel / Health',
    options: ['Vaccination - Yellow Fever', 'Vaccination - COVID'],
  },
  {
    label: 'Interior (Service & Hospitality)',
    options: [
      'Silver Service',
      'Housekeeping',
      'Mixology / Bartender',
      'Barista',
      'WSET Level 2',
      'WSET Level 3',
      'Food Hygiene / Food Safety Level 2',
      'Food Hygiene / Food Safety Level 3',
    ],
  },
  {
    label: 'STCW Passenger / Management',
    options: [
      'Crowd Management - A-V/2',
      'Crisis Management & Human Behaviour - A-V/2-2',
      'Passenger Ship Safety Training',
    ],
  },
];

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
  required_documents: [],
  salary: '',
  is_doe: false,
  is_tips: false,
  is_flexible: false,
  years_in_rank: '',
  gender: '',
  description: '',
  contact_email: '',
  contact_phone: '',
  link_facebook: '',
  link_instagram: '',
  link_x: '',
  team: 'No',
  teammate_rank: '',
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
};

const titles = ['Captain', 'Captain/Engineer', 'Skipper', 'Chase Boat Captain', 'Relief Captain', 'Chief Officer', '2nd Officer', '3rd Officer', 'Bosun', 'Deck/Engineer', 'Mate', 'Lead Deckhand', 'Deckhand', 'Deck/Steward(ess)', 'Deck/Carpenter', 'Deck/Divemaster', 'Deck/Cook', 'Dayworker', 'Chief Engineer', '2nd Engineer', '3rd Engineer', 'Solo Engineer', 'Engineer', 'Electrician', 'Chef', 'Head Chef', 'Sous Chef', 'Solo Chef', 'Cook/Crew Chef', 'Crew Chef/Stew', 'Chef/Steward(ess)', 'Butler', 'Steward(ess)', 'Chief Steward(ess)', '2nd Steward(ess)', '3rd Steward(ess)', '4th Steward(ess)', 'Solo Steward(ess)', 'Junior Steward(ess)', 'Housekeeper', 'Head of Housekeeping', 'Cook/Stew/Deck', 'Cook/Steward(ess)', 'Stew/Deck', 'Laundry/Steward(ess)', 'Stew/Masseur', 'Masseur', 'Hairdresser/Barber', 'Steward(ess)/Nanny', 'Nanny', 'Videographer', 'Yoga/Pilates Instructor', 'Personal Trainer', 'Dive Instrutor', 'Water Sport Instrutor', 'Nurse', 'Other']; // ajusta según lista oficial

const countries = [
  // 🌐 Countries
  "Albania", "Anguilla", "Antigua and Barbuda", "Argentina", "Aruba", "Australia", "Bahamas", "Bahrain", "Barbados",
  "Belgium", "Belize", "Bermuda (UK)", "Bonaire", "Brazil", "Brunei", "Bulgaria", "BVI (UK)", "Cambodia", "Canada", "Cape Verde", "Cayman Islands (UK)",
  "Chile", "China", "Colombia", "Costa Rica", "Croatia", "Cuba", "Curacao", "Cyprus", "Denmark", "Dominica",
  "Dominican Republic", "Ecuador", "Egypt", "Estonia", "Fiji", "Finland", "France", "Germany", "Gibraltar (UK)", "Greece", "Grenada", "Guatemala", "Guernsey (UK)", "Honduras", "India", "Indonesia", "Ireland", "Israel", "Isle of Man (UK)",
  "Italy", "Jamaica", "Japan", "Jersey (UK)", "Kiribati", "Kuwait", "Latvia", "Libya", "Lithuania", "Madagascar",
  "Malaysia", "Maldives", "Malta", "Marshall Islands", "Mauritius", "Mexico", "Micronesia",
  "Monaco", "Montenegro", "Morocco", "Myanmar", "Netherlands", "New Zealand", "Nicaragua",
  "Norway", "Panama", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Saint Barthélemy", "Saint Kitts and Nevis",
  "Saint Lucia", "Saint Maarten", "Saint Vincent and the Grenadines", "Samoa", "Saudi Arabia", "Seychelles",
  "Singapore", "Solomon Islands", "South Africa", "South Korea", "Spain", "Sweden", "Taiwan",
  "Thailand", "Trinidad and Tobago", "Tunisia", "Turkey", "United Arab Emirates", "United Kingdom",
  "United States", "Uruguay", "Vanuatu", "Venezuela", "Vietnam"
];

const types = ['Rotational', 'Permanent', 'Temporary', 'Seasonal', 'Relief', 'Delivery', 'Crossing', 'DayWork'];
const yearsOptions = ['Green', 1, 2, 2.5, 3, 5];

function YachtOfferForm({ user, onOfferPosted, initialValues, mode }) {
  const [formData, setFormData] = useState(initialValues ? { ...initialState, ...initialValues } : initialState);
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
    start_day: initialValues.start_date_month_only ? '' : day,
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
      end_day: initialValues.end_date_month_only ? '' : day,
    }));
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
    required_documents: initialValues.required_documents || [],
  }));
}, [initialValues]);
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

  // close the visas dropdown on outside click or ESC
const visasRef = useRef(null);
const requiredDocsRef = useRef(null);
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
  };
  const handleEsc = (e) => {
    if (e.key === 'Escape') {
      setShowVisas(false);
      setShowRequiredDocs(false);
    }
  };
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleEsc);
  return () => {
    document.removeEventListener('click', handleClickOutside);
    document.removeEventListener('keydown', handleEsc);
  };
}, []);

const readJsonResponse = async (res) => {
  const contentType = res.headers.get('content-type') || '';
  const text = await res.text();

  if (!contentType.includes('application/json')) {
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<!doctype')) {
      throw new Error('API not available in local dev. Use Vercel dev or deploy.');
    }
    throw new Error('Unexpected API response.');
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON response.');
  }
};

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
const deckDocumentOptions = needsDeckLicense ? getDeckDocumentOptionsForRank(formData.title) : [];
const isGalleyDepartmentRank = GALLEY_DEPARTMENT_RANKS.includes(formData.title);
const isInteriorDepartmentRank = INTERIOR_DEPARTMENT_RANKS.includes(formData.title);
const isOnboard = formData.work_environment === 'Onboard';
const isShoreBased = formData.work_environment === 'Shore-based';
const requiredDocumentGroups = isGalleyDepartmentRank
  ? GALLEY_REQUIRED_DOCUMENT_GROUPS
  : isInteriorDepartmentRank
    ? INTERIOR_REQUIRED_DOCUMENT_GROUPS
    : REQUIRED_DOCUMENT_GROUPS;

const renderRequiredDocsSummary = () => null;

const highlightClass = (missing) => (showMissing && missing ? 'missing-required' : '');
const adjustRemarksTextareaHeight = (el) => {
  if (!el) return;
  const doc = typeof document !== 'undefined' ? document : null;
  const scrollContainer =
    el.closest?.('.modal-content-wrapper') ||
    doc?.scrollingElement ||
    doc?.documentElement;
  const previousScrollTop = scrollContainer ? scrollContainer.scrollTop : null;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
  if (scrollContainer) {
    const restoreScroll = () => {
      scrollContainer.scrollTop = previousScrollTop ?? 0;
    };
    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(restoreScroll);
    } else {
      restoreScroll();
    }
  }
};
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
  formData.title === 'Chase Boat Captain' ? chaseBoatSizes : defaultYachtSizes;

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
          if (next.start_day && Number(next.start_day) > maxDay) {
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
          if (next.end_day && Number(next.end_day) > maxDay) {
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
  ...restForm
} = formData;
const startDateMonthOnly = !!start_month && !start_day;
const endDateMonthOnly = !!end_month && !end_day;
const requiredLicenses = required_license ? [required_license] : [];
const engineeringLicensesArray = engineering_license ? [engineering_license] : [];
const derivedStartDate = (() => {
  if (!start_month) return null;
  const year = getInferredYear(start_month);
  if (!year) return null;
  const month = String(start_month).padStart(2, '0');
  const day = start_day ? String(start_day).padStart(2, '0') : '01';
  return `${year}-${month}-${day}`;
})();
const derivedEndDate = (() => {
  if (!end_month) return null;
  const year = getInferredYear(end_month);
  if (!year) return null;
  const month = String(end_month).padStart(2, '0');
  const day = end_day ? String(end_day).padStart(2, '0') : '01';
  return `${year}-${month}-${day}`;
})();

  const sanitizedData = {
    ...restForm,
    start_date: derivedStartDate,
    end_date: derivedEndDate,
    start_date_month_only: startDateMonthOnly,
    end_date_month_only: endDateMonthOnly,
    required_licenses: requiredLicenses,
    required_engineering_licenses: engineeringLicensesArray,
    required_documents: Array.isArray(required_documents) ? required_documents : [],
    years_in_rank:
      formData.years_in_rank === 'Green'
        ? 0
      : formData.years_in_rank
      ? Number(formData.years_in_rank)
      : null,
  teammate_experience:
    formData.teammate_experience === 'Green'
      ? 0
      : formData.teammate_experience
      ? Number(formData.teammate_experience)
      : null,
};

    setLoading(true);

    if (mode === 'edit') {
  // en modo edición, delega a la función onOfferPosted que viene del modal
  await onOfferPosted(sanitizedData);
} else {
  // en modo creación, inserta como siempre
  const { error } = await supabase.from('yacht_work_offers').insert([{
    user_id: user.id,
    work_environment: sanitizedData.work_environment,
    work_location: sanitizedData.work_location || null,
    title: sanitizedData.title,
    city: sanitizedData.city,
    country: sanitizedData.country,
    type: sanitizedData.type || null,
      start_date: sanitizedData.is_asap || (sanitizedData.is_flexible && !sanitizedData.start_date)
        ? new Date().toISOString().split('T')[0]
        : sanitizedData.start_date || null,
      start_date_month_only: !!sanitizedData.start_date_month_only,
      end_date_month_only: !!sanitizedData.end_date_month_only,
      end_date:
        sanitizedData.type === 'Permanent'
          ? null
        : sanitizedData.end_date || null,
    is_doe: sanitizedData.is_doe,
    salary: sanitizedData.is_doe ? null : sanitizedData.salary,
    salary_currency: sanitizedData.is_doe ? null : sanitizedData.salary_currency || null,
    years_in_rank: sanitizedData.years_in_rank,
    description: sanitizedData.description || null,
    contact_email: sanitizedData.contact_email || null,
    contact_phone: sanitizedData.contact_phone || null,
    team: sanitizedData.team === 'Yes',
    teammate_rank: sanitizedData.team === 'Yes' ? sanitizedData.teammate_rank || null : null,
    teammate_salary: sanitizedData.team === 'Yes' ? sanitizedData.teammate_salary || null : null,
    teammate_salary_currency: sanitizedData.team === 'Yes' ? sanitizedData.teammate_salary_currency || null : null,
    teammate_experience: sanitizedData.team === 'Yes' ? sanitizedData.teammate_experience || null : null,
    flag: sanitizedData.flag || null,
    yacht_size: sanitizedData.yacht_size || null,
    yacht_type: sanitizedData.yacht_type || null,
    uses: sanitizedData.uses || null,
    required_licenses: sanitizedData.required_licenses || [],
    required_engineering_licenses: sanitizedData.required_engineering_licenses || [],
    required_documents: sanitizedData.required_documents || [],
    homeport: sanitizedData.homeport || null,
    liveaboard: sanitizedData.liveaboard || null,
    season_type: sanitizedData.season_type || null,
    is_asap: sanitizedData.is_asap,
    is_tips: sanitizedData.is_tips,
    is_flexible: sanitizedData.is_flexible,
    holidays: sanitizedData.holidays ? Number(sanitizedData.holidays) : null,
    language_1: sanitizedData.language_1 || null,
    language_1_fluency: sanitizedData.language_1_fluency || null,
    language_2: sanitizedData.language_2 || null,
    language_2_fluency: sanitizedData.language_2_fluency || null,
    propulsion_type: sanitizedData.propulsion_type || null,
    gender: sanitizedData.gender || null, // null = Any
    visas: Array.isArray(sanitizedData.visas) ? sanitizedData.visas : [],
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
    
    <div className="container">

    <div className="login-form">
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
      <>

    {/* 1. Team */}
    <label>Team</label>
    <select name="team" value={formData.team} onChange={handleChange}>
      <option value="No">No</option>
      <option value="Yes">Yes</option>
    </select>

    {/* 2. Título del puesto */}
    <label>Rank: <span style={{ color: 'red' }}>*</span></label>
    <select
      name="title"
      value={formData.title}
      onChange={handleChange}
      className={highlightClass(!formData.title)}
      required
    >
      <option value="">Select...</option>
      {titles.map((t) => <option key={t} value={t}>{t}</option>)}
    </select>

    {showLicenseFields && (
      <>
        <label>Required License:</label>
        <select
          name="required_license"
          value={formData.required_license}
          onChange={handleChange}
        >
          <option value="">Select...</option>
          {licenseOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        {showEngineeringLicenseField && (
          <>
            <label>Engineering License:</label>
            <select
              name="engineering_license"
              value={formData.engineering_license}
              onChange={handleChange}
            >
              <option value="">Select...</option>
              {engineeringLicenseFieldOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </>
        )}
      </>
    )}

    <label htmlFor="required-docs-trigger">Required Documents / Certifications:</label>
    <div
      className={`custom-multiselect ${showRequiredDocs ? 'open' : ''}`}
      ref={requiredDocsRef}
    >
      <button
        type="button"
        id="required-docs-trigger"
        className="multiselect-trigger"
        onClick={() => setShowRequiredDocs((v) => !v)}
      >
        {(formData.required_documents || []).length > 0
          ? (formData.required_documents || []).join(', ')
          : 'Select...'}
        <span className={`caret ${showRequiredDocs ? 'up' : ''}`} aria-hidden>?</span>
      </button>

      <div className="multiselect-options">
        {requiredDocumentGroups.map((group, index) => (
          <React.Fragment key={group.label}>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 700, margin: '4px 0' }}>{group.label}</div>
              {group.options.map((opt) => (
                <label key={opt} className="form-checkbox-label">
                  <input
                    type="checkbox"
                    name="required_documents"
                    value={opt}
                    checked={(formData.required_documents || []).includes(opt)}
                    onChange={handleChange}
                  />
                  {opt}
                </label>
              ))}
            </div>
            {index === 0 && deckDocumentOptions.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 700, margin: '4px 0' }}>Radio Certificates</div>
                {deckDocumentOptions.map((opt) => (
                  <label key={opt} className="form-checkbox-label">
                    <input
                      type="checkbox"
                      name="required_documents"
                      value={opt}
                      checked={(formData.required_documents || []).includes(opt)}
                      onChange={handleChange}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>

    {/* 3. Años en el cargo */}
    <label>Time in Rank:</label>
    <select name="years_in_rank" value={formData.years_in_rank} onChange={handleChange}>
      <option value="">Select...</option>
      {yearsOptions.map((y) => (
        <option key={y} value={y}>{y === 'Green' ? 'Green' : `>${y}`}</option>
      ))}
    </select>

    {/* 3.5. Sex Requirement (solo si Team === 'No') */}
      {formData.team === 'No' && (
        <>
          <label>Sex:</label>
          <select name="gender" value={formData.gender} onChange={handleChange}>
            <option value="">Any</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </>
      )}

{/* 6. Salary */}
{!formData.is_doe && (
  <>
    <label>Salary Currency: <span style={{ color: 'red' }}>*</span></label>
    <select
      name="salary_currency"
      value={formData.salary_currency}
      onChange={handleChange}
      className={highlightClass(!formData.salary_currency && !formData.is_doe)}
      required
    >
      <option value="">Select currency...</option>
      <option value="USD">USD</option>
      <option value="EUR">EUR</option>
      <option value="AUD">AUD</option>
      <option value="GBP">GBP</option>
    </select>

    <label>Salary: <span style={{ color: 'red' }}>*</span></label>
    <input
      type="number"
      name="salary"
      value={formData.salary || ''}
      onChange={handleChange}
      className={highlightClass(!formData.salary && !formData.is_doe)}
    />
  </>
)}

{/* 5. DOE */}
<div className="form-group salary-extra-row"> 
  <label className="form-checkbox-label"> 
    <input
      type="checkbox"
      name="is_doe"
      checked={formData.is_doe}
      onChange={handleChange}
    />
    <span>DOE (Salary)</span>
  </label>
  <label className="form-checkbox-label"> 
    <input
      type="checkbox"
      name="is_tips"
      checked={formData.is_tips}
      onChange={handleChange}
    />
    <span>+ Tips</span>
  </label>
</div>

{/* 6-8. Campos si Team === 'Yes' */}
{formData.team === 'Yes' && (
  <>
    <label>Teammate Rank: <span style={{ color: 'red' }}>*</span></label>
    <select
      name="teammate_rank"
      value={formData.teammate_rank}
      onChange={handleChange}
      className={highlightClass(formData.team === 'Yes' && !formData.teammate_rank)}
    >
      <option value="">Select...</option>
      {titles.map((t) => <option key={t} value={t}>{t}</option>)}
    </select>

    <label>Teammate Experience:</label>
    <select name="teammate_experience" value={formData.teammate_experience} onChange={handleChange}>
      <option value="">Select...</option>
      {yearsOptions.map((y) => (
        <option key={y} value={y}>{y === 'Green' ? 'Green' : `>${y}`}</option>
      ))}
    </select>

    {!formData.is_doe && (
      <>
        <label>Teammate Salary: <span style={{ color: 'red' }}>*</span></label>
<div className="form-inline-group">
  <span>{formData.teammate_salary_currency}</span>
  <input
    type="number"
    name="teammate_salary"
    value={formData.teammate_salary || ''}
    onChange={handleChange}
    className={highlightClass(formData.team === 'Yes' && !formData.is_doe && !formData.teammate_salary)}
  />
</div>
      </>
    )}
  </>
)}

{/* Languages */}
<label>Languages:</label>

<div className="form-inline-group">
  <select name="language_1" value={formData.language_1} onChange={handleChange}>
    <option value="">Language 1...</option>
    <option value="Arabic">Arabic</option>
    <option value="Dutch">Dutch</option>
    <option value="English">English</option>
    <option value="French">French</option>
    <option value="German">German</option>
    <option value="Greek">Greek</option>
    <option value="Italian">Italian</option>
    <option value="Mandarin">Mandarin</option>
    <option value="Portuguese">Portuguese</option>
    <option value="Russian">Russian</option>
    <option value="Spanish">Spanish</option>
    <option value="Turkish">Turkish</option>
    <option value="Ukrainian">Ukrainian</option>
  </select>

  <select name="language_1_fluency" value={formData.language_1_fluency} onChange={handleChange}>
    <option value="">Fluency...</option>
    <option value="Native">Native</option>
    <option value="Fluent">Fluent</option>
    <option value="Conversational">Conversational</option>
  </select>
</div>

<div className="form-inline-group">
  <select name="language_2" value={formData.language_2} onChange={handleChange}>
    <option value="">Language 2...</option>
    <option value="Arabic">Arabic</option>
    <option value="Dutch">Dutch</option>
    <option value="English">English</option>
    <option value="French">French</option>
    <option value="German">German</option>
    <option value="Greek">Greek</option>
    <option value="Italian">Italian</option>
    <option value="Mandarin">Mandarin</option>
    <option value="Portuguese">Portuguese</option>
    <option value="Russian">Russian</option>
    <option value="Spanish">Spanish</option>
    <option value="Turkish">Turkish</option>
    <option value="Ukrainian">Ukrainian</option>
  </select>

  <select name="language_2_fluency" value={formData.language_2_fluency} onChange={handleChange}>
    <option value="">Fluency...</option>
    <option value="Native">Native</option>
    <option value="Fluent">Fluent</option>
    <option value="Conversational">Conversational</option>
  </select>
</div>

  {/* Campo Visas */}
<label htmlFor="visas-trigger">Visa(s):</label>
<div
  className={`custom-multiselect ${showVisas ? 'open' : ''}`}
  ref={visasRef}
>
  <button
    type="button"
    id="visas-trigger"
    className="multiselect-trigger"
    onClick={() => setShowVisas((v) => !v)}
  >
    {formData.visas.length > 0 ? formData.visas.join(', ') : 'Select...'}
    <span className={`caret ${showVisas ? 'up' : ''}`} aria-hidden>▾</span>
  </button>

  <div className="multiselect-options">
    {visaOptions.map((visa) => (
      <label key={visa} className="form-checkbox-label">
        <input
          type="checkbox"
          name="visas"
          value={visa}
          checked={formData.visas.includes(visa)}
          onChange={handleChange}
        />
        {visa}
      </label>
    ))}
  </div>
</div>

    {/* 9. Tipo */}
    <label>Terms: <span style={{ color: 'red' }}>*</span></label>
<select
  name="type"
  value={isDayworker ? 'DayWork' : formData.type}
  onChange={handleChange}
  className={highlightClass(!isDayworker && !formData.type)}
  required
  disabled={isDayworker}
>
  <option value="">Select...</option>
  {types.map((t) => <option key={t} value={t}>{t}</option>)}
</select>

    {/* Liveaboard */}
    <label>Liveaboard:</label>
<select
  name="liveaboard"
  value={formData.liveaboard}
  onChange={handleChange}
  disabled={isDayworker}
>
      <option value="">Select...</option>
      <option value="No">No</option>
      <option value="Own Cabin">Own Cabin</option>
      <option value="Share Cabin">Share Cabin</option>
      <option value="Flexible">Flexible</option>
    </select>

    {/* Use */}
    <label>Use:</label>
<select
  name="uses"
  value={formData.uses}
  onChange={handleChange}
  disabled={isDayworker}
>
      <option value="">Select...</option>
      <option value="Private">Private</option>
      <option value="Charter (only)">Charter (only)</option>
      <option value="Private/Charter">Private/Charter</option>
    </select>

    {/* Season Type */}
    <label>Season Type:</label>
<select
  name="season_type"
  value={formData.season_type}
  onChange={handleChange}
  disabled={isDayworker}
>
      <option value="">Select...</option>
      <option value="Single Season">Single Season</option>
      <option value="Dual Season">Dual Season</option>
      <option value="Year-round">Year-round</option>
    </select>

    {/* 10. Tipo de Yate */}
    <label>Yacht Type: <span style={{ color: 'red' }}>*</span></label>
    <select
      name="yacht_type"
      value={formData.yacht_type}
      onChange={handleChange}
      className={highlightClass(!formData.yacht_type)}
    >
      <option value="">Select...</option>
      <option value="Motor Yacht">Motor Yacht</option>
      <option value="Sailing Yacht">Sailing Yacht</option>
      <option value="Chase Boat">Chase Boat</option>
      <option value="Sailing Catamaran">Sailing Catamaran</option>
      <option value="Motor Catamaran">Motor Catamaran</option>
      <option value="Support Yacht">Support Yacht</option>
      <option value="Expedition Yacht">Expedition Yacht</option>
    </select>

    {/* 11. Tamaño del Yate */}
<label>Yacht Size: <span style={{ color: 'red' }}>*</span></label>
<select
  name="yacht_size"
  value={formData.yacht_size}
  onChange={handleChange}
  className={highlightClass(!formData.yacht_size)}
>
  <option value="">Select...</option>
  {yachtSizeOptions.map((size) => (
    <option key={size} value={size}>{size}</option>
  ))}
</select>

    {/* 11.5 Propulsion Type (solo para ciertos rangos) */}
{['Captain', 'Relief Captain', 'Skipper', 'Captain/Engineer'].includes(formData.title) && (
  <>
    <label>Propulsion Type:</label>
    <select name="propulsion_type" value={formData.propulsion_type} onChange={handleChange}>
      <option value="">Select...</option>
      <option value="Shaft Drive">Shaft Drive</option>
      <option value="Waterjet">Waterjet</option>
      <option value="Pod Drive">Pod Drive</option>
      <option value="Arneson Drive">Arneson Drive</option>
    </select>
  </>
)}

    {/* Homeport */}
    <label>Homeport:</label>
    <input
      type="text"
      name="homeport"
      value={formData.homeport}
      onChange={handleChange}
/>

    {/* 12. Flag */}
    <label>Flag:</label>
    <select name="flag" value={formData.flag} onChange={handleChange}>
      <option value="">Select...</option>
      {['Foreign Flag', 'United States', 'Australia', 'Bahamas', 'Belgium', 'Bermuda', 'BVI', 'Cayman Islands', 'Cook Islands', 'Cyprus', 'Delaware', 'France', 'Germany', 'Gibraltar', 'Greece', 'Guernsey', 'Holland', 'Hong Kong', 'Isle of Man', 'Italy', 'Jamaica', 'Jersey', 'Langkawi', 'Malta', 'Marshall Islands', 'Panama', 'Poland', 'Portugal', 'San Marino', 'Singapore', 'Spain', 'UK'].map((f) => (
        <option key={f} value={f}>{f}</option>
      ))}
    </select>

    {/* 13. Fecha de Inicio */}
<label>Start Date (Month/Day): <span style={{ color: 'red' }}>*</span></label>
<div className="form-inline-group">
  <select
    name="start_month"
    value={formData.start_month}
    onChange={handleChange}
    className={highlightClass(!formData.start_month && !formData.is_asap && !formData.is_flexible)}
    required={!formData.is_asap && !formData.is_flexible}
    disabled={formData.is_asap || formData.is_flexible}
  >
    <option value="">Month...</option>
    {MONTHS.map((m) => (
      <option key={m.value} value={m.value}>{m.label}</option>
    ))}
  </select>
  <select
    name="start_day"
    value={formData.start_day}
    onChange={handleChange}
    disabled={!formData.start_month || formData.is_asap || formData.is_flexible}
  >
    <option value="">Day (optional)</option>
    {Array.from({ length: getDaysInMonth(formData.start_month || '0') }, (_, i) => i + 1).map((d) => (
      <option key={d} value={d}>{d}</option>
    ))}
  </select>
  <p style={{ marginTop: -10, marginBottom: 6, fontSize: 12, color: '#666', width: '100%' }}>
    Leave day empty to indicate flexible within the month.
  </p>
</div>

{/* ASAP Option */}
<div className="form-group asap-flex-row">
  <label className="form-checkbox-label">
    <input
      type="checkbox"
      name="is_asap"
      checked={formData.is_asap}
      onChange={handleChange}
      disabled={formData.is_flexible}
    />
    <span>ASAP</span>
  </label>
  <label className="form-checkbox-label">
    <input
      type="checkbox"
      name="is_flexible"
      checked={formData.is_flexible}
      onChange={handleChange}
      disabled={formData.is_asap}
    />
    <span>Flexible</span>
  </label>
</div>

    {/* 14. Fecha de Finalización */}
    <label>End Date (Month/Day):</label>
    <div className="form-inline-group">
      <select
        name="end_month"
        value={formData.end_month}
        onChange={handleChange}
        disabled={formData.type === 'Permanent'}
      >
        <option value="">Month...</option>
        {MONTHS.map((m) => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>
      <select
        name="end_day"
        value={formData.end_day}
        onChange={handleChange}
        disabled={!formData.end_month || formData.type === 'Permanent'}
      >
        <option value="">Day (optional)</option>
        {Array.from({ length: getDaysInMonth(formData.end_month || '0') }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
      <p style={{ marginTop: -10, marginBottom: 16, fontSize: 12, color: '#666', width: '100%' }}>
        Leave day empty to indicate flexible within the month.
      </p>
    </div>

    {/* Holidays */}
    <label>Holidays (Days per year):</label>
    <input
      type="number"
      step="0.1"
      name="holidays"
      value={formData.holidays || ''}
      onChange={handleChange}
      disabled={isDayworker}
    />

    {/* 15. Ciudad */}
    <label>City:</label>
    <input name="city" value={formData.city} onChange={handleChange} />

    {/* 16. Country/Region */}
<label>Country/Region: <span style={{ color: 'red' }}>*</span></label>
<select
  name="country"
  value={formData.country}
  onChange={handleChange}
  className={highlightClass(!formData.country)}
  required
>
  <option value="">Select...</option>

  <optgroup label="Regions">
    <option value="Asia">Asia</option>
    <option value="Baltic">Baltic</option>
    <option value="Caribbean">Caribbean</option>
    <option value="Indian Ocean">Indian Ocean</option>
    <option value="Mediterranean">Mediterranean</option>
    <option value="Red Sea">Red Sea</option>
    <option value="North Sea">North Sea</option>
    <option value="Pacific">Pacific</option>
  </optgroup>

  <optgroup label="Countries">
    {countries.map((c) => (
      <option key={c} value={c}>{c}</option>
    ))}
  </optgroup>
</select>

    {/* 17. Email de contacto */}
    <label>Contact Email:</label>
    <input type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} />

    {/* 18. Teléfono de contacto */}
    <label>Contact Phone:</label>
    <input type="tel" name="contact_phone" value={formData.contact_phone} onChange={handleChange} />

    {renderRequiredDocsSummary()}

    {/* 19. Descripción */}
    <label>Remarks:</label>
    <div className="remarks-field">
      <textarea
        className="remarks-textarea"
        name="description"
        rows={5}
        ref={remarksRef}
        value={formData.description}
        onChange={handleChange}
        onInput={handleRemarksInput}
        onFocus={autoResizeTextarea}
        style={{ overflow: 'hidden', resize: 'none' }}
      />
      <button
        type="button"
        onClick={previousRemarks ? undoRemarks : improveRemarks}
        className="remarks-ai-button"
        disabled={rewriteLoading || (!previousRemarks && remarksAiUsed)}
        aria-label={previousRemarks ? 'Undo AI change' : 'Improve with AI'}
        title={previousRemarks ? 'Undo' : 'Improve with AI'}
        data-typing={remarksTyping ? 'true' : 'false'}
      >
        {rewriteLoading ? (
          <span className="remarks-ai-text">...</span>
        ) : previousRemarks ? (
          <span className="remarks-ai-text">Undo</span>
        ) : (
          <>
            <span className="remarks-ai-spark">✦</span>
            <span className="remarks-ai-text">AI</span>
          </>
        )}
      </button>
    </div>

          </>
    )}

    {formData.work_environment === 'Shore-based' && (
  <>
    {/* Position */}
    <label>Position: <span style={{ color: 'red' }}>*</span></label>
    <input
      name="title"
      value={formData.title}
      onChange={handleChange}
      className={highlightClass(!formData.title)}
      required
    />

    {/* Salary */}
    {!formData.is_doe && (
      <>
        <label>Salary Currency: <span style={{ color: 'red' }}>*</span></label>
        <select
          name="salary_currency"
          value={formData.salary_currency}
          onChange={handleChange}
          className={highlightClass(!formData.salary_currency && !formData.is_doe)}
          required
        >
          <option value="">Select currency...</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="AUD">AUD</option>
          <option value="GBP">GBP</option>
        </select>

        <label>Salary: <span style={{ color: 'red' }}>*</span></label>
        <input
          type="number"
          name="salary"
          value={formData.salary || ''}
          onChange={handleChange}
          className={highlightClass(!formData.salary && !formData.is_doe)}
        />
      </>
    )}

    {/* DOE */}
    <div className="form-group salary-extra-row"> 
  <label className="form-checkbox-label"> 
    <input
      type="checkbox"
      name="is_doe"
      checked={formData.is_doe}
      onChange={handleChange}
    />
    <span>DOE (Salary)</span>
  </label>
  <label className="form-checkbox-label"> 
    <input
      type="checkbox"
      name="is_tips"
      checked={formData.is_tips}
      onChange={handleChange}
    />
    <span>+ Tips</span>
  </label>
</div>

    {/* Languages */}
    <label>Languages:</label>
    <div className="form-inline-group">
      <select name="language_1" value={formData.language_1} onChange={handleChange}>
        <option value="">Language 1...</option>
        <option value="Arabic">Arabic</option>
        <option value="Dutch">Dutch</option>
        <option value="English">English</option>
        <option value="French">French</option>
        <option value="German">German</option>
        <option value="Greek">Greek</option>
        <option value="Italian">Italian</option>
        <option value="Mandarin">Mandarin</option>
        <option value="Portuguese">Portuguese</option>
        <option value="Russian">Russian</option>
        <option value="Spanish">Spanish</option>
        <option value="Turkish">Turkish</option>
        <option value="Ukrainian">Ukrainian</option>
      </select>

      <select name="language_1_fluency" value={formData.language_1_fluency} onChange={handleChange}>
        <option value="">Fluency...</option>
        <option value="Native">Native</option>
        <option value="Fluent">Fluent</option>
        <option value="Conversational">Conversational</option>
      </select>
    </div>

    
      <div className="form-inline-group">
      <select name="language_2" value={formData.language_2} onChange={handleChange}>
        <option value="">Language 2...</option>
        <option value="Arabic">Arabic</option>
        <option value="Dutch">Dutch</option>
        <option value="English">English</option>
        <option value="French">French</option>
        <option value="German">German</option>
        <option value="Greek">Greek</option>
        <option value="Italian">Italian</option>
        <option value="Mandarin">Mandarin</option>
        <option value="Portuguese">Portuguese</option>
        <option value="Russian">Russian</option>
        <option value="Spanish">Spanish</option>
        <option value="Turkish">Turkish</option>
        <option value="Ukrainian">Ukrainian</option>
      </select>

      <select name="language_2_fluency" value={formData.language_2_fluency} onChange={handleChange}>
        <option value="">Fluency...</option>
        <option value="Native">Native</option>
        <option value="Fluent">Fluent</option>
        <option value="Conversational">Conversational</option>
      </select>
    </div>

    {/* Start Date */}
    <label>Start Date (Month/Day): <span style={{ color: 'red' }}>*</span></label>
    <div className="form-inline-group">
      <select
        name="start_month"
        value={formData.start_month}
        onChange={handleChange}
        className={highlightClass(!formData.start_month && !formData.is_asap && !formData.is_flexible)}
        required={!formData.is_asap && !formData.is_flexible}
        disabled={formData.is_asap || formData.is_flexible}
      >
        <option value="">Month...</option>
        {MONTHS.map((m) => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>
      <select
        name="start_day"
        value={formData.start_day}
        onChange={handleChange}
        disabled={!formData.start_month || formData.is_asap || formData.is_flexible}
      >
        <option value="">Day (optional)</option>
        {Array.from({ length: getDaysInMonth(formData.start_month || '0') }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
    </div>
    <p style={{ marginTop: -4, marginBottom: 16, fontSize: 12, color: '#666' }}>
      Leave day empty to indicate flexible within the month.
    </p>

    {/* ASAP */}
    <div className="form-group asap-flex-row">
      <label className="form-checkbox-label">
        <input
          type="checkbox"
          name="is_asap"
          checked={formData.is_asap}
          onChange={handleChange}
          disabled={formData.is_flexible}
        />
        <span>ASAP</span>
      </label>
      <label className="form-checkbox-label">
        <input
          type="checkbox"
          name="is_flexible"
          checked={formData.is_flexible}
          onChange={handleChange}
          disabled={formData.is_asap}
        />
        <span>Flexible</span>
      </label>
    </div>

    {/* End Date */}
    <label>End Date (Month/Day):</label>
    <div className="form-inline-group">
      <select
        name="end_month"
        value={formData.end_month}
        onChange={handleChange}
      >
        <option value="">Month...</option>
        {MONTHS.map((m) => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>
      <select
        name="end_day"
        value={formData.end_day}
        onChange={handleChange}
        disabled={!formData.end_month}
      >
        <option value="">Day (optional)</option>
        {Array.from({ length: getDaysInMonth(formData.end_month || '0') }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
      <p style={{ marginTop: -10, marginBottom: 16, fontSize: 12, color: '#666', width: '100%' }}>
        Leave day empty to indicate flexible within the month.
      </p>
    </div>

    {/* Work Location */}
    <label>Work Location: <span style={{ color: 'red' }}>*</span></label>
    <select
      name="work_location"
      value={formData.work_location}
      onChange={handleChange}
      className={highlightClass(!formData.work_location)}
    >
      <option value="">Select...</option>
      <option value="Remote">Remote</option>
      <option value="On - site">On - site</option>
    </select>

    {/* City & Country if On - site */}
    {formData.work_location === 'On - site' && (
      <>
        <label>City: <span style={{ color: 'red' }}>*</span></label>
        <input
          name="city"
          value={formData.city}
          onChange={handleChange}
          className={highlightClass(formData.work_location === 'On - site' && !formData.city)}
          required
        />

        <label>Country: <span style={{ color: 'red' }}>*</span></label>
        <select
          name="country"
          value={formData.country}
          onChange={handleChange}
          className={highlightClass(formData.work_location === 'On - site' && !formData.country)}
          required
        >
          <option value="">Select...</option>
          {countries.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </>
    )}

    {/* Contact Email */}
    <label>Contact Email:</label>
    <input
      type="email"
      name="contact_email"
      value={formData.contact_email}
      onChange={handleChange}
    />

    {/* Contact Phone */}
    <label>Contact Phone:</label>
    <input
      type="tel"
      name="contact_phone"
      value={formData.contact_phone}
      onChange={handleChange}
    />

    {/* Remarks */}
<label>Remarks:</label>
<div className="remarks-field">
  <textarea
    className="remarks-textarea"
    name="description"
    rows={5}
    ref={remarksRef}
    value={formData.description}
    onChange={handleChange}
    onInput={handleRemarksInput}
    onFocus={autoResizeTextarea}
    style={{ overflow: 'hidden', resize: 'none' }}
  />
  <button
    type="button"
    onClick={previousRemarks ? undoRemarks : improveRemarks}
    className="remarks-ai-button"
    disabled={rewriteLoading || (!previousRemarks && remarksAiUsed)}
    aria-label={previousRemarks ? 'Undo AI change' : 'Improve with AI'}
    title={previousRemarks ? 'Undo' : 'Improve with AI'}
    data-typing={remarksTyping ? 'true' : 'false'}
  >
    {rewriteLoading ? (
      <span className="remarks-ai-text">...</span>
    ) : previousRemarks ? (
      <span className="remarks-ai-text">Undo</span>
    ) : (
      <>
        <span className="remarks-ai-spark">✦</span>
        <span className="remarks-ai-text">AI</span>
      </>
    )}
  </button>
</div>
  </>
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