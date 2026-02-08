import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const roundNumber = (n) => String(Math.round(n));

// --- Post-processing: ONLY trim, collapse spaces, units, mask contact, remove DM ---

function trimAndCollapseSpaces(text) {
  return String(text || "")
    .trim()
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n");
}

function ensureLengthConversions(text) {
  let out = text;
  const isInsideParens = (idx) => {
    const before = out.slice(0, idx);
    return before.lastIndexOf("(") > before.lastIndexOf(")");
  };
  const hasUnitInTail = (offset, unitRe) => {
    const tail = out.slice(offset + 1, offset + 60);
    return /\(\s*\d/.test(tail) && unitRe.test(tail);
  };
  const addMeters = (match, num, offset) => {
    if (isInsideParens(offset)) return match;
    if (hasUnitInTail(offset + match.length, /\b(m|meter|metre)\b/i)) return match;
    return `${match} (${roundNumber(parseFloat(num) * 0.3048)} m)`;
  };
  const addFeet = (match, num, offset) => {
    if (isInsideParens(offset)) return match;
    if (hasUnitInTail(offset + match.length, /\b(ft|feet)\b/i)) return match;
    return `${match} (${roundNumber(parseFloat(num) / 0.3048)} ft)`;
  };
  out = out.replace(/\b(\d{1,3}(?:\.\d+)?)\s*(ft|feet)\b/gi, (m, num, unit, offset) => addMeters(m, num, offset));
  out = out.replace(/\b(\d{1,3}(?:\.\d+)?)\s*[''′](?!\w)/g, (m, num, offset) => addMeters(m, num, offset));
  out = out.replace(/\b(\d{1,3}(?:\.\d+)?)\s*(m|meter|metre)s?\b/gi, (m, num, unit, offset) => addFeet(m, num, offset));
  return out;
}

function normalizeUnitParens(text) {
  let out = String(text || "");
  out = out.replace(/\(\s*(\d+(?:\.\d+)?)\s*(m|meter|metre)s?\s*\)/gi, (_, num) => `(${roundNumber(Number(num))} m)`);
  out = out.replace(/\(\s*(\d+(?:\.\d+)?)\s*(ft|feet)\s*\)/gi, (_, num) => `(${roundNumber(Number(num))} ft)`);
  out = out.replace(/(\(\s*\d+\s*m\s*\))([\s\S]{0,40})\(\s*\d+\s*m\s*\)/gi, "$1$2");
  out = out.replace(/(\(\s*\d+\s*ft\s*\))([\s\S]{0,40})\(\s*\d+\s*ft\s*\)/gi, "$1$2");
  return out;
}

function hasEmail(text) {
  return /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(String(text || ""));
}

function hasLink(text) {
  return /https?:\/\/[^\s]+/i.test(String(text || ""));
}

/** Replace email/link with the apply phrase. Remove DM mentions when we have email or link. */
function maskContactAndRemoveDM(text, raw) {
  const rawHasEmail = hasEmail(raw);
  const rawHasLink = hasLink(raw);
  let out = String(text || "");

  if (rawHasEmail) {
    out = out.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "Apply via email.");
    out = out.replace(/(Apply via email\.\s*){2,}/gi, "Apply via email.");
  }
  if (rawHasLink) {
    out = out.replace(/https?:\/\/[^\s)\]]+/gi, "Apply via website.");
    out = out.replace(/(Apply via website\.\s*){2,}/gi, "Apply via website.");
  }

  if (rawHasEmail || rawHasLink) {
    out = out.replace(/\b(DM\s+me|message\s+me|send\s+DM|DM\s+to|contact\s+via\s+DM)\b/gi, "").replace(/\n{3,}/g, "\n\n");
  }

  return out.trim();
}

// --- Handler ---

const SYSTEM_PROMPT = `You rewrite yacht job postings for SeaJobs. Output must be the FINAL publish-ready text: same style as a human editor—clean, clear, with moderate emojis. No placeholders; the text you return is what gets published.

MANDATORY RULES (non-negotiable)

1) Do not invent anything.
Do not add: WhatsApp, DM, "apply via WhatsApp", "Immediate" start date, or benefits not stated. Only use information that is explicitly in the original.

2) Do not remove anything important.
If the original has: requirements, salary, dates, itinerary, visa, cabin restrictions, "male/female only", "US passport only", recruiter disclaimers, job code, links—keep it all (only improve wording).

3) Contact (critical)
- If there is an email or application link in the post: do NOT output the email/link. Output only the line: "📩 Apply via email." or "🔗 Apply via website." as appropriate.
- If the post says "DM me": do not mention DM. If there is also an email, output only "📩 Apply via email." If there is no real contact (no email, no link), do not add any apply line.

4) Structure (always the same)
- First block: role summary (1–2 lines) with 👤 and 📍 location if present.
- Then sections (only if they exist in the original), each on its own line:
  ✅ Requirements:
  🎁 Package includes: (or "Benefits:" if the original says Benefits)
  📅 Start date: (only if there is a date or explicit "ASAP")
  🧭 Itinerary: (only if the text mentions it)
  📩 Apply via email. or 🔗 Apply via website. (as applicable)
- Exactly one blank line between blocks/sections.
- Requirements: bullet • one per line.
- Package/Benefits: bullet ✔ one per line.
- Do not collapse lines. No "A → B → C". No long single-line blocks.

5) Emojis
Use sparingly and consistently: 👤 📍 ✅ 🎁 📅 🧭 💰 📩 🔗
Only on section headers and 1–2 key lines. Not on every sentence.

6) Units
- If the text has "80ft" → output "80 ft (24 m)".
- If "50m" → output "50m (164 ft)".
- Do not duplicate if already converted.

7) Disclaimers
If the post has "DISCLAIMER…", "YOA job #…", "Note: …"—keep it intact, only make it readable (same wording, no creative rewrite).

8) Style
You may use phrases like "Great opportunity", "Fantastic role". Do not change the actual offer.

Output: plain text only. No markdown. No explanation. Only the rewritten job card.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { text, context } = req.body || {};
    const raw = String(text || "").trim();

    if (!raw) return res.status(400).json({ error: "Text is required" });
    if (raw.length > 5000) return res.status(400).json({ error: "Text is too long" });

    const userContent = [
      context ? `Context: ${String(context).trim()}` : "",
      "",
      "Original job post:",
      raw
    ].filter(Boolean).join("\n");

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent }
      ]
    });

    let suggestion = completion.choices?.[0]?.message?.content?.trim();
    if (!suggestion) return res.status(500).json({ error: "No suggestion returned" });

    // Post-process only: trim, collapse spaces, units, mask contact, remove DM
    suggestion = trimAndCollapseSpaces(suggestion);
    suggestion = ensureLengthConversions(suggestion);
    suggestion = normalizeUnitParens(suggestion);
    suggestion = maskContactAndRemoveDM(suggestion, raw);
    suggestion = trimAndCollapseSpaces(suggestion);

    return res.status(200).json({ text: suggestion });
  } catch (error) {
    console.error("rewrite-remarks error:", error);
    return res.status(500).json({ error: "Failed to rewrite remarks" });
  }
}
