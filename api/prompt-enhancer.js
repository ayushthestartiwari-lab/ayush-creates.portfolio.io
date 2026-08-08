export default async function handler(req, res) {
  // Allow only POST requests
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");

    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  // Read the request body safely
  const { prompt } = req.body || {};

  if (typeof prompt !== "string" || prompt.trim().length === 0) {
    return res.status(400).json({
      error: "Prompt is required",
    });
  }

  const apiKey = process.env.GEMINI_PROMPT_ENHANCER_KEY;

  if (!apiKey) {
    console.error(
      "Missing GEMINI_PROMPT_ENHANCER_KEY environment variable"
    );

    return res.status(500).json({
      error: "Gemini API key is not configured",
    });
  }

  try {
    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: [
                  "You are an expert prompt engineer.",
                  "Rewrite the user's prompt to make it clearer, more specific, and more effective.",
                  "Add useful context, structure, constraints, and examples when appropriate.",
                  "Preserve the user's original intention.",
                  "Return only the improved prompt.",
                  "Do not include explanations, preambles, markdown, or quotation marks.",
                ].join(" "),
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

    // Do not hide Gemini's actual error
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
      ?.map((part) => part.text || "")
      .join("")
      .trim();

    // Handle blocked or empty responses
    if (!enhanced) {
      const reason =
        data?.promptFeedback?.blockReason ||
        data?.candidates?.[0]?.finishReason ||
        "Gemini returned an empty response";

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
