// src/components/cv/candidate/sectionscomponents/preferencesskills/catalogs.js

// Tipos de contrato aceptados
// (incluye "Any" para candidatos sin preferencia estricta)
export const CONTRACT_TYPES = [
  'Any',
  'Permanent',
  'Rotational',
  'Seasonal',
  'Temporary',
  'Relief',
  'Daywork',
];

// Ciclos/rotaciones comunes (sin "None")
export const ROTATION_CYCLES = [
  '1:1',
  '2:1',
  '2:2',
  '3:1',
  '3:3',
  '4:2',
  '5:1',
  '10:10',
];

// Tipos de embarcación
export const VESSEL_TYPES = [
  'Motor Yacht',
  'Sailing Yacht',
  'Catamaran',
  'Support / Shadow',
  'Expedition',
  'Chase Boat',
];

// Rangos de eslora (m) — alineados con el selector de LOA
export const VESSEL_SIZE_RANGES = [
  '0 - 30m',
  '31 - 40m',
  '41 - 50m',
  '51 - 70m',
  '71 - 100m',
  '>100m',
];

/** Lista de regiones (sin temporadas), orden alfabético */
export const REGIONS = [
  'Antarctic',
  'Arctic',
  'Atlantic',
  'Australia',
  'Bahamas',
  'Baltic',
  'Caribbean',
  'Central America',
  'Indian Ocean',
  'Mediterranean',
  'Middle East',
  'New Zealand',
  'North Sea',
  'Pacific',
  'Red Sea',
  'South America',
  'South Pacific',
  'Southeast Asia',
  'US East Coast',
  'US West Coast',
  'Worldwide',
];

// (Compat) Regiones/temporadas antiguas: mantener solo si algo legacy lo usa
export const REGIONS_SEASONS = [
  'Mediterranean (Summer)',
  'Caribbean (Winter)',
  'Worldwide',
  'Bahamas (Winter)',
  'South Pacific (Seasonal)',
  'US East Coast (Summer)',
  'Indian Ocean (Seasonal)',
];

// Niveles (CEFR)
export const LANGUAGE_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native'];

// Monedas soportadas (según lo solicitado)
export const CURRENCIES = ['USD', 'EUR', 'AUD', 'GBP'];

/**
 * Mapeo de skills antiguas → skills nuevas para normalizar CVs existentes.
 * Claves en minúsculas para comparación case-insensitive.
 */
export const SKILL_MIGRATION_MAP = {
  // Deck — Operations & Seamanship
  'line handling & mooring': 'Line handling / mooring',
  'line handling / mooring': 'Line handling / mooring',
  'rib/tender operations': 'Tender ops (RIB)',
  'driving large tenders (10m+)': 'Large tender driving (10m+)',
  'crane/davit operations': 'Crane / davit ops',
  'jet skis & water toys': 'Jet skis & water toys',
  'watersports instruction': 'Watersports assist',
  'bridge/navigation support': 'Nav support / chartwork',
  'chartwork & passage planning': 'Passage planning support',
  'watchkeeping (bridge)': 'Bridge watch / lookout',
  'anchoring ops': 'Anchoring ops',
  'fendering & docking prep': 'Docking prep (fenders / lines)',
  'gangway & passerelle ops': 'Docking prep (fenders / lines)',
  // Deck — Exterior Care
  'exterior washdown & detailing': 'Exterior washdown / detailing',
  'exterior washdown / detailing': 'Exterior washdown / detailing',
  'teak care & restoration': 'Teak care',
  'teak care': 'Teak care',
  'paint & varnish': 'Paint & varnish',
  'paint & varnish (basic)': 'Paint & varnish',
  'caulking & deck repairs': 'Caulking / deck repairs',
  'caulking / deck repairs': 'Caulking / deck repairs',
  // Deck — Safety
  'isps/security awareness': 'ISPS awareness',
  'isps awareness': 'ISPS awareness',
  'safety drills (mob/abandon ship)': 'MOB / fire / abandon drills',
  'mob / fire / abandon drills': 'MOB / fire / abandon drills',
  'first aid / medical support': 'First aid support',
  'first aid support': 'First aid support',
  // Deck — Guest Support & Media
  'drone photography / media': 'Drone ops (basic)',
  'guest logistics & concierge': 'Guest media assist',
  // Others — Water Activities
  'water sports instruction': 'Water Sports Instruction & Supervision',
  // Engine — Powertrain
  'diesel engines – diagnostics & service': 'Diesel diagnostics & repair',
  'generators – service & load management': 'Generator control systems',
  'shaft/propulsion alignment': 'Gearbox / shaft alignment',
  'stabilizers & thrusters': 'Stabilizers & thrusters service',
  // Engine — Electrical
  'electrical systems (ac/dc)': 'Electrical fault finding (AC/DC)',
  'electronics & instrumentation': 'AV / IT yacht networks',
  'battery systems & chargers': 'Lithium battery safety & service',
  'alarm/monitoring systems': 'PLC fault diagnostics',
  // Engine — Fluids
  'hydraulics': 'Hydraulic fault diagnostics',
  'piping & plumbing': 'Sanitary systems repair',
  'fuel systems & polishing': 'Fuel system troubleshooting',
  // Engine — HVAC & Water
  'hvac & refrigeration': 'HVAC fault diagnostics',
  'watermakers/ro plants': 'RO / watermaker service',
  // Engine — Maintenance
  'planned maintenance systems (pms)': 'PMS platforms (AMOS / IDEA / Voly)',
  'preventive maintenance scheduling': 'Preventive maintenance',
  'spare parts management': 'Spares handling',
  'technical purchasing & inventory': 'Spares strategy',
  'dry dock / yard period planning': 'Dry dock specs',
  'class & flag surveys support': 'Class / flag inspections',
  // Interior — Service & Table
  'silver service': 'Silver service',
  'wine & beverage service': 'Wine service (WSET 1/2)',
  'cocktail bartending': 'Mixology',
  'table scaping & décor': 'Table décor & styling',
  'service lead/butler duties': 'Butler-style service',
  'floristry': 'Flower arranging',
  // Interior — Housekeeping
  'housekeeping standards': 'Elite cabin detailing',
  'laundry/pressing/garment care': 'High-end laundry & ironing',
  'high-end fabric care': 'Luxury fabric care',
  'cabin turn-down procedures': 'Turn-down standards',
  // Interior — Guest Care
  'guest relations & concierge': 'Guest relations',
  'inventory & provisioning': 'Provisioning & stock control',
  'f&b stock control': 'Provisioning & stock control',
  'event & theme nights': 'Event / theme night setup',
  'valet skills': 'Valet services',
  'spa/beauty basics': 'Spa / beauty basics',
  'childcare/nanny support': 'Childcare / nanny support',
  'admin & purser support': 'Interior budget awareness',
  'medical/first aid support': 'Risk assessment (RA)',
  // Galley — Cuisine
  'mediterranean cuisine': 'Prepare Mediterranean cuisine',
  'asian/japanese/sushi': 'Prepare Asian / Japanese cuisine',
  'plant-based/vegan': 'Prepare plant-based menus',
  'gluten-free & allergens': 'Execute allergen-safe dishes',
  // Galley — Production
  'pastry & bakery': 'Produce pastries & desserts',
  'breads & viennoiserie': 'Bake breads & viennoiserie',
  'sauces & stocks': 'Prepare sauces & stocks',
  'desserts & chocolate work': 'Produce pastries & desserts',
  'butchery & fishmongery': 'Perform butchery & fish prep',
  'fine dining plating': 'Plate fine dining dishes',
  // Galley — Operation
  'menu planning & costing': 'Cost menus',
  'provisioning & vendor sourcing': 'Source provisions',
  'galley hygiene & haccp': 'Apply HACCP workflows',
  'food safety & storage': 'Maintain safe food storage',
  'dietary requirements management': 'Apply HACCP workflows',
  'crew food at scale': 'Produce crew meals at scale',
  'catering for charters/events': 'Execute charter turnaround',
  'waste minimization': 'Apply HACCP workflows',
  // Variantes legacy comunes
  'tender driving': 'Tender ops (RIB)',
  'washdown': 'Exterior washdown / detailing',
  'line handling': 'Line handling / mooring',
  'watchkeeping': 'Bridge watch / lookout',
  'refit support': 'New build / refit deck commissioning',
};

/**
 * Normaliza un skill (string) usando el mapeo de migración.
 * Si no hay mapeo, devuelve el string original trimmeado.
 */
export function normalizeSkillForDisplay(skill) {
  if (!skill || typeof skill !== 'string') return '';
  const s = String(skill).trim();
  if (!s) return '';
  const key = s.toLowerCase();
  const mapped = SKILL_MIGRATION_MAP[key];
  return mapped != null ? mapped : s;
}

/**
 * Normaliza un array de skills (strings u objetos) para migración.
 * Devuelve array de strings con skills normalizadas, sin duplicados.
 */
export function normalizeDeptSpecialties(raw) {
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : [];
  const seen = new Set();
  const out = [];

  for (const it of arr) {
    if (!it) continue;
    let skills = [];
    let dept = null;

    if (typeof it === 'string') {
      skills = [it];
    } else if (typeof it === 'object') {
      dept = it.department || it.dept || it.name;
      skills = it.skills || it.items || it.list || [];
      if (typeof skills === 'string') skills = [skills];
    }

    for (const sk of skills) {
      const s = typeof sk === 'string' ? sk : (sk?.name || sk?.label || sk?.title || '');
      const normalized = normalizeSkillForDisplay(s);
      if (!normalized) continue;
      const key = normalized.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(normalized);
    }
  }
  return out;
}

/** Departamentos para Specific skills — mismo orden en job form y candidate profile */
export const SPECIFIC_SKILLS_DEPARTMENTS = [
  'Profile / General',
  'Deck',
  'Engine',
  'Interior',
  'Galley',
  'Others',
];

/**
 * Especialidades por departamento — AGRUPADAS con títulos.
 * Formato esperado por el componente:
 * {
 *   Deck: [{ group: 'Group Title', items: ['a','b'] }, ...],
 *   ...
 * }
 */
export const DEPT_SPECIALTIES_SUGGESTIONS = {
  'Profile / General': [
    {
      group: 'Profile & Professional',
      items: [
        'Leadership',
        'Owner & guest liaison',
        'Yacht operations management',
        'Owner representative coordination',
        'Crew teamwork',
        'Team coordination',
        'Task prioritization',
        'Time management',
        'Multitasking under pressure',
        'Attention to detail',
        'Well-organized work style',
        'Professional conduct',
        'Discretion & confidentiality',
        'Strong work ethic',
        'Positive attitude',
        'Adaptability (private & charter)',
        'Guest interaction skills',
        'Service mindset',
        'Communication skills',
        'Problem-solving / troubleshooting mindset',
        'Ability to work independently',
        'Hands-on approach',
        'Flexibility / can-do attitude',
        'Reliability & punctuality',
        'Willingness to assist cross-department',
        'Drama-free mindset',
        'Outgoing personality',
        'Sociable & engaging',
      ],
    },
  ],

  Deck: [
    {
      group: 'Operations & Seamanship',
      items: [
        'Vessel Handling & Watchkeeping',
        'Local cruising knowledge',
        'Line handling / mooring',
        'Docking prep (fenders / lines)',
        'Anchoring ops',
        'Bridge watch / lookout',
        'Nav support / chartwork',
        'Bridge Resource Management (BRM)',
        'Passage planning support',
        'Tender ops (RIB)',
        'Large tender driving (10m+)',
        'Crane / davit ops',
        'Jet skis & water toys',
        'Toy launch & recovery',
        'Open-water towing (chase/tender)',
        'DP awareness',
      ],
    },
    {
      group: 'Exterior Care & Maintenance',
      items: [
        'Exterior Upkeep & Preservation',
        'Exterior washdown / detailing',
        'Deck products knowledge',
        'Teak care',
        'Paint & varnish',
        'Paint polishing & compounding',
        'Stainless polishing',
        'Caulking / deck repairs',
        'Rope splicing (basic)',
        'Exterior inventory',
      ],
    },
    {
      group: 'Safety, Compliance & Environment',
      items: [
        'Safety & Regulatory Operations',
        'MOB / fire / abandon drills',
        'First aid support',
        'Firefighting equipment',
        'LSA handling',
        'ISPS awareness',
        'Risk assessment (RA)',
        'Garbage & MARPOL',
        'ISM awareness',
        'MLC awareness',
      ],
    },
    {
      group: 'Watersports & Activities',
      items: [
        'Guest Water Operations',
        'Watersports assist',
        'Snorkel / dive support',
        'Tow sports',
        'Toy supervision',
      ],
    },
    {
      group: 'Technical / Hybrid Deck',
      items: [
        'Mechanical & Technical Support',
        'Engine room assist (basic)',
        'Bunkering assist',
        'Hydraulics basics',
        'Preventive maintenance',
        'PMS tasks',
        'Spares handling',
      ],
    },
    {
      group: 'Projects & Warranty',
      items: ['Refit & Project Support', 'Warranty claims', 'New build / refit deck commissioning'],
    },
    {
      group: 'Media / Guest Experience',
      items: ['Guest Media & Enhancements', 'Drone ops (basic)', 'Guest media assist', 'Beach setups / events'],
    },
  ],

  Engine: [
    {
      group: 'Mechanical & Propulsion',
      items: [
        'Propulsion & Machinery Problem-Solving',
        'Diesel diagnostics & repair',
        'Gearbox / shaft alignment',
        'Stabilizers & thrusters service',
        'Vibration / noise troubleshooting',
      ],
    },
    {
      group: 'Tenders & Water Toys Systems',
      items: [
        'Tender mechanical service',
        'Outboard engine service',
        'Jet ski maintenance',
        'Water toy fleet maintenance',
        'Tender electrical systems',
        'Small craft troubleshooting',
        'Toy launch & recovery systems',
      ],
    },
    {
      group: 'Electrical, Control & IT',
      items: [
        'Electrical & Control Problem-Solving',
        'Electrical fault finding (AC/DC)',
        'Generator control systems',
        'PLC fault diagnostics',
        'AV / IT yacht networks',
        'Satcom systems (Starlink / VSAT)',
        'Engine software diagnostics (CAT / MTU / Volvo)',
        'Lithium battery safety & service',
      ],
    },
    {
      group: 'Fluid & Auxiliary Systems',
      items: [
        'Fluid & Auxiliary Systems Troubleshooting',
        'Hydraulic fault diagnostics',
        'Fuel system troubleshooting',
        'Cooling loop diagnostics',
        'RO / watermaker service',
        'Sanitary systems repair',
      ],
    },
    {
      group: 'Hotel & Comfort Systems',
      items: [
        'HVAC & Refrigeration Troubleshooting',
        'HVAC fault diagnostics',
        'Refrigeration service',
      ],
    },
    {
      group: 'Compliance & Modern Tech',
      items: [
        'Environmental & Compliance Systems Management',
        'BWTS service',
        'Regulatory compliance (ISM / MLC / ISPS)',
        'MARPOL procedures',
      ],
    },
    {
      group: 'Maintenance & Management',
      items: [
        'Technical Maintenance Planning',
        'New build project support',
        'Warranty testing & claims management',
        'PMS platforms (AMOS / IDEA / Voly)',
        'Technical planning',
        'Dry dock specs',
        'Class / flag inspections',
        'Spares strategy',
      ],
    },
    {
      group: 'Hybrid Operations',
      items: [
        'Cross-Department Technical Operations',
        'Deck machinery systems',
        'Bunkering supervision',
      ],
    },
  ],

  Interior: [
    {
      group: 'Service & Hospitality',
      items: [
        'High-End Service Execution',
        'Silver service',
        'Butler-style service',
        'Mixology',
        'Barista skills',
        'Wine service (WSET 1/2)',
        'Table décor & styling',
        'Event / theme night setup',
        'Flower arranging',
        'Charter turnaround prep',
      ],
    },
    {
      group: 'Housekeeping & Care',
      items: [
        'Luxury Housekeeping Standards',
        'Elite cabin detailing',
        'Turn-down standards',
        'Wardrobe management',
        'High-end laundry & ironing',
        'Luxury fabric care',
        'Valet services',
      ],
    },
    {
      group: 'Guest Experience',
      items: [
        'Guest Experience Management',
        'Guest relations',
        'Concierge support',
        'Luxury sourcing',
        'Preference sheet management',
        'Provisioning & stock control',
        'Childcare / nanny support',
        'Spa / beauty basics',
      ],
    },
    {
      group: 'Administration & Systems',
      items: [
        'Interior Operations Management',
        'Interior inventory systems',
        'IDEA / Voly / Pinpoint',
        'APA tracking',
        'Interior budget awareness',
      ],
    },
    {
      group: 'Compliance & Safety',
      items: ['Interior Safety Awareness', 'Risk assessment (RA)'],
    },
    {
      group: 'Projects & Warranty',
      items: ['Interior Refit & Commissioning Support', 'New build / refit commissioning'],
    },
  ],

  Galley: [
    {
      group: 'Cuisine Execution',
      items: [
        'International Cuisine Execution',
        'Prepare Mediterranean cuisine',
        'Prepare Italian cuisine',
        'Prepare French cuisine',
        'Prepare Spanish cuisine',
        'Prepare UK / British cuisine',
        'Prepare Middle Eastern cuisine',
        'Prepare Asian / Japanese cuisine',
        'Prepare Thai cuisine',
        'Prepare Indian cuisine',
        'Prepare seafood-focused menus',
        'Prepare Caribbean cuisine',
        'Prepare Mexican cuisine',
        'Prepare kosher-style meals',
        'Prepare plant-based menus',
        'Execute allergen-safe dishes',
        'Ottolenghi-Style Cuisine',
        'Healthy Cuisine',
      ],
    },
    {
      group: 'Culinary Production',
      items: [
        'Advanced Culinary Techniques',
        'Casual & Crew Meal Preparation',
        'Design guest menus',
        'Plate fine dining dishes',
        'Produce pastries & desserts',
        'Bake breads & viennoiserie',
        'Prepare sauces & stocks',
        'Perform butchery & fish prep',
        'Special Diet Cuisine',
        'Custom Dietary Menus',
      ],
    },
    {
      group: 'Charter Operations',
      items: [
        'Charter Catering Execution',
        'Customize guest menus',
        'Execute charter turnaround',
        'Deliver themed catering',
        'Produce crew meals at scale',
      ],
    },
    {
      group: 'Galley Management',
      items: [
        'Professional Galley Management',
        'Cost menus',
        'Manage inventory',
        'Source provisions',
        'Coordinate vendors',
        'Organize galley workflow',
        'Lead kitchen teams',
        'Execute pressure service',
        'Support galley refit commissioning',
      ],
    },
    {
      group: 'Food Safety Practice',
      items: ['Food Safety & HACCP Compliance', 'Apply HACCP workflows', 'Maintain safe food storage'],
    },
  ],

  Others: [
    {
      group: 'Medical & Wellness',
      items: [
        'Guest Medical & Mobility Care',
        'Guest Wellness & Spa Services',
        'IV administration',
        'AED / emergency care',
        'Medical log management',
        'Sports massage',
        'Deep tissue massage',
        'Relaxation massage',
        'Yoga sessions',
        'Pilates sessions',
      ],
    },
    {
      group: 'Water Activities',
      items: [
        'Water Sports Instruction & Supervision',
        'Guest dive supervision',
        'Jet ski instruction',
      ],
    },
    {
      group: 'Fishing Experience',
      items: ['Recreational Fishing Experience', 'Advanced / Sport Fishing'],
    },
    {
      group: 'Childcare & Personal Care',
      items: ['Structured Childcare Supervision', 'Childcare routines', 'Educational activities'],
    },
    {
      group: 'Media & Digital',
      items: [
        'Digital Content & Media Handling',
        'Video shooting',
        'Drone operation',
        'Content editing',
        'Digital privacy handling',
        'DJ performance',
      ],
    },
    {
      group: 'Fitness & Physical Training',
      items: ['Functional training', 'Guest fitness routines'],
    },
  ],
};
