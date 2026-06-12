const EMOJI = {
  loa: "\u{1F6E5}\uFE0F",
  tender: "\u{1F6A4}",
  money: "\u{1F4B6}",
  travel: "\u{1F30D}",
  chef: "\u{1F468}\u200D\u{1F373}",
  bed: "\u{1F6CF}\uFE0F",
  cert: "\u{1F4DC}",
  sparkles: "\u2728",
  pin: "\u{1F4CC}",
};

function normalizeWhitespace(value) {
  return String(value || "")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}

function cleanupSentence(value) {
  return String(value || "")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "")
    .replace(/\+?\d[\d ()\-.]{6,}\d/g, "")
    .replace(/(?:please\s+)?(?:email|contact|reach)\s+(?:me\s+)?(?:at|via|on)?\s*/gi, "")
    .replace(/(please[, ]*)?(send|drop|shoot)\s+(me\s+)?(a\s+)?(message|dm|email|cv|cvs)\b/gi, "")
    .replace(/\bto\s+apply(?:\s+and\s+get\s+more\s+information)?\b/gi, "")
    .replace(/^[•·\-–—\s]+/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function ensureSentence(value) {
  const text = cleanupSentence(value);
  if (!text) return "";
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function pushUnique(lines, emoji, text) {
  const sentence = ensureSentence(text);
  if (!sentence) return;
  const line = `${emoji} ${sentence}`;
  if (!lines.some((existing) => existing.toLowerCase() === line.toLowerCase())) {
    lines.push(line);
  }
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
      .slice(Math.max(0, index - 60), Math.min(src.length, index + match[0].length + 60))
      .toLowerCase();

    const isTender = /\b(tender|chase\s*boat|rib\b|dinghy\b|jet\s*tender|support\s*vessel|rescue\s*boat)\b/.test(window);
    entries.push({ meters, isTender });
  }

  const dedupe = new Map();
  for (const entry of entries) {
    const key = `${Math.round(entry.meters)}-${entry.isTender ? "t" : "m"}`;
    if (!dedupe.has(key)) dedupe.set(key, entry);
  }
  return Array.from(dedupe.values());
}

function buildLengthLines(text) {
  const entries = extractLengthEntries(text);
  if (entries.length === 0) return [];

  const lines = [];
  const mains = entries.filter((entry) => !entry.isTender).sort((a, b) => b.meters - a.meters);
  const tenders = entries.filter((entry) => entry.isTender).sort((a, b) => b.meters - a.meters);

  if (mains.length > 0) {
    lines.push(`${EMOJI.loa} LOA: ${toLengthPair(mains[0].meters)}.`);
  }

  if (tenders.length > 0) {
    const tenderPairs = tenders.slice(0, 2).map((entry) => toLengthPair(entry.meters));
    lines.push(`${EMOJI.tender} Tender: ${tenderPairs.join(" / ")}.`);
  }

  return lines;
}

function collectSentenceMatches(text, regex) {
  const src = normalizeWhitespace(text);
  const parts = src
    .split(/\n+/)
    .flatMap((segment) => segment.split(/(?<=[.!?])\s+(?=[A-Z0-9])/))
    .map((segment) => cleanupSentence(segment))
    .filter(Boolean);

  return parts.filter((segment) => regex.test(segment));
}

function buildTargetedExtraLines(text) {
  const lines = [];
  const src = normalizeWhitespace(text);

  if (/\b13th\s+month\b/i.test(src)) {
    pushUnique(lines, EMOJI.money, "13th month bonus offered");
  }

  if (/\bcharters?\s+already\s+confirmed\b/i.test(src)) {
    pushUnique(lines, EMOJI.sparkles, "Charters already confirmed");
  }

  collectSentenceMatches(src, /\bcruis(?:e|ing)|itinerary|delivery|crossing\b/i)
    .slice(0, 2)
    .forEach((sentence) => pushUnique(lines, EMOJI.travel, sentence));

  collectSentenceMatches(src, /\bhealthy|focused|support(?:ing)?\s+the\s+head\s+chef|cooking|provisioning\b/i)
    .slice(0, 2)
    .forEach((sentence) => pushUnique(lines, EMOJI.chef, sentence));

  collectSentenceMatches(src, /\bcabin|private\s+head|shared\s+head|bunk\b/i)
    .slice(0, 2)
    .forEach((sentence) => pushUnique(lines, EMOJI.bed, sentence));

  collectSentenceMatches(src, /\bcertificate|certification|licen[cs]e|stcw|eng1|aec|yachtmaster|reference\b/i)
    .slice(0, 2)
    .forEach((sentence) => pushUnique(lines, EMOJI.cert, sentence));

  return lines;
}

function buildFallbackLines(text, out) {
  const src = normalizeWhitespace(text);
  const excludedBits = [
    out.rank,
    out.teammate_rank,
    out.city,
    out.country,
    out.yacht_type,
    out.type,
    out.season_type,
    out.salary_currency,
    out.contact_email,
    out.contact_phone,
  ].filter(Boolean).map((value) => String(value).toLowerCase());

  const parts = src
    .split(/\n+/)
    .flatMap((segment) => segment.split(/(?<=[.!?])\s+(?=[A-Z0-9])/))
    .map((segment) => cleanupSentence(segment))
    .filter(Boolean);

  const lines = [];
  for (const part of parts) {
    const lower = part.toLowerCase();
    if (
      /\b(apply|send\s+cv|send\s+cvs|salary|location|start:|start\s|country|contact|email|phone|private\/charter|m\/y|s\/y)\b/i.test(part)
    ) {
      continue;
    }
    if (excludedBits.some((bit) => bit && lower.includes(bit))) continue;
    if (part.split(/\s+/).length < 5) continue;
    pushUnique(lines, EMOJI.pin, part);
    if (lines.length >= 2) break;
  }
  return lines;
}

export function generateRemarks(originalText, out) {
  const baseLines = buildLengthLines(originalText);
  const targeted = buildTargetedExtraLines(originalText);
  const fallback = targeted.length === 0 ? buildFallbackLines(originalText, out) : [];
  return [...baseLines, ...targeted, ...fallback].slice(0, 5).join("\n");
}
