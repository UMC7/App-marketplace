// src/components/cv/candidate/shared/merchantRankData.js

// Merchant / Sea Service rank catalogs
// - Separate from yacht rankData to avoid collisions
// - Passenger-specific roles (hotel/entertainment/etc.) + cargo/offshore ops

export const MERCHANT_DEPARTMENTS = [
  "Deck",
  "Engine",
  "Electrical / ETO",
  "Cargo Operations",
  "Hotel / Guest Services",
  "Catering / Galley",
  "Housekeeping & Laundry",
  "Medical",
  "Security",
  "Entertainment & Activities",
  "Retail & Photo",
  "Spa & Wellness",
  "Other",
];

export const MERCHANT_RANKS_BY_DEPT = {
  "Deck": [
    "Master (Captain)",
    "Staff Captain / Deputy Master",
    "Chief Officer",
    "1st Officer",
    "2nd Officer",
    "3rd Officer",
    "Safety Officer",
    "Environmental Officer",
    "DP Officer (Offshore)",
    "Bosun",
    "Able Seafarer Deck (AB)",
    "Ordinary Seafarer (OS)",
    "Carpenter / Shipwright",
    "Crane Operator (Deck)",
    "Deck Cadet",
  ],

  "Engine": [
    "Chief Engineer",
    "2nd Engineer (1st Assistant)",
    "3rd Engineer",
    "4th / Junior Engineer",
    "Refrigeration Engineer (HVAC)",
    "Motorman / Oiler",
    "Fitter / Turner",
    "Plumber",
    "Wiper",
    "Engine Cadet",
  ],

  "Electrical / ETO": [
    "Chief ETO",
    "Electro-Technical Officer (ETO)",
    "Junior ETO",
    "Electrical Engineer",
    "AV/IT Officer (Passenger)",
    "Broadcast / IT Technician (Passenger)",
  ],

  "Cargo Operations": [
    "Chief Officer (Cargo)",
    "Cargo Superintendent (Shipboard)",
    "Cargo Control Room Operator (Tanker)",
    "Pumpman (Tanker)",
    "Loading / Discharging Officer",
    "Ballast Control Operator (Offshore)",
    "Crane Operator (Cargo)",
    "Ro-Ro Cargo Securing Officer",
    "Reefer Technician (Container)",
  ],

  "Hotel / Guest Services": [
    "Hotel Director",
    "Assistant Hotel Director",
    "Guest Services Manager / Purser",
    "Assistant Purser / Crew Purser",
    "Shore Excursions Manager",
    "Concierge / Receptionist",
    "Crew Office Administrator",
  ],

  "Catering / Galley": [
    "Executive Chef",
    "Executive Sous Chef",
    "Sous Chef",
    "Chef de Partie",
    "Demi Chef de Partie",
    "Pastry Chef",
    "Baker",
    "Butcher",
    "Garde Manger / Pantry Chef",
    "Provision Master / Storekeeper",
    "Galley Steward / Utility",
  ],

  "Housekeeping & Laundry": [
    "Executive Housekeeper",
    "Assistant Housekeeper",
    "Cabin Steward / Stewardess",
    "Public Area Attendant",
    "Laundry Master",
    "Tailor",
  ],

  "Medical": [
    "Senior Doctor",
    "Doctor",
    "Nurse",
    "Paramedic",
  ],

  "Security": [
    "Chief Security Officer (CSO)",
    "Security Officer",
    "CCTV Operator",
    "Security Guard",
  ],

  "Entertainment & Activities": [
    "Cruise Director",
    "Assistant Cruise Director",
    "Entertainment / Production Manager",
    "Stage Manager",
    "Sound & Light Technician",
    "DJ / Entertainer / Performer",
    "Youth Staff",
  ],

  "Retail & Photo": [
    "Retail Manager",
    "Sales Associate",
    "Photo Manager",
    "Photographer",
    "Photo Lab Technician",
  ],

  "Spa & Wellness": [
    "Spa Manager",
    "Massage Therapist",
    "Beautician / Esthetician",
    "Hairdresser / Barber",
    "Fitness / Yoga Instructor",
  ],

  "Other": [
    "Other",
  ],
};

// Helper to fetch ranks by department (mirrors yacht getRanksForDept)
export function getMerchantRanksForDept(dept) {
  return MERCHANT_RANKS_BY_DEPT[dept] || [];
}