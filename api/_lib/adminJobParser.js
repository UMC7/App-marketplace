// Smart Paste de admin: rellena el formulario completo con las reglas de carga de YachtDaywork
// y ejemplos reales (texto pegado -> formulario final) guardados en job_parse_examples.
import { createClient } from "@supabase/supabase-js";
import * as FORM from "../../src/components/yachtOfferForm.constants.js";
import { REGIONS, USES, VESSEL_TYPES } from "../../src/components/cv/candidate/shared/experienceCatalogs.js";
import { DEPT_SPECIALTIES_SUGGESTIONS } from "../../src/components/cv/candidate/sectionscomponents/preferencesskills/catalogs.js";

const BASE_REQUIRED_DOCUMENTS = [
  "ENG1 Seafarer Medical Certificate",
  "STCW Basic Training (A-VI/1) - PST, FPFF, EFA, PSSR",
];
const LANGUAGES = ["Arabic", "Croatian", "Dutch", "English", "French", "German", "Greek", "Italian", "Japanese", "Mandarin", "Polish", "Portuguese", "Russian", "Spanish", "Swedish", "Turkish", "Ukrainian"];
const FLUENCY = ["Native", "Fluent", "Conversational"];
const CURRENCIES = ["USD", "EUR", "AUD", "GBP"];
const LIVEABOARD = ["No", "Own Cabin", "Share Cabin", "Crew house provided", "Flexible"];
const SEASON_TYPES = ["Single Season", "Dual Season", "Year-round"];
const PROPULSION = ["Shaft Drive", "Waterjet", "Pod Drive", "Arneson Drive"];
const POSTING_DURATIONS = ["1 day", "2 days", "3 days", "1 week", "2 weeks", "3 weeks", "1 month", "Manual removal"];
const LOCATION_REQUIREMENTS = ["local_only", "region_only"];
const DAY_RANGES = ["beginning", "middle", "end"];
const SCHENGEN_AREA = new Set([
  "Europe", "Mediterranean", "Austria", "Belgium", "Croatia", "Czech Republic", "Denmark", "Estonia", "Finland",
  "France", "Germany", "Greece", "Hungary", "Iceland", "Italy", "Latvia", "Liechtenstein", "Lithuania",
  "Luxembourg", "Malta", "Monaco", "Netherlands", "Norway", "Poland", "Portugal", "Slovakia", "Slovenia",
  "Spain", "Sweden", "Switzerland",
]);
const EXAMPLE_POOL = 300;
const EXAMPLES_PER_REQUEST = 5;

function collectOptionStrings(value, out = new Set(), key = "") {
  if (Array.isArray(value)) {
    if ((key === "options" || key === "items") && value.every((v) => typeof v === "string")) {
      value.forEach((v) => out.add(v));
    } else {
      value.forEach((v) => collectOptionStrings(v, out));
    }
  } else if (value && typeof value === "object") {
    Object.entries(value).forEach(([k, v]) => collectOptionStrings(v, out, k));
  }
  return out;
}

const DOCUMENT_OPTIONS = (() => {
  const docs = new Set(BASE_REQUIRED_DOCUMENTS);
  Object.entries(FORM).forEach(([name, value]) => {
    if (/DOCUMENT/.test(name) && !/LICENSE/.test(name)) collectOptionStrings(value, docs);
  });
  Object.values(FORM.DECK_DOCUMENT_MAP || {}).forEach((list) => list.forEach((d) => docs.add(d)));
  return [...docs];
})();

const SKILL_OPTIONS = [...collectOptionStrings(DEPT_SPECIALTIES_SUGGESTIONS)];

const DECK_LICENSES = [...new Set(Object.values(FORM.DECK_LICENSE_MAP).flat())];
const ENGINEERING_LICENSES = [...new Set([
  ...FORM.ENGINEERING_LICENSE_OPTIONS,
  ...FORM.ELECTRICIAN_LICENSE_OPTIONS,
  ...FORM.ENGINEERING_LICENSE_FIELD_OPTIONS,
])];
const YEARS_OPTIONS = FORM.yearsOptions.map(String);
const COUNTRY_OPTIONS = [...REGIONS.filter((r) => r !== "Worldwide"), ...FORM.COUNTRIES];

export const FORM_FIELDS = {
  work_environment: "",
  work_location: "",
  title: "",
  city: "",
  country: "",
  type: "",
  start_month: "",
  start_day: "",
  end_month: "",
  end_day: "",
  is_asap: false,
  is_flexible: false,
  required_license: "",
  engineering_license: "",
  required_documents: [],
  required_skills: [],
  salary: "",
  salary_currency: "",
  is_doe: false,
  is_tips: false,
  is_smoke_free_yacht: false,
  is_dry_boat: false,
  is_no_visible_tattoos: false,
  is_random_drug_testing: false,
  is_charter_experience_required: false,
  local_candidates_only: false,
  candidate_location_requirement: "",
  years_in_rank: "",
  gender: "",
  team: "No",
  teammate_rank: "",
  teammate_salary: "",
  teammate_salary_currency: "",
  teammate_experience: "",
  teammate_required_license: "",
  teammate_engineering_license: "",
  teammate_required_documents: [],
  teammate_required_skills: [],
  flag: "Foreign Flag",
  yacht_size: "",
  yacht_type: "",
  propulsion_type: "",
  uses: "",
  homeport: "",
  liveaboard: "",
  season_type: "",
  holidays: "",
  language_1: "English",
  language_1_fluency: "Fluent",
  language_2: "",
  language_2_fluency: "",
  language_3: "",
  language_3_fluency: "",
  visas: [],
  contact_email: "",
  contact_phone: "",
  job_link: "",
  posting_duration: "2 weeks",
  description: "",
};

const RULES = `
You fill the YachtDaywork "Post Job" form exactly the way the site admin does. Follow these rules strictly; they override general knowledge. The worked examples show the admin's real final forms: imitate them.

GENERAL
- Every value must be copied EXACTLY from the allowed lists below. Use "" (or [] / false) when the text gives no information. Never invent contacts, dates or amounts.
- work_environment: "Onboard" for any job on a yacht/boat (dayworkers and boat detailers included). "Shore-based" only for office/yard/agency jobs; then also set work_location ("On - site" or "Remote") and liveaboard "No".

RANK (title)
- Map to the closest allowed rank. "First Mate" -> "Chief Officer". "ETO" -> "Electrician". "Stewardess/Steward/Stew" -> "Steward(ess)" ("Sole stew" -> "Steward(ess)" unless "Solo Steward(ess)" is clearly the job). "Crew cook + watchkeeper" -> "Chef/Stew/Deck". "Crew chef" -> "Cook/Crew Chef". "Day worker", "boat detailer", "wash down" -> "Dayworker". "Engineer / First Mate" -> "Mate/Engineer". "Deck Engineer" -> "Deck/Engineer". If two titles are joined with "/" (e.g. "Bosun / Chase Boat Captain") take the first one.
- team = "Yes" ONLY when two people are hired together (couple, or "Captain & Deckhand position"); then fill teammate_rank and the teammate_* fields.

SALARY
- Range -> the LOWER number ("5,000 - 5,500" -> "5000"; "€3000-3500 DOE" -> "3000"). "From 3000 upward", "3200+", "up to $30-$35" -> the first number.
- If ANY concrete amount is given: salary = that number (digits only), is_doe = false, even if the text also says DOE/negotiable.
- is_doe = true ONLY when no amount is given (DOE, competitive, strong salary, "salary paid in USD"). Then salary = "" and salary_currency = "".
- Day rates and hourly rates: store just the number.
- Currency: € = EUR, £ = GBP, $ = USD, except $ for jobs in Australia = AUD.
- is_tips = true when tips are mentioned as part of the package.

START / END DATES (no year: the form infers it)
- Copy dates EXACTLY as written. Never shift a day or month.
- ASAP, immediate(ly), "available now", "this week", "within the next week", "within 10-12 days", "start immediately" -> is_asap = true, start_month = "", start_day = "".
- If the text gives no start information at all -> is_asap = true.
- Exact date -> start_month = month number ("11"), start_day = day number without leading zero ("1", "17"). "Around 10th November" -> "11" / "10". "01/11/26" is day/month/year -> "11" / "1".
- "Early <month>" -> start_day "beginning"; "Mid <month>" -> "middle"; "Late/End of <month>" -> "end"; month only -> start_day "".
- End date only when an explicit end date is written (e.g. "31 October - 14 November" -> start 10/31, end 11/14; "November 1-9" -> start 11/1, end 11/9). Never for Permanent jobs.

TERMS (type)
- Rotation mentioned (3:1, 2:2, 10 on/10 off) -> "Rotational".
- "Permanent", "full-time", leave days per annum, flights per annum -> "Permanent".
- Temp, short-term, a trip, "for 2 weeks/two months", fill-in -> "Temporary".
- Atlantic/ocean crossing or delivery trip -> "Crossing" / "Delivery".
- Dayworker -> "DayWork" always.
- Season(al) or NO terms information -> "Seasonal". Do not guess "Permanent" from the tone of the post: it needs an explicit word (permanent, full-time) or annual leave / annual flights.

EXPERIENCE (years_in_rank, also teammate_experience)
- "Open to Green Crew": green crew welcome, no experience needed, "experience a bonus but not necessary".
- "New in Rank Welcome": stepping up into the rank is welcome.
- "Yacht Experience Preferred": previous (yachting) experience preferred / preferable / "preferibilmente con esperienza".
- "Proven Experience Required": "experienced", "proven experience", "prior experience is a must", "strong background".
- "Similar Size & Rank Required": experience on similar size yachts / same size bracket in the same rank is required.
- Numbers: seasons count as half years. Pick the highest allowed number that does not exceed it: "minimum 2 seasons" -> "1"; "3-4 seasons" -> "2.5"; "at least 2 years as 2nd Stew" -> "2"; "5+ years" -> "5". Years in the specific rank beat total yachting years.

VESSEL
- Convert feet to meters (1 ft = 0.3048 m) and use the size bucket. "50m+" -> "41 - 50m"; "60m+" -> "51 - 70m"; "20m+" -> "0 - 30m". If no size is given use "0 - 30m" and list "yacht_size" in uncertain_fields.
- "Chase Boat" type and the chase-boat size buckets ONLY when the job itself is on a chase boat. A yacht that owns a chase boat is still a Motor/Sailing Yacht.
- M/Y -> "Motor Yacht", S/Y -> "Sailing Yacht". Unknown -> "Motor Yacht" and list "yacht_type" in uncertain_fields.
- uses: "Private", "Charter (only)" (charter yacht / heavy charter), "Private/Charter" (private & charter). Unknown -> "".
- season_type: only when the post states it: "Dual Season" ("dual season", or a winter season AND a summer season named), "Single Season" ("single season"), "Year-round". An itinerary alone is not a season type. Unknown -> "".
- flag: default "Foreign Flag". If a flag in the list is named ("US-flagged" -> "United States", "Bandiera Panamá" -> "Panama", "Foreign Flagged (Jamaican)" -> "Jamaica", "Marshall Islands") use it. "FF" = "Foreign Flag".
- homeport only when explicitly stated. propulsion_type only when stated.

LOCATION
- country = joining country. Use a region from the list when only a region is given ("joining in Europe" -> "Europe", "in the Med" -> "Mediterranean", "Caribbean" -> "Caribbean").
- city = the joining city/area as written in English ("Napoli" -> "Naples", "Florida", "Sutherland Shire, Sydney", "SOF"). No trailing spaces.
- candidate_location_requirement: "local_only" when candidates MUST already be in that area or legal to work there ("must be located in Florida", "must be local", "must be legal to work in the US"); "region_only" when they must be in a wider region ("currently located in the EU or UK"); "" for a mere preference. local_candidates_only = true only with "local_only".

VISAS
- Joining in the United States -> ["B1/B2","Green card or US Citizen"]; if the text only accepts US passport / Green Card -> ["Green card or US Citizen"].
- Joining in a Schengen country, "Europe" or "Mediterranean" -> ["Schengen","European Passport"].
- Australia -> ["Australian Work Rights"].
- Caribbean/Bahamas -> only visas explicitly mentioned (usually B1/B2).
- Always add any visa explicitly required ("B1/B2 in hand" -> "B1/B2").

DOCUMENTS & LICENSES
- Onboard jobs ALWAYS include "${BASE_REQUIRED_DOCUMENTS[0]}" and "${BASE_REQUIRED_DOCUMENTS[1]}".
- Add every other explicitly required document from the list: PDSD/DSD/Security Awareness -> "Designated Security Duties (DSD) - A-VI/6-2"; Food Hygiene/Food Safety level 2 or 3 -> "Food Hygiene / HACCP Level 2|3"; ship's cook certificate or professional culinary training -> "Culinary Certificate / Diploma"; Powerboat Level 2; driving licence; seaman's book. Do not add "Reference Letter" unless references are listed among the qualifications/certificates.
- required_license: the main deck licence explicitly required, from the list ("OOW 3000gt" -> "OOW Yachts 3000 GT", "Master 500 GT" -> "Master Yachts 500 GT", "Yachtmaster Offshore"). engineering_license for engineering certificates (AEC, Y4, EOOW...). "" when none.

REQUIREMENT FLAGS
- gender: "Male"/"Female" only when explicit ("male only", "female only due to cabins", "a hard working girl"). Otherwise "".
- liveaboard: "Share Cabin" for cabin sharing or "must sleep onboard"; "Own Cabin" for captains or when stated; "Crew house provided" when stated; otherwise "".
- holidays: leave days per year as a number ("40 days leave" -> "40"). Not for rotations.
- is_smoke_free_yacht: non-smoker / no vaping. is_no_visible_tattoos: no visible tattoos. is_dry_boat: dry boat. is_random_drug_testing: drug testing. is_charter_experience_required: charter experience is a must.

OTHER
- languages: language_1 is ALWAYS "English" / "Fluent", even when the post is written in another language. Only add language_2/3 when the post explicitly requires another language.
- required_skills (and teammate_required_skills): 2-6 skills from the skills list that match the duties and requirements written in the post. Exact strings only.
- contact_email, contact_phone (as written), job_link (only an http(s) URL from the post).
- posting_duration: "3 days" for a dayworker job on a specific date; otherwise "2 weeks".

DESCRIPTION (English, always this structure)
<emoji> <Position as posted, cleaned> – <ft>ft (<m>m) <Private/Charter/New Build...> <Motor Yacht|Sailing Yacht>
(blank line)
📍 Joining Location: <place>   (or "📍 Location:")
📅 Start Date: <as written>   (or "📅 Dates: ..." for date ranges)
📄 Contract: <terms, rotation>
💰 Salary: <as written, e.g. "From €3,000/month, Depending on Experience" or "DOE">
(blank line)
Requirements:
• ...
(blank line)
Responsibilities:   (only if the post lists duties)
• ...
(blank line)
Additional Information:
• ...
(blank line)
📩 Apply via email with your CV.   (or "via WhatsApp", "via text message" depending on the contact)
- Rewrite in clean professional English, keep every operational detail, drop hashtags, emails, phone numbers and recruiter self-promotion. Use emoji ⚓ deck, 🛥️ interior, ⚙️ engineering, 👨‍🍳 galley, ⛵ sailing captain, ⚡ ETO, 🧼 detailing.

uncertain_fields: list the field names you had to guess or that the post leaves ambiguous.
`.trim();

export function catalogText() {
  return [
    `RANKS: ${FORM.titles.join(" | ")}`,
    `TERMS: ${FORM.types.join(" | ")}`,
    `EXPERIENCE: ${YEARS_OPTIONS.join(" | ")}`,
    `YACHT SIZES: ${FORM.DEFAULT_YACHT_SIZES.join(" | ")}  (chase boats: ${FORM.CHASE_BOAT_SIZES.join(" | ")})`,
    `YACHT TYPES: ${VESSEL_TYPES.join(" | ")}`,
    `USES: ${USES.join(" | ")}`,
    `SEASON TYPES: ${SEASON_TYPES.join(" | ")}`,
    `LIVEABOARD: ${LIVEABOARD.join(" | ")}`,
    `FLAGS: ${FORM.FLAG_OPTIONS.join(" | ")}`,
    `COUNTRIES / REGIONS: ${COUNTRY_OPTIONS.join(" | ")}`,
    `VISAS: ${FORM.VISA_OPTIONS.join(" | ")}`,
    `CURRENCIES: ${CURRENCIES.join(" | ")}`,
    `LANGUAGES: ${LANGUAGES.join(" | ")}; FLUENCY: ${FLUENCY.join(" | ")}`,
    `PROPULSION: ${PROPULSION.join(" | ")}`,
    `POSTING DURATION: ${POSTING_DURATIONS.join(" | ")}`,
    `DECK LICENSES: ${DECK_LICENSES.join(" | ")}`,
    `ENGINEERING LICENSES: ${ENGINEERING_LICENSES.join(" | ")}`,
    `DOCUMENTS: ${DOCUMENT_OPTIONS.join(" | ")}`,
    `SKILLS: ${SKILL_OPTIONS.join(" | ")}`,
  ].join("\n");
}

function getServiceClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Supabase service role is not configured");
  return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function isAdminUser(user) {
  if (user?.app_metadata?.role === "admin") return true;
  const { data, error } = await getServiceClient().from("users").select("role").eq("id", user.id).maybeSingle();
  if (error) {
    console.error("admin check error:", error.message);
    return false;
  }
  return data?.role === "admin";
}

const tokenize = (text) =>
  new Set(String(text || "").toLowerCase().match(/[a-z0-9]{3,}/g) || []);

function similarity(a, b) {
  let shared = 0;
  a.forEach((t) => { if (b.has(t)) shared += 1; });
  return shared / Math.sqrt((a.size || 1) * (b.size || 1));
}

async function pickExamples(text) {
  const { data, error } = await getServiceClient()
    .from("job_parse_examples")
    .select("raw_text, output, posted_on, created_at")
    .order("created_at", { ascending: false })
    .limit(EXAMPLE_POOL);
  if (error) {
    console.error("job_parse_examples read error:", error.message);
    return [];
  }
  const target = tokenize(text);
  return (data || [])
    .map((row) => ({ row, score: similarity(target, tokenize(row.raw_text)) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, EXAMPLES_PER_REQUEST)
    .reverse()
    .map(({ row }) => row);
}

const normKey = (v) => String(v ?? "").trim().toLowerCase().replace(/\s+/g, " ");

function matchOption(value, options) {
  const key = normKey(value);
  if (!key) return "";
  return options.find((opt) => normKey(opt) === key) || null;
}

function cleanNumber(value) {
  const match = String(value ?? "").replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  return match ? match[0] : "";
}

const SIZE_RE = /(\d{2,3}(?:[.,]\d)?)\s*\+?\s*(m|mt|meters?|metres?|metri|ft|foot|feet|'|’)(?![a-z])/gi;

/** Eslora mayor mencionada en el texto, en metros (las menciones de chase boats se ignoran). */
export function largestYachtMeters(text) {
  let max = 0;
  for (const match of String(text || "").matchAll(SIZE_RE)) {
    const after = text.slice(match.index, match.index + 60);
    if (/boston\s+whaler|chase\s+boat|tender|rib\b/i.test(after)) continue;
    const value = Number(match[1].replace(",", "."));
    const meters = /^(ft|foot|feet|'|’)$/i.test(match[2]) ? value * 0.3048 : value;
    if (meters >= 8 && meters <= 200) max = Math.max(max, meters);
  }
  return max;
}

function sizeBucket(meters) {
  if (meters <= 30) return "0 - 30m";
  if (meters <= 40) return "31 - 40m";
  if (meters <= 50) return "41 - 50m";
  if (meters <= 70) return "51 - 70m";
  if (meters <= 100) return "71 - 100m";
  return ">100m";
}

/** Valida contra las opciones del formulario; lo que no encaja se vacía y se marca como dudoso. */
export function sanitizeAdminFields(raw, uncertain = new Set(), text = "", { applyDefaults = true } = {}) {
  const out = { ...FORM_FIELDS };
  const src = raw && typeof raw === "object" ? raw : {};
  const bool = (k) => src[k] === true || String(src[k]).toLowerCase() === "true";
  const str = (k) => (src[k] == null ? "" : String(src[k]).trim());
  const pick = (k, options) => {
    const v = str(k);
    if (!v) return "";
    const hit = matchOption(v, options);
    if (hit == null) {
      uncertain.add(k);
      return "";
    }
    return hit;
  };
  const pickList = (k, options) => {
    const list = Array.isArray(src[k]) ? src[k] : [];
    const result = [];
    list.forEach((v) => {
      const hit = matchOption(v, options);
      if (hit && !result.includes(hit)) result.push(hit);
      else if (!hit && String(v || "").trim()) uncertain.add(k);
    });
    return result;
  };
  const pickMonth = (k) => {
    const n = Number(str(k));
    return Number.isInteger(n) && n >= 1 && n <= 12 ? String(n) : "";
  };
  const pickDay = (k) => {
    const v = normKey(str(k));
    if (DAY_RANGES.includes(v)) return v;
    const n = Number(v);
    return Number.isInteger(n) && n >= 1 && n <= 31 ? String(n) : "";
  };

  out.work_environment = pick("work_environment", ["Onboard", "Shore-based"]) || "Onboard";
  out.work_location = pick("work_location", ["On - site", "Remote"]);
  out.title = pick("title", FORM.titles);
  out.city = str("city");
  out.country = pick("country", COUNTRY_OPTIONS);
  out.type = pick("type", FORM.types);
  out.is_asap = bool("is_asap");
  out.is_flexible = bool("is_flexible") && !out.is_asap;
  out.start_month = out.is_asap || out.is_flexible ? "" : pickMonth("start_month");
  out.start_day = out.start_month ? pickDay("start_day") : "";
  out.end_month = pickMonth("end_month");
  out.end_day = out.end_month ? pickDay("end_day") : "";
  out.required_license = pick("required_license", DECK_LICENSES);
  out.engineering_license = pick("engineering_license", ENGINEERING_LICENSES);
  out.required_documents = pickList("required_documents", DOCUMENT_OPTIONS);
  out.required_skills = pickList("required_skills", SKILL_OPTIONS);
  out.salary = cleanNumber(src.salary);
  out.salary_currency = pick("salary_currency", CURRENCIES);
  out.is_doe = bool("is_doe");
  out.is_tips = bool("is_tips");
  out.is_smoke_free_yacht = bool("is_smoke_free_yacht");
  out.is_dry_boat = bool("is_dry_boat");
  out.is_no_visible_tattoos = bool("is_no_visible_tattoos");
  out.is_random_drug_testing = bool("is_random_drug_testing");
  out.is_charter_experience_required = bool("is_charter_experience_required");
  out.candidate_location_requirement = pick("candidate_location_requirement", LOCATION_REQUIREMENTS);
  out.local_candidates_only = out.candidate_location_requirement === "local_only";
  out.years_in_rank = pick("years_in_rank", YEARS_OPTIONS);
  out.gender = pick("gender", ["Male", "Female"]);
  out.team = str("team") === "Yes" ? "Yes" : "No";
  if (out.team === "Yes") {
    out.teammate_rank = pick("teammate_rank", FORM.titles);
    out.teammate_salary = cleanNumber(src.teammate_salary);
    out.teammate_salary_currency = pick("teammate_salary_currency", CURRENCIES);
    out.teammate_experience = pick("teammate_experience", YEARS_OPTIONS);
    out.teammate_required_license = pick("teammate_required_license", DECK_LICENSES);
    out.teammate_engineering_license = pick("teammate_engineering_license", ENGINEERING_LICENSES);
    out.teammate_required_documents = pickList("teammate_required_documents", DOCUMENT_OPTIONS);
    out.teammate_required_skills = pickList("teammate_required_skills", SKILL_OPTIONS);
  }
  out.flag = pick("flag", FORM.FLAG_OPTIONS) || "Foreign Flag";
  out.yacht_type = pick("yacht_type", VESSEL_TYPES);
  const sizeOptions = out.yacht_type === "Chase Boat" ? FORM.CHASE_BOAT_SIZES : FORM.DEFAULT_YACHT_SIZES;
  out.yacht_size = pick("yacht_size", sizeOptions);
  const textMeters = !applyDefaults || out.yacht_type === "Chase Boat" ? 0 : largestYachtMeters(text);
  if (textMeters) out.yacht_size = sizeBucket(textMeters);
  out.propulsion_type = pick("propulsion_type", PROPULSION);
  out.uses = pick("uses", USES);
  out.homeport = str("homeport");
  out.liveaboard = pick("liveaboard", LIVEABOARD);
  out.season_type = pick("season_type", SEASON_TYPES);
  out.holidays = cleanNumber(src.holidays);
  ["1", "2", "3"].forEach((n) => {
    out[`language_${n}`] = pick(`language_${n}`, LANGUAGES);
    out[`language_${n}_fluency`] = out[`language_${n}`] ? pick(`language_${n}_fluency`, FLUENCY) || "Fluent" : "";
  });
  out.visas = pickList("visas", FORM.VISA_OPTIONS);
  out.contact_email = str("contact_email");
  out.contact_phone = str("contact_phone");
  out.job_link = /^https?:\/\//i.test(str("job_link")) ? str("job_link") : "";
  out.posting_duration = pick("posting_duration", POSTING_DURATIONS) || "2 weeks";
  out.description = str("description");

  if (out.salary) out.is_doe = false;
  if (out.is_doe) {
    out.salary = "";
    out.salary_currency = "";
    out.teammate_salary = "";
    out.teammate_salary_currency = "";
  }
  if (!out.salary && !out.is_doe) {
    out.is_doe = true;
    out.salary_currency = "";
  }
  if (!out.is_asap && !out.is_flexible && !out.start_month) out.is_asap = true;
  if (out.title === "Dayworker") out.type = "DayWork";
  if (out.type === "Permanent") {
    out.end_month = "";
    out.end_day = "";
  }
  if (!out.language_1) {
    out.language_1 = "English";
    out.language_1_fluency = "Fluent";
  }
  const toHaccp = (docs) => docs.map((d) => d.replace("Food Hygiene / Food Safety Level", "Food Hygiene / HACCP Level"));
  out.required_documents = toHaccp(out.required_documents);
  out.teammate_required_documents = toHaccp(out.teammate_required_documents);

  if (applyDefaults && out.work_environment === "Onboard") {
    if (out.country === "United States" && out.visas.length === 0) {
      out.visas = ["B1/B2", "Green card or US Citizen"];
    } else if (SCHENGEN_AREA.has(out.country)) {
      out.visas = [...out.visas, "Schengen", "European Passport"];
    } else if (out.country === "Australia" && out.visas.length === 0) {
      out.visas = ["Australian Work Rights"];
    }
  }
  out.visas = FORM.VISA_OPTIONS.filter((v) => out.visas.includes(v));

  if (out.work_environment === "Onboard") {
    const docs = new Set([...BASE_REQUIRED_DOCUMENTS, ...out.required_documents]);
    out.required_documents = [...BASE_REQUIRED_DOCUMENTS, ...DOCUMENT_OPTIONS.filter((d) => docs.has(d) && !BASE_REQUIRED_DOCUMENTS.includes(d))];
  } else {
    out.liveaboard = "No";
  }
  ["title", "country", "type", "yacht_type", "yacht_size"].forEach((k) => {
    if (!out[k] && !(out.work_environment === "Shore-based" && /^yacht_/.test(k))) uncertain.add(k);
  });

  const modelUncertain = Array.isArray(src.uncertain_fields) ? src.uncertain_fields : [];
  modelUncertain.forEach((k) => { if (typeof k === "string" && k in FORM_FIELDS) uncertain.add(k); });
  return { fields: out, uncertain: [...uncertain] };
}

export async function parseJobAsAdmin({ openai, text, today }) {
  const examples = await pickExamples(text);
  const messages = [
    { role: "system", content: `${RULES}\n\nALLOWED VALUES\n${catalogText()}` },
  ];
  examples.forEach((ex) => {
    messages.push({ role: "user", content: `POSTED ON: ${ex.posted_on || String(ex.created_at || "").slice(0, 10)}\nJOB POST:\n${ex.raw_text}` });
    messages.push({ role: "assistant", content: JSON.stringify({ ...ex.output, uncertain_fields: [] }) });
  });
  messages.push({
    role: "user",
    content: `POSTED ON: ${today}\nJOB POST:\n${text}\n\nReturn ONLY one JSON object with exactly these keys: ${Object.keys(FORM_FIELDS).join(", ")}, uncertain_fields.`,
  });

  const model = process.env.OPENAI_ADMIN_PARSE_MODEL || "gpt-4.1";
  const completion = await openai.chat.completions.create({
    model,
    temperature: 0,
    response_format: { type: "json_object" },
    messages,
  });
  const content = completion.choices?.[0]?.message?.content || "{}";
  const parsed = JSON.parse(content);
  return { ...sanitizeAdminFields(parsed, new Set(), text), examples_used: examples.length, model };
}

export async function saveAdminExample({ user, rawText, output, aiOutput, offerId }) {
  if (typeof rawText !== "string" || !rawText.trim() || rawText.length > 12000) {
    throw new Error("Invalid example text");
  }
  const { fields } = sanitizeAdminFields(output, new Set(), "", { applyDefaults: false });
  const aiFields = aiOutput ? sanitizeAdminFields(aiOutput, new Set(), "", { applyDefaults: false }).fields : null;
  const { error } = await getServiceClient().from("job_parse_examples").insert([{
    raw_text: rawText.trim(),
    output: fields,
    ai_output: aiFields,
    source_offer_id: offerId || null,
    posted_on: new Date().toISOString().slice(0, 10),
    created_by: user.id,
  }]);
  if (error) throw new Error(error.message);
}
