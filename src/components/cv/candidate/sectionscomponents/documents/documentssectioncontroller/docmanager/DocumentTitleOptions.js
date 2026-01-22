// src/components/cv/candidate/sectionscomponents/documents/documentssectioncontroller/docmanager/DocumentTitleOptions.js

export const DOCUMENT_TITLE_OPTIONS = [
  /* --------- DECK CoC (highest first) --------- */
  { value: "Master Unlimited CoC", group: "Deck — Certificates of Competency" },
  { value: "Chief Mate Unlimited CoC", group: "Deck — Certificates of Competency" },
  { value: "OOW Unlimited CoC", group: "Deck — Certificates of Competency" },

  { value: "Master 3000 GT (Yachts) CoC", group: "Deck - Yacht CoC" },
  { value: "Chief Mate 3000 GT (Yachts) CoC", group: "Deck - Yacht CoC" },
  { value: "OOW 3000 GT (Yachts) CoC", group: "Deck - Yacht CoC" },
  { value: "Master (Yachts) 200 GT - MCA CoC (STCW II/2 Yachts)", group: "Deck - Yacht CoC" },

  { value: "Yachtmaster Ocean (RYA/MCA)", group: "Deck — Yachtmasters" },
  { value: "Yachtmaster Offshore (RYA/MCA)", group: "Deck — Yachtmasters" },
  { value: "Yacht Master 200 Tons", group: "Deck — Yachtmasters" },

  /* --------- ENGINE CoC --------- */
  { value: "Chief Engineer Unlimited CoC", group: "Engine — Certificates of Competency" },
  { value: "Second Engineer Unlimited CoC", group: "Engine — Certificates of Competency" },
  { value: "Y3 / Y2 / Y1 (Yacht Engineer)", group: "Engine — Yacht Engineer" },
  { value: "AEC 1 (Approved Engine Course 1)", group: "Engine — Yacht Engineer" },
  { value: "AEC 2 (Approved Engine Course 2)", group: "Engine — Yacht Engineer" },

  /* --------- RADIO / NAV --------- */
  { value: "GMDSS GOC", group: "Comms / Nav" },
  { value: "GMDSS ROC", group: "Comms / Nav" },
  { value: "RYA SRC (VHF)", group: "Comms / Nav" },
  { value: "RADAR / ARPA", group: "Comms / Nav" },

  /* --------- MEDICAL --------- */
  { value: "ENG1 Seafarer Medical Certificate", group: "Medical" },
  { value: "STCW Medical First Aid (A-VI/4-1)", group: "Medical" },
  { value: "STCW Medical Care (A-VI/4-2)", group: "Medical" },

  /* --------- STCW CORE & ADVANCED --------- */
  {
    value: "STCW Basic Training (A-VI/1) — PST / FPFF / EFA / PSSR",
    group: "STCW Core",
    hint: "Personal Survival Techniques, Fire Prevention & Fire Fighting, Elementary First Aid, Personal Safety & Social Responsibilities",
  },
  { value: "STCW Advanced Fire Fighting (A-VI/3)", group: "STCW Core" },
  { value: "PSCRB — Proficiency in Survival Craft & Rescue Boats (A-VI/2-1)", group: "STCW Core" },
  { value: "Fast Rescue Boats (A-VI/2-2)", group: "STCW Core" },

  /* --------- SECURITY --------- */
  { value: "Ship Security Officer (SSO)", group: "Security" },
  { value: "Designated Security Duties (DSD) (A-VI/6-2)", group: "Security" },
  { value: "Security Awareness (A-VI/6-1)", group: "Security" },

  /* --------- PASSENGER / ISM --------- */
  { value: "Crowd Management (Passenger Ships)", group: "Passenger / ISM" },
  { value: "Crisis Management & Human Behaviour", group: "Passenger / ISM" },

  /* --------- TENDER / SMALL CRAFT --------- */
  { value: "RYA Powerboat Level 2", group: "Tenders / PWCs" },
  { value: "PWC / Jet Ski (RYA or equivalent)", group: "Tenders / PWCs" },
  { value: "Tender Operator", group: "Tenders / PWCs" },
  { value: "Advanced Sea Survival (Offshore / ISAF)", group: "Tenders / PWCs" },

  /* --------- INTERIOR --------- */
  { value: "WSET Level 3 Award in Wines", group: "Interior" },
  { value: "WSET Level 2 Award in Wines", group: "Interior" },
  { value: "Silver Service", group: "Interior" },
  { value: "Housekeeping & Laundry", group: "Interior" },
  { value: "Barista / Coffee Skills", group: "Interior" },
  { value: "Mixology / Cocktail Craft", group: "Interior" },
  { value: "Floristry & Table Decoration", group: "Interior" },

  /* --------- GALLEY --------- */
  { value: "MCA Ship's Cook Certificate", group: "Galley" },
  { value: "Food Safety & Hygiene Level 3 (Supervising)", group: "Galley" },
  { value: "Food Safety & Hygiene Level 2", group: "Galley" },
  { value: "HACCP Level 3", group: "Galley" },
  { value: "Allergen Awareness", group: "Galley" },
  { value: "Menu Planning & Costing", group: "Galley" },

  /* --------- PERSONAL DOCS & MEDIA --------- */
  { value: "CV / Resume", group: "Docs & Media" },
  { value: "Cover Letter", group: "Docs & Media" },
  { value: "Reference Letter", group: "Docs & Media" },
  { value: "Portfolio / Menu Samples", group: "Docs & Media" },
  { value: "Seaman’s Book", group: "Docs & Media" },
  { value: "Passport", group: "Docs & Media" },
  { value: "Visa (Schengen / B1B2 / Other)", group: "Docs & Media" },

  /* --------- OTHER / MISC --------- */
  { value: "MLC Compliance / Familiarization", group: "Other" },
  { value: "Environmental Awareness (MARPOL / Garbage Management)", group: "Other" },
];

/**
 * Common aliases → canonical values (case-insensitive).
 * Only include high-signal aliases to keep this light.
 */
export const DOCUMENT_TITLE_ALIASES = new Map(
  [
    // Yachtmasters
    ["yachtmaster 200", "Yacht Master 200 Tons"],
    ["patron de yate 200", "Yacht Master 200 Tons"],
    ["yacht master 200", "Yacht Master 200 Tons"],
    ["yachtmaster offshore", "Yachtmaster Offshore (RYA/MCA)"],
    ["yachtmaster ocean", "Yachtmaster Ocean (RYA/MCA)"],

    // ENG1
    ["eng1", "ENG1 Seafarer Medical Certificate"],
    ["medical certificate", "ENG1 Seafarer Medical Certificate"],

    // STCW basic block
    ["bst", "STCW Basic Training (A-VI/1) — PST / FPFF / EFA / PSSR"],
    ["stcw basic", "STCW Basic Training (A-VI/1) — PST / FPFF / EFA / PSSR"],
    ["basic safety training", "STCW Basic Training (A-VI/1) — PST / FPFF / EFA / PSSR"],

    // PSCRB & FRB
    ["pscrb", "PSCRB — Proficiency in Survival Craft & Rescue Boats (A-VI/2-1)"],
    ["psc-rb", "PSCRB — Proficiency in Survival Craft & Rescue Boats (A-VI/2-1)"],
    ["frb", "Fast Rescue Boats (A-VI/2-2)"],

    // Security
    ["sso", "Ship Security Officer (SSO)"],
    ["dsd", "Designated Security Duties (DSD) (A-VI/6-2)"],

    // GMDSS
    ["goc", "GMDSS GOC"],
    ["roc", "GMDSS ROC"],

    // Interior / Galley
    ["food hygiene level 2", "Food Safety & Hygiene Level 2"],
    ["food hygiene level 3", "Food Safety & Hygiene Level 3 (Supervising)"],
    ["wset 2", "WSET Level 2 Award in Wines"],
    ["wset 3", "WSET Level 3 Award in Wines"],

    // Docs & Media
    ["cv", "CV / Resume"],
    ["resume", "CV / Resume"],
    ["reference", "Reference Letter"],
    ["references", "Reference Letter"],
  ].map(([k, v]) => [k.toLowerCase(), v])
);

export function matchTitleAlias(input) {
  if (!input) return input;
  const key = String(input).trim().toLowerCase();
  return DOCUMENT_TITLE_ALIASES.get(key) || input;
}
