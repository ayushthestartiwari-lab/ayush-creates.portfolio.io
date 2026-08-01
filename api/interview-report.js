// api/interview-report.js
//
// Vercel serverless function. Takes the interview transcript (and, once
// Phase 2 face-tracking lands, aggregate camera metrics) and makes ONE
// Gemini call to generate a structured interview report.
//
// Uses its own API key (GEMINI_API_KEY_INTERVIEW) so this feature's quota
// is fully separate from BeAI's chat quota.
//
// Reuses the same Upstash Redis REST setup as BeAI for per-visitor daily
// rate limiting (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN).

const GEMINI_MODEL = "gemini-3.6-flash";
const DAILY_LIMIT = 5; // reports per visitor per day — adjust as needed

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY_INTERVIEW;
  if (!apiKey) {
    res.status(500).json({ error: "server misconfigured: missing GEMINI_API_KEY_INTERVIEW" });
    return;
  }

  const { topic, transcript } = req.body || {};

  if (!Array.isArray(transcript) || transcript.length === 0) {
    res.status(400).json({ error: "transcript is required and must be a non-empty array" });
    return;
  }

  // ---- rate limit (per visitor, per day) ----
  const visitorId = getVisitorId(req);
  const allowed = await checkAndIncrementRateLimit(visitorId);
  if (!allowed) {
    res.status(429).json({ error: `daily limit of ${DAILY_LIMIT} reports reached — try again tomorrow` });
    return;
  }

  // ---- build prompt ----
  const transcriptText = transcript
    .map((t, i) => `Q${i + 1}: ${t.question}\nA${i + 1}: ${t.answer}`)
    .join("\n\n");

  const prompt = `You are an experienced technical interview coach reviewing a mock interview transcript for a student learning ${topic || "software development"} on a platform called Be Ahead.

Below is the full Q&A transcript from a spoken mock interview:

${transcriptText}

Write a report for the student. Respond ONLY with valid JSON, no markdown fences, no preamble, matching exactly this shape:

{
  "overall_score": <integer 1-10>,
  "summary": "<2-3 sentence overall impression>",
  "strengths": ["<short point>", "<short point>", "<short point>"],
  "areas_to_improve": ["<short point>", "<short point>", "<short point>"],
  "per_question_feedback": [
    { "question": "<question text>", "feedback": "<1-2 sentence feedback on this specific answer>" }
  ],
  "next_steps": ["<concrete, actionable suggestion>", "<concrete, actionable suggestion>"]
}`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            responseMimeType: "application/json"
          }
        })
      }
    );

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      console.error("Gemini API error:", JSON.stringify(data));
      res.status(502).json({ error: "gemini_error", detail: data?.error?.message || "unknown error" });
      return;
    }

    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      console.error("Unexpected Gemini response shape:", JSON.stringify(data));
      res.status(502).json({ error: "empty_response_from_gemini" });
      return;
    }

    let report;
    try {
      const cleaned = rawText.replace(/```json|```/g, "").trim();
      report = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("Failed to parse Gemini JSON:", rawText);
      res.status(502).json({ error: "invalid_json_from_gemini", raw: rawText });
      return;
    }

    res.status(200).json({ report });
  } catch (err) {
    console.error("interview-report handler error:", err);
    res.status(500).json({ error: "internal_error", detail: err.message });
  }
};

// ---- helpers ----

function getVisitorId(req) {
  const fwd = req.headers["x-forwarded-for"];
  const ip = (Array.isArray(fwd) ? fwd[0] : fwd || req.socket?.remoteAddress || "unknown")
    .split(",")[0]
    .trim();
  return ip;
}

async function checkAndIncrementRateLimit(visitorId) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  // if Upstash isn't configured, fail open (don't block the feature)
  if (!url || !token) return true;

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const key = `interview_report:${visitorId}:${today}`;

  try {
    const incrRes = await fetch(`${url}/incr/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const incrData = await incrRes.json();
    const count = incrData?.result ?? 0;

    if (count === 1) {
      // first hit today — set 24h expiry
      await fetch(`${url}/expire/${encodeURIComponent(key)}/86400`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }

    return count <= DAILY_LIMIT;
  } catch (err) {
    console.error("rate limit check failed:", err);
    return true; // fail open
  }
}
