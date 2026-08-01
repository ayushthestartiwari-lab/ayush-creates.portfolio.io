// api/interview-ack.js
//
// Lightweight, fast endpoint used DURING the interview (not the final
// report). Generates a one-sentence, content-aware reaction to the
// person's answer — e.g. "Good point about garbage collection being
// automatic" instead of a generic "Okay, interesting."
//
// Groq only (no Gemini fallback here) — this call needs to be fast
// enough not to slow the interview down. If it's not fast, the frontend
// just uses a canned line instead; this endpoint is a nice-to-have, not
// a blocker.

const GROQ_MODEL = "llama-3.3-70b-versatile";
const REQUEST_TIMEOUT_MS = 3000; // tight — this must never noticeably slow the interview

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

  const { question, answer } = req.body || {};
  if (typeof question !== "string" || typeof answer !== "string") {
    res.status(400).json({ error: "invalid_input" });
    return;
  }

  const safeQuestion = question.slice(0, 300);
  const safeAnswer = answer.slice(0, 800);

  const prompt =
    `You are a friendly technical interviewer. The candidate was just asked: "${safeQuestion}" ` +
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
        temperature: 0.6,
        max_tokens: 40
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

    res.status(200).json({ ack: text.replace(/^["']|["']$/g, "") });
  } catch (err) {
    clearTimeout(timeoutHandle);
    const status = err.name === "AbortError" ? 504 : 502;
    res.status(status).json({ error: "ack_failed" });
  }
};
