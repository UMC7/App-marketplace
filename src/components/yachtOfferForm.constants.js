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

export const yearsOptions = ['Green', 1, 2, 2.5, 3, 5];

export const titles = [
  'Captain','Captain/Engineer','Skipper','Chase Boat Captain','Relief Captain',
  'Chief Officer','2nd Officer','3rd Officer','Bosun','Deck/Engineer','Mate',
  'Lead Deckhand','Deckhand','Deck/Steward(ess)','Deck/Carpenter','Deck/Divemaster',
  'Deck/Cook','Dayworker',
  'Chief Engineer','2nd Engineer','3rd Engineer','Solo Engineer','Engineer','Electrician',
  'Chef','Head Chef','Sous Chef','Solo Chef','Cook/Crew Chef','Crew Chef/Stew','Chef/Steward(ess)',
  'Butler','Steward(ess)','Chief Steward(ess)','2nd Steward(ess)','3rd Steward(ess)',
  '4th Steward(ess)','Solo Steward(ess)','Junior Steward(ess)',
  'Housekeeper','Head of Housekeeping',
  'Cook/Stew/Deck','Cook/Steward(ess)','Stew/Deck','Laundry/Steward(ess)',
  'Stew/Masseur','Masseur','Hairdresser/Barber','Steward(ess)/Nanny','Nanny',
  'Videographer','Yoga/Pilates Instructor','Personal Trainer','Dive Instrutor',
  'Water Sport Instrutor','Nurse','Other'
];

export const types = [
  'Rotational','Permanent','Temporary','Seasonal','Relief','Delivery','Crossing','DayWork'
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
  'Chef','Head Chef','Sous Chef','Solo Chef','Cook/Crew Chef','Crew Chef/Stew','Chef/Steward(ess)'
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
  'Y4 – Yacht Engineer ≤200 GT',
  'MEO (Yachts) – Marine Engine Operator',
  'AEC 2 – Approved Engine Course 2',
  'AEC 1 – Approved Engine Course 1',
];

export const DECK_LICENSE_MAP = {
  Captain: ['Master Unlimited','Master Yachts 3000 GT','Master Yachts 500 GT','Master Yachts 200 GT','Yachtmaster'],
  'Captain/Engineer': ['Master Unlimited','Master Yachts 3000 GT','Master Yachts 500 GT','Master Yachts 200 GT','Yachtmaster'],
  Skipper: ['Master Yachts 200 GT','Yachtmaster'],
  'Relief Captain': ['Master Unlimited','Master Yachts 3000 GT','Master Yachts 500 GT','Master Yachts 200 GT','Yachtmaster'],
  'Chase Boat Captain': ['Master Yachts 200 GT','Yachtmaster'],
  'Chief Officer': ['Master Yachts 3000 GT','Chief Mate Unlimited','Chief Mate Yachts 3000 GT','OOW Unlimited','OOW Yachts 3000 GT','Yachtmaster'],
  '2nd Officer': ['Chief Mate Yachts 3000 GT','OOW Unlimited','OOW Yachts 3000 GT','Yachtmaster'],
  '3rd Officer': ['Chief Mate Yachts 3000 GT','OOW Unlimited','OOW Yachts 3000 GT','Yachtmaster'],
  Mate: ['Chief Mate Yachts 3000 GT','OOW Unlimited','OOW Yachts 3000 GT','Yachtmaster'],
  Bosun: ['OOW Yachts 3000 GT','Yachtmaster'],
  'Deck/Engineer': ['OOW Yachts 3000 GT','Yachtmaster'],
  'Lead Deckhand': ['OOW Yachts 3000 GT','Yachtmaster'],
  Deckhand: ['OOW Yachts 3000 GT','Yachtmaster'],
  'Deck/Steward(ess)': ['Yachtmaster'],
  'Deck/Carpenter': ['Yachtmaster'],
  'Deck/Divemaster': ['Yachtmaster'],
  'Deck/Cook': ['Yachtmaster'],
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
];

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
];

export const INTERIOR_DEPARTMENT_RANKS = [
  'Butler',
  'Steward(ess)',
  'Chief Steward(ess)',
  '2nd Steward(ess)',
  '3rd Steward(ess)',
  '4th Steward(ess)',
  'Solo Steward(ess)',
  'Junior Steward(ess)',
  'Housekeeper',
  'Head of Housekeeping',
  'Laundry/Steward(ess)',
  'Stew/Deck',
  'Cook/Stew/Deck',
  'Cook/Steward(ess)',
  'Chef/Steward(ess)',
  'Crew Chef/Stew',
  'Stew/Masseur',
  'Masseur',
  'Hairdresser/Barber',
  'Steward(ess)/Nanny',
  'Nanny',
  'Videographer',
  'Yoga/Pilates Instructor',
  'Personal Trainer',
  'Dive Instrutor',
  'Water Sport Instrutor',
  'Nurse',
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
];