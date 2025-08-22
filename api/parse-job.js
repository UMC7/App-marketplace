// pages/api/parse-job.js
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// mismas opciones que tu initialState
const RANKS = [
  "Captain", "Captain/Engineer", "Skipper", "Chase Boat Captain", "Relief Captain",
  "Chief Officer", "2nd Officer", "3rd Officer", "Bosun", "Deck/Engineer", "Mate",
  "Lead Deckhand", "Deckhand", "Deck/Steward(ess)", "Deck/Carpenter", "Deck/Divemaster",
  "Dayworker", "Chief Engineer", "2nd Engineer", "3rd Engineer", "Solo Engineer", "Electrician", "Chef",
  "Head Chef", "Sous Chef", "Solo Chef", "Cook/Crew Chef", "Crew Chef/Stew", "Steward(ess)", "Chief Steward(ess)", "2nd Steward(ess)",
  "3rd Stewardess", "Solo Steward(ess)", "Junior Steward(ess)", "Cook/Steward(ess)", "Stew/Deck",
  "Laundry/Steward(ess)", "Stew/Masseur", "Masseur", "Hairdresser/Barber", "Nanny", "Videographer",
  "Yoga/Pilates Instructor", "Personal Trainer", "Dive Instrutor", "Water Sport Instrutor", "Nurse", "Other"
];

const YACHT_TYPES = ["Motor Yacht", "Sailing Yacht", "Chase Boat", "Catamaran"];
const YACHT_BUCKETS = ["0 - 30m", "31 - 40m", "41 - 50m", "51 - 70m", "71 - 100m", ">100m"];
const CHASE_BUCKETS = ["<10m", "10 - 15m", "15 - 20m", ">20m"];
const TERMS = ["Rotational", "Permanent", "Temporary", "Seasonal", "Relief", "Delivery", "Crossing", "DayWork"];
const CURRENCIES = ["USD", "EUR", "GBP", "AUD"];
const LANGS = ["Arabic", "Dutch", "English", "French", "German", "Greek", "Italian", "Mandarin", "Portuguese", "Russian", "Spanish", "Turkish", "Ukrainian"];
const FLU = ["Native", "Fluent", "Conversational"];
const PROPULSION = ["Shaft Drive", "Pod Drive", "Waterjet", "Sail Drive", "Outboard", "Stern Drive"];

// --- ayudas locales (solo si falta info del modelo) ---

// Mapeo de sinónimos de rangos (nueva mejora)
const RANK_SYNONYMS = {
  "first engineer": "2nd Engineer",
  "1st engineer": "2nd Engineer",
  "assistant engineer": "2nd Engineer",
  "enigineer": "Solo Engineer",
  "junior engineer": "3rd Engineer",
  "deckhand/engineer": "Deck/Engineer",
  "stew": "Steward(ess)",
  "stewardess": "Steward(ess)",
  "steward": "Steward(ess)",
  "chief stew": "Chief Steward(ess)",
  "head stew": "Chief Steward(ess)",
  "sole stew": "Solo Steward(ess)",
  "second stew": "2nd Steward(ess)",
  "third stew": "3rd Stewardess",
  "junior stew": "Junior Steward(ess)",
  "deck/stew": "Stew/Deck",
  "deck/steward": "Stew/Deck",
  "cook/stew": "Cook/Steward(ess)",
  "stew/cook": "Cook/Steward(ess)",
  "deckhand/stew": "Stew/Deck",
  "Sole Chef": "Solo Chef",
  "Crew Chef/Steward": "Crew Chef/Stew",
  "Crew Chef/Stewardess": "Crew Chef/Stew",
};

// Mapa básico ciudad -> país (se usa SOLO si el país viene vacío)
const CITY_TO_COUNTRY = {
  "fort lauderdale": "United States",
  "miami": "United States",
  "west palm beach": "United States",
  "antibes": "France",
  "cannes": "France",
  "nice": "France",
  "sof": "France",
  "palma": "Spain",
  "palma de mallorca": "Spain",
  "barcelona": "Spain",
  "valencia": "Spain",
  "monaco": "Monaco",
  "genoa": "Italy",
  "la spezia": "Italy",
  "livorno": "Italy",
  "viareggio": "Italy",
  "athens": "Greece",
  "athina": "Greece",
  "split": "Croatia",
  "tivat": "Montenegro",
  "dubai": "United Arab Emirates",
  "abu dhabi": "United Arab Emirates",
  "doha": "Qatar",
  "auckland": "New Zealand",
  "sydney": "Australia"
};

// Normalización de países (sinónimos -> forma canónica del select)
const COUNTRY_SYNONYMS = {
  "us": "United States",
  "usa": "United States",
  "u.s.": "United States",
  "u.s.a.": "United States",
  "united states of america": "United States",
  "south of france": "France",
  "uk": "United Kingdom",
  "u.k.": "United Kingdom",
  "great britain": "United Kingdom",
  "britain": "United Kingdom",
  "uae": "United Arab Emirates",
  "u.a.e.": "United Arab Emirates",
  "ksa": "Saudi Arabia",
  "kingdom of saudi arabia": "Saudi Arabia",
  "british virgin islands": "BVI, UK",
  "bvi": "BVI, UK",
  "republic of korea": "South Korea",
  "korea, south": "South Korea"
};

function normalizeCountryName(raw) {
  if (!raw) return "";
  const key = String(raw).trim().toLowerCase().replace(/\./g, "");
  return COUNTRY_SYNONYMS[key] || raw;
}

// Parser simple para fechas tipo “25th of June”, “25 June”, “June 25”
const MONTH_INDEX = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
};

function pickUpcomingYear(monthIdx, day, today) {
  const y0 = today.getFullYear();
  const candidate = new Date(Date.UTC(y0, monthIdx, day));
  return candidate >= new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()))
    ? y0
    : y0 + 1;
}

function tryParseStartDateFrom(text, today) {
  const t = text.toLowerCase();

  // 1) 25th of June
  let m = t.match(/\b(\d{1,2})(st|nd|rd|th)?\s+of\s+(january|february|march|april|may|june|july|august|september|october|november|december)\b/);
  if (m) {
    const day = parseInt(m[1], 10);
    const mon = MONTH_INDEX[m[3]];
    const year = pickUpcomingYear(mon, day, today);
    return `${year}-${String(mon + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  // 2) 25 June
  m = t.match(/\b(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\b/);
  if (m) {
    const day = parseInt(m[1], 10);
    const mon = MONTH_INDEX[m[2]];
    const year = pickUpcomingYear(mon, day, today);
    return `${year}-${String(mon + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  // 3) June 25
  m = t.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})\b/);
  if (m) {
    const mon = MONTH_INDEX[m[1]];
    const day = parseInt(m[2], 10);
    const year = pickUpcomingYear(mon, day, today);
    return `${year}-${String(mon + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return "";
}

// Detecta "until/till/through/thru <fecha>" y devuelve una fecha ISO para END DATE
function tryParseUntilEndDate(text, today) {
  const t = text.toLowerCase();

  // a) until 15th of November
  let m = t.match(/\b(?:until|till|through|thru)\s+(\d{1,2})(st|nd|rd|th)?\s+of\s+(january|february|march|april|may|june|july|august|september|october|november|december)\b/);
  if (m) {
    const day = parseInt(m[1], 10);
    const mon = MONTH_INDEX[m[3]];
    const year = pickUpcomingYear(mon, day, today);
    return `${year}-${String(mon + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  // b) until 15 November
  m = t.match(/\b(?:until|till|through|thru)\s+(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\b/);
  if (m) {
    const day = parseInt(m[1], 10);
    const mon = MONTH_INDEX[m[2]];
    const year = pickUpcomingYear(mon, day, today);
    return `${year}-${String(mon + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  // c) until November 15
  m = t.match(/\b(?:until|till|through|thru)\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})\b/);
  if (m) {
    const mon = MONTH_INDEX[m[1]];
    const day = parseInt(m[2], 10);
    const year = pickUpcomingYear(mon, day, today);
    return `${year}-${String(mon + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return "";
}

// Pista de inicio (“start/starting/from/join on/commence…”) en cualquier parte del texto
function hasStartCue(text) {
  return /\b(start(?:ing)?\b|from\b|join(?:ing)?\s+on\b|embark(?:ing)?\s+on\b|commenc(?:e|ing)\b)/i.test(text);
}

// Extraer LOA en metros o pies (MEJORA: ahora también convierte pies a metros)
function extractAllMeters(text) {
  const t = text.toLowerCase();
  const res = [];

  // Regex para metros (e.g., "60m", "55 m")
  const reMeters = /\b(\d{1,3})\s*m\b/g;
  let m;
  while ((m = reMeters.exec(t))) {
    const val = parseInt(m[1], 10);
    if (!isNaN(val)) res.push(val);
  }

  // Regex para pies (e.g., "200ft", "180 feet") y conversión a metros (1 ft = 0.3048 m)
  const reFeet = /\b(\d{2,3})\s*(ft|feet)\b/g;
  while ((m = reFeet.exec(t))) {
    const val = parseInt(m[1], 10);
    if (!isNaN(val)) res.push(Math.round(val * 0.3048));
  }
  return res;
}

// Bucket de tamaño
function bucketYachtSize(meters, yachtType) {
  if (meters == null) return "";
  if (yachtType === "Chase Boat") {
    if (meters < 10) return "<10m";
    if (meters <= 15) return "10 - 15m";
    if (meters <= 20) return "15 - 20m";
    return ">20m";
  }
  if (meters <= 30) return "0 - 30m";
  if (meters <= 40) return "31 - 40m";
  if (meters <= 50) return "41 - 50m";
  if (meters <= 70) return "51 - 70m";
  if (meters <= 100) return "71 - 100m";
  return ">100m";
}

// Season type por regex
function inferSeasonType(text) {
  const t = text.toLowerCase();
  if (/\bdual\s*-?\s*season\b/.test(t)) return "Dual Season";
  if (/\bsingle\s*-?\s*season\b/.test(t)) return "Single Season";
  if (/\byear\s*-?\s*round\b/.test(t)) return "Year-round";
  return "";
}

// Years in rank por regex
function inferYearsInRank(text) {
  const t = text.toLowerCase();
  // Busca patrones como "5+ years"
  let m = t.match(/\b(\d+)\s*\+?\s*years?\b/);
  if (m) return String(m[1]);
  // Busca rangos como "2-3 years"
  m = t.match(/\b(\d+)\s*\-\s*(\d+)\s*years?\b/);
  if (m) return String(m[1]);
  // Busca valores explícitos como "2 years" o "one season"
  if (/\b(one|1)\s+season(s)?\b/.test(t)) return "1";
  m = t.match(/\b(\d+(?:\.\d+)?)\s*(years?|yrs?)\b/);
  if (m) return String(m[1]);
  // Busca "Green" o "Proven experience"
  if (/\bgreen\b/i.test(t)) return "Green";
  // **Regla actualizada para incluir "experienced"**
  if (/\b(proven|extensive|experienced)\s+experience\b|\bexperienced\b/i.test(t)) return "2.5";
  return "";
}

// Lógica de "años en el puesto" basada en el contexto
function updateYearsInRank(text, out) {
  // Si el modelo de IA no extrajo nada, usamos nuestra lógica de regex
  if (!out.years_in_rank) {
    const yr = inferYearsInRank(text);
    if (yr) {
      out.years_in_rank = yr;
    }
  }
}

// DOE fallback (MEJORA: más precisa)
function ensureDOE(text, out) {
  const t = text.toLowerCase();
  const hasUSD = /\b(usd|\$)(?!\s*per)\b/.test(t);
  const hasEUR = /\b(eur|€)(?!\s*per)\b/.test(t);
  const hasGBP = /\b(gbp|£)(?!\s*per)\b/.test(t);
  const hasAUD = /\b(aud)(?!\s*per)\b/.test(t);
  const hasCurrency = hasUSD || hasEUR || hasGBP || hasAUD;

  const numberNearCurrency = /(?:usd|\$|eur|€|gbp|£|aud)\s*\d{3,5}|\d{3,5}\s*(?:usd|eur|gbp|aud|\$|€|£)/i.test(text);

  if (!out.is_doe && !out.salary && hasCurrency && !numberNearCurrency) {
    out.is_doe = true;
    if (!out.salary_currency) {
      if (hasUSD) out.salary_currency = "USD";
      else if (hasEUR) out.salary_currency = "EUR";
      else if (hasGBP) out.salary_currency = "GBP";
      else if (hasAUD) out.salary_currency = "AUD";
    }
  }
}

// Fallback ASAP por texto
function ensureASAP(text, out) {
  const t = text.toLowerCase();
  if (/\basap\b|immediate(ly)?|start\s+immediately/.test(t)) {
    out.is_asap = true;
    out.start_date = "";
  }
}

/** =========================================================
 *  Mejora: inferLanguages robusto (evita falsos positivos)
 *  - Requiere “señal lingüística” cerca (fluent/native/required…)
 *  - Ignora topónimos como “French Polynesia”, “English Harbour”…
 * ========================================================= */

// Señales cercanas que indican idioma
const LANGUAGE_TOKENS = [
  "fluent", "native", "conversational", "bilingual", "speaker", "speaking", "spoken",
  "read", "write", "written", "verbal", "communication", "intermediate", "advanced", "basic",
  "required", "preferred", "a plus", "advantage", "must", "need", "mandatory"
];

// Topónimos que contienen palabras de idiomas pero NO son idiomas
const PLACE_SKIP = [
  /french\s+polynesia/i,
  /french\s+riviera/i,
  /english\s+harbour/i,
  /english\s+channel/i,
  /spanish\s+wells/i,
  /spanish\s+town/i,
  /greek\s+islands?/i,
  /italian\s+riviera/i,
  /turkish\s+riviera/i
];

// Heurística de idiomas
function inferLanguages(text, out) {
  const lower = text.toLowerCase();

  // ¿hay topónimo con la palabra del idioma?
  const inSkipPlace = (langWord) => PLACE_SKIP.some(rx => rx.test(lower)) &&
    new RegExp(`\\b${langWord}\\b`, "i").test(lower);

  // ¿existe alguna señal dentro de ±25 chars del match del idioma?
  function hasSignalNear(langWord) {
    const re = new RegExp(`\\b${langWord}\\b`, "ig");
    let m;
    while ((m = re.exec(text)) !== null) {
      const i = m.index;
      const windowStart = Math.max(0, i - 25);
      const windowEnd = Math.min(text.length, i + langWord.length + 25);
      const window = text.slice(windowStart, windowEnd).toLowerCase();
      if (LANGUAGE_TOKENS.some(tok => window.includes(tok))) return true;
    }
    return false;
  }

  // Fluencia a partir del contexto cercano
  function inferFluency(langWord) {
    const re = new RegExp(`\\b${langWord}\\b`, "ig");
    let m;
    while ((m = re.exec(text)) !== null) {
      const i = m.index;
      const w = text.slice(Math.max(0, i - 25), Math.min(text.length, i + langWord.length + 25)).toLowerCase();
      if (/\bnative\b/.test(w)) return "Native";
      if (/\bfluent\b/.test(w)) return "Fluent";
      if (/\b(conversational|a plus|preferred)\b/.test(w)) return "Conversational";
    }
    return "";
  }

  function setLang(slot, lang, flu) {
    if (slot === 1) {
      if (!out.language_1) out.language_1 = lang;
      if (!out.language_1_fluency && flu) out.language_1_fluency = flu;
    } else {
      if (!out.language_2) out.language_2 = lang;
      if (!out.language_2_fluency && flu) out.language_2_fluency = flu;
    }
  }

  // 1) English: exigir señal y evitar topónimos
  if (!out.language_1 && /\benglish\b/i.test(text) && hasSignalNear("english") && !inSkipPlace("english")) {
    setLang(1, "English", inferFluency("english"));
  }

  // 2) Otros idiomas habituales
  const candidates = ["Italian", "Spanish", "French", "German", "Greek", "Portuguese", "Russian", "Dutch", "Turkish", "Arabic"];
  for (const lang of candidates) {
    const lw = lang.toLowerCase();
    if ((out.language_1 && out.language_2) || !lower.includes(lw)) continue;
    if (inSkipPlace(lw)) continue;      // p.ej., French Polynesia
    if (!hasSignalNear(lw)) continue;      // mención aislada sin señal -> ignorar
    const slot = out.language_1 ? 2 : 1;
    setLang(slot, lang, inferFluency(lw));
  }
}

// Lógica de "fluidez del idioma" basada en el contexto
function updateLanguageFluency(text, out) {
  const t = text.toLowerCase();
  if (out.language_1) {
    const langSpeakingRegex = new RegExp(`\\b${out.language_1.toLowerCase()}\\s*speaking\\b`, "i");
    if (langSpeakingRegex.test(t)) {
      out.language_1_fluency = "Native";
    } else if (out.language_1_fluency === "") {
      out.language_1_fluency = "Fluent";
    }
  }
  if (out.language_2 && out.language_2_fluency === "") {
    out.language_2_fluency = "Conversational";
  }
}

// === NUEVA LÓGICA PARA HOMEPORT ===
function inferHomeport(text, out) {
  const t = text.toLowerCase();
  const re = /\b(based\s+in|home\s+port\s+is|docked\s+in|located\s+in)\s+([a-z\s]+?)\b/;
  const m = t.match(re);
  if (m && m[2]) {
    const potentialCity = m[2].trim();
    if (potentialCity) {
      out.homeport = potentialCity.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
  }
}

// === GENDER helper (solo si el aviso lo exige explícitamente) ===
function inferGender(text) {
  const t = text.toLowerCase();
  if (/\b(female|women|woman)\b/.test(t)) return "Female";
  if (/\b(male|men|man)\b/.test(t)) return "Male";
  return "";
}

// === VISAS helper (B1/B2, Schengen, EU passport) ===
function inferVisas(text) {
  const t = text.toLowerCase();
  const res = [];
  if (/\b(b1\s*\/\s*b2|b1b2|b1\b[^a-z0-9]*b2\b|us\s*visa)\b/.test(t)) res.push("B1/B2");
  if (/\bschengen\b/.test(t)) res.push("Schengen");
  // ⬇️ nuevo: “European passport / EU passport”
  if (/\beuropean\s+passport\b|\beu\s*passport\b/.test(t)) res.push("European Passport");
  return Array.from(new Set(res));
}

// === Itinerary → EU docs helper (Mediterranean only, non-culinary) ===
function itineraryImpliesSchengen(text) {
  const t = text.toLowerCase();

  // matches for "Mediterranean" / "the Med" / "Med" (short form handled via context)
  const medRe = /\b(mediterranean|the\s+med|med)\b/g;
  const culinaryRe = /\b(cuisine|diet|food|menu|restaurant|kitchen|style)\b/;
  const itineraryCueRe =
    /\b(itinerary|itineraries|programmes?|programs?|season|seasons|cruising|cruise|route|schedule|charter|home\s*port|homeport|based\s+in|operat(?:e|es|ing))\b/;

  const matches = [...t.matchAll(medRe)];
  if (matches.length === 0) return false;

  for (const m of matches) {
    const i = m.index ?? 0;
    const window = t.slice(Math.max(0, i - 40), Math.min(t.length, i + m[0].length + 40));
    // discard culinary contexts (e.g., "Mediterranean food")
    if (culinaryRe.test(window)) continue;
    // require itinerary/operations context near the mention
    if (itineraryCueRe.test(window)) return true;
  }
  return false;
}

// === PROPULSION helper ===
function inferPropulsionType(text) {
  const t = text.toLowerCase();

  // Pod Drive (IPS, Azipod, Zeus)
  if (/\b(ips|azipod|zeus\s*pods?|pod\s*drive|pods?|volvo\s*-?\s*penta)\b/.test(t)) return "Pod Drive";

  // Waterjet / Jet
  if (/\b(water\s*jet|waterjet|jet\s*drive)\b/.test(t)) return "Waterjet";

  // Shaft Drive (straight shaft, twin screw)
  if (/\b(shaft\s*drive|straight\s*shaft|twin\s*screws?|twin\s*shaft)\b/.test(t)) return "Shaft Drive";

  // Sail Drive
  if (/\b(sail\s*drive|saildrive)\b/.test(t)) return "Sail Drive";

  // Outboard(s)
  if (/\b(outboards?|o\/b)\b/.test(t)) return "Outboard";

  // Stern Drive / Z-Drive / MerCruiser
  if (/\b(stern\s*drive|sterndrive|z-?drive|mercruiser)\b/.test(t)) return "Stern Drive";

  // Genérico: si menciona "jet" a secas, asumir Waterjet
  if (/\bjets?\b/.test(t)) return "Waterjet";

  return "";
}

// permitir body grande y texto plano
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1mb",
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });

  try {
    // manejo robusto del body
    let text = "";
    if (req.headers["content-type"]?.includes("application/json")) {
      text = req.body?.text || "";
    } else if (typeof req.body === "string") {
      text = req.body;
    }
    if (!text) return res.status(400).json({ error: "Missing job text in { text }" });

    // Pre-procesamiento para ayudar con el rank (sinónimos de Deckhand y rangos compuestos)
    let processedText = text;
    for (const [synonym, normalized] of Object.entries(RANK_SYNONYMS)) {
      const regex = new RegExp(`\\b${synonym}\\b`, "i");
      if (regex.test(processedText)) {
        processedText = processedText.replace(regex, normalized);
      }
    }
    const finalText = processedText;

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10); // YYYY-MM-DD

    const system = `
You are an information extractor for yacht job posts.
Output MUST be STRICT JSON with EXACT keys and value types matching the schema below.
Do not include comments, markdown, or extra text.
    `.trim();

    const schema = {
      work_environment: "Onboard|Shore-based",
      rank: "", // must be one of RANKS
      city: "",
      country: "",
      type: TERMS.join("|"),
      start_date: "YYYY-MM-DD or empty",
      end_date: "",
      salary: "",
      is_doe: "true|false",
      years_in_rank: "",
      description: "",
      contact_email: "",
      contact_phone: "",
      link_facebook: "",
      link_instagram: "",
      link_x: "",
      team: "Yes|No",
      teammate_rank: "",
      teammate_salary: "",
      teammate_salary_currency: "",
      teammate_experience: "",
      flag: "",
      yacht_size: "",
      yacht_type: YACHT_TYPES.join("|"),
      uses: "Private|Charter|Private/Charter|",
      homeport: "",
      liveaboard: "Own Cabin|Share Cabin|No|",
      season_type: "",
      holidays: "",
      is_asap: "true|false",
      language_1: "",
      language_1_fluency: FLU.join("|") + "|",
      language_2: "",
      language_2_fluency: FLU.join("|") + "|",
      salary_currency: CURRENCIES.join("|") + "|",
      gender: "Male|Female|",
      propulsion_type: PROPULSION.join("|") + "|",
      visas: [],
    };

    const rules = `
- TODAY = ${todayStr}.
- If the text contains an explicit day (e.g., "25th of June", "25 June", "June 25"): use THAT day.
  Only default to the 1st if the post mentions a MONTH with NO day.
- If year is missing: choose the next upcoming occurrence relative to TODAY.
- If ASAP/immediate/flexible: is_asap=true and start_date="".
- Salary: capture the numeric amount next to a currency (EUR/€ GBP/£ USD/$ AUD). Ignore numbers referring to leave days/rotation.
  If there is currency mention but NO numeric amount -> is_doe=true, salary=""; set salary_currency accordingly.
- work_environment: "Onboard" if it's for a yacht/boat; "Shore-based" if office/yard/agency.
- rank: map the described role to one of: ${RANKS.join(", ")}. **If multiple roles are mentioned (e.g., "Captain or Engineer"), return the most prominent one or the first one listed.** Prefer the most specific (e.g. "Deck/Steward(ess)", "Chief Officer", "2nd Steward(ess)"). If no rank is found, return "Other". Never leave empty.
- yacht_size: bucket LOA meters into one of ${YACHT_BUCKETS.join(", ")} (or ${CHASE_BUCKETS.join(", ")} if clearly a Chase Boat).
- yacht_type: one of ${YACHT_TYPES.join("|")}.
- uses: map "Private", "Charter" or "Private/Charter" if present.
- propulsion_type: normalize to one of [Shaft Drive, Pod Drive, Waterjet, Sail Drive, Outboard, Stern Drive] when explicitly mentioned (e.g., "IPS/Azipod/Zeus pods" => "Pod Drive"; "waterjet/jet" => "Waterjet"; "stern drive/sterndrive/z-drive" => "Stern Drive"; "twin screw/straight shaft" => "Shaft Drive"). Otherwise "".
- team: "Yes" ONLY if it explicitly mentions a COUPLE/PAIR role; otherwise "No".
- liveaboard: "Share Cabin" if the text says share/sharing cabin; "Own Cabin" if said; "No" for shore-based.
- languages: fill language_1/_2 and *_fluency when explicit (e.g. "English / Fluent").
- years_in_rank: Find the numeric value for "years in rank" or "experience" and convert it to a single number (e.g., "5+ years" -> "5", "2-3 years" -> "2", "proven experience" -> "2.5"). If the term "green" is used, return "Green".
- city and country: infer both if possible. If only a city is stated, include the corresponding country in 'country'.
- homeport: extract the city/port if explicitly stated, for example "homeport: Palma". If not stated, infer it from phrases like "based in".
- gender: ONLY if the text explicitly requires it (e.g., "female only", "male required"). Otherwise, "".
- visas: return an array with any of ["B1/B2","Schengen"] explicitly mentioned (e.g., "B1/B2 required", "valid Schengen"). If none, [].
- description: put ALL extra, non-mapped information here (itinerary, visas, qualifications like AEC/ENG1/STCW, training, career progression, etc.).
  Do not leave essential context out of description.
- contact_email, contact_phone: extract if present; else "".
- Never invent data: leave as "" when not present. Keep booleans strictly true/false (no quotes in JSON).
    `.trim();

    const schemaJson = JSON.stringify(schema, null, 2);

    const prompt = `
Return ONLY a JSON object with EXACTLY these keys and value types (no extra keys):

${schemaJson}

Follow these rules:
${rules}

Helper lists to normalize:
- RANKS: ${RANKS.join(", ")}
- LANGUAGES: ${LANGS.join(", ")}
- FLUENCY: ${FLU.join(", ")}
- CURRENCIES: ${CURRENCIES.join(", ")}

JOB POST:
---
${finalText}
---
    `.trim();

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt }
      ]
    });

    let raw = completion.choices?.[0]?.message?.content?.trim() || "{}";

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      if (start !== -1 && end !== -1 && end > start) {
        const slice = raw.slice(start, end + 1);
        data = JSON.parse(slice);
      } else {
        throw new Error("Model did not return valid JSON.");
      }
    }

    const coerceStr = v => (v == null ? "" : String(v));
    const coerceBool = v => (typeof v === "boolean" ? v : String(v).toLowerCase() === "true");

    const out = {
      work_environment: coerceStr(data.work_environment),
      rank: coerceStr(data.rank),
      city: coerceStr(data.city),
      country: coerceStr(data.country),
      type: coerceStr(data.type),
      start_date: coerceStr(data.start_date),
      end_date: coerceStr(data.end_date),
      salary: coerceStr(data.salary),
      is_doe: coerceBool(data.is_doe),
      years_in_rank: coerceStr(data.years_in_rank),
      description: coerceStr(data.description),
      contact_email: coerceStr(data.contact_email),
      contact_phone: coerceStr(data.contact_phone),
      link_facebook: coerceStr(data.link_facebook),
      link_instagram: coerceStr(data.link_instagram),
      link_x: coerceStr(data.link_x),
      team: coerceStr(data.team || "No"),
      teammate_rank: coerceStr(data.teammate_rank),
      teammate_salary: coerceStr(data.teammate_salary),
      teammate_salary_currency: coerceStr(data.teammate_salary_currency),
      teammate_experience: coerceStr(data.teammate_experience),
      flag: coerceStr(data.flag),
      yacht_size: coerceStr(data.yacht_size),
      yacht_type: coerceStr(data.yacht_type),
      propulsion_type: coerceStr(data.propulsion_type),
      uses: coerceStr(data.uses),
      homeport: coerceStr(data.homeport),
      liveaboard: coerceStr(data.liveaboard),
      season_type: coerceStr(data.season_type),
      holidays: coerceStr(data.holidays),
      is_asap: coerceBool(data.is_asap),
      language_1: coerceStr(data.language_1),
      language_1_fluency: coerceStr(data.language_1_fluency),
      language_2: coerceStr(data.language_2),
      language_2_fluency: coerceStr(data.language_2_fluency),
      salary_currency: coerceStr(data.salary_currency),
      gender: coerceStr(data.gender),
      visas: Array.isArray(data.visas)
  ? data.visas
      .map(v => String(v).toLowerCase())
      .map(v => {
        if (/\bb1\b[^a-z0-9]*\/[^a-z0-9]*\bb2\b|\bb1b2\b/.test(v)) return "B1/B2";
        if (/\bschengen\b/.test(v)) return "Schengen";
        if (/\beu\b[^a-z0-9]*passport|\beuropean\s+passport\b/.test(v)) return "European Passport";
        if (/\bgreen\s*card\b|\bus\s*citizen\b/.test(v)) return "Green card or US Citizen";
        return "";
      })
      .filter(Boolean)
  : [],
    };

    // Coherencia DOE del modelo
    if (out.is_doe) {
      out.salary = "";
      out.salary_currency = out.salary_currency || out.teammate_salary_currency || "";
    }

    // Fallback DOE si hay moneda pero no monto
    ensureDOE(finalText, out);

    // Fallback ASAP por texto (primera pasada)
ensureASAP(finalText, out);

// --- Reconciliación específica para "until <fecha>" ---
// Si hay "until/till/through/thru <fecha>": usarlo como end_date y asumir ASAP para start si no hay pista de inicio.
const untilEnd = tryParseUntilEndDate(finalText, today);
if (untilEnd) {
  if (!out.end_date) out.end_date = untilEnd;

  const startEqualsEnd = !!out.start_date && out.start_date === untilEnd;
  const hasCue = hasStartCue(finalText); // "start/starting/from/join on/commence..."

  if (!hasCue || startEqualsEnd) {
    out.start_date = "";
    out.is_asap = true;
  }
}

// Fallback de fecha si el modelo devolvió 1º del mes o nada y el texto tenía día explícito
if ((!out.start_date || /\-\d{2}\-01$/.test(out.start_date)) && !untilEnd) {
  const parsed = tryParseStartDateFrom(finalText, today);
  if (parsed) {
    out.start_date = parsed;
    out.is_asap = false;
  }
}

// Normalización de país y fallback por ciudad
if (out.country) out.country = normalizeCountryName(out.country);
if (!out.country && out.city) {
  const guess = CITY_TO_COUNTRY[out.city.trim().toLowerCase()];
  if (guess) out.country = guess;
}

    // Nuevo Fallback para "SOF" o "South of France"
    if (!out.country) {
      if (/\b(sof|south of france)\b/i.test(finalText)) {
        out.country = "France";
      }
    }

    // Fallback de season_type si viene vacío
    if (!out.season_type) {
      const st = inferSeasonType(finalText);
      if (st) out.season_type = st;
    }

    // Fallback de years_in_rank si viene vacío
    updateYearsInRank(finalText, out);

    // === RECONCILIACIÓN de yacht_size con LOA explícito en el texto ===
    {
      const metersList = extractAllMeters(finalText);
      if (metersList.length > 0) {
        let chosen = null;
        const isChase = (out.yacht_type === "Chase Boat") || /\bchase\s+boat\b/i.test(finalText);
        if (isChase) {
          // típico: "12m chase boat supporting 55m M/Y" -> para chase usamos el menor
          chosen = Math.min(...metersList);
        } else {
          // yate principal: si hay varios números, usamos el mayor (60m vs 12m de chase, etc.)
          chosen = Math.max(...metersList);
        }
        const bucket = bucketYachtSize(chosen, isChase ? "Chase Boat" : "Motor Yacht");
        if (bucket && out.yacht_size !== bucket) {
          out.yacht_size = bucket; // sobreescribe si el modelo se equivocó (p.ej. >70m en un 60m)
        }
      }
    }

    // Fallback de idiomas si vienen vacíos
    if (!out.language_1 || !out.language_2) {
      inferLanguages(finalText, out);
    }
    // Nueva lógica para la fluidez del idioma si el campo no se pudo llenar
    updateLanguageFluency(finalText, out);

    // === DEFAULT: si no se mencionan idiomas, asumir English / Fluent ===
    if (!out.language_1 && !out.language_2) {
      out.language_1 = "English";
      out.language_1_fluency = "Fluent";
    }

    // Verificación ASAP final (por si algo lo pisó en el flujo)
    ensureASAP(finalText, out);

    // =========================================================
    // LÓGICA DE LIVEABOARD CORREGIDA Y OPTIMIZADA
    // =========================================================
    ;{
  const t = finalText.toLowerCase();

  // 1) "No liveaboard" — manda siempre
  const notLiveaboardRegExp =
    /\b(?:non[-\s]?live\s*aboard|no\s+live\s*aboard|not\s+live\s*aboard|live\s+ashore|shore[-\s]?based|living\s+ashore)\b/;

  if (notLiveaboardRegExp.test(t) || out.work_environment === "Shore-based") {
    out.liveaboard = "No";
  } else if (/\b(?:own|private|single|solo|individual|separate)\b(?:\s+berth)?\s*-?\s*cabins?\b/i.test(finalText)) {
    // 2) Expreso "Own/Private cabin"
    out.liveaboard = "Own Cabin";
  } else if (/\b(?:share(?:s|d)?|sharing)\b(?:\s+(?:a|one|the))?\s+cabins?\b/i.test(finalText)) {
    // 3) Expreso "Share/Sharing cabin"
    out.liveaboard = "Share Cabin";
  } else {
    // 4) Defaults por pareja o rango
    const mentionsCouple =
      /\b(?:couple(?:'s)?|couples?|team\s+of\s+2|pair|couple\s+(?:role|position))\b/i.test(t);
    const isCaptainFamily =
      ["Captain", "Captain/Engineer", "Relief Captain", "Skipper"].includes(out.rank);

    out.liveaboard = (mentionsCouple || isCaptainFamily) ? "Own Cabin" : "Share Cabin";
  }
}
    // =========================================================

    // === NUEVA IMPLEMENTACIÓN DE HOMEPORT ===
    // Solo si el homeport está vacío, usamos la lógica de inferencia
    if (!out.homeport) {
      inferHomeport(finalText, out);
    }
    // ===================================

    // - Si no se menciona nada, asumir "Shaft Drive"
    if (!out.propulsion_type) {
      out.propulsion_type = inferPropulsionType(finalText);
      if (!out.propulsion_type) out.propulsion_type = "Shaft Drive";
    }

// Visas fallback (si el modelo no devolvió nada)
if (!out.visas || out.visas.length === 0) out.visas = inferVisas(finalText);

// --- Gender defaults by rank (only if not specified) ---
if (!out.gender) {
  const femRanks = new Set([
    'Steward(ess)', 'Chief Steward(ess)', '2nd Steward(ess)', '3rd Stewardess',
    'Solo Steward(ess)', 'Junior Steward(ess)', 'Cook/Steward(ess)', 'Stew/Deck',
    'Laundry/Steward(ess)', 'Stew/Masseur', 'Masseur', 'Hairdresser/Barber', 'Nanny'
  ]);
  const maleRanks = new Set([
    'Captain', 'Captain/Engineer', 'Skipper', 'Chase Boat Captain', 'Relief Captain'
  ]);

  if (femRanks.has(out.rank)) {
    out.gender = 'Female';
  } else if (maleRanks.has(out.rank)) {
    out.gender = 'Male';
    } else {
    out.gender = '';
  }
}

// Itinerary-based EU docs (Mediterranean → require Schengen + EU passport)
{
  if (itineraryImpliesSchengen(finalText)) {
    if (!Array.isArray(out.visas)) out.visas = [];
    if (!out.visas.includes('Schengen')) {
      out.visas.push('Schengen');
    }
    if (!out.visas.includes('European Passport')) {
    out.visas.push('European Passport');
    }
  }
}

// --- Visa defaults by country (only if visas not mentioned) ---
{
  const country = (out.country || "").trim();

  // Asegurar array
  if (!Array.isArray(out.visas)) out.visas = [];

  // Si ya tenemos alguna visa detectada, no forzar defaults
  const hasAnyVisa = out.visas.length > 0;

  // Conjunto Schengen (nombres como suelen salir en tu app)
  const SCHENGEN = new Set([
    'Austria','Belgium','Croatia','Czechia','Czech Republic','Denmark','Estonia','Finland',
    'France','Germany','Greece','Hungary','Iceland','Italy','Latvia','Liechtenstein',
    'Lithuania','Luxembourg','Malta','Netherlands','Norway','Poland','Portugal',
    'Slovakia','Slovenia','Spain','Sweden','Switzerland'
  ]);

  if (!hasAnyVisa) {
    if (country === 'United States') {
      // USA
      out.visas = ['B1/B2', 'Green card or US Citizen'];
    } else if (SCHENGEN.has(country)) {
      // Espacio Schengen
      out.visas = ['Schengen', 'European Passport'];
    }
  }
}

    return res.status(200).json(out);
  } catch (err) {
    console.error("parse-job error:", err);
    return res.status(500).json({ error: err.message || "Parse error" });
  }
}