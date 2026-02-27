// src/components/cv/candidate/sectionscomponents/experience/utils.js
import React from 'react';

/* ========= Year-Month helpers ========= */
const ymOnlyDigits = (s = '') => String(s).replace(/\D/g, '').slice(0, 6);

/** Permite tipear libre y agrega el guion al pasar 4 dígitos (YYYY-MM parcial) */
export function ymFormatOnChange(value) {
  const d = ymOnlyDigits(value); // YYYYMM (parcial)
  if (d.length <= 4) return d;               // "2024"
  return `${d.slice(0, 4)}-${d.slice(4)}`;   // "2024-0" / "2024-05"
}

/** Normaliza a "YYYY-MM" o devuelve '' si no coincide */
export function ymNormalize(value) {
  if (!value) return '';
  const m = String(value).match(/^(\d{4})(?:-?)(\d{1,2})$/);
  if (!m) return '';
  const year = m[1];
  const mmNum = Math.min(12, Math.max(1, Number(m[2] || 0)));
  const mm = String(mmNum).padStart(2, '0');
  return `${year}-${mm}`;
}

/* ========= UI helpers ========= */
export const Opt = ({ value }) => <option value={value}>{value}</option>;

/* ========= Logic helpers ========= */
export function hideTechForRole(department) {
  const d = String(department || '').toLowerCase();
  return d === 'interior' || d === 'galley';
}

/** Construye tags compactos para notas (yacht) */
export function buildNoteTags({
  use,
  propulsion,
  powerValue,
  powerUnit,
  crossings,
  yardPeriod,
  crewBucket,
}) {
  const tags = [];
  if (use) tags.push(`use:${use}`);
  if (propulsion) tags.push(`propulsion:${propulsion}`);
  if (powerValue && powerUnit) tags.push(`power_${String(powerUnit).toLowerCase()}:${powerValue}`);
  if (crossings) tags.push(`crossings:${crossings}`);
  if (yardPeriod) tags.push(`yard:${yardPeriod}`);
  if (crewBucket && !['1', '2', '3', '4'].includes(crewBucket))
    tags.push(`crew_bucket:${crewBucket}`);
  return tags.length ? `[${tags.join('|')}]` : null;
}

/** Tags para experiencias Shore */
export function buildShoreTags({ supervised }) {
  const tags = [];
  if (supervised) tags.push(`supervised:${supervised}`);
  return tags.length ? `[${tags.join('|')}]` : null;
}

/* ========= Domain lists (idéntico a original) ========= */
// Lista acotada de industrias relevantes para transición a yates
export const INDUSTRIES = [
  'Hospitality',
  'Recreation & Tourism',
  'Catering / F&B',
  'Facilities / Maintenance',
  'Engineering',
  'Logistics',
  'Administration',
  'Security',
  'Retail',
  'IT / Systems',
  'Aviation',
  'Maritime Services',
  'Other',
];

// Lista de países (concisa pero útil)
export const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda','Argentina',
  'Armenia','Australia','Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Barbados',
  'Belarus','Belgium','Belize','Benin','Bhutan','Bolivia','Bosnia and Herzegovina',
  'Botswana','Brazil','Brunei','Bulgaria','Burkina Faso','Burundi','Cambodia','Cameroon',
  'Canada','Cape Verde','Central African Republic','Chad','Chile','China','Colombia',
  'Comoros','Congo, Democratic Republic of the','Congo, Republic of the','Costa Rica',
  "Cote d'Ivoire",'Croatia','Cuba','Cyprus','Czech Republic','Denmark','Djibouti',
  'Dominica','Dominican Republic','Ecuador','Egypt','El Salvador','Equatorial Guinea',
  'Eritrea','Estonia','Eswatini','Ethiopia','Fiji','Finland','France','Gabon','Gambia',
  'Georgia','Germany','Ghana','Greece','Grenada','Guatemala','Guinea','Guinea-Bissau',
  'Guyana','Haiti','Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq',
  'Ireland','Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kiribati',
  'Kosovo','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho','Liberia','Libya',
  'Liechtenstein','Lithuania','Luxembourg','Madagascar','Malawi','Malaysia','Maldives',
  'Mali','Malta','Marshall Islands','Mauritania','Mauritius','Mexico','Micronesia',
  'Moldova','Monaco','Mongolia','Montenegro','Morocco','Mozambique','Myanmar','Namibia',
  'Nauru','Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria','North Korea',
  'North Macedonia','Norway','Oman','Pakistan','Palau','Palestine','Panama',
  'Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal','Puerto Rico','Qatar',
  'Romania','Russia','Rwanda','Saint Kitts and Nevis','Saint Lucia',
  'Saint Vincent and the Grenadines','Samoa','San Marino','Sao Tome and Principe',
  'Saudi Arabia','Senegal','Serbia','Seychelles','Sierra Leone','Singapore','Slovakia',
  'Slovenia','Solomon Islands','Somalia','South Africa','South Korea','South Sudan',
  'Spain','Sri Lanka','Sudan','Suriname','Sweden','Switzerland','Syria','Taiwan',
  'Tajikistan','Tanzania','Thailand','Timor-Leste','Togo','Tonga','Trinidad and Tobago',
  'Tunisia','Turkey','Turkmenistan','Tuvalu','Uganda','Ukraine','United Arab Emirates',
  'United Kingdom','United States','Uruguay','Uzbekistan','Vanuatu','Vatican City',
  'Venezuela','Vietnam','Yemen','Zambia','Zimbabwe'
];
