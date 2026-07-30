// api/beai.js
// Vercel Serverless Function — proxies chat messages to the Gemini API,
// with a per-visitor daily question limit backed by Upstash Redis.
//
// Required env vars (set in Vercel Project Settings → Environment Variables):
//   GEMINI_API_KEY               — your Gemini API key
//   UPSTASH_REDIS_REST_URL       — from your Upstash Redis database
//   UPSTASH_REDIS_REST_TOKEN     — from your Upstash Redis database

const DAILY_LIMIT = 15;

const SYSTEM_PROMPT = `You are BeAI, the coding assistant built into the "Be Ahead" learning platform
(be-ahead.vercel.app), which teaches Python, JavaScript, Java, Go, HTML, and Rust.

When a user asks you to SOLVE A PROBLEM (write a function, solve a coding challenge, "how do I do X"),
do NOT give the full code answer immediately. Instead, guide them to think it through first:
1. Ask what the problem is really asking them to find, or what steps they'd take, before writing code.
2. Wait for their attempt. If they respond with an idea, react to it — confirm what's right, nudge what's missing.
3. Only give full working code once they've made a real attempt at the reasoning, OR if they explicitly
   say they're stuck and want the answer, OR if they directly ask for the code.
Keep each guiding question short — one question at a time, not a list.

This does NOT apply to: syntax questions ("how do I write a for loop"), debugging questions where they've
pasted their own broken code, definitions, or general concept explanations. Answer those directly and clearly.

Keep answers concise and beginner-friendly unless the question is clearly advanced.
If asked something unrelated to programming/learning, gently steer back to coding topics.`;

// --- Upstash Redis REST helpers (no SDK needed, just fetch) ---
async function redisIncrWithExpiry(key, ttlSeconds) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null; // Redis not configured — limiting disabled

  const headers = { Authorization: `Bearer ${token}` };

  // INCR the key
  const incrRes = await fetch(`${url}/incr/${encodeURIComponent(key)}`, { headers });
  const incrData = await incrRes.json();
  const count = incrData.result;

  // First time this key is seen today — set it to expire
  if (count === 1) {
    await fetch(`${url}/expire/${encodeURIComponent(key)}/${ttlSeconds}`, { headers });
  }

  return count;
}

function getVisitorId(req) {
  const fwd = req.headers["x-forwarded-for"];
  const ip = (Array.isArray(fwd) ? fwd[0] : fwd || "")
    .split(",")[0]
    .trim();
  return ip || "unknown";
}

function getTodayKey(visitorId) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `beai:count:${today}:${visitorId}`;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server misconfigured: missing GEMINI_API_KEY" });
    return;
  }

  // --- Rate limit check ---
  const visitorId = getVisitorId(req);
  const key = getTodayKey(visitorId);
  let count = null;
  try {
    count = await redisIncrWithExpiry(key, 60 * 60 * 26); // expire ~26h, covers timezone drift
  } catch (err) {
    console.error("Rate limit check failed, allowing request:", err);
  }

  if (count !== null && count > DAILY_LIMIT) {
    res.status(429).json({
      error: `You've hit today's limit of ${DAILY_LIMIT} questions. Come back tomorrow!`,
      limitReached: true,
    });
    return;
  }

  // --- Parse body ---
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  const message = (body && body.message ? String(body.message) : "").trim();
  const history = Array.isArray(body && body.history) ? body.history : [];

  if (!message) {
    res.status(400).json({ error: "Missing 'message' in request body" });
    return;
  }
  if (message.length > 2000) {
    res.status(400).json({ error: "Message too long (max 2000 characters)" });
    return;
  }

  const contents = [
    ...history
      .filter((m) => m && (m.role === "user" || m.role === "model") && typeof m.text === "string")
      .slice(-10)
      .map((m) => ({ role: m.role, parts: [{ text: m.text.slice(0, 2000) }] })),
    { role: "user", parts: [{ text: message }] },
  ];

  try {
    const geminiRes = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", geminiRes.status, errText);
      res.status(502).json({ error: "Upstream AI service error", debug: errText });
      return;
    }

    const data = await geminiRes.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") ||
      "Sorry, I couldn't generate a response. Please try again.";

    const remaining = count !== null ? Math.max(DAILY_LIMIT - count, 0) : null;
    res.status(200).json({ reply, remaining });
  } catch (err) {
    console.error("BeAI handler error:", err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};
