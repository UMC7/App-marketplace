// src/components/cv/candidate/shared/merchantCatalogs.js
// Catalogs specific to Merchant / Sea Service forms.

export const TERMS = [
  'Permanent',
  'Rotational',
  'Temporary',
  'Seasonal',
  'Relief',
  'Voyage / Project',
  'Cadetship / Training',
];

export const MERCHANT_VESSEL_TYPES = [
  'Passenger / Ferry (Ro-Pax)',
  'Cargo (Container / Bulk / Tanker)',
  'Offshore / Supply / DP',
  'Tug',
  'Dredger',
  'Research / Survey',
  'Training / School Ship',
  'Government / Patrol',
  'Other',
];

export const REGIONS = [
  'Worldwide',
  'Mediterranean',
  'Europe',
  'Caribbean',
  'Atlantic',
  'Pacific',
  'Indian Ocean',
  'Red Sea',
  'Baltic',
  'North Sea',
  'Arctic',
  'Antarctic',
  'Middle East',
  'Southeast Asia',
  'US East Coast',
  'US West Coast',
  'South Pacific',
  'Central America',
  'South America',
];

export const ENGINE_POWER_DEPARTMENTS = ['Engine', 'Electrical / ETO'];

export function shouldShowEnginePower(department) {
  return ENGINE_POWER_DEPARTMENTS.includes(String(department || ''));
}
