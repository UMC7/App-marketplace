// src/components/cv/candidate/shared/rankData.js
export const DEPARTMENTS = ["Deck", "Engine", "Interior", "Galley", "Other"];

export const RANKS_BY_DEPT = {
  Deck: [
    "Captain",
    "Relief Captain",
    "Captain/Engineer",
    "Skipper",
    "Chase Boat Captain",
    "Chief Officer",
    "2nd Officer",
    "3rd Officer",
    "Mate",
    "Bosun",
    "Lead Deckhand",
    "Deckhand",
    "Deck/Engineer",
    "Deck/Steward(ess)",
    "Deck/Carpenter",
    "Deck/Divemaster",
    "Dayworker",
  ],
  Engine: [
    "Chief Engineer",
    "2nd Engineer",
    "3rd Engineer",
    "Solo Engineer",
    "Electrician",
    "Dayworker",
  ],
  Galley: [
    "Chef",
    "Head Chef",
    "Sous Chef",
    "Solo Chef",
    "Cook/Crew Chef",
    "Crew Chef/Stew",
    "Cook/Steward(ess)",
    "Dayworker",
  ],
  Interior: [
    "Steward(ess)",
    "Chief Steward(ess)",
    "2nd Steward(ess)",
    "3rd Steward(ess)",
    "4th Steward(ess)",
    "Solo Steward(ess)",
    "Junior Steward(ess)",
    "Laundry/Steward(ess)",
    "Stew/Deck",
    "Stew/Masseur",
    "Dayworker",
  ],
  Other: [
    "Nurse",
    "Dive Instructor",
    "Water Sport Instructor",
    "Masseur",
    "Hairdresser/Barber",
    "Nanny",
    "Yoga/Pilates Instructor",
    "Personal Trainer",
    "Videographer",
    "Other",
  ],
};

export function getRanksForDept(dept) {
  return RANKS_BY_DEPT[dept] || [];
}
