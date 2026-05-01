// ─── api/chat.js ────────────────────────────────────────────────────────────
// Vercel serverless function: Proxy for Claude API calls
// Runs server-side, has access to CLAUDE_API_KEY from environment
// ─────────────────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // ── CORS headers for every response ──────────────────────────────────────
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ── Handle OPTIONS preflight requests ────────────────────────────────────
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // ── Only allow POST ──────────────────────────────────────────────────────
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // ── Get API key from environment ─────────────────────────────────────
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "Server configuration error: CLAUDE_API_KEY not set",
      });
    }

    // ── Extract request body ─────────────────────────────────────────────
    const { messages, mode, documentContext, model } = req.body;

    if (!messages || !model) {
      return res.status(400).json({
        error: "Missing required fields: messages and model",
      });
    }

    // ── Forward to Anthropic API ────────────────────────────────────────
    const anthropicResponse = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 1024,
          system: req.body.system, // Sent from client-side already formatted
          messages: messages,
        }),
      }
    );

    // ── Handle Anthropic API errors ────────────────────────────────────
    if (!anthropicResponse.ok) {
      const errorData = await anthropicResponse.json();
      return res.status(anthropicResponse.status).json({
        error: errorData.error?.message || "Anthropic API error",
      });
    }

    // ── Return Claude's response ────────────────────────────────────────
    const data = await anthropicResponse.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error("Chat API error:", error);
    return res.status(500).json({
      error: error.message || "Internal server error",
    });
  }
}
