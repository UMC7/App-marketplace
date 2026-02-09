// src/components/yachtOfferForm.constants.js

export const MONTHS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export const yearsOptions = ['Green', 'New in rank welcome', 1, 2, 2.5, 3, 5];

export const titles = [
  'Captain','Captain/Engineer','Skipper','Chase Boat Captain','Relief Captain',
  'Chief Officer','2nd Officer','3rd Officer','Bosun','Deck/Engineer','Mate',
  'Lead Deckhand','Deckhand','Deck/Steward(ess)','Deck/Carpenter','Deck/Divemaster',
  'Deck/Cook','Dayworker',
  'Chief Engineer','2nd Engineer','3rd Engineer','Solo Engineer','Engineer','Electrician',
  'Chef','Head Chef','Sous Chef','Solo Chef','Cook','Cook/Crew Chef','Crew Chef/Stew','Chef/Steward(ess)',
  'Butler','Steward(ess)','Chief Steward(ess)','2nd Steward(ess)','3rd Steward(ess)',
  '4th Steward(ess)','Solo Steward(ess)','Junior Steward(ess)',
  'Housekeeper','Head of Housekeeping',
  'Cook/Stew/Deck','Cook/Steward(ess)','Stew/Deck','Laundry/Steward(ess)',
  'Stew/Masseur','Masseur','Hairdresser/Barber','Steward(ess)/Nanny','Nanny',
  'Videographer','Yoga/Pilates Instructor','Personal Trainer','Dive Instrutor',
  'Water Sport Instrutor','Nurse','Other'
];

export const types = [
  'Rotational','Permanent','Temporary','Seasonal','Relief','Delivery','Crossing','Freelance','DayWork'
];

export const ENGINEERING_RANKS = [
  'Chief Engineer','2nd Engineer','3rd Engineer','Solo Engineer','Engineer','Electrician'
];

export const DECK_LICENSE_RANKS = [
  'Captain','Captain/Engineer','Skipper','Chase Boat Captain','Relief Captain',
  'Chief Officer','2nd Officer','3rd Officer','Bosun','Deck/Engineer','Mate',
  'Lead Deckhand','Deckhand','Deck/Steward(ess)','Deck/Carpenter','Deck/Divemaster','Deck/Cook'
];

export const GALLEY_DEPARTMENT_RANKS = [
  'Chef','Head Chef','Sous Chef','Solo Chef','Cook','Cook/Crew Chef','Crew Chef/Stew','Chef/Steward(ess)'
];

export const ENGINEERING_LICENSE_OPTIONS = [
  'Chief Engineer Unlimited - STCW III/2',
  'Second Engineer Unlimited - STCW III/2',
  'Engineering Officer of the Watch (EOOW) - STCW III/1',
  'Y1 - Yacht Engineer (Unlimited)',
  'Y2 - Yacht Engineer ≤3000 GT',
  'Y3 - Yacht Engineer ≤500 GT',
  'Y4 - Yacht Engineer ≤200 GT',
  'Small Vessel Chief Engineer - MCA SV',
  'AEC 2 - Approved Engine Course 2',
  'AEC 1 - Approved Engine Course 1',
  'MEOL (Yachts) - Marine Engine Operator Licence',
];

export const ELECTRICIAN_LICENSE_OPTIONS = [
  'Engineering Officer of the Watch (EOOW) - STCW III/1',
  'MEO (Yachts) - Marine Engine Operator Licence',
  'AEC 2 - Approved Engine Course 2',
  'AEC 1 - Approved Engine Course 1',
];

export const ENGINEERING_LICENSE_FIELD_RANKS = ['Captain/Engineer','Deck/Engineer'];

export const ENGINEERING_LICENSE_FIELD_OPTIONS = [
  'Y3 - Yacht Engineer ≤500 GT',
  'Y4 – Yacht Engineer ≤200 GT',
  'MEO (Yachts) – Marine Engine Operator',
  'AEC 2 – Approved Engine Course 2',
  'AEC 1 – Approved Engine Course 1',
];

export const DECK_LICENSE_MAP = {
  Captain: ['Master Unlimited','Master Yachts 3000 GT','Master 1600 GRT','Master Yachts 500 GT','Master Yachts 200 GT','Yachtmaster','Master 100 GRT / OUPV'],
  'Captain/Engineer': ['Master Yachts 500 GT','Master Yachts 200 GT','Yachtmaster','Master 100 GRT / OUPV'],
  Skipper: ['Master Yachts 200 GT','Yachtmaster','Master 100 GRT / OUPV'],
  'Relief Captain': ['Master Unlimited','Master Yachts 3000 GT','Master 1600 GRT','Master Yachts 500 GT','Master Yachts 200 GT','Yachtmaster','Master 100 GRT / OUPV'],
  'Chase Boat Captain': ['Master Yachts 200 GT','Yachtmaster','Master 100 GRT / OUPV'],
  'Chief Officer': ['Master Yachts 3000 GT','Master 1600 GRT','Chief Mate Unlimited','Chief Mate Yachts 3000 GT','OOW Unlimited','OOW Yachts 3000 GT','Yachtmaster','Master 100 GRT / OUPV'],
  '2nd Officer': ['Chief Mate Yachts 3000 GT','OOW Unlimited','OOW Yachts 3000 GT','Yachtmaster','Master 100 GRT / OUPV'],
  '3rd Officer': ['Chief Mate Yachts 3000 GT','OOW Unlimited','OOW Yachts 3000 GT','Yachtmaster','Master 100 GRT / OUPV'],
  Mate: ['Chief Mate Yachts 3000 GT','OOW Unlimited','OOW Yachts 3000 GT','Yachtmaster','Master 100 GRT / OUPV'],
  Bosun: ['OOW Yachts 3000 GT','Yachtmaster','Master 100 GRT / OUPV'],
  'Deck/Engineer': ['OOW Yachts 3000 GT','Yachtmaster','Master 100 GRT / OUPV'],
  'Lead Deckhand': ['OOW Yachts 3000 GT','Yachtmaster','Master 100 GRT / OUPV'],
  Deckhand: ['OOW Yachts 3000 GT','Yachtmaster','Master 100 GRT / OUPV'],
  'Deck/Steward(ess)': ['Yachtmaster','Master 100 GRT / OUPV'],
  'Deck/Carpenter': ['Yachtmaster','Master 100 GRT / OUPV'],
  'Deck/Divemaster': ['Yachtmaster','Master 100 GRT / OUPV'],
  'Deck/Cook': ['Yachtmaster','Master 100 GRT / OUPV'],
};

export const DECK_DOCUMENT_MAP = {
  Captain: ['GMDSS GOC','GMDSS ROC','VHF SRC'],
  'Captain/Engineer': ['GMDSS GOC','GMDSS ROC','VHF SRC'],
  Skipper: ['GMDSS ROC','VHF SRC'],
  'Relief Captain': ['GMDSS GOC','GMDSS ROC','VHF SRC'],
  'Chase Boat Captain': ['GMDSS ROC','VHF SRC'],
  'Chief Officer': ['GMDSS GOC','GMDSS ROC','VHF SRC'],
  '2nd Officer': ['GMDSS GOC','GMDSS ROC','VHF SRC'],
  '3rd Officer': ['GMDSS GOC','GMDSS ROC','VHF SRC'],
  Mate: ['GMDSS GOC','GMDSS ROC','VHF SRC'],
  Bosun: ['VHF SRC'],
  'Lead Deckhand': ['VHF SRC'],
  Deckhand: ['VHF SRC (preferred / plus)'],
  'Deck/Steward(ess)': ['VHF SRC (optional)'],
  'Deck/Carpenter': ['VHF SRC (optional)'],
  'Deck/Divemaster': ['VHF SRC (optional)'],
  'Deck/Cook': ['VHF SRC (optional)'],
  'Deck/Engineer': ['VHF SRC'],
};

export const WATERSORTS_DIVING_REQUIRED_DOCUMENT_GROUP = {
  label: 'Watersports / Diving',
  options: [
    'Certified Diver',
    'Divemaster / Dive Guide',
    'Instructor (PADI or equivalent)',
    'Water Toys Experience',
  ],
};

const INTERIOR_SERVICE_HOSPITALITY_GROUP = {
  label: 'Interior (Service & Hospitality)',
  options: [
    'Silver Service',
    'Housekeeping',
    'Mixology / Bartender',
    'Barista',
    'WSET Level 2',
    'WSET Level 3',
    'Food Hygiene / Food Safety Level 2',
    'Food Hygiene / Food Safety Level 3',
  ],
};

export const FISHING_REQUIRED_DOCUMENT_GROUP = {
  label: 'Fishing Experience',
  options: [
    'Recreational Fishing Experience',
    'Advanced / Sport Fishing',
  ],
};

export const REQUIRED_DOCUMENT_GROUPS = [
  {
    label: 'Commonly Required',
    options: [
      'Valid Passport (>=6 months validity)',
      "Seaman's Book",
      'ENG1 Seafarer Medical Certificate',
      'STCW Basic Training (A-VI/1)',
      "Driver's License",
    ],
  },
  {
    label: 'Administrative / Compliance',
    options: ['Flag State Endorsement','Background Check - DBS / Police Clearance'],
  },
  {
    label: 'Travel & Health',
    options: ['Vaccination - Yellow Fever'],
  },
  {
    label: 'Tender & PWC',
    options: [
      'Powerboat Level 2 / Tender Operator',
      'PWC (Personal Watercraft)',
      'PWC Instructor',
    ],
  },
  FISHING_REQUIRED_DOCUMENT_GROUP,
  WATERSORTS_DIVING_REQUIRED_DOCUMENT_GROUP,
];

export const CAPTAIN_TIER_DECK_RANKS = ['Captain','Captain/Engineer','Skipper','Relief Captain'];

export const CAPTAIN_REQUIRED_DOCUMENT_GROUPS = [
  {
    label: 'Commonly Required',
    options: [
      'Valid Passport (>6 months validity)',
      'Reference Letter',
      "Seaman's Book",
      'ENG1 Seafarer Medical Certificate',
      'STCW Basic Training (A-VI/1)',
      "Driver's License",
    ],
  },
  {
    label: 'Administrative / Compliance',
    options: ['Background Check - DBS / Police Clearance', 'Flag State Endorsement'],
  },
  {
    label: 'Travel / Health',
    options: ['Vaccination - Yellow Fever', 'Vaccination - COVID'],
  },
  {
    label: 'Radio Certificates',
    options: ['GMDSS GOC', 'GMDSS ROC', 'VHF SRC'],
  },
  {
    label: 'STCW Certificates',
    options: [
      'STCW Basic Training (A-VI/1) - PST, FPFF, EFA, PSSR',
      'Proficiency in Survival Craft & Rescue Boats (PSCRB) - A-VI/2-1',
      'Fast Rescue Boats - A-VI/2-2',
      'Advanced Fire Fighting - A-VI/3',
      'Medical First Aid - A-VI/4-1',
      'Medical Care - A-VI/4-2',
      'Security Awareness - A-VI/6-1',
      'Designated Security Duties (DSD) - A-VI/6-2',
    ],
  },
  {
    label: 'STCW Passenger / Management',
    options: [
      'Crowd Management - A-V/2',
      'Crisis Management & Human Behaviour - A-V/2-2',
      'Passenger Ship Safety Training',
    ],
  },
  {
    label: 'MCA Modules (Deck)',
    options: ['Navigation, Radar & ARPA (OOW)', 'ECDIS — Electronic Chart Display'],
  },
  {
    label: 'Yacht Helicopter Ops',
    options: [
      'Helideck Assistant / Marshalling (HDA)',
      'Helicopter Landing Officer (HLO)',
    ],
  },
  {
    label: 'Tender & PWC',
    options: ['PWC Instructor'],
  },
  FISHING_REQUIRED_DOCUMENT_GROUP,
  WATERSORTS_DIVING_REQUIRED_DOCUMENT_GROUP,
];

const ENGINE_ROOM_AEC_GROUP = {
  label: 'Engine Room / AEC',
  options: ['AEC 2 - Approved Engine Course 2', 'AEC 1 - Approved Engine Course 1'],
};

export const DECK_COMMAND_REQUIRED_DOCUMENT_GROUPS = [
  {
    label: 'Commonly Required',
    options: [
      'Valid Passport (>6 months validity)',
      'Reference Letter',
      "Seaman's Book",
      'ENG1 Seafarer Medical Certificate',
      'STCW Basic Training (A-VI/1)',
      "Driver's License",
    ],
  },
  {
    label: 'Administrative / Compliance',
    options: ['Background Check - DBS / Police Clearance', 'Flag State Endorsement'],
  },
  {
    label: 'Travel / Health',
    options: ['Vaccination - Yellow Fever', 'Vaccination - COVID'],
  },
  {
    label: 'Radio Certificates',
    options: ['GMDSS GOC', 'GMDSS ROC', 'VHF SRC'],
  },
  {
    label: 'STCW Certificates',
    options: [
      'STCW Basic Training (A-VI/1) - PST, FPFF, EFA, PSSR',
      'Proficiency in Survival Craft & Rescue Boats (PSCRB) - A-VI/2-1',
      'Fast Rescue Boats - A-VI/2-2',
      'Advanced Fire Fighting - A-VI/3',
      'Medical First Aid - A-VI/4-1',
      'Medical Care - A-VI/4-2',
      'Security Awareness - A-VI/6-1',
      'Designated Security Duties (DSD) - A-VI/6-2',
    ],
  },
  {
    label: 'STCW Passenger / Management',
    options: [
      'Crowd Management - A-V/2',
      'Crisis Management & Human Behaviour - A-V/2-2',
      'Passenger Ship Safety Training',
    ],
  },
  {
    label: 'MCA Modules (Deck)',
    options: [
      'Efficient Deck Hand (EDH)',
      'General Ship Knowledge (GSK)',
      'Navigation, Radar & ARPA (OOW)',
      'HELM — Operational Level',
      'HELM — Management Level',
      'ECDIS — Electronic Chart Display',
      'Stability — Master Yachts',
      'Seamanship & Meteorology — Master Yachts',
      'Business & Law — Master Yachts',
      'Celestial Navigation — Master Yachts',
      'MCA Yacht Rating Certificate',
    ],
  },
  {
    label: 'Yacht Helicopter Ops',
    options: [
      'Helideck Assistant / Marshalling (HDA)',
      'Helicopter Landing Officer (HLO)',
    ],
  },
  {
    label: 'Tender & PWC',
    options: [
      'Powerboat Level 2 / Tender Operator',
      'PWC (Personal Watercraft)',
      'PWC Instructor',
    ],
  },
  FISHING_REQUIRED_DOCUMENT_GROUP,
  WATERSORTS_DIVING_REQUIRED_DOCUMENT_GROUP,
];

const DECK_COMMAND_ENGINE_ROOM_DOCUMENT_GROUPS = [...DECK_COMMAND_REQUIRED_DOCUMENT_GROUPS, ENGINE_ROOM_AEC_GROUP];

const COMMON_DECK_HAND_REQUIRED_DOCUMENT_GROUPS = [
  {
    label: 'Commonly Required',
    options: [
      'Valid Passport (>6 months validity)',
      'Reference Letter',
      "Seaman's Book",
      'ENG1 Seafarer Medical Certificate',
      'STCW Basic Training (A-VI/1)',
      "Driver's License",
    ],
  },
  {
    label: 'Administrative / Compliance',
    options: ['Background Check - DBS / Police Clearance', 'Flag State Endorsement'],
  },
  {
    label: 'Travel / Health',
    options: ['Vaccination - Yellow Fever', 'Vaccination - COVID'],
  },
  {
    label: 'Radio Certificates',
    options: ['VHF SRC'],
  },
  {
    label: 'MCA Modules (Deck)',
    options: [
      'Efficient Deck Hand (EDH)',
      'General Ship Knowledge (GSK)',
      'HELM — Operational Level',
      'MCA Yacht Rating Certificate',
    ],
  },
  {
    label: 'Tender & PWC',
    options: [
      'Powerboat Level 2 / Tender Operator',
      'PWC (Personal Watercraft)',
      'PWC Instructor',
    ],
  },
  FISHING_REQUIRED_DOCUMENT_GROUP,
  WATERSORTS_DIVING_REQUIRED_DOCUMENT_GROUP,
];

const DECK_STEWARD_REQUIRED_DOCUMENT_GROUPS = [
  ...COMMON_DECK_HAND_REQUIRED_DOCUMENT_GROUPS.slice(0, -2),
  INTERIOR_SERVICE_HOSPITALITY_GROUP,
  FISHING_REQUIRED_DOCUMENT_GROUP,
  WATERSORTS_DIVING_REQUIRED_DOCUMENT_GROUP,
];

export const DECK_HAND_RANK_REQUIRED_DOCUMENT_GROUPS = COMMON_DECK_HAND_REQUIRED_DOCUMENT_GROUPS;

const DECK_HAND_ENGINE_ROOM_DOCUMENT_GROUPS = [...COMMON_DECK_HAND_REQUIRED_DOCUMENT_GROUPS, ENGINE_ROOM_AEC_GROUP];

export const DECK_ENGINEER_REQUIRED_DOCUMENT_GROUPS = [
  {
    label: 'Commonly Required',
    options: [
      'Valid Passport (>6 months validity)',
      'Reference Letter',
      "Seaman's Book",
      'ENG1 Seafarer Medical Certificate',
      'STCW Basic Training (A-VI/1)',
      "Driver's License",
    ],
  },
  {
    label: 'Administrative / Compliance',
    options: ['Background Check - DBS / Police Clearance', 'Flag State Endorsement'],
  },
  {
    label: 'Travel / Health',
    options: ['Vaccination - Yellow Fever', 'Vaccination - COVID'],
  },
  {
    label: 'Radio Certificates',
    options: ['VHF SRC'],
  },
  {
    label: 'MCA Modules (Deck)',
    options: [
      'Efficient Deck Hand (EDH)',
      'General Ship Knowledge (GSK)',
      'HELM — Operational Level',
      'MCA Yacht Rating Certificate',
    ],
  },
  {
    label: 'Tender & PWC',
    options: [
      'Powerboat Level 2 / Tender Operator',
      'PWC (Personal Watercraft)',
      'PWC Instructor',
    ],
  },
  FISHING_REQUIRED_DOCUMENT_GROUP,
  WATERSORTS_DIVING_REQUIRED_DOCUMENT_GROUP,
];

export const DAYWORKER_REQUIRED_DOCUMENT_GROUPS = [
  {
    label: 'Commonly Required',
    options: [
      'Valid Passport (>6 months validity)',
      'Reference Letter',
      "Seaman's Book",
      'ENG1 Seafarer Medical Certificate',
      'STCW Basic Training (A-VI/1)',
      "Driver's License",
    ],
  },
];

export const ENGINEERING_REQUIRED_DOCUMENT_GROUPS = [
  {
    label: 'Commonly Required',
    options: [
      'Valid Passport (>6 months validity)',
      'Reference Letter',
      "Seaman's Book",
      'ENG1 Seafarer Medical Certificate',
      'STCW Basic Training (A-VI/1)',
      "Driver's License",
    ],
  },
  {
    label: 'Administrative / Compliance',
    options: ['Background Check - DBS / Police Clearance', 'Flag State Endorsement'],
  },
  {
    label: 'Travel / Health',
    options: ['Vaccination - Yellow Fever', 'Vaccination - COVID'],
  },
  {
    label: 'Tender & PWC',
    options: [
      'Powerboat Level 2 / Tender Operator',
      'PWC (Personal Watercraft)',
      'PWC Instructor',
    ],
  },
  FISHING_REQUIRED_DOCUMENT_GROUP,
  WATERSORTS_DIVING_REQUIRED_DOCUMENT_GROUP,
];

export const RANK_SPECIFIC_REQUIRED_DOCUMENT_GROUPS = {
  Captain: CAPTAIN_REQUIRED_DOCUMENT_GROUPS,
  'Captain/Engineer': CAPTAIN_REQUIRED_DOCUMENT_GROUPS,
  Skipper: CAPTAIN_REQUIRED_DOCUMENT_GROUPS,
  'Relief Captain': CAPTAIN_REQUIRED_DOCUMENT_GROUPS,
  'Chase Boat Captain': DECK_COMMAND_ENGINE_ROOM_DOCUMENT_GROUPS,
  'Chief Officer': DECK_COMMAND_REQUIRED_DOCUMENT_GROUPS,
  '2nd Officer': DECK_COMMAND_REQUIRED_DOCUMENT_GROUPS,
  '3rd Officer': DECK_COMMAND_REQUIRED_DOCUMENT_GROUPS,
  Mate: DECK_COMMAND_ENGINE_ROOM_DOCUMENT_GROUPS,
  Bosun: DECK_COMMAND_ENGINE_ROOM_DOCUMENT_GROUPS,
  'Lead Deckhand': DECK_HAND_ENGINE_ROOM_DOCUMENT_GROUPS,
  Deckhand: DECK_HAND_ENGINE_ROOM_DOCUMENT_GROUPS,
  'Deck/Steward(ess)': DECK_STEWARD_REQUIRED_DOCUMENT_GROUPS,
  'Deck/Carpenter': DECK_HAND_RANK_REQUIRED_DOCUMENT_GROUPS,
  'Deck/Divemaster': DECK_HAND_RANK_REQUIRED_DOCUMENT_GROUPS,
  'Deck/Cook': DECK_HAND_RANK_REQUIRED_DOCUMENT_GROUPS,
  Dayworker: DAYWORKER_REQUIRED_DOCUMENT_GROUPS,
  'Chief Engineer': ENGINEERING_REQUIRED_DOCUMENT_GROUPS,
  '2nd Engineer': ENGINEERING_REQUIRED_DOCUMENT_GROUPS,
  '3rd Engineer': ENGINEERING_REQUIRED_DOCUMENT_GROUPS,
  Engineer: ENGINEERING_REQUIRED_DOCUMENT_GROUPS,
  'Solo Engineer': ENGINEERING_REQUIRED_DOCUMENT_GROUPS,
  Electrician: ENGINEERING_REQUIRED_DOCUMENT_GROUPS,
  'Deck/Engineer': DECK_ENGINEER_REQUIRED_DOCUMENT_GROUPS,
};

export const GALLEY_REQUIRED_DOCUMENT_GROUPS = [
  {
    label: 'Commonly Required',
    options: [
      'Valid Passport (>6 months validity)',
      'Reference Letter',
      "Seaman's Book",
      'ENG1 Seafarer Medical Certificate',
      'STCW Basic Training (A-VI/1)',
      "Driver's License",
    ],
  },
  {
    label: 'Administrative / Compliance',
    options: ['Background Check - DBS / Police Clearance'],
  },
  {
    label: 'Travel / Health',
    options: ['Vaccination - Yellow Fever','Vaccination - COVID'],
  },
  {
    label: 'Galley (Culinary)',
    options: [
      "Ship's Cook Certificate",
      'Food Hygiene / HACCP Level 2',
      'Food Hygiene / HACCP Level 3',
      'Menu Portfolio',
      'Wine List / Beverage Program',
      'Culinary Photo Portfolio',
    ],
  },
  {
    label: 'Interior (Service & Hospitality)',
    options: ['Silver Service','Mixology / Bartender','Barista'],
  },
  {
    label: 'Tender & PWC',
    options: [
      'Powerboat Level 2 / Tender Operator',
      'PWC (Personal Watercraft)',
      'PWC Instructor',
    ],
  },
  FISHING_REQUIRED_DOCUMENT_GROUP,
  WATERSORTS_DIVING_REQUIRED_DOCUMENT_GROUP,
];

export const INTERIOR_DEPARTMENT_RANKS = [
  'Chief Steward(ess)',
  '2nd Steward(ess)',
  '3rd Steward(ess)',
  '4th Steward(ess)',
  'Junior Steward(ess)',
  'Steward(ess)',
  'Solo Steward(ess)',
  'Stew/Deck',
  'Laundry/Steward(ess)',
  'Stew/Masseur',
  'Steward(ess)/Nanny',
  'Butler',
  'Head of Housekeeping',
  'Housekeeper',
  'Cook/Stew/Deck',
  'Cook/Steward(ess)',
];

export const INTERIOR_REQUIRED_DOCUMENT_GROUPS = [
  {
    label: 'Commonly Required',
    options: [
      'Valid Passport (>6 months validity)',
      'Reference Letter',
      "Seaman's Book",
      'ENG1 Seafarer Medical Certificate',
      'STCW Basic Training (A-VI/1)',
      "Driver's License",
    ],
  },
  {
    label: 'Administrative / Compliance',
    options: ['Background Check - DBS / Police Clearance'],
  },
  {
    label: 'Travel / Health',
    options: ['Vaccination - Yellow Fever','Vaccination - COVID'],
  },
  {
    label: 'Interior (Service & Hospitality)',
    options: [
      'Silver Service','Housekeeping','Mixology / Bartender','Barista',
      'WSET Level 2','WSET Level 3',
      'Food Hygiene / Food Safety Level 2','Food Hygiene / Food Safety Level 3',
    ],
  },
  {
    label: 'STCW Passenger / Management',
    options: [
      'Crowd Management — A-V/2',
      'Crisis Management & Human Behaviour — A-V/2-2',
      'Passenger Ship Safety Training',
    ],
  },
  {
    label: 'Tender & PWC',
    options: [
      'Powerboat Level 2 / Tender Operator',
      'PWC (Personal Watercraft)',
      'PWC Instructor',
    ],
  },
  FISHING_REQUIRED_DOCUMENT_GROUP,
  WATERSORTS_DIVING_REQUIRED_DOCUMENT_GROUP,
];

export const OTHERS_REQUIRED_DOCUMENT_GROUPS = [
  {
    label: 'Commonly Required',
    options: [
      'Valid Passport (>6 months validity)',
      'Reference Letter',
      "Seaman's Book",
      'ENG1 Seafarer Medical Certificate',
      'STCW Basic Training (A-VI/1)',
      "Driver's License",
    ],
  },
  {
    label: 'Administrative / Compliance',
    options: ['Background Check - DBS / Police Clearance'],
  },
  {
    label: 'Travel / Health',
    options: ['Vaccination - Yellow Fever', 'Vaccination - COVID'],
  },
  {
    label: 'STCW Certificates (Key)',
    options: [
      'Medical First Aid — A-VI/4-1',
      'Medical Care — A-VI/4-2',
      'Designated Security Duties (DSD) — A-VI/6-2',
    ],
  },
  {
    label: 'STCW Passenger / Management',
    options: [
      'Crowd Management — A-V/2',
      'Crisis Management & Human Behaviour — A-V/2-2',
      'Passenger Ship Safety Training',
    ],
  },
  {
    label: 'MCA Modules (Deck)',
    options: [
      'Efficient Deck Hand (EDH)',
      'General Ship Knowledge (GSK)',
      'MCA Yacht Rating Certificate',
    ],
  },
  {
    label: 'Yacht Helicopter Ops',
    options: [
      'Helideck Assistant / Marshalling (HDA)',
      'Helicopter Landing Officer (HLO)',
    ],
  },
  {
    label: 'Tender & PWC',
    options: [
      'Powerboat Level 2 / Tender Operator',
      'PWC (Personal Watercraft)',
      'PWC Instructor',
    ],
  },
  FISHING_REQUIRED_DOCUMENT_GROUP,
  WATERSORTS_DIVING_REQUIRED_DOCUMENT_GROUP,
];

export const DEPARTMENT_RANK_GROUPS = [
  {
    label: 'Deck Department',
    ranks: [
      'Captain',
      'Captain/Engineer',
      'Skipper',
      'Relief Captain',
      'Chase Boat Captain',
      'Chief Officer',
      '2nd Officer',
      '3rd Officer',
      'Mate',
      'Bosun',
      'Deck/Engineer',
      'Lead Deckhand',
      'Deckhand',
      'Deck/Steward(ess)',
      'Deck/Carpenter',
      'Deck/Divemaster',
      'Deck/Cook',
      'Dayworker',
    ],
  },
  {
    label: 'Engine Department',
    ranks: [
      'Chief Engineer',
      '2nd Engineer',
      '3rd Engineer',
      'Engineer',
      'Solo Engineer',
      'Electrician',
    ],
  },
  {
    label: 'Galley Department',
    ranks: [
      'Head Chef',
      'Sous Chef',
      'Chef',
      'Solo Chef',
      'Cook',
      'Cook/Crew Chef',
      'Crew Chef/Stew',
      'Chef/Steward(ess)',
    ],
  },
  {
    label: 'Interior Department',
    ranks: [
      'Chief Steward(ess)',
      '2nd Steward(ess)',
      '3rd Steward(ess)',
      '4th Steward(ess)',
      'Junior Steward(ess)',
      'Steward(ess)',
      'Solo Steward(ess)',
      'Stew/Deck',
      'Laundry/Steward(ess)',
      'Stew/Masseur',
      'Steward(ess)/Nanny',
      'Butler',
      'Head of Housekeeping',
      'Housekeeper',
      'Cook/Stew/Deck',
      'Cook/Steward(ess)',
    ],
  },
  {
    label: 'Others Department',
    ranks: [
      'Masseur',
      'Nanny',
      'Hairdresser/Barber',
      'Videographer',
      'Yoga/Pilates Instructor',
      'Personal Trainer',
      'Dive Instrutor',
      'Water Sport Instrutor',
      'Nurse',
      'Other',
    ],
  },
];

export const OTHERS_DEPARTMENT_RANKS = DEPARTMENT_RANK_GROUPS.find((group) => group.label === 'Others Department').ranks;

export const DEFAULT_YACHT_SIZES = [
  '0 - 30m',
  '31 - 40m',
  '41 - 50m',
  '51 - 70m',
  '71 - 100m',
  '>100m',
];

export const CHASE_BOAT_SIZES = [
  '<10m',
  '10 - 15m',
  '15 - 20m',
  '>20m',
];

export const VISA_OPTIONS = [
  'Green card or US Citizen',
  'B1/B2',
  'C1/D',
  'Schengen',
  'European Passport',
];

export const COUNTRIES = [
  'Albania','Anguilla','Antigua and Barbuda','Argentina','Aruba','Australia','Bahamas','Bahrain','Barbados',
  'Belgium','Belize','Bermuda (UK)','Bonaire','Brazil','Brunei','Bulgaria','BVI (UK)','Cambodia','Canada','Cape Verde','Cayman Islands (UK)',
  'Chile','China','Colombia','Costa Rica','Croatia','Cuba','Curacao','Cyprus','Denmark','Dominica',
  'Dominican Republic','Ecuador','Egypt','Estonia','Fiji','Finland','France','Germany','Gibraltar (UK)','Greece','Grenada','Guatemala','Guernsey (UK)','Honduras','India','Indonesia','Ireland','Israel','Isle of Man (UK)',
  'Italy','Jamaica','Japan','Jersey (UK)','Kiribati','Kuwait','Latvia','Libya','Lithuania','Madagascar',
  'Malaysia','Maldives','Malta','Marshall Islands','Mauritius','Mexico','Micronesia',
  'Monaco','Montenegro','Morocco','Myanmar','Netherlands','New Zealand','Nicaragua',
  'Norway','Panama','Peru','Philippines','Poland','Portugal','Qatar','Romania','Saint Barthélemy','Saint Kitts and Nevis',
  'Saint Lucia','Saint Maarten','Saint Vincent and the Grenadines','Samoa','Saudi Arabia','Seychelles',
  'Singapore','Slovenia','Solomon Islands','South Africa','South Korea','Spain','Sweden','Taiwan',
  'Thailand','Trinidad and Tobago','Tunisia','Turkey','United Arab Emirates','United Kingdom',
  'United States','Uruguay','Vanuatu','Venezuela','Vietnam',
];
