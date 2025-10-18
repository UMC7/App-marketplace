// src/components/cv/candidate/sectionscomponents/experience/index.js

// Components
export { default as YachtFields } from './YachtFields';
export { default as ShoreFields } from './ShoreFields';
export { default as MerchantFields } from './MerchantFields';
export { default as ItemRow } from './ItemRow';

// Utilities (explicit to avoid name collisions)
export { ymOnlyDigits } from './helpers';
export { ymFormatOnChange, ymNormalize } from './utils';
export { hideTechForRole, buildNoteTags, buildShoreTags } from './helpers';
export { default as EmploymentStatus } from './EmploymentStatus';

// Longevity (nuevo)
export {
  computeLongevityAvg,
  monthsBetweenInclusive,
  formatMonthsHuman,
  tenureMonthsForItem,
  formatRangeLabel,
} from './longevity';