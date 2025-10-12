// src/components/cv/shared/yachtBrands.js

// ================================
// Lista A: Yates grandes (≥20 m)
// ================================
export const YACHT_BRANDS_BY_COUNTRY = Object.freeze({
  Australia: [
    "Echo Yachts",
    "SilverYachts",
  ],
  Brazil: [
    "Inace Yachts",
    "Intermarine",
    "Schaefer Yachts",
  ],
  Canada: [
    "Crescent Custom Yachts",
    "Rayburn Yachts",
    "West Bay SonShip",
  ],
  Finland: [
    "Baltic Yachts",
    "Nautor's Swan",
  ],
  France: [
    "CNB",
    "Couach",
    "JFA Yachts",
    "OCEA Yachts",
  ],
  Germany: [
    "Abeking & Rasmussen",
    "Blohm+Voss",
    "Lürssen",
    "Nobiskrug",
  ],
  Greece: [
    "Golden Yachts",
  ],
  Italy: [
    "AB Yachts",
    "Admiral",
    "Arcadia Yachts",
    "Azimut",
    "Baglietto",
    "Benetti",
    "CCN – Cerri Cantieri Navali",
    "Codecasa",
    "CRN",
    "Custom Line",
    "Ferretti Yachts",
    "Fincantieri Yachts",
    "ISA Yachts",
    "Maiora",
    "Mangusta (Overmarine)",
    "Mondomarine",
    "OTAM",
    "Perini Navi",
    "Pershing",
    "Riva",
    "Rossinavi",
    "Sanlorenzo",
    "Tecnomar",
    "Wider Yachts",
  ],
  Monaco: [
    "Wally",
  ],
  Netherlands: [
    "Amels",
    "Damen Yachting",
    "Feadship",
    "Hakvoort",
    "Heesen",
    "Jongert",
    "Moonen",
    "Mulder",
    "Oceanco",
    "Royal Huisman",
    "Van der Valk",
    "Vitters",
  ],
  "New Zealand": [
    "Alloy Yachts",
    "Circa Marine",
    "McMullen & Wing",
    "Yachting Developments",
  ],
  Poland: [
    "Sunreef Yachts",
  ],
  "South Africa": [
    "Balance Catamarans",
    "Southern Wind",
  ],
  Spain: [
    "Astondoa",
    "Atollvic",
    "Freire Shipyard",
  ],
  Sweden: [
    "Delta Powerboats",
  ],
  Taiwan: [
    "Horizon",
    "Johnson Yachts",
    "Ocean Alexander",
  ],
  Turkey: [
    "Aegean Yacht",
    "Alia Yachts",
    "Bering Yachts",
    "Bilgin Yachts",
    "Dunya Yachts",
    "Mengi Yay",
    "Numarine",
    "Peri Yachts",
    "RMK Marine",
    "Sarp Yachts",
    "Sirena Yachts",
    "Tansu Yachts",
    "Turquoise Yachts",
    "Vicem",
  ],
  UAE: [
    "Gulf Craft (Majesty Yachts)",
    "Nomad Yachts",
  ],
  UK: [
    "Arksen",
    "Oyster",
    "Pearl Yachts",
    "Pendennis",
    "Princess Yachts",
    "Spirit Yachts",
    "Sunseeker",
  ],
  USA: [
    "Broward Marine",
    "Burger Boat Company",
    "Christensen",
    "Delta Marine",
    "Derecktor",
    "Hargrave Custom Yachts",
    "Hatteras",
    "Jarrett Bay",
    "Lazzara Yachts",
    "Marlow Yachts",
    "Merritt",
    "Palmer Johnson",
    "Rybovich",
    "Trinity Yachts",
    "Viking Yachts",
    "Westport",
  ],
  Other: ["Other"],
});

// Derivados — Yates grandes
export const ALL_YACHT_BRANDS = Object.freeze(
  [
    ...new Set(
      Object.entries(YACHT_BRANDS_BY_COUNTRY)
        .flatMap(([country, brands]) => (country === "Other" ? [] : brands))
    ),
  ]
    .sort((a, b) => a.localeCompare(b))
    .concat(YACHT_BRANDS_BY_COUNTRY.Other)
);

export const yachtBrandOptionsGrouped = Object.freeze(
  Object.entries(YACHT_BRANDS_BY_COUNTRY).map(([country, brands]) => ({
    label: country,
    options: brands.map((b) => ({ value: b, label: b })),
  }))
);

export const yachtBrandOptions = Object.freeze(
  ALL_YACHT_BRANDS.map((b) => ({ value: b, label: b }))
);

// ======================================
// Lista B: Tenders & Dayboats (<20 m)
// (pensada para chase boats).
// ======================================
export const TENDER_RIB_BRANDS_BY_COUNTRY = Object.freeze({
  Australia: [
    "Brig Australia",
  ],
  Austria: [
    "Frauscher Boats",
  ],
  Finland: [
    "Axopar",
    "Sargo",
    "Saxdor",
    "Targa (Botnia Marin)",
    "XO Boats",
  ],
  France: [
    "3D Tender",
    "Bombard",
    "Zodiac",
  ],
  Germany: [
    "Fjord (HanseYachts)",
  ],
  Greece: [
    "Onda Tenders",
    "Seafighter RIBs",
    "Skipper (BSK Marine)",
    "Technohull",
    "Top Line RIBs",
  ],
  Iceland: [
    "Rafnar",
  ],
  Italy: [
    "Bluegame",
    "BSC Colzani",
    "Capelli (Tempest)",
    "Invictus Yacht",
    "Italboats (Stingher)",
    "Itama",
    "Joker Boat",
    "Lomac Nautica",
    "MV Marine (Motonautica Vesuviana)",
    "Novamarine",
    "Pardo Yachts",
    "Pirelli (TecnoRib)",
    "Riva",
    "Sacs Marine",
    "Scanner Marine",
    "Selva Marine",
    "Solaris Power",
    "ZAR Formenti",
  ],
  Monaco: [
    "Wally", // Wallytender 43/48 (<20 m)
  ],
  Netherlands: [
    "VanDutch",
    "Vanquish Yachts",
    "Wajer",
    "Xtenders",
    "Zeelander",
  ],
  NewZealand: [
    "Naiad",
    "Rayglass Protector",
    "Smuggler Marine",
    "Stabicraft",
  ],
  Norway: [
    "Goldfish Boat",
    "Windy",
  ],
  Poland: [
    "Northstar (Europe)",
    "Parker Poland",
  ],
  SouthAfrica: [
    "Gemini Marine",
    "Infanta RIBs",
    "Ribcraft South Africa",
  ],
  Spain: [
    "De Antonio Yachts",
    "Narwhal",
    "Sasga Yachts (Menorquín)",
    "Vanguard Marine",
  ],
  Sweden: [
    "Anytec",
    "Nimbus",
    "Paragon Yachts",
  ],
  Turkey: [
    "Alen Yacht",
    "Northstar Boats",
  ],
  UAE: [
    "ASIS Boats",
    "Al Marakeb Boats",
  ],
  UK: [
    "Cobra RIBs",
    "Pascoe International",
    "Ribeye",
    "Scorpion RIBs",
    "Williams Jet Tenders",
  ],
  USA: [
    "Blackfin",
    "Boston Whaler",
    "Chris-Craft",
    "Cigarette Racing",
    "Contender",
    "EdgeWater",
    "Everglades",
    "Freeman Boatworks",
    "HCB (Hydra-Sports Custom)",
    "Intrepid Powerboats",
    "Invincible",
    "Midnight Express",
    "MJM Yachts",
    "Nor-Tech",
    "Pursuit",
    "Scout Boats",
    "SeaVee",
    "Valhalla Boatworks",
    "Yellowfin",
  ],
  Other: ["Other"],
});

// Derivados — Tenders & RIBs
export const ALL_TENDER_RIB_BRANDS = Object.freeze(
  [
    ...new Set(
      Object.entries(TENDER_RIB_BRANDS_BY_COUNTRY)
        .flatMap(([country, brands]) => (country === "Other" ? [] : brands))
    ),
  ]
    .sort((a, b) => a.localeCompare(b))
    .concat(TENDER_RIB_BRANDS_BY_COUNTRY.Other)
);

export const tenderRibBrandOptionsGrouped = Object.freeze(
  Object.entries(TENDER_RIB_BRANDS_BY_COUNTRY).map(([country, brands]) => ({
    label: country,
    options: brands.map((b) => ({ value: b, label: b })),
  }))
);

export const tenderRibBrandOptions = Object.freeze(
  ALL_TENDER_RIB_BRANDS.map((b) => ({ value: b, label: b }))
);

// Por compatibilidad, mantenemos el default en la lista de yates grandes.
export default YACHT_BRANDS_BY_COUNTRY;