export default async function handler(req, res) {
  try {

    if (req.method !== "POST") {
      return res.status(200).json({ reply: "Be AI is running" });
    }

    const message = req.body?.message;

    if (!message) {
      return res.status(400).json({ reply: "No message received" });
    }

    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({ reply: "API key missing in Vercel" });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are Be AI. Answer coding questions only.

User: ${message}`
            }]
          }]
        })
      }
    );

    const data = await response.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No AI response";

    return res.status(200).json({ reply });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ reply: "Server crashed" });
  }
}