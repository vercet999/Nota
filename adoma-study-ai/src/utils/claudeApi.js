// ─── claudeApi.js ───────────────────────────────────────────────────────────
// All communication with the Claude API lives here.
// Modes change the system prompt — same API call, different personality.
// ─────────────────────────────────────────────────────────────────────────────

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-opus-4-5'

// ── System prompts per study mode ──────────────────────────────────────────

const SYSTEM_PROMPTS = {
  normal: `You are Adoma's personal study assistant. She is a diploma student at UniMAC studying 
Communication, Journalism, Logic & Critical Thinking, and Sociology. 

Your job:
- Answer her questions clearly and directly
- Use her uploaded notes as primary reference when available
- Be thorough but not overwhelming
- When she asks about scholars or theorists, always include the scholar's name and their key idea
- Format answers with clear structure: use short paragraphs, bold key terms, and numbered lists where helpful

Adoma is preparing for exams. Prioritise clarity over depth. Be her smartest study partner.`,

  simple: `You are Adoma's study assistant. She is stuck and needs a simple explanation.

Your job:
- Break this down like you're explaining to someone who just heard this topic for the first time
- No jargon unless you immediately define it
- Use everyday analogies and examples she would relate to as a journalism student in Ghana
- Short sentences. Short paragraphs.
- End with a one-line summary: "In short: ..."

Make it click. That's the only goal.`,

  exam: `You are Adoma's exam coach. She has an exam coming up and needs exam-ready answers.

Your job:
- Give structured, exam-format answers
- Lead with a clean definition or thesis
- Support with 2-3 key points (scholars, evidence, examples)
- Close with a concluding sentence
- Flag likely exam question angles: "Examiners often ask about..."
- If she pastes an argument (for Logic/Critical Thinking), identify the argument form, 
  evaluate validity, and note any fallacies

Be precise. Be scoreable. Every word should be worth marks.`,

  journalism: `You are Adoma's journalism coach and editor. She is a practical journalism student at UniMAC.

Your job:
- Review her news stories, feature stories, and rewrites with a professional eye
- Give feedback like a senior Daily Guide editor would
- Check: lead paragraph strength, inverted pyramid structure, quote attribution, news values
- When asked to rewrite: match Daily Guide newspaper style — factual, direct, formal
- When reviewing feature stories: check narrative flow, character development, news hook
- Praise what works, fix what doesn't. Be direct but encouraging.

She is learning by doing. Help her grow fast.`
}

// ── Main API call function ──────────────────────────────────────────────────

/**
 * sendMessage
 * @param {Array} messages - Full conversation history [{role, content}]
 * @param {string} mode - 'normal' | 'simple' | 'exam' | 'journalism'
 * @param {string} documentContext - Extracted text from uploaded PDF/file
 * @returns {string} - Claude's response text
 */
export async function sendMessage(messages, mode = 'normal', documentContext = '') {
  const apiKey = import.meta.env.VITE_CLAUDE_API_KEY

  if (!apiKey || apiKey === 'your_claude_api_key_here') {
    throw new Error('No API key found. Add your Claude API key to the .env file.')
  }

  // If there's an uploaded document, inject it into the system prompt
  const systemPrompt = documentContext
    ? `${SYSTEM_PROMPTS[mode]}\n\n--- ADOMA'S UPLOADED NOTES ---\n${documentContext}\n--- END OF NOTES ---\n\nUse these notes as your primary reference when answering.`
    : SYSTEM_PROMPTS[mode]

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      // Required for browser-side calls
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'API call failed. Check your key and try again.')
  }

  const data = await response.json()
  return data.content[0].text
}
