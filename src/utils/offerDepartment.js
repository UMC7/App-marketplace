// src/utils/offerDepartment.js
const normalizeDepartment = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return 'Others';
  const key = raw.toLowerCase();
  if (['deck', 'deck department', 'deckdepartment'].includes(key)) return 'Deck';
  if (['engine', 'engineering', 'engine department', 'enginedepartment'].includes(key)) return 'Engine';
  if (['galley', 'kitchen', 'galley department', 'galleydepartment'].includes(key)) return 'Galley';
  if (['interior', 'stewardess', 'steward', 'interior department', 'interiordepartment'].includes(key)) return 'Interior';
  if (['other', 'others'].includes(key)) return 'Others';
  return raw;
};

const getOfferDepartmentFromTitle = (offer) => {
  const title = String(offer?.title || '').toLowerCase();
  const workEnv = String(offer?.work_environment || '').toLowerCase();

  if (workEnv === 'shore-based') return 'Shore-based';

  if ([
    'captain', 'captain/engineer', 'skipper', 'chase boat captain', 'relief captain', 'chief officer',
    '2nd officer', '3rd officer', 'bosun', 'deck/engineer', 'mate', 'lead deckhand', 'deckhand',
    'deck/steward(ess)', 'deck/carpenter', 'deck/divemaster'
  ].some(role => title.includes(role))) return 'Deck';

  if ([
    'chief engineer', '2nd engineer', '3rd engineer', 'solo engineer', 'electrician'
  ].some(role => title.includes(role))) return 'Engine';

  if ([
    'chef', 'head chef', 'sous chef', 'solo chef', 'cook/crew chef', 'cook/steward(ess)'
  ].some(role => title.includes(role))) return 'Galley';

  if ([
    'chief steward(ess)', '2nd steward(ess)', '2nd stewardess', '3rd steward(ess)', '3rd stewardess',
    '4th steward(ess)', '4th stewardess', 'steward(ess)', 'stewardess', 'steward', 'solo steward(ess)',
    'junior steward(ess)', 'stew/deck', 'laundry/steward(ess)', 'stew/masseur',
    'masseur', 'hairdresser', 'barber', 'butler', 'housekeeper', 'cook/stew/deck'
  ].some(role => title.includes(role))) return 'Interior';

  return 'Others';
};

export const getOfferDepartment = (offer) =>
  normalizeDepartment(offer?.department || getOfferDepartmentFromTitle(offer));

export const normalizeOfferDepartment = normalizeDepartment;
