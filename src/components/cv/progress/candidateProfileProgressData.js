import { normalizeDeptSpecialties } from '../candidate/sectionscomponents/preferencesskills/catalogs';
import {
  buildLiteProgressSections,
  buildProfessionalProgressSections,
} from './profileProgress';

const DEFAULT_DOC_FLAGS = {
  passport6m: false,
  schengenVisa: false,
  stcwBasic: false,
  seamansBook: false,
  eng1: false,
  usVisa: false,
  drivingLicense: false,
  pdsd: false,
  covidVaccine: false,
};

export function normalizeCandidateProfileLanguageLevels(arr) {
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

export function buildCandidateLiteState(profile = {}) {
  const seedLite = profile?.prefs_skills_lite && typeof profile.prefs_skills_lite === 'object'
    ? profile.prefs_skills_lite
    : {};
  const lifestyleSeed = seedLite?.lifestyleHabits && typeof seedLite.lifestyleHabits === 'object'
    ? seedLite.lifestyleHabits
    : {};

  return {
    status: seedLite?.status || '',
    availability: seedLite?.availability || '',
    languageLevels: Array.isArray(seedLite?.languageLevels)
      ? normalizeCandidateProfileLanguageLevels(seedLite.languageLevels)
      : [],
    deptSpecialties: normalizeDeptSpecialties(seedLite?.deptSpecialties || []),
    lifestyleHabits: {
      tattoosVisible: lifestyleSeed?.tattoosVisible || '',
      drugTestWilling: (lifestyleSeed?.drugTestWilling || '').trim() || 'Yes',
      smoking: (lifestyleSeed?.smoking || '').trim() || 'Non-smoker',
      vaping: (lifestyleSeed?.vaping || '').trim() || 'None',
      alcohol: (lifestyleSeed?.alcohol || '').trim() || 'None',
      dietaryAllergies: Array.isArray(lifestyleSeed?.dietaryAllergies) ? lifestyleSeed.dietaryAllergies : [],
      fitness: (lifestyleSeed?.fitness || '').trim() || 'None',
    },
    docFlags: {
      ...DEFAULT_DOC_FLAGS,
      ...(seedLite?.docFlags && typeof seedLite.docFlags === 'object' ? seedLite.docFlags : {}),
    },
  };
}

export function buildCandidateProfessionalPrefs(profile = {}) {
  const seedPro = profile?.prefs_skills_pro && typeof profile.prefs_skills_pro === 'object'
    ? profile.prefs_skills_pro
    : {};

  return {
    ...seedPro,
    regionsSeasons: Array.isArray(seedPro?.regionsSeasons) ? seedPro.regionsSeasons : [],
    contracts: Array.isArray(seedPro?.contracts) ? seedPro.contracts : [],
    rotation: Array.isArray(seedPro?.rotation)
      ? seedPro.rotation
      : (seedPro?.rotation ? [seedPro.rotation] : []),
    vesselTypes: Array.isArray(seedPro?.vesselTypes) ? seedPro.vesselTypes : [],
    vesselSizeRange: seedPro?.vesselSizeRange ?? [],
    rateSalary:
      seedPro?.rateSalary && typeof seedPro.rateSalary === 'object'
        ? seedPro.rateSalary
        : { currency: 'USD', dayRateMin: '', salaryMin: '' },
    programTypes: Array.isArray(seedPro?.programTypes) ? seedPro.programTypes : [],
    dietaryRequirements: Array.isArray(seedPro?.dietaryRequirements) ? seedPro.dietaryRequirements : [],
    onboardPrefs: seedPro?.onboardPrefs && typeof seedPro.onboardPrefs === 'object' ? seedPro.onboardPrefs : {},
  };
}

export function buildCandidateProfileProgressSections({
  profile = {},
  mode = 'lite',
  personal = null,
  primaryDepartment = '',
  primaryRank = '',
  aboutMe = '',
  docs = [],
  educationCount = 0,
  expCount = 0,
  refsCount = 0,
  gallery = [],
  litePrefs = null,
  professionalPrefs = null,
} = {}) {
  const liteState = litePrefs || buildCandidateLiteState(profile);
  const proPrefs = professionalPrefs || buildCandidateProfessionalPrefs(profile);
  const personalState = personal || {
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    email_public: profile?.email_public || '',
    phone_cc: profile?.phone_cc || '',
    phone_number: profile?.phone_number || '',
    country: profile?.country || '',
    city_port: profile?.city_port || '',
    nationalities: Array.isArray(profile?.nationalities) ? profile.nationalities : [],
    birth_month: profile?.birth_month ?? null,
    birth_year: profile?.birth_year ?? null,
    gender: profile?.gender || '',
    residence_country: profile?.residence_country || '',
    contact_pref: profile?.contact_pref || '',
  };
  const department = primaryDepartment || profile?.primary_department || '';
  const rank = primaryRank || profile?.primary_role || '';
  const about = aboutMe || profile?.about_me || '';

  return {
    liteSections: buildLiteProgressSections({
      personal: personalState,
      primaryDepartment: department,
      primaryRank: rank,
      expCount,
      aboutMe: about,
      prefs: {
        status: liteState.status,
        availability: liteState.availability,
        languageLevels: liteState.languageLevels,
        deptSpecialties: liteState.deptSpecialties,
      },
      lifestyleHabits: liteState.lifestyleHabits,
      educationCount,
      docs,
      docFlags: liteState.docFlags,
      refsCount,
      gallery,
    }),
    professionalSections: buildProfessionalProgressSections({
      profile,
      personal: {
        gender: personalState?.gender || '',
        residence_country: personalState?.residence_country || '',
        contact_pref: personalState?.contact_pref || '',
      },
      prefs: proPrefs,
    }),
    activeSections: mode === 'professional'
      ? buildProfessionalProgressSections({
          profile,
          personal: {
            gender: personalState?.gender || '',
            residence_country: personalState?.residence_country || '',
            contact_pref: personalState?.contact_pref || '',
          },
          prefs: proPrefs,
        })
      : buildLiteProgressSections({
          personal: personalState,
          primaryDepartment: department,
          primaryRank: rank,
          expCount,
          aboutMe: about,
          prefs: {
            status: liteState.status,
            availability: liteState.availability,
            languageLevels: liteState.languageLevels,
            deptSpecialties: liteState.deptSpecialties,
          },
          lifestyleHabits: liteState.lifestyleHabits,
          educationCount,
          docs,
          docFlags: liteState.docFlags,
          refsCount,
          gallery,
        }),
  };
}
