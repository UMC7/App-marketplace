// /api/rewrite-remarks.js

import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const roundNumber = (n) => String(Math.round(n));

const removeApplyHere = (text) =>
  String(text || "").replace(/\[\s*apply\s*here\s*\]/gi, "").trim();

const normalizeSectionLabels = (text) => {
  let out = String(text || "");
  out = out.replace(/\bStart Date\s+is\b/gi, "Start Date:");
  out = out.replace(/\bStart Date\s*-\s*/gi, "Start Date: ");
  out = out.replace(/\bItinerary\s*-\s*/gi, "Itinerary: ");
  out = out.replace(/\bSalary\s+DOE\b/gi, "Salary: DOE");
  return out;
};

const forceSectionBreaks = (text) => {
  let out = String(text || "");

  const sectionHeads = [
    /\s+(Requirements?:)\s*/gi,
    /\s+(Role Overview:?)\s*/gi,
    /\s+(Vessel Details:?)\s*/gi,
    /\s+(Start\s+Date:?)\s*/gi,
    /\s+(Itinerary:?)\s*/gi,
    /\s+(Salary:?)\s*/gi,
    /\s+(To Apply:?)\s*/gi,
    /\s+(Best\s+Regards,)/gi,
  ];

  for (const re of sectionHeads) {
    out = out.replace(re, "\n\n$1 ");
  }

  return out.replace(/\n{3,}/g, "\n\n").trim();
};

const normalizeListMarkers = (text) => {
  return String(text || "")
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      const m = trimmed.match(/^([-*]|\d+\.)\s+/);
      if (!m) return trimmed;
      const rest = trimmed.slice(m[0].length).trim();
      return `• ${rest}`;
    })
    .join("\n");
};

const splitBulletLines = (text) => {
  const lines = String(text || "").split("\n");
  const out = [];

  for (const line of lines) {
    const t = line.trim();
    if (!t) {
      out.push("");
      continue;
    }

    if (t.startsWith("•")) {
      const body = t.slice(1).trim();
      const parts = body
        .split(/\s*[,;]\s*(?=[A-Za-z])/)
        .map((s) => s.trim())
        .filter(Boolean);

      if (parts.length > 1) {
        parts.forEach((p) => out.push(`• ${p}`));
        continue;
      }
    }

    out.push(t);
  }

  return out.join("\n");
};

const dedupeBlocksAndBullets = (text) => {
  const blocks = text
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  const seen = new Set();
  const cleaned = [];

  for (const block of blocks) {
    const lines = block.split("\n");
    const local = new Set();
    const outLines = [];

    for (const l of lines) {
      const k = l.toLowerCase();
      if (local.has(k)) continue;
      local.add(k);
      outLines.push(l);
    }

    const joined = outLines.join("\n");
    const key = joined.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push(joined);
  }

  return cleaned.join("\n\n");
};

const ensureSentenceEndings = (text) =>
  String(text || "")
    .split("\n")
    .map((line) => {
      const t = line.trim();
      if (!t) return "";
      if (/^(•)\s+/.test(t)) return t;
      if (/[.!?]$/.test(t)) return t;
      if (t.length > 12) return `${t}.`;
      return t;
    })
    .join("\n");

const normalizeSpacing = (text) => {
  const lines = String(text || "").split("\n").map(l => l.trimEnd());
  const out = [];
  let prevBlank = false;

  for (const raw of lines) {
    const line = raw.trim();
    const isBullet = /^•\s+/.test(line);

    if (!line) {
      if (out.length && /^•\s+/.test(out[out.length - 1])) continue;
      if (prevBlank) continue;
      out.push("");
      prevBlank = true;
      continue;
    }

    out.push(line);
    prevBlank = false;

    if (isBullet) prevBlank = false;
  }

  while (out[0] === "") out.shift();
  while (out[out.length - 1] === "") out.pop();

  return out.join("\n").replace(/\n{3,}/g, "\n\n");
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { text, context } = req.body || {};
    const raw = String(text || "").trim();

    if (!raw) return res.status(400).json({ error: "Text is required" });
    if (raw.length > 5000) return res.status(400).json({ error: "Text too long" });

    const system = `
You are a professional editor.

Rules (strict):
- Keep the same language as input.
- Do NOT change sensitive data: salary/DOE, dates, locations, vessel size, contract, leave/rotation, cabin, visas, certificates, gender/nationality limits.
- Do NOT invent benefits or start dates.
- Do NOT add new requirements.
- Only reorganize and rephrase existing information.
- If contact exists, do NOT print email/link; just say "Apply via email/website".
- Preserve recruiter disclaimers.

Structure:
Role/location → vessel details → role overview → requirements → start/date/salary if present → apply.

Use • for requirements only.

Return plain text only.
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: [
            "Context:",
            context || "None",
            "",
            "Original:",
            raw
          ].join("\n"),
        },
      ],
    });

    const suggestionRaw = completion.choices?.[0]?.message?.content?.trim();
    if (!suggestionRaw) return res.status(500).json({ error: "No suggestion" });

    const suggestion = normalizeSpacing(
      ensureSentenceEndings(
        dedupeBlocksAndBullets(
          splitBulletLines(
            normalizeListMarkers(
              forceSectionBreaks(
                removeApplyHere(
                  normalizeSectionLabels(suggestionRaw)
                )
              )
            )
          )
        )
      )
    );

    return res.status(200).json({ text: suggestion });
  } catch (err) {
    console.error("rewrite-remarks error:", err);
    return res.status(500).json({ error: "Failed to rewrite remarks" });
  }
}