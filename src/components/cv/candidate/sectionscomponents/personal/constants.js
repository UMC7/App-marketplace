// src/components/cv/candidate/sectionscomponents/personal/constants.js

// Meses (para el selector de mes de nacimiento)
export const MONTHS = [
  { v: 1, label: 'Jan' }, { v: 2, label: 'Feb' }, { v: 3, label: 'Mar' },
  { v: 4, label: 'Apr' }, { v: 5, label: 'May' }, { v: 6, label: 'Jun' },
  { v: 7, label: 'Jul' }, { v: 8, label: 'Aug' }, { v: 9, label: 'Sep' },
  { v: 10, label: 'Oct' }, { v: 11, label: 'Nov' }, { v: 12, label: 'Dec' }
];

// Preferencia de comunicación (valores EXACTOS permitidos por el CHECK en DB)
export const COMM_PREFS = ['email', 'phone', 'whatsapp'];

// Países y nacionalidades (reutilizamos el módulo compartido)
export { COUNTRIES, NATIONALITIES } from '../../shared/countriesData';