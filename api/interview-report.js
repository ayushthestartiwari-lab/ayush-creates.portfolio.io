// api/interview-report.js
//
// Vercel serverless function. Takes an interview transcript and makes ONE
// Gemini call to generate a structured interview report.
//
// Uses its own API key (GEMINI_API_KEY_INTERVIEW) so this feature's quota
// is fully separate from BeAI's chat quota. Reuses the same Upstash Redis
// REST setup as BeAI for per-visitor daily rate limiting.

const GEMINI_MODEL = "gemini-3.6-flash";
const GEMINI_TIMEOUT_MS = 25000; // fail cleanly before Vercel force-kills the function
const DAILY_LIMIT = 5; // successful reports per visitor per day
const MAX_QUESTIONS = 10; // hard cap on transcript size accepted
const MAX_ANSWER_CHARS = 2000; // per-answer cap, guards against oversized payloads

// Vercel Serverless Function config — raises the max execution time where
// the plan allows it (Hobby is capped at 10s regardless of this setting;
// Pro allows up to 60s). Safe to leave even on Hobby.
module.exports.config = { maxDuration: 30 };

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY_INTERVIEW;
  if (!apiKey) {
    console.error("Missing GEMINI_API_KEY_INTERVIEW env var");
    res.status(500).json({ error: "server_misconfigured" });
    return;
  }

  // ---- validate input ----
  const { topic, transcript } = req.body || {};

  if (!Array.isArray(transcript) || transcript.length === 0) {
    res.status(400).json({ error: "invalid_transcript", detail: "transcript must be a non-empty array" });
    return;
  }

  if (transcript.length > MAX_QUESTIONS) {
    res.status(400).json({ error: "invalid_transcript", detail: `too many questions (max ${MAX_QUESTIONS})` });
    return;
  }

  const cleanTranscript = [];
  for (const item of transcript) {
    if (!item || typeof item.question !== "string" || typeof item.answer !== "string") {
      res.status(400).json({ error: "invalid_transcript", detail: "each item needs a question and answer string" });
      return;
    }
    cleanTranscript.push({
      question: item.question.slice(0, 500),
      answer: item.answer.slice(0, MAX_ANSWER_CHARS)
    });
  }

  const safeTopic = typeof topic === "string" ? topic.slice(0, 50) : "software development";
  const visitorId = getVisitorId(req);

  // ---- rate limit: check only (doesn't consume quota until success) ----
  const remaining = await getRemainingQuota(visitorId);
  if (remaining !== null && remaining <= 0) {
    res.status(429).json({ error: "daily_limit_reached", detail: `limit of ${DAILY_LIMIT} reports per day reached — try again tomorrow` });
    return;
  }

  // ---- build prompt ----
  const transcriptText = cleanTranscript
    .map((t, i) => `Q${i + 1}: ${t.question}\nA${i + 1}: ${t.answer}`)
    .join("\n\n");

  const prompt = `You are an experienced technical interview coach reviewing a mock interview transcript for a student learning ${safeTopic} on a platform called Be Ahead.

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

  // ---- call Gemini, with a hard timeout ----
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  let geminiRes;
  try {
    geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey // key in header, not query string
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            responseMimeType: "application/json"
          }
        }),
        signal: controller.signal
      }
    );
  } catch (err) {
    clearTimeout(timeoutHandle);
    if (err.name === "AbortError") {
      console.error("Gemini request timed out after", GEMINI_TIMEOUT_MS, "ms");
      res.status(504).json({ error: "gemini_timeout", detail: "the AI took too long to respond — please try again" });
      return;
    }
    console.error("Gemini request failed:", err);
    res.status(502).json({ error: "gemini_unreachable", detail: err.message });
    return;
  }
  clearTimeout(timeoutHandle);

  let data;
  try {
    data = await geminiRes.json();
  } catch (err) {
    console.error("Failed to parse Gemini response as JSON:", err);
    res.status(502).json({ error: "gemini_bad_response" });
    return;
  }

  if (!geminiRes.ok) {
    console.error("Gemini API error:", geminiRes.status, JSON.stringify(data));
    // surface 429 distinctly so the frontend can show a "quota" message
    const status = geminiRes.status === 429 ? 429 : 502;
    res.status(status).json({ error: "gemini_error", detail: data?.error?.message || "unknown error" });
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
    res.status(502).json({ error: "invalid_json_from_gemini" });
    return;
  }

  const safeReport = normalizeReport(report);

  // ---- only now consume quota, since generation actually succeeded ----
  await incrementQuota(visitorId);

  res.status(200).json({ report: safeReport });
};

// ---- helpers ----

/** Coerces the model's output into a shape the frontend can always render safely. */
function normalizeReport(report) {
  const score = Number(report.overall_score);
  return {
    overall_score: Number.isFinite(score) ? Math.min(10, Math.max(1, Math.round(score))) : null,
    summary: typeof report.summary === "string" ? report.summary : "",
    strengths: Array.isArray(report.strengths) ? report.strengths.filter((s) => typeof s === "string") : [],
    areas_to_improve: Array.isArray(report.areas_to_improve)
      ? report.areas_to_improve.filter((s) => typeof s === "string")
      : [],
    per_question_feedback: Array.isArray(report.per_question_feedback)
      ? report.per_question_feedback
          .filter((item) => item && typeof item.question === "string" && typeof item.feedback === "string")
          .map((item) => ({ question: item.question, feedback: item.feedback }))
      : [],
    next_steps: Array.isArray(report.next_steps) ? report.next_steps.filter((s) => typeof s === "string") : []
  };
}

function getVisitorId(req) {
  const fwd = req.headers["x-forwarded-for"];
  const ip = (Array.isArray(fwd) ? fwd[0] : fwd || req.socket?.remoteAddress || "unknown")
    .split(",")[0]
    .trim();
  return ip;
}

function todayKey(visitorId) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `interview_report:${visitorId}:${today}`;
}

/** Returns remaining quota for today, or null if Upstash isn't configured (fail open). */
async function getRemainingQuota(visitorId) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    const key = todayKey(visitorId);
    const getRes = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const getData = await getRes.json();
    const count = getData?.result ? parseInt(getData.result, 10) : 0;
    return DAILY_LIMIT - count;
  } catch (err) {
    console.error("rate limit read failed:", err);
    return null; // fail open
  }
}

/** Increments today's count for this visitor, setting a 24h expiry on first hit. */
async function incrementQuota(visitorId) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;

  try {
    const key = todayKey(visitorId);
    const incrRes = await fetch(`${url}/incr/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const incrData = await incrRes.json();
    if (incrData?.result === 1) {
      await fetch(`${url}/expire/${encodeURIComponent(key)}/86400`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }
  } catch (err) {
    console.error("rate limit increment failed:", err);
  }
}
