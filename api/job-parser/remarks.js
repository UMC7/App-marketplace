function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeWhitespace(value) {
  return String(value || "")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}

function stripContactsAndCtas(value) {
  return String(value || "")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "")
    .replace(/\+?\d[\d ()\-.]{6,}\d/g, "")
    .replace(/(?:please\s+)?(?:email|contact|reach)\s+(?:me\s+)?(?:at|via|on)?\s*/gi, "")
    .replace(/(please[, ]*)?(send|drop|shoot)\s+(me\s+)?(a\s+)?(message|dm|email|cv|cvs)\b/gi, "")
    .replace(/\bto\s+apply(?:\s+and\s+get\s+more\s+information)?\b/gi, "")
    .trim();
}

function cleanSegment(value) {
  return stripContactsAndCtas(value)
    .replace(/^[•·\-–—\s]+/, "")
    .replace(/^(program|requirements|deck stew|captain|chef|benefits?)\s*:?\s*$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function ensureSentence(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function buildMappedPatterns(out) {
  const patterns = [
    /\b(motor\s*yacht|sailing\s*yacht|catamaran|chase\s*boat|m\/y|s\/y|s\/v|m\/v)\b/i,
    /\b\d{1,3}(?:\.\d+)?\s*(?:m(?:etres?|eters?)?|ft|feet|['\u2019\u2032])\+?\b/i,
    /\b(asap|immediate(?:ly)?)\b/i,
    /\bprivate\/charter\b/i,
    /\bprivate\b/i,
    /\bcharter\b/i,
    /\b(own|private|single|separate|share(?:d)?|sharing)\s+cabin\b/i,
    /\b(live\s*(?:a)?board|shore[-\s]?based|live\s+ashore)\b/i,
    /\b(b1\s*\/\s*b2|b1b2|schengen|green\s*card|eu(?:ropean)?\s*passport|us\s*citizen)\b/i,
    /\b(english|spanish|french|italian|german|greek|portuguese|russian|dutch|turkish|arabic|mandarin|polish|ukrainian)\b/i,
    /\b(flag(?:ged)?|registry|registered|under\s+.*\s+flag)\b/i,
    /\b(start|location|salary|leave|boarding|based\s+in|languages?|use|terms?|season(?:\s+type)?|rank|team|yacht\s+type|yacht\s+size|country|city|contact)\s*[:\-]/i,
  ];

  const fields = [
    out.rank,
    out.teammate_rank,
    out.city,
    out.country,
    out.type,
    out.season_type,
    out.homeport,
    out.salary_currency,
    out.yacht_type,
    out.flag,
    out.work_environment,
  ].filter(Boolean);

  for (const field of fields) {
    patterns.push(new RegExp(`\\b${escapeRegExp(field)}\\b`, "i"));
  }

  return patterns;
}

const EXTRA_HINTS = [
  /\b(13th\s+month|bonus|confirmed|return|come\s+back|opportunity|handover)\b/i,
  /\b(program|itinerary|cruis(?:e|ing)|delivery|crossing|summer|winter|season)\b/i,
  /\b(healthy|focused|support(?:ing)?|assist|manoeuvres?|tender|provisioning|inventory|paperwork)\b/i,
  /\b(cooking|meals|interior|housekeeping|service|guest|crew)\b/i,
  /\b(cabin|private\s+head|shared\s+head|bunk)\b/i,
  /\b(certificate|certification|license|licence|stcw|eng1|aec|yachtmaster|reference)\b/i,
];

function hasExtraHint(value) {
  return EXTRA_HINTS.some((pattern) => pattern.test(value));
}

function pickEmoji(value) {
  if (/\b(13th\s+month|bonus|leave)\b/i.test(value)) return "💶";
  if (/\b(cruis(?:e|ing)|itinerary|summer|winter|season|delivery|crossing)\b/i.test(value)) return "🌍";
  if (/\b(cooking|chef|meals|healthy|provisioning)\b/i.test(value)) return "👨‍🍳";
  if (/\b(cabin|private\s+head|shared\s+head|bunk)\b/i.test(value)) return "🛏️";
  if (/\b(certificate|certification|license|licence|stcw|eng1|aec|yachtmaster|reference)\b/i.test(value)) return "📜";
  if (/\b(confirmed|opportunity|handover|return|support|assist)\b/i.test(value)) return "✨";
  return "📌";
}

function shouldKeepSegment(value, patterns) {
  if (!value) return false;

  const text = value.trim();
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words < 4 || text.length < 20) return false;
  if (/^(program|requirements|benefits?|deck stew|captain|chef)$/i.test(text)) return false;

  const mappedHits = patterns.reduce((count, pattern) => count + (pattern.test(text) ? 1 : 0), 0);
  if (mappedHits >= 2 && !hasExtraHint(text)) return false;

  if (
    /\b(apply|send\s+cv|send\s+cvs|more\s+information|contact\s+us|contact\s+me)\b/i.test(text)
  ) {
    return false;
  }

  return true;
}

function toLengthPair(meters) {
  const wholeMeters = Math.round(meters);
  const feet = Math.round(wholeMeters * 3.28084);
  return `${wholeMeters}m / ${feet}ft`;
}

function extractLengthEntries(text) {
  const src = String(text || "");
  const entries = [];
  const re = /(?:\b(\d{1,3}(?:\.\d+)?)\s*(ft|feet)\+?\b|\b(\d{1,3}(?:\.\d+)?)\s*m(?:etres?|eters?)?\+?\b|\b(\d{1,3}(?:\.\d+)?)\s*['\u2019\u2032]\+?\b)/gi;
  let match;

  while ((match = re.exec(src)) !== null) {
    const raw = match[0].trim();
    let meters = null;

    if (match[2]) {
      meters = parseFloat(match[1]) * 0.3048;
    } else if (match[3]) {
      meters = parseFloat(match[3]);
    } else if (match[4]) {
      meters = parseFloat(match[4]) * 0.3048;
    }

    if (!meters || Number.isNaN(meters) || meters <= 0 || meters > 200) continue;

    const index = match.index || 0;
    const window = src
      .slice(Math.max(0, index - 60), Math.min(src.length, index + raw.length + 60))
      .toLowerCase();

    const isTender = /\b(tender|chase\s*boat|rib\b|dinghy\b|jet\s*tender|support\s*vessel|rescue\s*boat)\b/.test(window);
    const isMain =
      /\b(yacht|s\/y|m\/y|s\/v|m\/v|catamaran|motor\s*yacht|sailing\s*yacht|loa|length)\b/.test(window) ||
      (!isTender && /\bcharter\b/.test(window));

    entries.push({ meters, isTender, isMain });
  }

  const dedupe = new Map();
  for (const entry of entries) {
    const key = `${Math.round(entry.meters)}-${entry.isTender ? "t" : "m"}-${entry.isMain ? "1" : "0"}`;
    if (!dedupe.has(key)) dedupe.set(key, entry);
  }

  return Array.from(dedupe.values());
}

function buildLengthLines(text) {
  const entries = extractLengthEntries(text);
  if (entries.length === 0) return [];

  const mains = entries.filter((entry) => !entry.isTender).sort((a, b) => b.meters - a.meters);
  const tenders = entries.filter((entry) => entry.isTender).sort((a, b) => b.meters - a.meters);
  const lines = [];

  if (mains.length > 0) {
    lines.push(`🛥️ LOA: ${toLengthPair(mains[0].meters)}.`);
  }

  if (tenders.length > 0) {
    const tenderPairs = tenders.slice(0, 2).map((entry) => toLengthPair(entry.meters));
    lines.push(`🚤 Tender: ${tenderPairs.join(" / ")}.`);
  }

  return lines;
}

export function generateRemarks(originalText, out) {
  const full = normalizeWhitespace(originalText);
  const lines = buildLengthLines(originalText);
  if (!full) return lines.join("\n");

  const patterns = buildMappedPatterns(out);
  const segments = full
    .split(/\n+/)
    .flatMap((part) => part.split(/(?<=[.!?])\s+(?=[A-Z0-9])/))
    .map((segment) => cleanSegment(segment))
    .filter(Boolean);

  const extras = [];
  for (const segment of segments) {
    if (!shouldKeepSegment(segment, patterns)) continue;

    const sentence = ensureSentence(segment);
    if (!sentence) continue;

    const line = `${pickEmoji(sentence)} ${sentence}`;
    if (!extras.some((existing) => existing.toLowerCase() === line.toLowerCase())) {
      extras.push(line);
    }
  }

  return [...lines, ...extras.slice(0, Math.max(0, 5 - lines.length))].join("\n");
}
