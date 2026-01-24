import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
      "Use tasteful, professional emojis to improve readability (e.g., role, location, requirements, contact).",
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

    const suggestion = completion.choices?.[0]?.message?.content?.trim();
    if (!suggestion) {
      return res.status(500).json({ error: "No suggestion returned" });
    }

    return res.status(200).json({ text: suggestion });
  } catch (error) {
    console.error("rewrite-remarks error:", error);
    return res.status(500).json({ error: "Failed to rewrite remarks" });
  }
}
