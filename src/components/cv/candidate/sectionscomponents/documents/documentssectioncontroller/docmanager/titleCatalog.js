// src/components/cv/candidate/sectionscomponents/documents/documentssectioncontroller/docmanager/titleCatalog.js

const TITLE_CATALOG = [
  /* ---------------- Core documents ---------------- */
  {
    group: "Core Documents",
    items: [
      { id: "cv", label: "CV / Résumé", aliases: ["Resume"] },
      { id: "cover_letter", label: "Cover Letter" },
      {
        id: "reference_letter",
        label: "Reference Letter",
        aliases: ["Letter of Reference", "Recommendation Letter"],
      },
      {
        id: "seamans_book",
        label: "Seaman’s Discharge Book / Sea Service Letters",
        aliases: ["Seaman Book", "Discharge Book", "Sea Service"],
      },
      { id: "passport", label: "Passport (Photo Page)" },
      { id: "visa_b1b2", label: "Visa – B1/B2" },
      { id: "visa_schengen", label: "Visa – Schengen" },
      { id: "vaccination_yf", label: "Vaccination – Yellow Fever" },
      { id: "dbs_police", label: "Background Check – DBS / Police Clearance" },
      { id: "drivers_license", label: "Driver’s License" },
    ],
  },

  /* ---------------- MCA CoC (Deck) ---------------- */
  {
    group: "MCA Certificates of Competency (Deck)",
    items: [
      {
        id: "coc_master_unlimited",
        label: "Master Unlimited — STCW II/2 (Master Mariner)",
        aliases: ["MCA Master Unlimited", "Class 1", "II/2 Master"],
      },
      {
        id: "coc_chief_mate_unlimited",
        label: "Chief Mate Unlimited — STCW II/2",
        aliases: ["MCA Chief Mate Unlimited", "Chief Mate II/2", "Class 2"],
      },
      {
        id: "coc_oow_unlimited",
        label: "OOW Unlimited — STCW II/1",
        aliases: ["Officer of the Watch Unlimited", "Class 3", "II/1"],
      },
      {
        id: "coc_master_3000",
        label: "Master (Yachts) 3000 GT — MCA CoC (STCW II/2 Yachts)",
        aliases: ["Master 3000 GT", "MCA Master Yachts 3000", "II/2 (Yachts)"],
      },
      {
        id: "coc_chief_mate_3000",
        label: "Chief Mate (Yachts) 3000 GT — MCA CoC (STCW II/2 Yachts)",
        aliases: ["Chief Mate 3000 GT", "Yachts Chief Mate 3000", "II/2 (Yachts)"],
      },
      {
        id: "coc_oow_3000",
        label: "OOW (Yachts) 3000 GT — MCA CoC (STCW II/1 Yachts)",
        aliases: ["Officer of the Watch 3000 GT", "II/1 (Yachts)"],
      },
      {
        id: "coc_master_500",
        label: "Master (Yachts) 500 GT - MCA CoC (STCW II/2 Yachts)",
        aliases: ["Master 500 GT", "MCA Master <500 GT", "II/2 <500 GT"],
      },
      {
        id: "coc_master_200",
        label: "Master (Yachts) 200 GT - MCA CoC (STCW II/2 Yachts)",
        aliases: ["Master 200 GT", "MCA Master 200 GT", "II/2 200 GT"],
      },
      {
        id: "rya_yachtmaster_ocean",
        label: "Yachtmaster Ocean — RYA/MCA (≤24 m, Ocean)",
        aliases: ["RYA/MCA Yachtmaster Ocean", "YM Ocean", "Unlimited passages"],
      },
      {
        id: "rya_yachtmaster_offshore",
        label: "Yachtmaster Offshore — RYA (≤24 m, ≤150 nm)",
        aliases: ["RYA/MCA Yachtmaster Offshore", "YM Offshore", "150 nm"],
      },
      {
        id: "rya_yachtmaster_coastal",
        label: "Yachtmaster Coastal — RYA (≤24 m, ≤60 nm)",
        aliases: ["RYA/MCA Yachtmaster Coastal", "YM Coastal", "60 nm"],
      },
      {
        id: "rya_yachtmaster_200_ocean",
        label: "Yachtmaster 200 GT — RYA/MCA (Ocean, Unlimited)",
        aliases: [
          "Master of Yachts 200 Ocean",
          "IYT/MCA Master 200 Ocean",
          "MOY 200 Ocean",
          "200GT Ocean Unlimited"
        ],
      },
      {
        id: "rya_yachtmaster_200_offshore",
        label: "Yachtmaster 200 GT — RYA/MCA (Offshore, Limited ≤150 nm)",
        aliases: [
          "Master of Yachts 200 Offshore",
          "IYT/MCA Master 200 Offshore",
          "MOY 200 Offshore",
          "200GT Offshore Limited"
        ],
      },
    ],
  },

  /* ---------------- Engineering (MCA / SV) ---------------- */
  {
    group: "Engineering Certificates (MCA / SV)",
    items: [
      {
        id: "sv_ce_unlimited",
        label: "Chief Engineer Unlimited — STCW III/2",
        aliases: ["MCA Chief Engineer Unlimited", "III/2 Chief Engineer", "Class 1"],
      },
      {
        id: "sv_second_engineer",
        label: "Second Engineer Unlimited — STCW III/2",
        aliases: ["Second Engineer (Yachts)", "III/2 Second Engineer", "Class 2"],
      },
      {
        id: "sv_eoow",
        label: "Engineering Officer of the Watch (EOOW) — STCW III/1",
        aliases: ["EOOW III/1", "STCW III/1", "OICEW"],
      },
      {
        id: "eng_y1",
        label: "Y1 — Yacht Engineer (Unlimited)",
        aliases: ["Yacht Engineer Unlimited", "Yacht Engineer Y1"],
      },
      {
        id: "eng_y2",
        label: "Y2 — Yacht Engineer ≤3000 GT",
        aliases: ["Yacht Engineer 3000 GT", "Yacht Engineer Y2"],
      },
      {
        id: "eng_y3",
        label: "Y3 — Yacht Engineer ≤500 GT",
        aliases: ["Yacht Engineer 500 GT", "Yacht Engineer Y3"],
      },
      {
        id: "eng_y4",
        label: "Y4 — Yacht Engineer ≤200 GT",
        aliases: ["Yacht Engineer 200 GT", "Yacht Engineer Y4"],
      },
      {
        id: "sv_ce_small_vessel",
        label: "Small Vessel Chief Engineer — MCA SV",
        aliases: ["SV Chief Engineer", "Small Vessel CoC"],
      },
      { id: "sv_aec2", label: "AEC 2 — Approved Engine Course 2" },
      { id: "sv_aec1", label: "AEC 1 — Approved Engine Course 1" },
      { id: "sv_meol", label: "MEOL (Yachts) — Marine Engine Operator Licence" },
    ],
  },

  /* ---------------- Radio ---------------- */
  {
    group: "Radio Certificates",
    items: [
      { id: "gmdss_goc", label: "GMDSS GOC — General Operator’s Certificate" },
      { id: "gmdss_roc", label: "GMDSS ROC — Restricted Operator’s Certificate" },
      { id: "vhf_src", label: "VHF SRC — Short Range Certificate" },
    ],
  },

  /* ---------------- Medical ---------------- */
  {
    group: "Medical Certificates",
    items: [
      { id: "eng1", label: "ENG1 Seafarer Medical Certificate", aliases: ["ENG 1"] },
      {
        id: "medical_equivalent",
        label: "Seafarer Medical (Equivalent) — ML5 / Other Flag",
        aliases: ["ML5", "Other Flag Medical"],
      },
    ],
  },

  /* ---------------- STCW (key / common) ---------------- */
  {
    group: "STCW Certificates (Key)",
    items: [
      {
        id: "stcw_basic",
        label: "STCW Basic Training (A-VI/1) — PST, FPFF, EFA, PSSR",
        aliases: [
          "BST",
          "Basic Safety Training",
          "PST (A-VI/1-1)",
          "FPFF (A-VI/1-2)",
          "EFA (A-VI/1-3)",
          "PSSR (A-VI/1-4)",
        ],
      },
      {
        id: "stcw_pscrb",
        label: "Proficiency in Survival Craft & Rescue Boats (PSCRB) — A-VI/2-1",
        aliases: ["PSC-RB"],
      },
      { id: "stcw_fast_rescue", label: "Fast Rescue Boats — A-VI/2-2" },
      { id: "stcw_advanced_fire", label: "Advanced Fire Fighting — A-VI/3" },
      { id: "stcw_medical_first_aid", label: "Medical First Aid — A-VI/4-1" },
      { id: "stcw_medical_care", label: "Medical Care — A-VI/4-2" },
      { id: "stcw_security_awareness", label: "Security Awareness — A-VI/6-1" },
      {
        id: "stcw_dsd",
        label: "Designated Security Duties (DSD) — A-VI/6-2",
        aliases: ["Designated Security Duties"],
      },
      { id: "stcw_crowd_mgmt", label: "Crowd Management — A-V/2" },
      { id: "stcw_crisis_human", label: "Crisis Management & Human Behaviour — A-V/2-2" },
      { id: "passenger_ship_safety", label: "Passenger Ship Safety Training" },
    ],
  },

  /* ---------------- MCA Modules (Deck) ---------------- */
  {
    group: "MCA Modules (Deck)",
    items: [
      { id: "mca_edh", label: "Efficient Deck Hand (EDH)" },
      { id: "mca_gsk", label: "General Ship Knowledge (GSK)" },
      { id: "mca_nav_radar_oow", label: "Navigation, Radar & ARPA (OOW)" },
      { id: "mca_helm_operational", label: "HELM — Operational Level" },
      { id: "mca_helm_management", label: "HELM — Management Level" },
      { id: "mca_ecdis", label: "ECDIS — Electronic Chart Display" },
      { id: "mca_stability_my", label: "Stability — Master Yachts" },
      { id: "mca_seamanship_meteorology_my", label: "Seamanship & Meteorology — Master Yachts" },
      { id: "mca_business_law_my", label: "Business & Law — Master Yachts" },
      { id: "mca_celestial_my", label: "Celestial Navigation — Master Yachts" },
      { id: "mca_yacht_rating", label: "MCA Yacht Rating Certificate" },
    ],
  },

  /* ---------------- Helideck / Heli Ops ---------------- */
  {
    group: "Helideck (Yacht Helicopter Ops)",
    items: [
      { id: "helideck_hda", label: "Helideck Assistant / Marshalling (HDA)" },
      { id: "helideck_hlo", label: "Helicopter Landing Officer (HLO)" },
    ],
  },

  /* ---------------- Tender / PWC ---------------- */
  {
    group: "Tender & PWC",
    items: [
      { id: "powerboat_lvl2", label: "Powerboat Level 2 / Tender Operator", aliases: ["PB2"] },
      { id: "pwc", label: "PWC (Personal Watercraft)" },
      { id: "pwc_instructor", label: "PWC Instructor" },
    ],
  },

  /* ---------------- Interior ---------------- */
  {
    group: "Interior (Service & Hospitality)",
    items: [
      { id: "interior_silver_service", label: "Interior – Silver Service" },
      { id: "interior_housekeeping", label: "Interior – Housekeeping" },
      { id: "interior_bartender", label: "Interior – Mixology / Bartender" },
      { id: "interior_barista", label: "Interior – Barista" },
      { id: "wset2", label: "WSET Level 2" },
      { id: "wset3", label: "WSET Level 3" },
      { id: "food_hygiene_3", label: "Food Hygiene / Food Safety Level 3", aliases: ["HACCP Level 3"] },
      { id: "food_hygiene_2", label: "Food Hygiene / Food Safety Level 2", aliases: ["HACCP Level 2"] },
    ],
  },

  /* ---------------- Galley ---------------- */
  {
    group: "Galley (Culinary)",
    items: [
      { id: "ship_cook_cert", label: "Ship’s Cook Certificate" },
      { id: "chef_haccp3", label: "Food Hygiene / HACCP Level 3" },
      { id: "chef_haccp2", label: "Food Hygiene / HACCP Level 2" },
      { id: "menu_portfolio", label: "Menu Portfolio", aliases: ["Menu Book"] },
      { id: "beverage_program", label: "Wine List / Beverage Program" },
      { id: "chef_portfolio", label: "Culinary Photo Portfolio", aliases: ["Food Portfolio"] },
    ],
  },
];

export default TITLE_CATALOG;

/* Optional helper: flattened list (id, label, group) */
export const ALL_TITLE_OPTIONS = TITLE_CATALOG.flatMap((g) =>
  g.items.map(({ id, label }) => ({ id, label, group: g.group }))
);
