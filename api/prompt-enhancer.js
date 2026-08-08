export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");

    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  const prompt = req.body?.prompt;

  if (typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({
      error: "Prompt is required",
    });
  }

  const rawApiKey = process.env.GEMINI_PROMPT_ENHANCER_KEY;

  if (!rawApiKey) {
    console.error("Missing GEMINI_PROMPT_ENHANCER_KEY");

    return res.status(500).json({
      error: "Gemini API key is not configured",
    });
  }

  const apiKey = rawApiKey.trim().replace(/^["']|["']$/g, "");

  try {
    const model = "gemini-3.5-flash";

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/` +
      `${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const geminiResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text:
                "You are an expert prompt engineer. Rewrite the user's " +
                "prompt to make it clearer, more specific, and more effective. " +
                "Preserve the user's original intention. Add useful context, " +
                "structure, constraints, and examples when appropriate. " +
                "Return only the improved prompt. Do not include explanations, " +
                "preambles, markdown, or quotation marks.",
            },
          ],
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: prompt.trim(),
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
        },
      }),
    });

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error("Gemini API error:", {
        status: geminiResponse.status,
        data,
      });

      return res.status(geminiResponse.status).json({
        error:
          data?.error?.message ||
          `Gemini request failed with status ${geminiResponse.status}`,
      });
    }

    const enhanced = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text || "")
      .join("")
      .trim();

    if (!enhanced) {
      const reason =
        data?.promptFeedback?.blockReason ||
        data?.candidates?.[0]?.finishReason ||
        "Gemini returned no text";

      console.error("Gemini returned no usable text:", {
        reason,
        data,
      });

      return res.status(502).json({
        error: `Could not enhance prompt: ${reason}`,
      });
    }

    return res.status(200).json({
      enhanced,
    });
  } catch (error) {
    console.error("Prompt enhancer error:", error);

    return res.status(500).json({
      error: "Unable to connect to Gemini",
    });
  }
}
