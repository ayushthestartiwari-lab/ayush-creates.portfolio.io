// api/interview-report.js
//
// Vercel serverless function. Takes an interview transcript and generates
// a structured interview report.
//
// Provider strategy: Groq is tried first (dedicated LPU hardware, rarely
// overloaded, fast) — Gemini is the fallback if Groq fails for any reason.
// Each provider has its own API key/quota, fully separate from BeAI's key.
//
// Reuses the same Upstash Redis REST setup as BeAI for per-visitor daily
// rate limiting.

const GROQ_MODEL = "openai/gpt-oss-120b";
const GEMINI_MODEL = "gemini-3.6-flash";
const GEMINI_FALLBACK_MODEL = "gemini-2.5-flash";

const REQUEST_TIMEOUT_MS = 20000; // per provider attempt
const DAILY_LIMIT = 5; // successful reports per visitor per day
const MAX_QUESTIONS = 10;
const MAX_ANSWER_CHARS = 2000;

module.exports.config = { maxDuration: 30 };

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY_INTERVIEW;

  if (!groqKey && !geminiKey) {
    console.error("Missing both GROQ_API_KEY and GEMINI_API_KEY_INTERVIEW");
    res.status(500).json({ error: "server_misconfigured" });
    return;
  }

  // ---- validate input ----
  const { topic, transcript, faceMetrics } = req.body || {};

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

  const safeFaceMetrics = Array.isArray(faceMetrics) ? faceMetrics.slice(0, MAX_QUESTIONS) : null;
  const cameraSummaryText = buildCameraSummaryText(safeFaceMetrics, cleanTranscript.length);

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

  const systemPrompt = `You are an experienced technical interview coach reviewing a mock interview transcript for a student learning ${safeTopic} on a platform called Be Ahead. You will also receive a webcam eye-contact summary — use it to give brief, constructive presence/confidence feedback, but keep the main focus on the content of the answers. Respond ONLY with valid JSON, no markdown fences, no preamble, matching exactly this shape:

{
  "overall_score": <integer 1-10>,
  "summary": "<2-3 sentence overall impression>",
  "strengths": ["<short point>", "<short point>", "<short point>"],
  "areas_to_improve": ["<short point>", "<short point>", "<short point>"],
  "per_question_feedback": [
    { "question": "<question text>", "feedback": "<1-2 sentence feedback on this specific answer>" }
  ],
  "camera_presence": {
    "average_eye_contact_percent": <integer 0-100, or null if no data was provided>,
    "note": "<1 short, encouraging sentence about their camera presence — mention it only if the data suggests something worth noting, otherwise keep it brief and positive>"
  },
  "next_steps": ["<concrete, actionable suggestion>", "<concrete, actionable suggestion>"]
}`;

  const userPrompt = `Here is the full Q&A transcript from a spoken mock interview:\n\n${transcriptText}\n\n${cameraSummaryText}`;

  // ---- try providers in order: Groq first, Gemini as fallback ----
  let rawText = null;
  let lastError = null;

  if (groqKey) {
    try {
      rawText = await callGroq(groqKey, systemPrompt, userPrompt);
    } catch (err) {
      console.error("Groq failed, falling back to Gemini:", err.message);
      lastError = err;
    }
  }

  if (!rawText && geminiKey) {
    for (const model of [GEMINI_MODEL, GEMINI_FALLBACK_MODEL]) {
      try {
        rawText = await callGemini(geminiKey, model, `${systemPrompt}\n\n${userPrompt}`);
        break;
      } catch (err) {
        console.error(`Gemini (${model}) failed:`, err.message);
        lastError = err;
      }
    }
  }

  if (!rawText) {
    const status = lastError?.status || 502;
    res.status(status === 429 ? 429 : 502).json({
      error: "all_providers_failed",
      detail: lastError?.message || "could not reach any AI provider"
    });
    return;
  }

  let report;
  try {
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    report = JSON.parse(cleaned);
  } catch (parseErr) {
    console.error("Failed to parse AI JSON output:", rawText);
    res.status(502).json({ error: "invalid_json_from_ai" });
    return;
  }

  const safeReport = normalizeReport(report);

  // ---- only now consume quota, since generation actually succeeded ----
  await incrementQuota(visitorId);

  res.status(200).json({ report: safeReport });
};

// ---- provider calls ----

async function callGroq(apiKey, systemPrompt, userPrompt) {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.4,
        response_format: { type: "json_object" }
      }),
      signal: controller.signal
    });
  } catch (err) {
    clearTimeout(timeoutHandle);
    if (err.name === "AbortError") throw makeErr("Groq request timed out", 504);
    throw makeErr(`Groq unreachable: ${err.message}`, 502);
  }
  clearTimeout(timeoutHandle);

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const msg = data?.error?.message || `Groq returned ${response.status}`;
    throw makeErr(msg, response.status);
  }

  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw makeErr("Groq returned an empty response", 502);
  return text;
}

async function callGemini(apiKey, model, prompt) {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, responseMimeType: "application/json" }
        }),
        signal: controller.signal
      }
    );
  } catch (err) {
    clearTimeout(timeoutHandle);
    if (err.name === "AbortError") throw makeErr(`Gemini (${model}) timed out`, 504);
    throw makeErr(`Gemini (${model}) unreachable: ${err.message}`, 502);
  }
  clearTimeout(timeoutHandle);

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const msg = data?.error?.message || `Gemini (${model}) returned ${response.status}`;
    throw makeErr(msg, response.status);
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw makeErr(`Gemini (${model}) returned an empty response`, 502);
  return text;
}

function makeErr(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

// ---- helpers ----

function buildCameraSummaryText(faceMetrics, questionCount) {
  if (!Array.isArray(faceMetrics) || faceMetrics.length === 0) {
    return "No webcam eye-contact data was available for this session.";
  }

  const valid = faceMetrics.filter(
    (m) => m && typeof m.eye_contact_percent === "number" && m.eye_contact_percent >= 0 && m.eye_contact_percent <= 100
  );

  if (!valid.length) {
    return "No webcam eye-contact data was available for this session.";
  }

  const avg = Math.round(valid.reduce((sum, m) => sum + m.eye_contact_percent, 0) / valid.length);
  const lookAwayCount = faceMetrics.filter((m) => m && m.looked_away_events > 0).length;

  return (
    `Webcam eye-contact summary: average eye contact was approximately ${avg}% across ${valid.length} of ${questionCount} questions. ` +
    `The candidate looked away from the camera long enough to pause the interview during ${lookAwayCount} question(s).`
  );
}

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
    camera_presence: normalizeCameraPresence(report.camera_presence),
    next_steps: Array.isArray(report.next_steps) ? report.next_steps.filter((s) => typeof s === "string") : []
  };
}

function normalizeCameraPresence(cp) {
  if (!cp || typeof cp !== "object") return { average_eye_contact_percent: null, note: "" };
  const pct = Number(cp.average_eye_contact_percent);
  return {
    average_eye_contact_percent: Number.isFinite(pct) ? Math.min(100, Math.max(0, Math.round(pct))) : null,
    note: typeof cp.note === "string" ? cp.note : ""
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
  const today = new Date().toISOString().slice(0, 10);
  return `interview_report:${visitorId}:${today}`;
}

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
    return null;
  }
}

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
