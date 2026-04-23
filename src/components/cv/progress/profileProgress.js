import { hasValidAvailability } from '../../../utils/availability';

const DOC_FLAG_KEYS = [
  'passport6m',
  'schengenVisa',
  'stcwBasic',
  'seamansBook',
  'eng1',
  'usVisa',
  'drivingLicense',
  'pdsd',
  'covidVaccine',
];

function hasLanguagesWithLevel(languageLevels) {
  if (!Array.isArray(languageLevels)) return false;
  return languageLevels.some(
    (ll) =>
      ll &&
      String(ll.lang || '').trim() &&
      String(ll.level || '').trim()
  );
}

function hasDeptSkills(deptSpecialties) {
  if (!Array.isArray(deptSpecialties)) return false;
  return deptSpecialties.some((it) => {
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
  return DOC_FLAG_KEYS.every((key) => {
    if (key === 'schengenVisa') {
      return docFlags[key] === true || docFlags[key] === false || docFlags[key] === 'resident';
    }
    if (key === 'usVisa') {
      return docFlags[key] === true || docFlags[key] === false || docFlags[key] === 'green_card';
    }
    return typeof docFlags[key] === 'boolean';
  });
}

function docsMeetMin(docs) {
  if (!Array.isArray(docs) || docs.length < 3) return false;
  let valid = 0;
  for (const doc of docs) {
    const titleOk = !!String(doc?.title || '').trim();
    const issuedOk = !!String(doc?.issuedOn || '').trim();
    const visibilityOk = !!String(doc?.visibility || 'unlisted').trim();
    if (titleOk && issuedOk && visibilityOk) valid += 1;
    if (valid >= 3) return true;
  }
  return false;
}

function hasAnySelectedItem(value) {
  if (Array.isArray(value)) return value.some((item) => String(item || '').trim().length > 0);
  if (value && typeof value === 'object') return Object.values(value).some(Boolean);
  return String(value || '').trim().length > 0;
}

function hasRateSalary(value) {
  if (!value || typeof value !== 'object') return false;
  return Boolean(
    String(value.dayRateMin || '').trim() ||
    String(value.salaryMin || '').trim() ||
    String(value.dayRate || '').trim() ||
    String(value.monthlySalary || '').trim() ||
    String(value.salaryMonthly || '').trim()
  );
}

function imageCount(gallery) {
  if (!Array.isArray(gallery)) return 0;
  return gallery.filter((item) => {
    const source = item?.type || item?.name || item?.path || item?.url || '';
    if (item?.type) return item.type === 'image';
    return !/\.(mp4|webm|mov|m4v|avi|mkv)$/i.test(String(source));
  }).length;
}

export function buildLiteProgressSections({
  personal = {},
  primaryDepartment = '',
  primaryRank = '',
  expCount = 0,
  aboutMe = '',
  prefs = {},
  lifestyleHabits = {},
  educationCount = 0,
  docs = [],
  docFlags = {},
  refsCount = 0,
  gallery = [],
} = {}) {
  return {
    personal: {
      first_name: !!String(personal.first_name || '').trim(),
      last_name: !!String(personal.last_name || '').trim(),
      email: /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(personal.email_public || '').trim()),
      phone_cc: String(personal.phone_cc || '').replace(/\D/g, '').length > 0,
      phone_number: !!String(personal.phone_number || '').trim(),
      country: !!personal.country,
      city_port: !!String(personal.city_port || '').trim(),
      birth_month: !!personal.birth_month,
      birth_year: !!personal.birth_year,
      nationality: Array.isArray(personal.nationalities) && personal.nationalities.length > 0,
    },
    dept_ranks: {
      count: (primaryDepartment ? 1 : 0) + (primaryRank ? 1 : 0),
      total: 2,
    },
    experience: { count: Number(expCount || 0) > 0 ? 1 : 0, total: 1 },
    about_me: { count: String(aboutMe || '').trim() ? 1 : 0, total: 1 },
    lifestyle: {
      count:
        (lifestyleHabits?.tattoosVisible ? 1 : 0) +
        (lifestyleHabits?.drugTestWilling ? 1 : 0) +
        (lifestyleHabits?.smoking ? 1 : 0) +
        (lifestyleHabits?.vaping ? 1 : 0) +
        (lifestyleHabits?.alcohol ? 1 : 0) +
        (Array.isArray(lifestyleHabits?.dietaryAllergies) && lifestyleHabits.dietaryAllergies.length > 0 ? 1 : 0) +
        (lifestyleHabits?.fitness ? 1 : 0),
      total: 7,
    },
    prefs_skills: {
      count:
        (prefs?.status && String(prefs.status).trim() ? 1 : 0) +
        (hasValidAvailability(prefs?.availability) ? 1 : 0) +
        (hasLanguagesWithLevel(prefs?.languageLevels) ? 1 : 0) +
        (hasDeptSkills(prefs?.deptSpecialties) ? 1 : 0),
      total: 4,
    },
    education: { count: Number(educationCount || 0) > 0 ? 1 : 0, total: 1 },
    documents: {
      count: (docsMeetMin(docs) ? 1 : 0) + (allDocFlagsSelected(docFlags) ? 1 : 0),
      total: 2,
    },
    references: { count: Number(refsCount || 0) > 0 ? 1 : 0, total: 1 },
    photos_videos: { count: Math.min(imageCount(gallery), 3), total: 3 },
  };
}

export function buildProfessionalProgressSections({
  profile = {},
  personal = {},
  prefs = {},
} = {}) {
  const targetRanks = profile?.target_ranks || [];
  return {
    personal: {
      count:
        ((profile?.gender ?? personal.gender) ? 1 : 0) +
        ((profile?.residence_country ?? personal.residence_country) ? 1 : 0) +
        ((profile?.contact_pref ?? personal.contact_pref) ? 1 : 0),
      total: 3,
    },
    dept_ranks: {
      count: Array.isArray(targetRanks) && targetRanks.length > 0 ? 1 : 0,
      total: 1,
    },
    about_me: {
      count: String(profile?.professional_statement || '').trim() ? 1 : 0,
      total: 1,
    },
    prefs_skills: {
      count:
        (hasAnySelectedItem(prefs?.regionsSeasons) ? 1 : 0) +
        (hasAnySelectedItem(prefs?.contracts) ? 1 : 0) +
        (hasAnySelectedItem(prefs?.rotation) ? 1 : 0) +
        (hasAnySelectedItem(prefs?.vesselTypes) ? 1 : 0) +
        (hasAnySelectedItem(prefs?.vesselSizeRange) ? 1 : 0) +
        (hasRateSalary(prefs?.rateSalary) ? 1 : 0) +
        (hasAnySelectedItem(prefs?.programTypes) ? 1 : 0) +
        (hasAnySelectedItem(prefs?.dietaryRequirements) ? 1 : 0) +
        (hasAnySelectedItem(prefs?.onboardPrefs) ? 1 : 0),
      total: 9,
    },
  };
}

export function buildProfileProgressSections({ mode = 'lite', ...data } = {}) {
  if (mode === 'professional') {
    return buildProfessionalProgressSections(data);
  }
  return buildLiteProgressSections(data);
}
