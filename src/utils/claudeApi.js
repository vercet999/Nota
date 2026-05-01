// ─── claudeApi.js ───────────────────────────────────────────────────────────
// All communication with the Claude API lives here.
// Modes change the system prompt — same API call, different personality.
// ─────────────────────────────────────────────────────────────────────────────

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

export const MODELS = {
  haiku: { id: "claude-haiku-4-5-20251001", label: "Haiku", badge: "Fast" },
  sonnet: { id: "claude-sonnet-4-6", label: "Sonnet", badge: "Deep" },
};
export const DEFAULT_MODEL = MODELS.haiku.id;

// ── System prompts per study mode ──────────────────────────────────────────

const getSystemPrompts = (userName) => ({
  normal: `You are ${userName}'s personal study assistant. The student is studying Communication, Journalism, Logic & Critical Thinking, and Sociology. 

Your job:
- Answer questions clearly and directly
- Use their uploaded notes as primary reference when available
- Be thorough but not overwhelming
- When asked about scholars or theorists, always include the scholar's name and their key idea
- Format answers with clear structure: use short paragraphs, bold key terms, and numbered lists where helpful

${userName} is preparing for exams. Prioritise clarity over depth. Be their smartest study partner.`,

  simple: `You are ${userName}'s study assistant. The student is stuck and needs a simple explanation.

Your job:
- Break this down like you're explaining to someone who just heard this topic for the first time
- No jargon unless you immediately define it
- Use everyday analogies and examples they would relate to as a journalism student in Ghana
- Short sentences. Short paragraphs.
- End with a one-line summary: "In short: ..."

Make it click. That's the only goal.`,

  exam: `You are ${userName}'s exam coach. ${userName} has an exam coming up and needs exam-ready answers.

Your job:
- Give structured, exam-format answers
- Lead with a clean definition or thesis
- Support with 2-3 key points (scholars, evidence, examples)
- Close with a concluding sentence
- Flag likely exam question angles: "Examiners often ask about..."
- If an argument is pasted (for Logic/Critical Thinking), identify the argument form, 
  evaluate validity, and note any fallacies

Be precise. Be scoreable. Every word should be worth marks.`,
});

// ── Main API call function ──────────────────────────────────────────────────

/**
 * sendMessage
 * @param {Array} messages - Full conversation history [{role, content}]
 * @param {string} mode - 'normal' | 'simple' | 'exam' | 'journalism'
 * @param {string} documentContext - Extracted text from uploaded PDF/file
 * @param {string} userName - The name of the user
 * @param {string} modelId - The ID of the Claude model to use
 * @returns {string} - Claude's response text
 */
export async function sendMessage(
  messages,
  mode = "normal",
  documentContext = "",
  userName = "Adoma",
  modelId = DEFAULT_MODEL,
) {
  const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;

  if (!apiKey || apiKey === "your_claude_api_key_here") {
    throw new Error(
      "No API key found. Add your Claude API key to the .env file.",
    );
  }

  const prompts = getSystemPrompts(userName);

  // If there's an uploaded document, inject it into the system prompt
  const systemPrompt = documentContext
    ? `${prompts[mode]}\n\n--- ${userName.toUpperCase()}'S UPLOADED NOTES ---\n${documentContext}\n--- END OF NOTES ---\n\nUse these notes as your primary reference when answering.`
    : prompts[mode];

  const response = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      // Required for browser-side calls
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map(({ role, content }) => ({ role, content })),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.error?.message || "API call failed. Check your key and try again.",
    );
  }

  const data = await response.json();
  return data.content[0].text;
}

export async function generateSessionTitle(
  messageContent,
  modelId = DEFAULT_MODEL,
) {
  const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;
  if (!apiKey || apiKey === "your_claude_api_key_here") {
    throw new Error(
      "No API key found. Add your Claude API key to the .env file.",
    );
  }

  const systemPrompt = `You are a helpful assistant. Generate a 4-6 word title summarizing the user's message. Output ONLY the title, no quotes, no extra text.`;

  const response = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 20,
      system: systemPrompt,
      messages: [{ role: "user", content: messageContent }],
    }),
  });

  if (!response.ok) {
    return "New Conversation"; // Fallback gracefully
  }

  const data = await response.json();
  const text = data.content[0].text.trim();
  return text.substring(0, 60); // Safety limit
}

export async function generateFlashcards(
  documentContext,
  modelId = DEFAULT_MODEL,
  numCards = 5,
  mode = "normal",
  topicFocus = "",
) {
  const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;
  if (!apiKey || apiKey === "your_claude_api_key_here") {
    throw new Error(
      "No API key found. Add your Claude API key to the .env file.",
    );
  }

  let modeInstruction = "";
  if (mode === "simple")
    modeInstruction =
      "Make the definitions very simple, broken down for beginners, without jargon.";
  if (mode === "exam")
    modeInstruction =
      "Make the definitions structured as exam-ready answers, leading with a clean definition and supported with key points.";
  if (mode === "normal")
    modeInstruction = "Make the definitions clear and direct.";

  let topicInstruction = "";
  if (topicFocus && topicFocus.trim()) {
    topicInstruction = `Specifically focus on extracting flashcards related to these keywords or topics: "${topicFocus.trim()}".`;
  }

  const systemPrompt = `You are an expert study assistant. Your task is to extract key concepts and definitions from the provided notes and return them as an array of flashcards in strictly valid JSON format.
  
${modeInstruction}
${topicInstruction}

Output format MUST be JSON like this, with NO markdown formatting, NO \`\`\`json blocks, and NO extra text:
[
  { "term": "...", "definition": "..." },
  { "term": "...", "definition": "..." }
]`;

  const inputMessage = documentContext
    ? `Here are the uploaded notes to generate flashcards from:\n\n${documentContext}\n\nGenerate EXACTLY ${numCards} flashcards based on the key concepts.`
    : `I don't have notes uploaded right now. Create EXACTLY ${numCards} general flashcards on Critical Thinking.`;

  const response = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: inputMessage }],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.error?.message || "API call failed. Check your key and try again.",
    );
  }

  const data = await response.json();
  const text = data.content[0].text.trim();

  try {
    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(cleaned);
  } catch (error) {
    throw new Error("Failed to parse generated flashcards. Please try again.");
  }
}
