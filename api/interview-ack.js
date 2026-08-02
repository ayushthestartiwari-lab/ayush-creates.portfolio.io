// api/interview-ack.js
//
// Lightweight, fast endpoint used DURING the interview (not the final
// report). Two modes:
//
// 1. Plain ack (default): one-sentence, content-aware reaction to the
//    person's answer.
// 2. Follow-up (wantFollowUp: true): a reaction PLUS one natural
//    follow-up question about something specific they mentioned — makes
//    the interview feel like a real conversation instead of rapid-fire Q&A.
//
// Groq only (no Gemini fallback here) — this call needs to be fast
// enough not to slow the interview down. If it's not fast, the frontend
// just uses a canned line instead; this endpoint is a nice-to-have, not
// a blocker.
//
// Reuses the same Upstash Redis REST setup as interview-report.js for
// per-visitor daily rate limiting — this endpoint has no auth of its own,
// so without a cap it could be hit directly (bypassing the frontend) in
// a loop and burn through Groq quota.

const GROQ_MODEL = "llama-3.3-70b-versatile";
const REQUEST_TIMEOUT_MS = 3000; // tight — this must never noticeably slow the interview
const DAILY_LIMIT = 100; // acks per visitor per day — generous, since ~5-8 fire per interview
const MAX_ACK_WORDS = 30; // hard cap in case the model ignores the word-limit instruction
const MAX_FOLLOWUP_WORDS = 40; // follow-ups are reaction + question, so allow a bit more room

module.exports.config = { maxDuration: 10 };

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "server_misconfigured" });
    return;
  }

  const { question, answer, wantFollowUp } = req.body || {};
  if (typeof question !== "string" || typeof answer !== "string") {
    res.status(400).json({ error: "invalid_input" });
    return;
  }

  const trimmedAnswer = answer.trim();
  if (!trimmedAnswer) {
    // nothing worth reacting to — let the frontend fall back to a canned
    // line instead of spending a Groq call on an empty answer
    res.status(400).json({ error: "empty_answer" });
    return;
  }

  const safeQuestion = question.slice(0, 300);
  const safeAnswer = trimmedAnswer.slice(0, 800);
  const isFollowUp = wantFollowUp === true;
  const visitorId = getVisitorId(req);

  const remaining = await getRemainingQuota(visitorId);
  if (remaining !== null && remaining <= 0) {
    // over quota — fail fast and quiet, the frontend already treats any
    // non-200 here as "use the canned line", no need for a detailed error
    res.status(429).json({ error: "daily_limit_reached" });
    return;
  }

  const prompt = isFollowUp
    ? `You are a friendly technical interviewer having a natural conversation. The candidate was just asked: "${safeQuestion}" ` +
      `and answered: "${safeAnswer}". ` +
      `Write ONE short, natural reaction to something specific they said, immediately followed by ONE relevant follow-up ` +
      `question that digs a little deeper into their answer — the way a real interviewer would casually probe further. ` +
      `Keep it conversational, not formal. Do not use markdown. Keep the whole thing under 35 words total. ` +
      `Reply with just the reaction and question, nothing else.`
    : `You are a friendly technical interviewer. The candidate was just asked: "${safeQuestion}" ` +
      `and answered: "${safeAnswer}". ` +
      `Reply with ONE short, natural, conversational sentence reacting specifically to what they said — ` +
      `like a real interviewer would (e.g. referencing a detail they mentioned, or gently noting if it was vague). ` +
      `Do not ask a new question. Do not use markdown. Keep it under 20 words. Reply with just the sentence, nothing else.`;

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: isFollowUp ? 70 : 40
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutHandle);

    if (!response.ok) {
      res.status(502).json({ error: "groq_error" });
      return;
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) {
      res.status(502).json({ error: "empty_response" });
      return;
    }

    const maxWords = isFollowUp ? MAX_FOLLOWUP_WORDS : MAX_ACK_WORDS;
    const ack = capWords(text.replace(/^["']|["']$/g, ""), maxWords);

    // only consume quota once we actually have a usable ack to send back
    await incrementQuota(visitorId);

    res.status(200).json({ ack, isFollowUp });
  } catch (err) {
    clearTimeout(timeoutHandle);
    const status = err.name === "AbortError" ? 504 : 502;
    res.status(status).json({ error: "ack_failed" });
  }
};

// ---- helpers ----

function capWords(text, maxWords) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "...";
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
  return `interview_ack:${visitorId}:${today}`;
}

async function getRemainingQuota(visitorId) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null; // no Redis configured — fail open, don't block the interview

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
    return null; // fail open — a Redis hiccup shouldn't break the interview
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
