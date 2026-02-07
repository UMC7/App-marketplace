import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const roundNumber = (n) => String(Math.round(n));

const ensureLengthConversions = (text) => {
  let out = text;

  const isInsideParens = (idx) => {
    const before = out.slice(0, idx);
    const lastOpen = before.lastIndexOf('(');
    const lastClose = before.lastIndexOf(')');
    return lastOpen > lastClose;
  };

  const hasUnitInTail = (offset, unitRe) => {
    const tail = out.slice(offset + 1, offset + 60);
    return /\(\s*\d/.test(tail) && unitRe.test(tail);
  };

  const addMeters = (match, num, offset) => {
    if (isInsideParens(offset)) return match;
    if (hasUnitInTail(offset + match.length, /\b(m|meter|metre)\b/i)) return match;
    const meters = parseFloat(num) * 0.3048;
    return `${match} (${roundNumber(meters)} m)`;
  };

  const addFeet = (match, num, offset) => {
    if (isInsideParens(offset)) return match;
    if (hasUnitInTail(offset + match.length, /\b(ft|feet)\b/i)) return match;
    const feet = parseFloat(num) / 0.3048;
    return `${match} (${roundNumber(feet)} ft)`;
  };

  out = out.replace(/\b(\d{1,3}(?:\.\d+)?)\s*(ft|feet)\b/gi, (m, num, unit, offset) => addMeters(m, num, offset));
  out = out.replace(/\b(\d{1,3}(?:\.\d+)?)\s*['’′](?!\w)/g, (m, num, offset) => addMeters(m, num, offset));
  out = out.replace(/\b(\d{1,3}(?:\.\d+)?)\s*(m|meter|metre)s?\b/gi, (m, num, unit, offset) => addFeet(m, num, offset));

  return out;
};

const dedupeBlocksAndBullets = (text) => {
  const blocks = text
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  const seen = new Set();
  const cleanedBlocks = [];

  for (const block of blocks) {
    const lines = block.split("\n");
    const outLines = [];
    const seenLine = new Set();

    for (const line of lines) {
      const trimmed = line.trim();
      const key = trimmed.toLowerCase();
      if (!trimmed) continue;
      if ((trimmed.startsWith("•") || trimmed.startsWith("✔")) && seenLine.has(key)) {
        continue;
      }
      seenLine.add(key);
      outLines.push(trimmed);
    }

    const joined = outLines.join("\n");
    const key = joined.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    cleanedBlocks.push(joined);
  }

  return cleanedBlocks.join("\n\n");
};

const removeApplyHere = (text) => {
  return String(text || "").replace(/\[\s*apply\s*here\s*\]/gi, "").replace(/\s{2,}/g, " ").trim();
};

const normalizeUnitParens = (text) => {
  let out = String(text || "");
  out = out.replace(/\(\s*(\d+(?:\.\d+)?)\s*(m|meter|metre)s?\s*\)/gi, (m, num, unit) => {
    return `(${roundNumber(Number(num))} m)`;
  });
  out = out.replace(/\(\s*(\d+(?:\.\d+)?)\s*(ft|feet)\s*\)/gi, (m, num, unit) => {
    return `(${roundNumber(Number(num))} ft)`;
  });

  out = out.replace(/(\(\s*\d+\s*m\s*\))([\s\S]{0,40})\(\s*\d+\s*m\s*\)/gi, "$1$2");
  out = out.replace(/(\(\s*\d+\s*ft\s*\))([\s\S]{0,40})\(\s*\d+\s*ft\s*\)/gi, "$1$2");
  return out;
};

const normalizeSectionLabels = (text) => {
  let out = String(text || "");
  out = out.replace(/\bStart Date\s+is\b/gi, "Start Date:");
  out = out.replace(/\bStart Date\s*-\s*/gi, "Start Date: ");
  out = out.replace(/\bItinerary\s*-\s*/gi, "Itinerary: ");
  out = out.replace(/\bSalary\s+DOE\b/gi, "Salary: DOE");
  return out;
};

/** Force newline before section headers so "Benefits:", "Email...", etc. start on their own line. */
const forceSectionBreaks = (text) => {
  let out = String(text || "");
  const sectionHeads = [
    /\s+(Requirements?:)\s*/gi,
    /\s+(Benefits?:)\s*/gi,
    /\s+(Email\s+[A-Za-z])/gi,
    /\s+(Start\s+Date:?)\s*/gi,
    /\s+(Itinerary:?)\s*/gi,
    /\s+(Salary:?)\s*/gi,
    // "Vessel Details:" debe ir en línea aparte; la IA a veces pega "ASAP Vessel Details:." → forzar "ASAP.\n\nVessel Details:"
    /\s+Vessel\s+Details:\.?\s*/gi,
  ];
  for (const re of sectionHeads) {
    // Para "Vessel Details" no usamos $1; quitamos el punto si lo puso la IA tras los dos puntos
    out = re.source.includes("Vessel")
      ? out.replace(re, "\n\nVessel Details:\n")
      : out.replace(re, "\n\n$1 ");
  }
  return out.replace(/\n{3,}/g, "\n\n").trim();
};

/** Convert - or * list markers to • or ✔ based on content. */
const normalizeListMarkers = (text) => {
  const benefitKeywords = /\b(salary|rotation|leave|flights?|flight\s+paid|accommodation|bonus|package|medical|insurance|travel|holiday|vacation)\b/i;
  return String(text || "")
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      const bulletMatch = trimmed.match(/^([-*]|\d+\.)\s+/);
      if (!bulletMatch) return trimmed;
      const rest = trimmed.slice(bulletMatch[0].length).trim();
      if (benefitKeywords.test(rest)) return `✔ ${rest}`;
      return `• ${rest}`;
    })
    .join("\n");
};

/** Split lines that contain multiple bullets in one line so each bullet is on its own line. */
const splitBulletLines = (text) => {
  const lines = String(text || "").split("\n");
  const out = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      out.push("");
      continue;
    }
    const bulletReq = /^(•)\s+(.+)$/;
    const bulletBen = /^([✔✓])\s+(.+)$/;
    const mReq = trimmed.match(bulletReq);
    const mBen = trimmed.match(bulletBen);

    if (mReq) {
      const rest = mReq[2];
      const byComma = rest.split(/\s*[,;]\s*(?=[A-Za-z])/).map((s) => s.trim()).filter(Boolean);
      const byBullet = rest.split(/\s+•\s+/).map((s) => s.trim()).filter(Boolean);
      const parts = byBullet.length > 1 ? byBullet : byComma.length > 1 ? byComma : [rest];
      if (parts.length > 1) {
        parts.forEach((p) => out.push(`• ${p}`));
        continue;
      }
    }
    if (mBen) {
      const rest = mBen[2];
      const byComma = rest.split(/\s*[,;]\s*(?=[A-Za-z])/).map((s) => s.trim()).filter(Boolean);
      const byBullet = rest.split(/\s+[✔✓]\s+/).map((s) => s.trim()).filter(Boolean);
      const parts = byBullet.length > 1 ? byBullet : byComma.length > 1 ? byComma : [rest];
      if (parts.length > 1) {
        const bulletChar = mBen[1];
        parts.forEach((p) => out.push(`${bulletChar} ${p}`));
        continue;
      }
    }
    const sectionLabel = /^(Requirements?:|Benefits?:|Email\s|Start\s+Date|Itinerary|Salary)/i;
    if (/[•✔✓]/.test(trimmed) && !/^[•✔✓]\s/.test(trimmed)) {
      const byBulletDot = trimmed.split(/\s+•\s+/).map((s) => s.trim()).filter(Boolean);
      const byBulletCheck = trimmed.split(/\s+[✔✓]\s+/).map((s) => s.trim()).filter(Boolean);
      if (byBulletDot.length > 1) {
        byBulletDot.forEach((p) => {
          out.push(sectionLabel.test(p) || p.startsWith("•") ? p : `• ${p}`);
        });
        continue;
      }
      if (byBulletCheck.length > 1) {
        byBulletCheck.forEach((p) => {
          out.push(sectionLabel.test(p) || /^[✔✓]\s/.test(p) ? p : `✔ ${p}`);
        });
        continue;
      }
    }
    out.push(trimmed);
  }
  return out.join("\n");
};

/** Ensure sentences end with a period when they look like statements. */
const ensureSentenceEndings = (text) => {
  return String(text || "")
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || /^(•|✔|👤|📍|✅|📅|🧭|💰|🎁)\s/.test(trimmed)) return trimmed;
      if (/[.!?]$/.test(trimmed)) return trimmed;
      if (/^[A-Z0-9]/.test(trimmed) && trimmed.length > 15) return `${trimmed}.`;
      return trimmed;
    })
    .join("\n");
};

/** Always enforce: one blank line between sections/paragraphs, single newline between list items. */
const ensureParagraphs = (text) => {
  const lines = String(text || "")
    .split("\n")
    .map((l) => l.trim());
  const normalized = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line === "") {
      normalized.push("");
      i++;
      continue;
    }
    if (/^(•|✔)\s+/.test(line)) {
      normalized.push(line);
      i++;
      while (i < lines.length && lines[i] !== "" && /^(•|✔)\s+/.test(lines[i])) {
        normalized.push(lines[i]);
        i++;
      }
      if (i < lines.length && lines[i] !== "") normalized.push("");
      continue;
    }
    const sentences = line.split(/(?<=[.!?])\s+(?=[A-Z0-9])/).map((s) => s.trim()).filter(Boolean);
    if (sentences.length === 0) {
      normalized.push(line);
      i++;
      if (i < lines.length && lines[i] !== "") normalized.push("");
      continue;
    }
    for (let j = 0; j < sentences.length; j++) {
      normalized.push(sentences[j]);
      if (j < sentences.length - 1) normalized.push("");
    }
    i++;
    if (i < lines.length && lines[i] !== "" && !/^(•|✔)\s+/.test(lines[i])) normalized.push("");
  }

  const final = [];
  for (let k = 0; k < normalized.length; k++) {
    const cur = normalized[k];
    const next = normalized[k + 1];
    final.push(cur);
    if (next === undefined) break;
    const curBullet = /^(•|✔)\s+/.test(cur);
    const nextBullet = /^(•|✔)\s+/.test(next);
    if (cur === "" || next === "") continue;
    if (curBullet && nextBullet) continue;
    final.push("");
  }
  return final.join("\n").replace(/\n{3,}/g, "\n\n").trim();
};

const ensureEmojis = (text) => {
  const benefitKeywords = /\b(salary|rotation|leave|flights?|accommodation|bonus|package|medical|insurance|travel|holiday|vacation)\b/i;
  return String(text || "")
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      if (/^(👤|📍|✅|📅|🧭|💰|🎁|📧|🚢)\s/.test(trimmed)) return trimmed;
      if (/^(•|✔)\s+/.test(trimmed)) return trimmed;
      if (/^Start Date\b/i.test(trimmed)) return `📅 ${trimmed}`;
      if (/^Itinerary\b/i.test(trimmed)) return `🧭 ${trimmed}`;
      if (/^Salary\b/i.test(trimmed)) return `💰 ${trimmed}`;
      if (/^Benefits?:?\s*$/i.test(trimmed)) return `🎁 ${trimmed}`;
      if (/^Email\b/i.test(trimmed)) return `📧 ${trimmed}`;
      if (/^Vessel\s+Details\b/i.test(trimmed)) return `🚢 ${trimmed}`;
      if (/^(seeking|looking for|position:|role:)/i.test(trimmed)) return `👤 ${trimmed}`;
      if (/^(located|location|based)\b/i.test(trimmed)) return `📍 ${trimmed}`;
      if (/^(requirements?|qualifications?|must|required)\b/i.test(trimmed)) return `✅ ${trimmed}`;
      if (/^(benefits?|package|rotation|leave|flights|accommodation|bonus)\b/i.test(trimmed)) return `🎁 ${trimmed}`;
      if (/^\w+\s+\d+\s*(m\s?|ft\)|\()/.test(trimmed) && /\b(yacht|flag|motor)\b/i.test(trimmed)) return `👤 ${trimmed}`;
      if (/\b(seeking|looking for|position:|role:)\b/i.test(trimmed)) return `👤 ${trimmed}`;
      if (/\b(located|location|based)\b/i.test(trimmed)) return `📍 ${trimmed}`;
      if (/\b(requirements?|qualifications?|must|required)\b/i.test(trimmed)) return `✅ ${trimmed}`;
      if (/\b(benefits?|package|rotation|leave|flights|accommodation|bonus)\b/i.test(trimmed)) return `🎁 ${trimmed}`;
      return trimmed;
    })
    .join("\n");
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { text, context } = req.body || {};
    const raw = String(text || "").trim();

    if (!raw) {
      return res.status(400).json({ error: "Text is required" });
    }
    if (raw.length > 5000) {
      return res.status(400).json({ error: "Text is too long" });
    }

    const system = `You are a professional editor. Rewrite the job remarks so they are clear, structured, and easy to read. Output rules (follow strictly):

1. LANGUAGE: Keep the same language as the input. Do not add information that is not in the source.

2. STRUCTURE: Organise in this order when relevant: role/location → requirements → benefits → start date / itinerary / salary. Put exactly one blank line between each section or paragraph. Use short paragraphs (one or two sentences). Do not repeat the same information.

3. SENTENCES: End every sentence with a period. Use proper punctuation.

4. LISTS - REQUIREMENTS: If there are requirements (must-have: certificates, visas, experience, skills), list each requirement on its own line. Each line must start with the bullet character • (Unicode bullet). Use only • for requirements, never "-" or "*". Example:
• STCW required
• Valid visa for EU
• 2 years experience

5. LISTS - BENEFITS: If there are benefits or package details (salary, rotation, flights, accommodation, leave), list each on its own line. Each line must start with ✔ (checkmark). Use only ✔ for benefits. Example:
✔ Competitive salary
✔ Flights included
✔ 38 days leave

6. FORMAT: Plain text only. No markdown (no ** or ##). No quotes around the output. Put exactly one blank line between paragraphs or sections. Between list items of the same list use a single newline (no blank line between • items or between ✔ items).

7. NUMBERS: Keep exact vessel lengths as given. If length is in feet add (X m) in parentheses; if in meters add (X ft).

8. Return only the rewritten text, nothing else.`;

    const promptParts = [
      "Context (optional):",
      context ? String(context).trim() : "None",
      "",
      "Original remarks:",
      raw
    ];

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: promptParts.join("\n") }
      ]
    });

    const suggestionRaw = completion.choices?.[0]?.message?.content?.trim();
    const suggestion = suggestionRaw
      ? ensureEmojis(
          ensureParagraphs(
            ensureSentenceEndings(
              dedupeBlocksAndBullets(
                splitBulletLines(
                  normalizeListMarkers(
                    forceSectionBreaks(
                      removeApplyHere(
                        normalizeUnitParens(
                          ensureLengthConversions(
                            normalizeSectionLabels(suggestionRaw)
                          )
                        )
                      )
                    )
                  )
                )
              )
            )
          )
        )
      : "";
    if (!suggestion) {
      return res.status(500).json({ error: "No suggestion returned" });
    }

    return res.status(200).json({ text: suggestion });
  } catch (error) {
    console.error("rewrite-remarks error:", error);
    return res.status(500).json({ error: "Failed to rewrite remarks" });
  }
}

