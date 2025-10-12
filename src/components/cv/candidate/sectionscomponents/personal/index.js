// src/components/cv/candidate/sectionscomponents/personal/index.js

// ── Components ────────────────────────────────────────────────────────────────
export { default as NameRow } from './NameRow';
export { default as EmailPhoneRow } from './EmailPhoneRow';
export { default as WhatsAppRow } from './WhatsAppRow';
export { default as CountryCityCommRow } from './CountryCityCommRow';
export { default as ResidenceCountryRow } from './ResidenceCountryRow';
export { default as BirthNationalityRow } from './BirthNationalityRow';
export { default as NationalitiesChips } from './NationalitiesChips';
export { default as SocialLinksRow } from './SocialLinksRow';
export { default as VisibilityTogglesRow } from './VisibilityTogglesRow';

// ── Helpers (named exports) ───────────────────────────────────────────────────
export {
  buildYears,
  normalizePhone,
  normalizeUrl,
  calcAgeYears,
  rowTwoCols,
  labelNowrap,
} from './helpers';

// ── Constants (re-export desde ./constants) ───────────────────────────────────
export {
  MONTHS,
  COMM_PREFS,
  COUNTRIES,
  NATIONALITIES,
} from './constants';