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
  "3rd Steward(ess)", "4th Steward(ess)", "Solo Steward(ess)", "Junior Steward(ess)", "Cook/Steward(ess)", "Stew/Deck",
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
  "chief steward": "Chief Steward(ess)",
  "chief stewardess": "Chief Steward(ess)",
  "head stew": "Chief Steward(ess)",
  "sole stew": "Solo Steward(ess)",
  "second stew": "2nd Steward(ess)",
  "second steward": "2nd Steward(ess)",
  "second stewardess": "2nd Steward(ess)",
  "2nd stew": "2nd Steward(ess)",
  "2nd steward": "2nd Steward(ess)",
  "2nd stewardess": "2nd Steward(ess)",
  "third stew": "3rd Steward(ess)",
  "third steward": "3rd Steward(ess)",
  "third stewardess": "3rd Steward(ess)",
  "3rd stew": "3rd Steward(ess)",
  "3rd steward": "3rd Steward(ess)",
  "3rd stewardess": "3rd Steward(ess)",
  "junior stew": "Junior Steward(ess)",
  "deck/stew": "Deck/Steward(ess)",
  "deck/steward": "Deck/Steward(ess)",
  "cook/stew": "Cook/Steward(ess)",
  "stew/cook": "Cook/Steward(ess)",
  "deckhand/stew": "Deck/Steward(ess)",
  "Sole Chef": "Solo Chef",
  "Crew Chef/Steward": "Crew Chef/Stew",
  "Crew Chef/Stewardess": "Crew Chef/Stew",
  "steward/deck": "Stew/Deck",
  "stewardess/deck": "Stew/Deck",
  "stew/deckhand": "Stew/Deck",
  "steward/deckhand": "Stew/Deck",
  "stew/chef": "Cook/Steward(ess)",
  "chef/stew": "Cook/Steward(ess)",
  "fourth stew": "4th Steward(ess)",
  "fourth steward": "4th Steward(ess)",
  "fourth stewardess": "4th Steward(ess)",
  "4th steward": "4th Steward(ess)",
  "4th stewardess": "4th Steward(ess)",
  "4th stew": "4th Steward(ess)",
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
  "korea, south": "South Korea",
  "the bahamas": "Bahamas",
  "bahamas": "Bahamas"
};

function normalizeFlagValue(v) {
  const m = {
    "usa": "USA",
    "us": "USA",
    "united states": "USA",
    "american": "USA",
  };
  const k = String(v||"").toLowerCase().trim();
  return m[k] || v;
}

function normalizeCountryName(raw) {
  if (!raw) return "";
  const key = String(raw).trim().toLowerCase().replace(/\./g, "");
  return COUNTRY_SYNONYMS[key] || raw;
}

function appearsInText(phrase, text) {
  if (!phrase) return false;
  const esc = String(phrase).trim()
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\s+/g, "\\s+");
  return new RegExp(`\\b${esc}\\b`, "i").test(String(text || ""));
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

// Extraer LOA en metros o pies (incluye ft, feet y comillas ' ’ ′)
function extractAllMeters(text) {
  const t = text.toLowerCase();
  const res = [];

  // "60m", "55 m"
  const reMeters = /\b(\d{1,3})\s*m\b/g;
  let m;
  while ((m = reMeters.exec(t))) {
    const val = parseInt(m[1], 10);
    if (!isNaN(val)) res.push(val);
  }

  // "200ft", "180 feet", "55'", "55’", "55′"
  const reFeet = /\b(\d{2,3})\s*(?:ft|feet|['\u2019\u2032])(?!\w)/gi;
  while ((m = reFeet.exec(text))) {
    const val = parseInt(m[1], 10);
    if (!isNaN(val)) res.push(Math.round(val * 0.3048)); // ft → m
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

function inferSeasonType(text) {
  const t = text.toLowerCase();

  // Prioridades: explícitos primero
  if (/\byear\s*-?\s*round\b/.test(t)) return "Year-round";
  if (/\bdual\s*-?\s*season\b/.test(t)) return "Dual Season";
  if (/\bsingle\s*-?\s*season\b/.test(t)) return "Single Season";

  // Heurística: rango de meses => Single Season
  const MONTH = "(january|february|march|april|may|june|july|august|september|october|november|december)";
  const SEP = "(?:-|–|—|to|through|till|until|thru)";
  const monthRangeRe = new RegExp(`\\b${MONTH}\\b(?:\\s+\\d{4})?\\s*${SEP}\\s*\\b${MONTH}\\b(?:\\s+\\d{4})?`, "i");

  if (monthRangeRe.test(t)) return "Single Season";

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
  // "Green" solo si no es "green card" y está en contexto laboral/novato
{
  const re = /\bgreen\b/ig;
  let m;
  while ((m = re.exec(text)) !== null) {
    const window = text.slice(Math.max(0, m.index - 25), Math.min(text.length, m.index + 25)).toLowerCase();
    // Evitar "green card", "green-card", "green  card holder", etc.
    if (/\bcard\b/.test(window)) continue;

    // Señales de contexto laboral/novato
    if (/\b(crew|candidate|deckhand|stew|steward|engineer|chef|captain|junior|entry|new\s+to\s+yachting|first\s+season)\b/.test(window)) {
      return "Green";
    }
  }
}

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

// === NUEVA LÓGICA PARA HOMEPORT (corrige "Based in the Bahamas" => no "The") ===
function inferHomeport(text, out) {
  const src = String(text || "");
  const re = /\b(?:based\s+in|home\s*port\s*is|docked\s+in|located\s+in)\s+([A-Za-z][A-Za-z\s\-']{1,60})(?=[\.,;]|$)/i;
  const m = src.match(re);
  if (!m) return;

  let place = m[1].trim().replace(/\s+/g, " ");
  place = place.replace(/^(the)\s+/i, ""); // quita "the " inicial

  const lower = place.toLowerCase();

  // Si parece un país, NO lo tratamos como homeport; solo ayudamos al país si está vacío
  if (lower === "bahamas" || lower === "the bahamas") {
    if (!out.country) out.country = "Bahamas";
    return;
  }

  // Si llega hasta aquí, sí parece ciudad/puerto
  const titled = place.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  out.homeport = titled;
}

function inferHolidays(text) {
  if (!text) return '';
  const t = String(text).replace(/\s+/g, ' ');

  const m = t.match(/(\d{1,3})\s*(\+)?\s*days?\s*(?:of\s+)?(?:leave|holiday|holidays|off)[^.\n]*?(?:p\/?a|per\s*annum|pa|per\s*year|a\s*year)?/i);
  if (m) {
    const num = m[1];
    const plus = m[2] ? '+' : '';
    const hasPA = /p\/?a|per\s*annum|pa|per\s*year|a\s*year/i.test(m[0]);
    return `${num}${plus} days${hasPA ? ' PA' : ''}`;
  }

  const m2 = t.match(/(\d{1,3})\s*(\+)?\s*days?\s*(?:of\s+)?(?:leave|holiday|holidays|off)\b/i);
  if (m2) {
    const num = m2[1];
    const plus = m2[2] ? '+' : '';
    return `${num}${plus} days`;
  }

  return '';
}

// === GENDER helper (solo si el aviso lo exige explícitamente) ===
function inferGender(text) {
  const t = text.toLowerCase();
  if (/\b(female|women|woman)\b/.test(t)) return "Female";
  if (/\b(male|men|man)\b/.test(t)) return "Male";
  return "";
}

// === VISAS helper (B1/B2, Schengen, EU passport, US citizen/Green card) ===
function inferVisas(text) {
  const t = text.toLowerCase();
  const res = [];

  // B1/B2
  if (/\b(b1\s*\/\s*b2|b1b2|b1\b[^a-z0-9]*b2\b|us\s*visa)\b/.test(t)) res.push("B1/B2");

  // Schengen
  if (/\bschengen\b/.test(t)) res.push("Schengen");

  // European / EU passport
  if (/\beuropean\s+passport\b|\beu\s*passport\b/.test(t)) res.push("European Passport");

  // US citizen / Green card holder
  if (/\bgreen\s*card\s*(holder)?\b/.test(t) || /\b(u\.?s\.?|us|usa)\s*(citizen|passport\s*holder)\b/.test(t)) {
    res.push("Green card or US Citizen");
  }

  // "American only" → requiere autorización de trabajo USA (independiente de lo anterior)
  if (/\bamerican\s+only\b/.test(t) || /\b(u\.?s\.?a?|us)\s+citizens?\s+only\b/.test(t)) {
    res.push("Green card or US Citizen");
  }

  return Array.from(new Set(res));
}

function inferFlag(text) {
  const src = String(text || "");
  // quitamos puntos para capturar U.S./U.S.A.
  const t = src.replace(/\./g, "").toLowerCase();

  // 1) Restricciones por nacionalidad (p. ej., "US citizens only due to flag")
  if (/\bamericans?\b[\s\S]{0,12}\bonly\b/.test(t)) return "United States";
  if (/\bus\s*citizens?\b[\s\S]{0,12}\bonly\b/.test(t)) return "United States";

  // 2) US flag en orden "prefix US ... flag"
  if (
    /\bus[-\s]?flag(?:ged)?\b/.test(t) ||
    /\bamerican[-\s]?flag(?:ged)?\b/.test(t) ||
    /\b(?:us|usa|american|united\s+states)\b[\s\-]*flag(?:ged)?\b/.test(t) ||
    /\bunder\s+(?:the\s+)?(?:us|usa|american|united\s+states)\s+flag\b/.test(t)
  ) {
    return "United States";
  }

  // 3) US flag en orden inverso "flag: US"
  const sep = `[:\\-–—]?`; // :, -, –, —
  if (new RegExp(`\\bflag(?:ged)?\\s*${sep}\\s*(?:us|usa|american|united\\s+states)\\b`).test(t)) {
    return "United States";
  }

  // 4) Otros registros frecuentes (ambos órdenes)
  const MAP = [
    { re: /\bcayman(?:\s+islands?)?\b[\s\S]{0,20}\b(flag(?:ged)?|registered|registry)\b|\b(flag(?:ged)?|registered|registry)\b[\s\S]{0,20}\bcayman(?:\s+islands?)?\b/, out: "Cayman Islands" },
    { re: /\bmarshall\s+islands?\b[\s\S]{0,20}\b(flag(?:ged)?|registered|registry)\b|\b(flag(?:ged)?|registered|registry)\b[\s\S]{0,20}\bmarshall\s+islands?\b/, out: "Marshall Islands" },
    { re: /\bbahamas\b[\s\S]{0,20}\b(flag(?:ged)?|registered|registry)\b|\b(flag(?:ged)?|registered|registry)\b[\s\S]{0,20}\bbahamas\b/, out: "Bahamas" },
    { re: /\bbermuda\b[\s\S]{0,20}\b(flag(?:ged)?|registered|registry)\b|\b(flag(?:ged)?|registered|registry)\b[\s\S]{0,20}\bbermuda\b/, out: "Bermuda" },
    { re: /\bgibraltar\b[\s\S]{0,20}\b(flag(?:ged)?|registered|registry)\b|\b(flag(?:ged)?|registered|registry)\b[\s\S]{0,20}\bgibraltar\b/, out: "Gibraltar" },
    { re: /\bisle\s+of\s+man\b[\s\S]{0,20}\b(flag(?:ged)?|registered|registry)\b|\b(flag(?:ged)?|registered|registry)\b[\s\S]{0,20}\bisle\s+of\s+man\b/, out: "Isle of Man" },
    { re: /\bmalta\b[\s\S]{0,20}\b(flag(?:ged)?|registered|registry)\b|\b(flag(?:ged)?|registered|registry)\b[\s\S]{0,20}\bmalta\b/, out: "Malta" },
    { re: /\bjamaica\b[\s\S]{0,20}\b(flag(?:ged)?|registered|registry)\b|\b(flag(?:ged)?|registered|registry)\b[\s\S]{0,20}\bjamaica\b/, out: "Jamaica" },
    { re: /\bpanama\b[\s\S]{0,20}\b(flag(?:ged)?|registered|registry)\b|\b(flag(?:ged)?|registered|registry)\b[\s\S]{0,20}\bpanama\b/, out: "Panama" },
    { re: /\bcook\s+islands?\b[\s\S]{0,20}\b(flag(?:ged)?|registered|registry)\b|\b(flag(?:ged)?|registered|registry)\b[\s\S]{0,20}\bcook\s+islands?\b/, out: "Cook Islands" },
    { re: /\b(bvi|british\s+virgin\s+islands?)\b[\s\S]{0,20}\b(flag(?:ged)?|registered|registry)\b|\b(flag(?:ged)?|registered|registry)\b[\s\S]{0,20}\b(bvi|british\s+virgin\s+islands?)\b/, out: "BVI, UK" },
    { re: /\b(united\s+kingdom|uk|red\s+ensign)\b[\s\S]{0,20}\b(flag(?:ged)?|registered|registry)\b|\b(flag(?:ged)?|registered|registry)\b[\s\S]{0,20}\b(united\s+kingdom|uk|red\s+ensign)\b/, out: "United Kingdom" },
    // orden inverso "flag: Malta" etc.
    { re: /\bflag(?:ged)?\s*[:\-–—]?\s*malta\b/, out: "Malta" },
    { re: /\bflag(?:ged)?\s*[:\-–—]?\s*bahamas\b/, out: "Bahamas" },
    { re: /\bflag(?:ged)?\s*[:\-–—]?\s*cayman(?:\s+islands?)?\b/, out: "Cayman Islands" },
    { re: /\bflag(?:ged)?\s*[:\-–—]?\s*marshall\s+islands?\b/, out: "Marshall Islands" },
    { re: /\bflag(?:ged)?\s*[:\-–—]?\s*panama\b/, out: "Panama" },
    { re: /\bflag(?:ged)?\s*[:\-–—]?\s*(?:uk|united\s+kingdom|red\s+ensign)\b/, out: "United Kingdom" },
  ];
  for (const { re, out } of MAP) {
    if (re.test(t)) return out;
  }

  return "";
}

function detectTeamAndTeammate(text, out) {
  const t = text.toLowerCase();

  const coupleCue =
    /\b(couple|team\s*of\s*2|pair|duo|husband\s+and\s+wife)\b/;

  const join = String.raw`\s*(?:\+|\/|&|and)\s*`;

  const capChef = new RegExp(`\\b(captain)${join}(chef|cook)\\b`, "i");
  const chefCap = new RegExp(`\\b(chef|cook)${join}(captain)\\b`, "i");

  if (coupleCue.test(t) || capChef.test(text) || chefCap.test(text)) {
    out.team = "Yes";

    if (!out.teammate_rank) {
      if (/captain/i.test(out.rank)) {
        out.teammate_rank = "Chef";
      } else if (/(chef|cook)/i.test(out.rank)) {
        out.teammate_rank = "Captain";
      } else if (capChef.test(text)) {
        out.teammate_rank = "Chef";
      }
    }
  }
}

function itineraryImpliesSchengen(text) {
  const t = text.toLowerCase();

  const medRe = /\b(mediterranean|the\s+med|med)\b/g;
  const culinaryRe = /\b(cuisine|diet|food|menu|restaurant|kitchen|style)\b/;
  const itineraryCueRe =
    /\b(itinerary|itineraries|programmes?|programs?|season|seasons|cruising|cruise|route|schedule|charter|home\s*port|homeport|based\s+in|operat(?:e|es|ing))\b/;

  const matches = [...t.matchAll(medRe)];
  if (matches.length === 0) return false;

  for (const m of matches) {
    const i = m.index ?? 0;
    const window = t.slice(Math.max(0, i - 40), Math.min(t.length, i + m[0].length + 40));
    if (culinaryRe.test(window)) continue;
    if (itineraryCueRe.test(window)) return true;
  }
  return false;
}

function detectSalaryPeriod(text){
  const t = String(text || "").toLowerCase();
  if (/\b(per\s*day|a\s*day|daily|\/\s*day)\b/.test(t)) return 'day';
  if (/\b(per\s*week|a\s*week|weekly|\/\s*week|\/\s*wk|wkly|pw)\b/.test(t)) return 'week';
  if (/\b(per\s*hour|an?\s*hour|hourly|\/\s*hour|\/\s*hr)\b/.test(t)) return 'hour';
  if (/\b(per\s*month|a\s*month|monthly|\/\s*month|\/\s*mo)\b/.test(t)) return 'month';
  return '';
}

function inferPropulsionType(text) {
  const t = text.toLowerCase();

  if (/\b(ips|azipod|zeus\s*pods?|pod\s*drive|pods?|volvo\s*-?\s*penta)\b/.test(t)) return "Pod Drive";

  if (/\b(water\s*jet|waterjet|jet\s*drive)\b/.test(t)) return "Waterjet";

  if (/\b(shaft\s*drive|straight\s*shaft|twin\s*screws?|twin\s*shaft)\b/.test(t)) return "Shaft Drive";

  if (/\b(sail\s*drive|saildrive)\b/.test(t)) return "Sail Drive";

  if (/\b(outboards?|o\/b)\b/.test(t)) return "Outboard";

  if (/\b(stern\s*drive|sterndrive|z-?drive|mercruiser)\b/.test(t)) return "Stern Drive";

  if (/\bjets?\b/.test(t)) return "Waterjet";

  return "";
}

function extractExactLengthsByContext(text) {
  const src = String(text || "");
  const matches = [];

  const re = /(?:\b(\d{1,3})\s*(ft|feet)\b|\b(\d{1,3})\s*m\b|\b(\d{1,3})\s*['\u2019\u2032]\b)/gi;

  let m;
  while ((m = re.exec(src)) !== null) {
    let fullTxt = m[0];
    let meters = null;
    if (m[2]) {
      meters = parseInt(m[1], 10) * 0.3048;
    } else if (m[3]) {
      meters = parseInt(m[3], 10);
    } else if (m[4]) {
      meters = parseInt(m[4], 10) * 0.3048;
    }

    const i = m.index;
    const window = src.slice(Math.max(0, i - 60), Math.min(src.length, i + fullTxt.length + 60)).toLowerCase();

    const isTender =
      /\b(tender|chase\s*boat|chase\b|rib\b|dinghy\b|jet\s*tender|support\s*vessel|rescue\s*boat)\b/.test(window);

    const isMain =
      /\b(yacht|s\/y|m\/y|s\/v|m\/v|catamaran|sail\s*boat|sailboat|motor\s*yacht|sailing\s*yacht|loa|length\b)/.test(window) ||
      (!isTender && /\bcharter\b/.test(window));

    matches.push({ text: fullTxt.trim(), meters: meters ?? 0, isTender, isMain });
  }

  const main = [];
  const tenders = [];
  const seen = new Set();

  for (const it of matches) {
    if (it.meters <= 0 || it.meters > 150) continue;

    const key = `${it.text.toLowerCase()}|${it.isTender?'t':'m'}`;
    if (seen.has(key)) continue;
    seen.add(key);

    if (it.isTender) tenders.push(it);
    else if (it.isMain) main.push(it);
    else {
      if (it.meters >= 12) main.push(it);
      else tenders.push(it);
    }
  }

  let mainBest = null;
  if (main.length > 0) {
    mainBest = main.reduce((a, b) => (a.meters >= b.meters ? a : b));
  }

  const tenderList = tenders
    .sort((a, b) => b.meters - a.meters)
    .map(x => x.text);

  return {
    mainText: mainBest ? mainBest.text : "",
    tenderTexts: Array.from(new Set(tenderList)),
  };
}

function appendLoaRemarks(originalText, currentDesc, out) {
  const desc = String(currentDesc || "").trim();
  const { mainText, tenderTexts } = extractExactLengthsByContext(originalText);

  const lines = [];

  const hasLine = (line) => desc.toLowerCase().includes(line.toLowerCase());

  if (mainText) {
    const line = `Main vessel LOA: ${mainText}.`;
    if (!hasLine(line)) lines.push(line);
  }

  if (tenderTexts.length > 0) {
    const tenderLine = `Tender: ${tenderTexts.join(" / ")}.`;
    if (!hasLine(tenderLine)) lines.push(tenderLine);
  }

  if (lines.length === 0) return desc;

  return desc
    ? `${desc}\n\n${lines.join("\n")}`
    : lines.join("\n");
}

function appendUnmappedCues(originalText, currentDesc, out) {
  const desc = String(currentDesc || "").trim();
  const t = String(originalText || "").replace(/\s+/g, " ");

  const lines = [];

  // Itinerary: acepta "Mediterranean/Med" y "Caribbean/Carib", con (summer)/(winter) si aparecen
  const hasMed = /\b(mediterranean|the\s+med|med)\b/i.test(t);
  const hasCarib = /\b(caribbean|carib)\b/i.test(t);
  if (hasMed && hasCarib) {
    const summer = /summer/i.test(t) ? " (summer)" : "";
    const winter = /winter/i.test(t) ? " (winter)" : "";
    lines.push(`Itinerary: Mediterranean${summer} → Caribbean${winter}.`);
  }

  // Owner usage: "~8 months/year onboard"
  const owner = t.match(/owner[^.\n]*?(\d{1,2})\s*(?:months?|mos?)\s*(?:of\s+the\s+year)?[^.\n]*?(?:on\s*board|onboard)/i);
  if (owner) lines.push(`Owner usage: ~${owner[1]} months/year onboard.`);

  // Crew: "Total of 8 crew (mixed nationality)"
  const crew = t.match(/(?:total\s+of\s+)?(\d{1,2})\s+crew\b/i);
  if (crew) {
    const mixed = /mixed\s+nationalit/i.test(t) ? " (mixed nationality)" : "";
    lines.push(`Crew: ${crew[1]}${mixed}.`);
  }

  // Policy: non-smoking
  if (/non[-\s]?smoking/i.test(t)) lines.push("Policy: Non-smoking vessel.");

  // Cuisine: Mediterranean
  if (/mediterranean\s+cuisine/i.test(t)) lines.push("Cuisine: Mediterranean cuisine.");

  // Contract: MLC SEA
  if (/mlc\s*sea/i.test(t)) lines.push("Contract: Standard MLC SEA.");

  // --- Filtro: jamás repetir en Remarks lo que ya llenó campos del form ---
  const blockers = [
    out.holidays,                                 // leave
    out.flag,                                     // flag
    out.start_date || (out.is_asap ? "ASAP" : ""),// start
    out.salary,                                   // salary
    out.is_doe ? "DOE" : "",                      // DOE
    out.uses,                                     // Private/Charter
    out.yacht_size                                // LOA bucket
  ]
  .filter(Boolean)
  .map(s => String(s).toLowerCase());

  const filtered = lines.filter(line => {
    const L = line.toLowerCase();
    // Nunca incluir encabezados prohibidos
    if (/^language:/i.test(line)) return false;
    if (/^salary:/i.test(line)) return false;
    // Si la línea contiene un token ya usado en un campo, fuera
    return !blockers.some(tok => tok && L.includes(String(tok).toLowerCase()));
  });

  if (!filtered.length) return desc || "";
  const joiner = desc ? "\n\n" : "";
  return desc + joiner + filtered.join("\n");
}

function stripRoleTeamRedundancy(desc, out) {
  if (!desc) return "";
  let s = String(desc);

  const roles = [out.rank, out.teammate_rank]
    .filter(Boolean)
    .map(r => r.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const roleAlt = roles.length ? `(?:${roles.join("|")})` : null;

  const coupleAlt = "(?:couple|team\\s*of\\s*2|pair|duo|husband\\s+and\\s+wife)";
  const join = String.raw`\s*(?:\+|\/|&|and)\s*`;

  const capChef = new RegExp(`\\bCaptain${join}(?:Chef|Cook)\\b`, "i");
  const chefCap = new RegExp(`\\b(?:Chef|Cook)${join}Captain\\b`, "i");

  const opener = /\b(looking\s+for|seeking|hiring|need(?:ed|ing)?|searching\s+for|require(?:s|d)?)\b/i;

  s = s
    .split(/\r?\n/)
    .map((line) => {
      const L = line.trim();
      if (!L) return "";

      const hasOpener = opener.test(L);
      const hasCouple =
        /captain\s*(?:\+|\/|&|and)\s*(?:chef|cook)/i.test(L) ||
        /(chef|cook)\s*(?:\+|\/|&|and)\s*captain/i.test(L) ||
        new RegExp(`\\b${coupleAlt}\\b`, "i").test(L);

      const hasExplicitRole = roleAlt ? new RegExp(`\\b${roleAlt}\\b`, "i").test(L) : false;

      if (hasOpener && (hasCouple || hasExplicitRole)) return "";
      if (!hasOpener && (hasCouple || (hasExplicitRole && L.length <= 80))) return "";

      return line;
    })
    .join("\n");

  s = s.replace(capChef, "").replace(chefCap, "");
  return s.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1mb",
    },
  },
};

function cleanDescriptionContacts(desc, out) {
  if (!desc) return "";

  let s = String(desc);

  if (out.contact_email) {
    const esc = out.contact_email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    s = s.replace(new RegExp(esc, "gi"), "");
  }
  s = s.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "");

  const digits = (x) => String(x || "").replace(/\D/g, "");
  const phoneOut = digits(out.contact_phone);
  if (phoneOut) {

    const compactRe = new RegExp(phoneOut.split("").join("\\D*"), "g");
    s = s.replace(compactRe, "");
  }
  s = s.replace(/\+?\d[\d ()\-\.]{6,}\d/g, "");

  const ctaRe =
    /(please[, ]*)?(send|drop|shoot)\s+(me\s+)?(a\s+)?(message|dm|email)\b|(?:please\s+)?(?:email|contact|reach)\s+(me\s+)?(?:at|via|on)?/i;

  s = s
    .split(/\r?\n/)
    .map((line) => (ctaRe.test(line) ? "" : line))
    .join("\n");

  s = s.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

  return s;
}

function escapeReg(s){ return String(s||"").replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
const WB = { before: '(?:^|[^A-Za-z0-9_])', after: '(?=$|[^A-Za-z0-9_])' };

function buildRankRegex(rank){
  if(!rank) return null;
  const rankLc = String(rank).toLowerCase();
  const alts = [rank];
  for (const [syn, norm] of Object.entries(RANK_SYNONYMS)) {
    if (String(norm).toLowerCase() === rankLc) alts.push(syn);
  }
  const alt = alts
    .map(a => escapeReg(a).replace(/Steward\\\(ess\\\)/i, 'Steward\\(ess\\)'))
    .join('|');
  return new RegExp(`${WB.before}(?:${alt})${WB.after}`, 'ig');
}

function dedupeRemarksAgainstFields(originalText, desc, out) {
  if (!desc) return "";
  let s = String(desc);

  const rxRank = buildRankRegex(out.rank);

  if (rxRank) s = s.replace(rxRank, '');

  const TYPE_PATTERNS = {
    'Catamaran': [/\bcatamarans?\b/gi],
    'Motor Yacht': [/\bmotor\s*yachts?\b/gi, /\bm\/y\b/gi],
    'Sailing Yacht': [/\bsailing\s*yachts?\b/gi, /\bs\/y\b/gi, /\bsail\s*boats?\b/gi, /\bsailboats?\b/gi],
    'Chase Boat': [/\bchase\s*boats?\b/gi]
  };
  if (out.yacht_type && TYPE_PATTERNS[out.yacht_type]) {
    for (const rx of TYPE_PATTERNS[out.yacht_type]) s = s.replace(rx, '');
  }

  const LIVE = {
    'Own Cabin': [/\b(single|own|private|separate)\s+cabin\b/gi],
    'Share Cabin': [/\b(share(?:d)?|sharing)\s+cabin\b/gi],
    'No': [/\b(no\s+live\s*aboard|live\s*ashore)\b/gi],
  };
  if (out.liveaboard && LIVE[out.liveaboard]) {
    for (const rx of LIVE[out.liveaboard]) s = s.replace(rx, '');
  }

  if (/Main vessel LOA:/i.test(s)) {
    s = s.split(/\r?\n/).map(line => {
      if (/^\s*(Main vessel LOA:|Tender:)/i.test(line)) return line; // conservar
      return line
        .replace(/\b\d{1,3}\s*m\b/gi, '')
        .replace(/\b\d{2,3}\s*(?:ft|feet|['\u2019\u2032])\b/gi, '');
    }).join('\n');
  }

  {
    const period = detectSalaryPeriod(originalText);
    if (out.is_doe || out.salary || out.salary_currency) {
      const removeSalaryText = (period === 'month' || period === '');
      if (removeSalaryText) {
        s = s
          .replace(/\b(?:€|eur|\$|usd|£|gbp|aud)\s*\d[\d,\.]*(?:\s*(?:per|\/)\s*(?:day|week|month|mo|wk|hour|hr))?/gi, '')
          .replace(/\b\d[\d,\.]*\s*(?:€|eur|usd|\$|£|gbp|aud)\s*(?:per|\/)?\s*(?:day|week|month|mo|wk|hour|hr)?/gi, '');
      }
    }
  }

  // 7) “based in <city>” / “<city> based” si ya tenemos city
  if (out.city) {
    const c = escapeReg(out.city);
    s = s
      .replace(new RegExp(`${WB.before}based\\s+in\\s+${c}${WB.after}`, 'ig'), '')
      .replace(new RegExp(`${WB.before}${c}\\s+based(?:\\s+only)?${WB.after}`, 'ig'), '');
  }

  // 8) Limpieza final
  s = s
    .replace(/[ \t]+/g, ' ')
    .replace(/ ?([.,;:]) ?/g, '$1 ')
    .replace(/\s{2,}/g, ' ')
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean)
    .join('\n');

  return s.trim();
}

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

    // Pre-procesamiento para ayudar con el rank (compuestos primero)
let processedText = text;

// 0) Combos que deben ganar a palabras sueltas
const COMBOS = [
  [/\bstew\s*[/&+]\s*chef\b/i, 'Cook/Steward(ess)'],
  [/\bchef\s*[/&+]\s*stew\b/i, 'Cook/Steward(ess)'],
  [/\bdeck\s*[/&+]\s*stew(?:ard(?:ess)?)?\b/i, 'Deck/Steward(ess)'],
  [/\bstew(?:ard(?:ess)?)?\s*[/&+]\s*deck(?:hand)?\b/i, 'Stew/Deck'],
];
for (const [rx, norm] of COMBOS) processedText = processedText.replace(rx, norm);

// 1) Luego sinónimos, priorizando los largos (para que “stew/chef” gane a “stew”)
const entries = Object.entries(RANK_SYNONYMS).sort((a, b) => b[0].length - a[0].length);
for (const [synonym, normalized] of entries) {
  const safe = synonym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rx = new RegExp(`\\b${safe}\\b`, 'ig');
  processedText = processedText.replace(rx, normalized);
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

    if (out.is_doe) {
      out.salary = "";
      out.salary_currency = out.salary_currency || out.teammate_salary_currency || "";
    }

    ensureDOE(finalText, out);

ensureASAP(finalText, out);

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

if ((!out.start_date || /\-\d{2}\-01$/.test(out.start_date)) && !untilEnd) {
  const parsed = tryParseStartDateFrom(finalText, today);
  if (parsed) {
    out.start_date = parsed;
    out.is_asap = false;
  }
}

if (out.country) out.country = normalizeCountryName(out.country);
if (!out.country && out.city) {
  const guess = CITY_TO_COUNTRY[out.city.trim().toLowerCase()];
  if (guess) out.country = guess;
}

if (out.city) {
  const cityLC = out.city.trim().toLowerCase();
  const countryLC = (out.country || "").trim().toLowerCase();
  if (countryLC && (cityLC === countryLC || cityLC === `the ${countryLC}`)) {
    out.city = "";
  } else if (!appearsInText(out.city, finalText)) {
    out.city = "";
  }
}

    if (!out.country) {
      if (/\b(sof|south of france)\b/i.test(finalText)) {
        out.country = "France";
      }
    }

    if (!out.season_type) {
      const st = inferSeasonType(finalText);
      if (st) out.season_type = st;
    }

    updateYearsInRank(finalText, out);

    {
  const metersList = extractAllMeters(finalText);
  if (metersList.length > 0) {
    let chosen = null;
    const isChase = (out.yacht_type === "Chase Boat") || /\bchase\s+boat\b/i.test(finalText);

    if (isChase) {
      chosen = Math.min(...metersList);
    } else {
      chosen = Math.max(...metersList);
    }

    const bucket = bucketYachtSize(chosen, isChase ? "Chase Boat" : "Motor Yacht");
    if (bucket && out.yacht_size !== bucket) {
      out.yacht_size = bucket;
    }
  }
}

    if (!out.language_1 || !out.language_2) {
      inferLanguages(finalText, out);
    }
    updateLanguageFluency(finalText, out);

    if (!out.language_1 && !out.language_2) {
      out.language_1 = "English";
      out.language_1_fluency = "Fluent";
    }

    ensureASAP(finalText, out);

    ;{
  const t = finalText.toLowerCase();

  const notLiveaboardRegExp =
    /\b(?:non[-\s]?live\s*aboard|no\s+live\s*aboard|not\s+live\s*aboard|live\s+ashore|shore[-\s]?based|living\s+ashore)\b/;

  if (notLiveaboardRegExp.test(t) || out.work_environment === "Shore-based") {
    out.liveaboard = "No";
  } else if (/\b(?:own|private|single|solo|individual|separate)\b(?:\s+berth)?\s*-?\s*cabins?\b/i.test(finalText)) {
    out.liveaboard = "Own Cabin";
  } else if (/\b(?:share(?:s|d)?|sharing)\b(?:\s+(?:a|one|the))?\s+cabins?\b/i.test(finalText)) {
    out.liveaboard = "Share Cabin";
  } else {
    const mentionsCouple =
      /\b(?:couple(?:'s)?|couples?|team\s+of\s+2|pair|couple\s+(?:role|position))\b/i.test(t);
    const isCaptainFamily =
      ["Captain", "Captain/Engineer", "Relief Captain", "Skipper"].includes(out.rank);

    out.liveaboard = (mentionsCouple || isCaptainFamily) ? "Own Cabin" : "Share Cabin";
  }
}

    if (!out.homeport) {
      inferHomeport(finalText, out);
    }

if (out.homeport) {
  const hp = out.homeport.trim();
  const hpLC = hp.toLowerCase();
  const countryLC = (out.country || "").trim().toLowerCase();
  const hpIsCountry =
    hpLC === countryLC ||
    hpLC === `the ${countryLC}` ||
    (COUNTRY_SYNONYMS[hpLC] && COUNTRY_SYNONYMS[hpLC].toLowerCase() === countryLC);

  if (hpIsCountry || !appearsInText(hp, finalText)) {
    out.homeport = "";
  }
}

    if (!out.propulsion_type) {
      out.propulsion_type = inferPropulsionType(finalText);
      if (!out.propulsion_type) out.propulsion_type = "Shaft Drive";
    }

if (!out.visas || out.visas.length === 0) out.visas = inferVisas(finalText);

detectTeamAndTeammate(finalText, out);

if (!out.gender) {
  const femRanks = new Set([
    'Deck/Steward(ess)', 'Steward(ess)', 'Chief Steward(ess)', '2nd Steward(ess)', '3rd Steward(ess)',
    '4th Steward(ess)', 'Solo Steward(ess)', 'Junior Steward(ess)', 'Cook/Steward(ess)', 'Stew/Deck',
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

{
  const country = (out.country || "").trim();

  if (!Array.isArray(out.visas)) out.visas = [];

  const hasAnyVisa = out.visas.length > 0;

  const SCHENGEN = new Set([
    'Austria','Belgium','Croatia','Czechia','Czech Republic','Denmark','Estonia','Finland',
    'France','Germany','Greece','Hungary','Iceland','Italy','Latvia','Liechtenstein',
    'Lithuania','Luxembourg','Malta','Netherlands','Norway','Poland','Portugal',
    'Slovakia','Slovenia','Spain','Sweden','Switzerland'
  ]);

  if (!hasAnyVisa) {
    if (country === 'United States') {
      out.visas = ['B1/B2', 'Green card or US Citizen'];
    } else if (SCHENGEN.has(country)) {
      out.visas = ['Schengen', 'European Passport'];
    }
  }
}

if (!out.start_date) {
  out.is_asap = true;
}

out.flag = normalizeFlagValue(out.flag);
if (!out.flag) {
  const f = inferFlag(finalText);
  if (f) out.flag = normalizeFlagValue(f);
}

if (!out.holidays || !out.holidays.trim()) {
  const h = inferHolidays(finalText);
  if (h) out.holidays = h;
}

out.description = stripRoleTeamRedundancy(out.description, out);
out.description = cleanDescriptionContacts(out.description || "", out);
out.description = appendUnmappedCues(finalText, out.description, out);
out.description = appendLoaRemarks(finalText, out.description, out);
out.description = dedupeRemarksAgainstFields(finalText, out.description, out);

return res.status(200).json(out);

  } catch (err) {
    console.error("parse-job error:", err);
    return res.status(500).json({ error: err.message || "Parse error" });
  }
}