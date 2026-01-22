// src/components/cv/candidate/sectionscomponents/documents/documentssectioncontroller/docmanager/docExtraction.js
const BIRTH_RX =
  /\b(dob|date\s*of\s*birth|born|birth|fecha\s*de\s*nacimiento|nacido|nacimiento)\b/i;
export function extractMetadataFromText(text, opts = {}) {
  // Normaliza retornos y NBSP para facilitar los regex
  const safeText = String(text || "")
    .replace(/\r/g, "\n")
    .replace(/\u00A0/g, " ");
  const lines = splitMeaningfulLines(safeText);
  const titleGuess = selectTitleCandidate(lines, safeText, opts.filename);
  const normalized = normalizeTitleToEnglish(titleGuess, safeText);
  const {
    issuedOn,
    expiresOn,
    confidence: confDates,
    notes: dateNotes,
  } = parseDatesFromText(safeText);
  const confidence = {
    title: normalized.changed ? 0.85 : titleGuess ? 0.7 : 0.3,
    issuedOn: confDates.issuedOn,
    expiresOn: confDates.expiresOn,
  };
  const notes = [];
  if (normalized.note) notes.push(normalized.note);
  if (dateNotes && dateNotes.length) notes.push(...dateNotes);
  const payload = {
    title: normalized.value || titleGuess || "Untitled document",
    originalTitle: normalized.changed ? titleGuess : undefined,
    issuedOn,
    expiresOn,
    confidence,
  };
  if (notes.length) payload.notes = notes;
  return payload;
}
/* ----------------------------- TITLE ----------------------------- */
/**
 * 1) Si hay un patrón OMI/IMO 3.xx + nombre de curso, úsalo.
 * 2) Si hay nombres de cursos STCW conocidos, úsalo.
 * 3) Si no, scoring sobre líneas/segmentos del encabezado (robusto a OCR).
 *    Prioriza CoC/Master Unlimited por encima de cursos como SSO.
 */
function selectTitleCandidate(lines, fullText, filename) {
  // --- Paso 1: OMI/IMO ---
  const fromOMI = pickOMITitle(fullText);
  if (fromOMI) return cleanHeader(fromOMI);
  // --- Paso 2: catálogo de cursos (ES/EN) ---
  const fromCatalog = pickCatalogCourse(fullText);
  if (fromCatalog) return cleanHeader(fromCatalog);
  // --- Paso 3: heurística por líneas/segmentos ---
  const top = (lines || []).slice(0, 60);
  const FORBID_RX =
    /\b(expires?|expiry|valid\s*until|issued|issue\s*date|fecha\s*de\s*emisi[oó]n|vencim|v[ée]nce|dob|date\s*of\s*birth|certificate\s*holder|has\s*been\s*approved|this\s*certificate|valid\s*for|recognized\s*by|conformidad|anexo|cap[ií]tulo|c[oó]digo|convenci[oó]n|mar[ií]timo|regla\s*v\/?i|secci[oó]n|cuadro|parr[aá]fos?)\b/i;
  // Alta prioridad a CoC / Master Unlimited
  const PRIORITY_RX = [
    /\b(certificate\s+of\s+competenc(y|ies)|certificado\s+de\s+competencia|co\/?c)\b/i,
    /\b(master\s+unlimited|master\s+mariner|class\s*1.*master)\b/i,
  ];
  const STRONG_RX = [
    /\b(master\s*of\s*yachts?|yacht\s*master|yachtmaster|patr[oó]n\s*de\s*yate)\b/i,
    /\bstcw\b/i,
    /\beng1\b/i,
    /\bproficiency\s+in\s+survival\s+craft\b/i,
    /\bcrowd\s+management\b/i,
    /\bsecurity\s+awareness\b/i,
    /\bship\s+security\s+officer\b/i,
    /\bsso\b/i,
    /\bomi|imo\b\s*\d+\.\d+/i, // “OMI 3.19”, “IMO 3.26”
  ];
  const TON_RX = /(\b(200|500|3000)\b|\b\d{2,4}\s*(?:gt|tons?|tm)\b)/i;
  // Construye candidatos: divide por separadores para evitar “párrafos pegados”
  const candidates = [];
  for (const raw of top) {
    if (!raw) continue;
    String(raw)
      .split(/[|•·•∙·•/\\—–\-]{1,}/) // corta segmentos “bonitos”
      .map((s) => s && s.trim())
      .filter(Boolean)
      .forEach((seg) => candidates.push(seg));
  }
  let best = "";
  let bestScore = -Infinity;
  const hasCoCInDoc = /\b(certificate\s+of\s+competenc|certificado\s+de\s+competencia|co\/?c)\b/i.test(
    fullText || ""
  );
  for (const s0 of candidates) {
    const s = String(s0 || "").trim();
    if (!s) continue;
    let score = 0;
    // Descartes / penalizaciones
    if (s.length > 120) score -= 6;
    if (FORBID_RX.test(s)) score -= 8;
    if (isMostlyDateLike(s)) score -= 6;
    if (commaDensity(s) > 0.12) score -= 3; // párrafos
    // Prioridad CoC/Master Unlimited
    for (const rx of PRIORITY_RX) if (rx.test(s)) score += 15;
    // Señales fuertes
    for (const rx of STRONG_RX) if (rx.test(s)) score += 9;
    // Si es SSO y en el documento existe CoC, baja un poco la puntuación
    if (/\b(ship\s+security\s+officer|sso)\b/i.test(s) && hasCoCInDoc) score -= 4;
    // Tonnage / nivel
    if (TON_RX.test(s)) score += 3;
    // “Certificate” ayuda un poco, pero no decide
    if (/\bcertificate\b/i.test(s)) score += 1;
    // CAPS razonables suelen ser encabezados
    const upperRatio = uppercaseRatio(s);
    if (upperRatio > 0.55 && s.length <= 90) score += 1;
    // Longitud razonable
    if (s.length >= 8 && s.length <= 90) score += 1;
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  }
  if (best) return cleanHeader(best);
  // Fallback: filename
  if (filename) {
    const base = String(filename).replace(/\.[a-z0-9]+$/i, "");
    return prettifyWords(base.replace(/[_-]+/g, " "));
  }
  return "";
}
function uppercaseRatio(s) {
  const letters = (s.match(/[A-ZÁÉÍÓÚÑ]/g) || []).length;
  const total = (s.match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g) || []).length || 1;
  return letters / total;
}
function commaDensity(s) {
  const commas = (s.match(/[.,;:]/g) || []).length;
  return commas / Math.max(1, s.length);
}
function isMostlyDateLike(s) {
  const t = String(s || "");
  const numbers = (t.match(/\d/g) || []).length;
  const letters = (t.match(/[a-z]/gi) || []).length;
  return numbers >= 4 && letters <= 5;
}
/** Extrae “OMI/IMO 3.xx <nombre de curso>” de todo el texto (ES/EN). */
function pickOMITitle(text) {
  const t = String(text || "");
  // Captura “OMI 3.19 <hasta fin de línea>” evitando párrafo largo
  const rx = /\b(OMI|IMO)\s*(\d{1,2}\.\d{1,2}[A-Za-z]?)[^\S\r\n]*([^\n\r]{0,120})/gi;
  let best = "";
  let bestLen = 0;
  let m;
  while ((m = rx.exec(t))) {
    const number = m[2];
    const tail = (m[3] || "").trim();
    const cleanTail = tail.replace(/^[-–—:|]\s*/, "");
    if (!cleanTail) continue;
    const chopped = cleanTail.split(/[|•·•∙·•/\\—–\-]{1,}/)[0].trim();
    if (commaDensity(chopped) > 0.12) continue;
    const candidate = `OMI ${number} ${chopped}`.trim();
    if (candidate.length > bestLen && candidate.length <= 120) {
      best = candidate;
      bestLen = candidate.length;
    }
  }
  return best || "";
}
/** Busca un curso conocido por catálogo y devuelve ese nombre si aparece. */
function pickCatalogCourse(text) {
  const t = " " + String(text || "") + " ";
  for (const entry of COURSE_ALIASES) {
    if (entry.rx.test(t)) return entry.label;
  }
  return "";
}
function cleanHeader(s) {
  let out = String(s || "").trim();
  out = out.replace(
    /^(certificate|certificado|diploma|constancia|licen[sc]e)\s*[:\-–]\s*/i,
    ""
  );
  out = out.replace(/\s{2,}/g, " ").replace(/[•·]+/g, "·").trim();
  return prettifyWords(out);
}
function prettifyWords(s) {
  return String(s || "")
    .split(/\s+/)
    .map((w) => {
      if (/^(stcw|eng1|mlc|rya|mca|dni|imo|omi|sso|pscrb)$/i.test(w)) return w.toUpperCase();
      if (/^\d+(gt|tons?|tm)$/i.test(w)) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}
/**
 * Canonicalize to consistent EN labels.
 */
export function normalizeTitleToEnglish(raw, contextText = "") {
  const src = String(raw || "").trim();
  if (!src) return { value: "", changed: false };
  const s = src.toLowerCase();
  // Extract tonnage/level cues
  const ton = extractTonnage(s);
  const level = extractYMLevel(s);
  const dict = [
    // YachtMaster / Patr¢n de Yate (tonelaje)
    {
      match:
        /(master\s*of\s*yachts?\s*limited.*200.*(t|tons|gt|power)|yacht\s*master.*200.*(t|tons|gt)|patr[o¢]n\s*de\s*yate.*200.*(t|toneladas?|gt))/i,
      label: "Yacht Master 200 Tons",
    },
    {
      match:
        /(master\s*\(yachts?\)\s*200\s*gt|master\s*yachts?\s*200\s*gt|mca\s*master\s*200\s*gt|master\s*200\s*gt.*stcw\s*ii\/?2)/i,
      label: "Master (Yachts) 200 GT - MCA CoC (STCW II/2 Yachts)",
    },
    {
      match: /(master\s*of\s*yachts?\s*limited.*500|yacht\s*master.*500|patr[o¢]n.*500)/i,
    },
    {
      match: /(master\s*of\s*yachts?|yacht\s*master|yachtmaster|patr[o¢]n\s*de\s*yate)/i,
      label: "Yacht Master",
    },

    // ENG1
    { match: /(eng1|medical\s+certificate|certificado\s+m[e‚]dico)/i, label: "ENG1 Seafarer Medical Certificate" },

    // STCW b sicos
    { match: /(stcw).*(basic|b[a ]sico|bst|pssr|pst|fpff|efa|efaw?|advanced\s+fire)/i, label: "STCW Basic Safety Training" },

    // Seguridad / protecci¢n mar¡tima
    { match: /(ship\s+security\s+officer|oficial\s+de\s+protecci[o¢]n\s+de\s+buque|sso\b)/i, label: "Ship Security Officer (SSO)" },
    { match: /(security\s+awareness\s+for\s+seafarers\s+with\s+designated\s+security\s+duties|designated\s+security\s+duties|deberes\s+designados\s+de\s+seguridad)/i, label: "Designated Security Duties (DSD)" },
    { match: /(security\s+awareness|conciencia\s+de\s+seguridad)/i, label: "Security Awareness" },

    // Pasajeros
    { match: /(crowd\s+management|gesti[o¢]n\s+de\s+multitudes)/i, label: "Crowd Management" },

    // Botes de rescate
    { match: /(psc\s*-\s*rb|pscrb|proficiency\s+in\s+survival\s+craft)/i, label: "Proficiency in Survival Craft (PSC-RB)" },
  ];
  for (const rule of dict) {
    if (rule.match.test(s)) {
      const base = rule.label;
      if (base.startsWith("Yacht Master")) {
        // ⬇️ Evitar sufijos redundantes cuando el número ya está en el label base
        const baseLower = base.toLowerCase();
        let suffix = "";
        if (level && /^\d{3,4}$/.test(level)) {
          // Solo añadir nivel si NO aparece ya (p.ej., "200" ya está en "Yacht Master 200 Tons")
          if (!baseLower.includes(level)) suffix = ` ${level}`;
        } else if (ton && ton.value) {
          const tonStr = String(ton.value);
          // Solo añadir ton/valor si no aparece ya en el label base
          if (!baseLower.includes(tonStr)) suffix = ` ${ton.value} ${ton.unit}`;
        }
        const value = `${base}${suffix}`.replace(/\s+/g, " ").trim();
        return { value, changed: value.toLowerCase() !== src.toLowerCase() };
      }
      return { value: base, changed: base.toLowerCase() !== src.toLowerCase() };
    }
  }
  const translated = translateCommonTokens(src);
  if (translated.toLowerCase() !== src.toLowerCase()) {
    return { value: translated, changed: true, note: "Translated from source language." };
  }
  return { value: src, changed: false };
}
/** Catálogo mínimo de cursos frecuentes (ES/EN) → etiqueta canónica. */
const COURSE_ALIASES = [
  { rx: /\bship\s+security\s+officer\b|\boficial\s+de\s+protecci[oó]n\s+de\s+buque\b|\bsso\b/i, label: "Ship Security Officer (SSO)" },
  { rx: /\bdesignated\s+security\s+duties\b|deberes\s+designados\s+de\s+seguridad/i, label: "Designated Security Duties (DSD)" },
  { rx: /\bsecurity\s+awareness\b|conciencia\s+de\s+seguridad/i, label: "Security Awareness" },
  { rx: /\bcrowd\s+management\b|gesti[oó]n\s+de\s+multitudes/i, label: "Crowd Management" },
  { rx: /\bpsc\s*-\s*rb\b|\bpscrb\b|proficiency\s+in\s+survival\s+craft/i, label: "Proficiency in Survival Craft (PSC-RB)" },
  { rx: /\bbasic\s+safety\s+training\b|formaci[oó]n\s+b[aá]sica\s+de\s+seguridad|\bbst\b|\bpssr\b|\bpst\b|\bfpff\b|\befa\b/i, label: "STCW Basic Safety Training" },
  { rx: /\beng1\b|certificado\s+m[eé]dico/i, label: "ENG1 Seafarer Medical Certificate" },
];
/* ----------------------------- DATES ----------------------------- */
export function parseDatesFromText(text) {
  const src = " " + String(text || "") + " ";
  // Buscar explícitamente "Issued: <date>" y "Expires: <date>" (EN/ES), saltando líneas
  const issuedRaw =
    findLabelDate(
      src,
      /(date\s*of\s*issue|issued\s*on|issue\s*date|issued|fecha\s*de\s*emisi[oó]n|emitido\s*el)/i
    ) || "";
  const expiryRaw =
    findLabelDate(
      src,
      /(date\s*of\s*expiry|expiry\s*date|expires?\b|expires\s*on|valid\s*until|v[aá]lido\s*hasta|vigente\s*hasta|fecha\s*de\s*vencimiento|v[ée]nce\b|vigencia\s*hasta|training\s*expires?)/i
    ) || "";
  let issued = toISODate(issuedRaw, { hint: inferLocaleHint(src, "issue") });
  let expires = toISODate(expiryRaw, { hint: inferLocaleHint(src, "expiry") });
  // Fallback a earliest/latest si falta alguno, filtrando DOB/nacimiento por contexto
  if (!issued || !expires) {
    const any = allDateLikesWithIndex(src)
      .filter(({ idx }) => {
        const left = Math.max(0, idx - 40);
        const right = idx + 40;
        const ctx = src.slice(left, right);
        return !BIRTH_RX.test(ctx);
      })
      .map(({ value }) => toISODate(value))
      .filter(Boolean)
      .sort();
    if (!issued && any.length) issued = any[0];
    if (!expires && any.length >= 2) expires = any[any.length - 1];
  }
  const confidence = {
    issuedOn: issuedRaw ? 0.95 : issued ? 0.6 : 0,
    expiresOn: expiryRaw ? 0.95 : expires ? 0.6 : 0,
  };
  const notes = [];
  if (issuedRaw && isAmbiguousNumericDate(issuedRaw)) notes.push("Issued date format ambiguous.");
  if (expiryRaw && isAmbiguousNumericDate(expiryRaw)) notes.push("Expiry date format ambiguous.");
  return { issuedOn: issued || undefined, expiresOn: expires || undefined, confidence, notes };
}
/** Captura una fecha hasta 200 chars a la derecha (saltando líneas).
 *  Evita labels que estén en contexto cercano a DOB/nacimiento. */
function findLabelDate(text, labelRx) {
  const m = text.match(labelRx);
  if (!m || typeof m.index !== "number") return "";
  // Si alrededor del label hay contexto de nacimiento, ignorar
  const prevCtx = text.slice(Math.max(0, m.index - 40), m.index + 20);
  if (BIRTH_RX.test(prevCtx)) return "";
  const start = m.index + m[0].length;
  const slice = text.slice(start, start + 200); // ventana generosa
  return firstDateLike(slice);
}
function firstDateLike(s) {
  if (!s) return "";
  const rx =
    /(\d{1,2}\s*[-\/\.]\s*\d{1,2}\s*[-\/\.]\s*\d{2,4}|\d{4}\s*[-\/\.]\s*\d{1,2}\s*[-\/\.]\s*\d{1,2}|\b\d{1,2}\s+\w+\s+\d{2,4}|\b\w+\s+\d{1,2},\s*\d{4}|\b\d{1,2}\s*[-\/\.]\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s*[-\/\.]\s*\d{2,4})/i;
  const m = String(s).match(rx);
  return m ? m[0] : "";
}
// Mantengo la API antigua por compatibilidad
function allDateLikes(text) {
  const rx =
    /(\d{1,2}\s*[-\/\.]\s*\d{1,2}\s*[-\/\.]\s*\d{2,4}|\d{4}\s*[-\/\.]\s*\d{1,2}\s*[-\/\.]\s*\d{1,2}|\b\d{1,2}\s+\w+\s+\d{2,4}|\b\w+\s+\d{1,2},\s*\d{4}|\b\d{1,2}\s*[-\/\.]\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s*[-\/\.]\s*\d{2,4})/gi;
  return [...String(text).matchAll(rx)].map((m) => m[0]);
}
// Nueva variante con índice para filtrar contexto (DOB, etc.)
function allDateLikesWithIndex(text) {
  const rx =
    /(\d{1,2}\s*[-\/\.]\s*\d{1,2}\s*[-\/\.]\s*\d{2,4}|\d{4}\s*[-\/\.]\s*\d{1,2}\s*[-\/\.]\s*\d{1,2}|\b\d{1,2}\s+\w+\s+\d{2,4}|\b\w+\s+\d{1,2},\s*\d{4}|\b\d{1,2}\s*[-\/\.]\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s*[-\/\.]\s*\d{2,4})/gi;
  const out = [];
  let m;
  while ((m = rx.exec(String(text)))) out.push({ value: m[0], idx: m.index });
  return out;
}
function isAmbiguousNumericDate(s) {
  return /^\d{1,2}\s*[-\/\.]\s*\d{1,2}\s*[-\/\.]\s*\d{2,4}$/.test(String(s || ""));
}
function inferLocaleHint(text, _kind) {
  const hasEs = /\b(fecha|emisi[oó]n|vence|validez|hasta|vencimiento|v[aá]lido|vigente)\b/i.test(text);
  const hasEn = /\b(issued|expiry|valid|until|expires)\b/i.test(text);
  if (hasEs && !hasEn) return "DMY";
  if (hasEn && !hasEs) return "MDY";
  return "auto";
}
function toISODate(s, opts = {}) {
  const str = String(s || "").trim();
  if (!str) return "";
  // DD-Mon-YYYY (abreviado)
  let m = str.match(
    /^(\d{1,2})\s*[-\/\.]\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s*[-\/\.]\s*(\d{2,4})$/i
  );
  if (m) {
    const day = m[1];
    const mon = monthAbbrToNum(m[2]);
    const year = normalizeYear(m[3]);
    return ymd(year, mon, day);
  }
  const t = normalizeMonthWords(str);
  // YYYY-MM-DD
  m = t.match(/^(\d{4})\s*[-\/\.]\s*(\d{1,2})\s*[-\/\.]\s*(\d{1,2})$/);
  if (m) return ymd(m[1], m[2], m[3]);
  // DD/MM/YYYY o MM/DD/YYYY
  m = t.match(/^(\d{1,2})\s*[-\/\.]\s*(\d{1,2})\s*[-\/\.]\s*(\d{2,4})$/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    const y = normalizeYear(m[3]);
    const hint = opts.hint || "auto";
    let d = a,
      mo = b;
    if (hint === "MDY" && a <= 12 && b <= 31) {
      mo = a;
      d = b;
    } else if (hint === "DMY" && a <= 31 && b <= 12) {
      // keep
    } else if (a > 12 && b <= 12) {
      // claramente D/M/Y
    } else if (a <= 12 && b > 12) {
      mo = a;
      d = b;
    }
    return ymd(y, mo, d);
  }
  // "DD Month YYYY" -> ya normalizado a "DD MM YYYY"
  m = t.match(/^(\d{1,2})\s+(\d{1,2})\s+(\d{2,4})$/);
  if (m) return ymd(normalizeYear(m[3]), m[2], m[1]);
  const d = new Date(t);
  if (!Number.isNaN(d.getTime())) {
    return ymd(d.getFullYear(), d.getMonth() + 1, d.getDate());
  }
  return "";
}
function monthAbbrToNum(abbr) {
  const k = abbr.toLowerCase();
  const map = {
    jan: "01",
    feb: "02",
    mar: "03",
    apr: "04",
    may: "05",
    jun: "06",
    jul: "07",
    aug: "08",
    sep: "09",
    sept: "09",
    oct: "10",
    nov: "11",
    dec: "12",
  };
  return map[k] || "01";
}
function normalizeMonthWords(s) {
  let t = " " + String(s || "").trim().toLowerCase() + " ";
  t = t.replace(/\u00A0/g, " ");
  const map = [
    // English full
    [" january ", " 01 "],
    [" february ", " 02 "],
    [" march ", " 03 "],
    [" april ", " 04 "],
    [" may ", " 05 "],
    [" june ", " 06 "],
    [" july ", " 07 "],
    [" august ", " 08 "],
    [" september ", " 09 "],
    [" october ", " 10 "],
    [" november ", " 11 "],
    [" december ", " 12 "],
    // English abbr (con espacios)
    [" jan ", " 01 "],
    [" feb ", " 02 "],
    [" mar ", " 03 "],
    [" apr ", " 04 "],
    /* may */ [" jun ", " 06 "],
    [" jul ", " 07 "],
    [" aug ", " 08 "],
    [" sep ", " 09 "],
    [" sept ", " 09 "],
    [" oct ", " 10 "],
    [" nov ", " 11 "],
    [" dec ", " 12 "],
    // Spanish
    [" enero ", " 01 "],
    [" febrero ", " 02 "],
    [" marzo ", " 03 "],
    [" abril ", " 04 "],
    [" mayo ", " 05 "],
    [" junio ", " 06 "],
    [" julio ", " 07 "],
    [" agosto ", " 08 "],
    [" septiembre ", " 09 "],
    [" setiembre ", " 09 "],
    [" octubre ", " 10 "],
    [" noviembre ", " 11 "],
    [" diciembre ", " 12 "],
  ];
  for (const [k, v] of map) t = t.replaceAll(k, v);
  // Manejar "03-Aug-2027" o "03 - Aug - 2027" -> "03-08-2027"
  t = t.replace(
    /(\d{1,2})\s*[-\/\.]\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s*[-\/\.]\s*(\d{2,4})/gi,
    (_, d, m, y) => `${String(d).padStart(2, "0")}-${monthAbbrToNum(m)}-${y}`
  );
  return t.trim();
}
function ymd(y, m, d) {
  const yy = String(y).padStart(4, "0");
  const mm = String(m).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}
function normalizeYear(y) {
  const n = Number(y);
  if (n < 100) return 2000 + n;
  return n;
}
/* ----------------------------- UTILS ----------------------------- */
function splitMeaningfulLines(text) {
  return String(text || "")
    .split(/\n+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 300);
}
function extractTonnage(s) {
  const m =
    s.match(/(\d{2,4})\s*(?:gt|grt|tons?|toneladas?|tm)\b/i) ||
    s.match(/(?:^|\s)(200|500|3000)\b(?!\s*nm)/i);
  if (!m) return null;
  const val = Number(m[1] || m[0]);
  if (!Number.isFinite(val)) return null;
  return { value: val, unit: "Tons" };
}
function extractYMLevel(s) {
  const m = s.match(/\b(200|500|3000)\b/);
  return m ? m[1] : null;
}
function translateCommonTokens(s) {
  return String(s || "")
    .replace(/\bpatr[oó]n\b/gi, "Yacht Master")
    .replace(/\bde\b/gi, "of")
    .replace(/\btoneladas?\b/gi, "Tons")
    .replace(/\bcertificado\b/gi, "Certificate")
    .replace(/\bm[eé]dico\b/gi, "Medical")
    .replace(/\bb[aá]sico\b/gi, "Basic")
    .replace(/\bseguridad\b/gi, "Safety")
    .replace(/\bformaci[oó]n\b/gi, "Training")
    .replace(/\bcurso\b/gi, "Course")
    .replace(/\bvencimiento\b/gi, "Expiry")
    .replace(/\bemisi[oó]n\b/gi, "Issue")
    .replace(/\bmar[ií]timo\b/gi, "Seafarer")
    .replace(/\bgesti[oó]n\b/gi, "Management")
    .replace(/\bmultitudes\b/gi, "Crowd");
}
