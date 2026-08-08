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
    console.error("GEMINI_PROMPT_ENHANCER_KEY is missing");

    return res.status(500).json({
      error: "Gemini API key is not configured",
    });
  }

  // Handles accidental spaces or quotes copied into Vercel.
  const apiKey = rawApiKey.trim().replace(/^["']|["']$/g, "");

  if (!apiKey || apiKey.includes("GEMINI_PROMPT_ENHANCER_KEY=")) {
    console.error("GEMINI_PROMPT_ENHANCER_KEY contains an invalid value");

    return res.status(500).json({
      error: "Gemini API key configuration is invalid",
    });
  }

  try {
    const endpoint =
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      "gemini-2.5-flash:generateContent";

    const geminiResponse = await fetch(
      `${endpoint}?key=${encodeURIComponent(apiKey)}`,
      {
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
                  "prompt to make it clearer, more specific, and more " +
                  "effective. Preserve the user's original intention. Add " +
                  "useful context, structure, constraints, and examples " +
                  "when appropriate. Return only the improved prompt. Do " +
                  "not include explanations, preambles, markdown, or " +
                  "quotation marks.",
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
      }
    );

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error("Gemini API error:", {
        status: geminiResponse.status,
        message: data?.error?.message,
        statusText: data?.error?.status,
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

      console.error("Gemini returned no usable response:", {
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
    console.error("Prompt enhancer connection error:", error);

    return res.status(500).json({
      error: "Unable to connect to Gemini",
    });
  }
}
