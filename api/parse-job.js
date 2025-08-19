// pages/api/parse-job.js
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// mismas opciones que tu initialState
const RANKS = [
  "Captain","Captain/Engineer","Skipper","Chase Boat Captain","Relief Captain",
  "Chief Officer","2nd Officer","3rd Officer","Bosun","Deck/Engineer","Mate",
  "Lead Deckhand","Deckhand","Deck/Steward(ess)","Deck/Carpenter","Deck/Divemaster",
  "Dayworker","Chief Engineer","2nd Engineer","3rd Engineer","Solo Engineer","Electrician",
  "Head Chef","Sous Chef","Solo Chef","Cook/Crew Chef","Chief Steward(ess)","2nd Steward(ess)",
  "3rd Stewardess","Solo Steward(ess)","Junior Steward(ess)","Cook/Steward(ess)","Stew/Deck",
  "Laundry/Steward(ess)","Stew/Masseur","Masseur","Hairdresser/Barber","Nanny","Videographer",
  "Yoga/Pilates Instructor","Personal Trainer","Dive Instrutor","Water Sport Instrutor","Nurse","Other"
];

const YACHT_TYPES = ["Motor Yacht","Sailing Yacht","Chase Boat","Catamaran"];
const YACHT_BUCKETS = ["0 - 30m","31 - 40m","41 - 50m","51 - 70m","> 70m"];
const CHASE_BUCKETS = ["< 10m","10 - 15m","15 - 20m","> 20m"];
const TERMS = ["Rotational","Permanent","Temporary","Seasonal","Relief","Delivery","Crossing","DayWork"];
const CURRENCIES = ["USD","EUR","GBP","AUD"];
const LANGS = ["Arabic","Dutch","English","French","German","Greek","Italian","Mandarin","Portuguese","Russian","Spanish","Turkish","Ukrainian"];
const FLU = ["Native","Fluent","Conversational"];

// 🔧 permitir body grande y texto plano
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });

  try {
    // ✅ manejo robusto del body
    let text = "";
    if (req.headers["content-type"]?.includes("application/json")) {
      text = req.body?.text || "";
    } else if (typeof req.body === "string") {
      text = req.body;
    }

    if (!text) return res.status(400).json({ error: "Missing job text in { text }" });

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10); // YYYY-MM-DD

    const system = `
You are an information extractor for yacht job posts. 
Output MUST be STRICT JSON with EXACT keys and value types matching the schema below. 
Do not include comments, markdown, or extra text.
    `.trim();

    const schema = {
      work_environment: "Onboard|Shore-based",
      rank: "",                   // must be one of RANKS
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
    };

    const rules = `
- TODAY = ${todayStr}. If the post only gives a MONTH (e.g. "October"), set start_date to the 1st of that month in the upcoming occurrence relative to TODAY; set is_asap=false.
- If ASAP/immediate/flexible: is_asap=true and start_date="".
- Salary: capture the numeric amount next to a currency (EUR/€ GBP/£ USD/$ AUD). Ignore numbers referring to leave days/rotation.
  If there is currency mention but NO numeric amount -> is_doe=true, salary=""; set salary_currency accordingly.
- work_environment: "Onboard" if it's for a yacht/boat; "Shore-based" if office/yard/agency.
- rank: map the described role to one of: ${RANKS.join(", ")}. Prefer the most specific (e.g. "Deck/Steward(ess)", "Chief Officer", "2nd Steward(ess)"). Never leave empty.
- yacht_size: bucket LOA meters into one of ${YACHT_BUCKETS.join(", ")} (or ${CHASE_BUCKETS.join(", ")} if clearly a Chase Boat).
- yacht_type: one of ${YACHT_TYPES.join("|")}.
- uses: map "Private", "Charter" or "Private/Charter" if present.
- team: "Yes" ONLY if it explicitly mentions a COUPLE/PAIR role; otherwise "No".
- liveaboard: "Share Cabin" if the text says share/sharing cabin; "Own Cabin" if said; "No" for shore-based.
- languages: fill language_1/_2 and *_fluency when explicit (e.g. "English / Fluent").
- years_in_rank: lower bound from "X+ years" or first number in a range; allow "Green".
- description: concise summary (itinerary + key quals + extras). DO NOT duplicate fields already mapped.
- country vs city: if ambiguous short word and clearly a country, put into country; otherwise city.
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
${text}
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
    };

    if (out.is_doe) {
      out.salary = "";
      out.salary_currency = out.salary_currency || out.teammate_salary_currency || "";
    }

    return res.status(200).json(out);
  } catch (err) {
    console.error("parse-job error:", err);
    return res.status(500).json({ error: err.message || "Parse error" });
  }
}