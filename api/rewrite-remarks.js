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
    const tail = out.slice(offset + 1, offset + 24);
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

    const system = [
      "You rewrite job remarks into a professional, clear, and concise version.",
      "Keep the same language as the input.",
      "Do not add facts or requirements that are not in the source.",
      "Preserve important details like dates, locations, salaries, visas, and certificates.",
      "Format for readability: use short paragraphs separated by a blank line.",
      "Avoid repeating the same information or section twice.",
      "Use tasteful, professional emojis to improve readability (role, location, requirements, benefits, start date, itinerary, contact).",
      "Use plain text only (no markdown bold).",
      "If requirements are present, list each on its own line and prefix with '•'.",
      "If employer benefits or package details are listed, put each on its own line and prefix with '✔'.",
      "Treat requirements as must-have conditions (e.g., 'must', 'required', 'need', visas, certificates, experience).",
      "Treat benefits/package as offerings (e.g., salary, rotation, leave, flights, accommodation, bonuses).",
      "Do not convert exact vessel length into ranges. Keep exact lengths as given.",
      "If a length appears in feet, add meters in parentheses. If in meters, add feet in parentheses.",
      "Return only the rewritten text without quotes or extra commentary."
    ].join(" ");

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
      ? dedupeBlocksAndBullets(removeApplyHere(ensureLengthConversions(suggestionRaw)))
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

