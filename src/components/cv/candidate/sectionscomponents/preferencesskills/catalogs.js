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
 * Especialidades por departamento — AGRUPADAS con títulos.
 * Formato esperado por el componente:
 * {
 *   Deck: [{ group: 'Group Title', items: ['a','b'] }, ...],
 *   ...
 * }
 * (Back-compat: si algún consumer espera un array plano, el componente actual lo envuelve)
 */
export const DEPT_SPECIALTIES_SUGGESTIONS = {
  Deck: [
    {
      group: 'Operations & Seamanship',
      items: [
        'Line handling & mooring',
        'RIB/Tender operations',
        'Driving large tenders (10m+)',
        'Crane/Davit operations',
        'Jet skis & water toys',
        'Watersports instruction',
        'Bridge/Navigation support',
        'Chartwork & passage planning',
        'Watchkeeping (bridge)',
        'Anchoring ops',
        'Fendering & docking prep',
        'Gangway & passerelle ops',
      ],
    },
    {
      group: 'Exterior Care & Refinishing',
      items: [
        'Exterior washdown & detailing',
        'Teak care & restoration',
        'Paint & varnish',
        'Caulking & deck repairs',
      ],
    },
    {
      group: 'Safety & Security',
      items: [
        'ISPS/Security awareness',
        'Safety drills (MOB/abandon ship)',
        'First aid / medical support',
      ],
    },
    {
      group: 'Guest Support & Media',
      items: ['Drone photography / media', 'Guest logistics & concierge'],
    },
  ],

  Engine: [
    {
      group: 'Powertrain & Propulsion',
      items: [
        'Diesel engines – diagnostics & service',
        'Generators – service & load management',
        'Shaft/propulsion alignment',
        'Stabilizers & thrusters',
      ],
    },
    {
      group: 'Electrical & Electronics',
      items: [
        'Electrical systems (AC/DC)',
        'Electronics & instrumentation',
        'Battery systems & chargers',
        'Alarm/monitoring systems',
      ],
    },
    {
      group: 'Fluids & Mechanics',
      items: ['Hydraulics', 'Piping & plumbing', 'Fuel systems & polishing'],
    },
    {
      group: 'HVAC & Water',
      items: ['HVAC & refrigeration', 'Watermakers/RO plants'],
    },
    {
      group: 'Maintenance & Compliance',
      items: [
        'Planned maintenance systems (PMS)',
        'Preventive maintenance scheduling',
        'Spare parts management',
        'Technical purchasing & inventory',
        'Dry dock / yard period planning',
        'Class & flag surveys support',
      ],
    },
  ],

  Interior: [
    {
      group: 'Service & Table',
      items: [
        'Silver service',
        'Wine & beverage service',
        'Cocktail bartending',
        'Table scaping & décor',
        'Service lead/Butler duties',
        'Floristry',
      ],
    },
    {
      group: 'Housekeeping & Laundry',
      items: [
        'Housekeeping standards',
        'Laundry/pressing/garment care',
        'High-end fabric care',
        'Cabin turn-down procedures',
      ],
    },
    {
      group: 'Guest Care & Operations',
      items: [
        'Guest relations & concierge',
        'Inventory & provisioning',
        'F&B stock control',
        'Event & theme nights',
        'Valet skills',
        'Spa/beauty basics',
        'Childcare/Nanny support',
        'Admin & Purser support',
        'Medical/first aid support',
      ],
    },
  ],

  Galley: [
    {
      group: 'Cuisine & Styles',
      items: [
        'Mediterranean cuisine',
        'Asian/Japanese/Sushi',
        'Plant-based/vegan',
        'Gluten-free & allergens',
      ],
    },
    {
      group: 'Production & Technique',
      items: [
        'Pastry & bakery',
        'Breads & viennoiserie',
        'Sauces & stocks',
        'Desserts & chocolate work',
        'Butchery & fishmongery',
        'Fine dining plating',
      ],
    },
    {
      group: 'Operation & Safety',
      items: [
        'Menu planning & costing',
        'Provisioning & vendor sourcing',
        'Galley hygiene & HACCP',
        'Food safety & storage',
        'Dietary requirements management',
        'Crew food at scale',
        'Catering for charters/events',
        'Waste minimization',
      ],
    },
  ],

  Others: [],
};