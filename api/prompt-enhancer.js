export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_PROMPT_ENHANCER_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a prompt engineering expert. Rewrite the following prompt to be clearer, more specific, and more effective. Add context, structure, or examples where helpful. Return ONLY the improved prompt text — no explanation, no preamble, no markdown formatting.\n\nOriginal prompt:\n${prompt}`
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();
    const enhanced = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!enhanced) {
      console.error('Unexpected Gemini response:', JSON.stringify(data));
      return res.status(502).json({ error: 'Could not enhance prompt right now' });
    }

    return res.status(200).json({ enhanced: enhanced.trim() });
  } catch (err) {
    console.error('Prompt enhancer error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
