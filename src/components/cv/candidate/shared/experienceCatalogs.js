// src/components/cv/candidate/shared/experienceCatalogs.js

export const TERMS_OPTIONS = [
  "Rotational",
  "Permanent",
  "Temporary",
  "Seasonal",
  "Relief",
  "Delivery",
  "Crossing",
  "DayWork",
];

export const VESSEL_USE = ["Private", "Charter", "Private/Charter"];

export const VESSEL_TYPES = [
  "Motor Yacht",
  "Sailing Yacht",
  "Catamaran",
  "Support / Shadow",
  "Expedition",
  "Chase Boat",
];

export const PROPULSION_TYPES = [
  "Shaft Drive",
  "Waterjet",
  "Pod Drive",
  "Arneson Drive",
];

export const ENGINE_BRANDS_BY_PROPULSION = {
  "Shaft Drive": [
    "MTU",
    "Caterpillar",
    "MAN",
    "Volvo Penta",
    "Yanmar",
    "Cummins",
    "Scania",
    "Detroit Diesel",
    "John Deere",
    "Other",
  ],
  Waterjet: [
    "HamiltonJet",
    "Rolls-Royce Kamewa",
    "MJP (Marine Jet Power)",
    "Doen",
    "Other",
  ],
  "Pod Drive": [
    "Volvo Penta IPS",
    "ZF POD",
    "Cummins Zeus",
    "CAT POD",
    "Other",
  ],
  "Arneson Drive": ["Twin Disc Arneson", "Other"],
};

export function getEngineBrandsForPropulsion(propulsion) {
  return ENGINE_BRANDS_BY_PROPULSION[propulsion] || ["Other"];
}

export const CREW_SIZE_PRESETS = ["1", "2", "3", "4", "5-10", "10-15", "15-20", "20+"];

export const REGIONS = [
  "Worldwide",
  "Mediterranean",
  "Caribbean",
  "Atlantic",
  "Pacific",
  "Indian Ocean",
  "Red Sea",
  "Baltic",
  "North Sea",
  "Arctic",
  "Antarctic",
  "Middle East",
  "Southeast Asia",
  "US East Coast",
  "US West Coast",
  "Bahamas",
  "South Pacific",
  "Australia",
  "New Zealand",
  "Central America",
  "South America",
];

export const OCEAN_CROSSING_OPTIONS = ["0", "1", "2", "3", "4", "5+"];
export const YARD_PERIOD_OPTIONS = ["None", "1–2", "3–5", "6–11", "12+"];

export const HIDE_TECH_SPECS_FOR_DEPARTMENTS = new Set(["Interior", "Galley"]);

export function normalizePhone(v) {
  if (!v) return "";
  let s = String(v).trim();
  if (!s.startsWith("+")) s = "+" + s.replace(/[^\d]/g, "");
  return s;
}

export function normalizeUrl(v) {
  if (!v) return "";
  let s = String(v).trim();
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  return s;
}

export const TERMS = TERMS_OPTIONS; // alias
export const USES = VESSEL_USE; // alias
export const ENGINE_BRANDS = ENGINE_BRANDS_BY_PROPULSION; // alias
export const CREW_SIZE_BUCKETS = CREW_SIZE_PRESETS; // alias