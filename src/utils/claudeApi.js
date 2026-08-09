// ─── claudeApi.js ───────────────────────────────────────────────────────────
// All communication with the Claude API lives here.
// Modes change the system prompt — same API call, different personality.
// ─────────────────────────────────────────────────────────────────────────────

const CLAUDE_API_URL = "/api/chat";

export const MODELS = {
  haiku: { id: "claude-haiku-4-5-20251001", label: "Haiku", badge: "Fast" },
  sonnet: { id: "claude-sonnet-4-6", label: "Sonnet", badge: "Deep" },
};
export const DEFAULT_MODEL = MODELS.haiku.id;

// ── System prompts per study mode ──────────────────────────────────────────
// Courses and institution come from the Profile (Settings → Profile), not
// hardcoded here — update the profile each semester instead of the code.

const buildCourseList = (courses) => {
  if (!courses || !courses.trim()) return "";
  return courses
    .split("\n")
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => `- ${c}`)
    .join("\n");
};

const getSystemPrompts = (userName, institution = "", courses = "", specialNotes = "") => {
  const courseList = buildCourseList(courses);
  const studiesLine = institution ? ` She studies at ${institution}.` : "";
  const coursesBlock = courseList
    ? `\n\nHer current courses this semester:\n${courseList}`
    : "";
  const notesBlock =
    specialNotes && specialNotes.trim()
      ? `\n\nAdditional guidance:\n${specialNotes.trim()}`
      : "";

  return {
    normal: `You are ${userName}'s personal study assistant.${studiesLine}${coursesBlock}${notesBlock}

Your job:
- Answer questions clearly and directly based on her uploaded notes when available
- When asked about theories or concepts, name the scholar/source and their key idea
- Connect abstract concepts to real, local (Ghanaian/African) examples where it helps understanding
- Format answers with short paragraphs, bold key terms, and numbered lists where helpful

Be her smartest study partner. Prioritise clarity.`,

    simple: `You are ${userName}'s study assistant. She is stuck and needs a simple explanation.${studiesLine}${coursesBlock}${notesBlock}

Your job:
- Break this down like you're explaining to someone hearing it for the first time
- No jargon unless you immediately define it in plain English
- Use everyday Ghanaian examples and analogies she would relate to
- Short sentences. Short paragraphs.
- End with: "In short: ..."

Make it click. That's the only goal.`,

    exam: `You are ${userName}'s exam coach.${studiesLine}${coursesBlock}${notesBlock}

Your job:
- Give structured, exam-format answers
- Lead with a clean definition or thesis statement
- Support with 2-3 key points — cite scholars/sources, use evidence
- Close with a strong concluding sentence
- Flag likely exam angles: "Examiners often ask about..."

Be precise. Be scoreable. Every word should be worth marks.`,
  };
};

// ── Main API call function ──────────────────────────────────────────────────

/**
 * sendMessage
 * @param {Array} messages - Full conversation history [{role, content}]
 * @param {string} mode - 'normal' | 'simple' | 'exam' | 'journalism'
 * @param {string} documentContext - Extracted text from uploaded PDF/file
 * @param {string} userName - The name of the user
 * @param {string} modelId - The ID of the Claude model to use
 * @param {object} academicContext - { institution, courses, specialNotes } from the Profile
 * @returns {string} - Claude's response text
 */
export async function sendMessage(
  messages,
  mode = "normal",
  documentContext = "",
  userName = "Adoma",
  modelId = DEFAULT_MODEL,
  academicContext = {},
) {
  const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;

  if (!apiKey || apiKey === "your_claude_api_key_here") {
    throw new Error(
      "No API key found. Add your Claude API key to the .env file.",
    );
  }

  const { institution = "", courses = "", specialNotes = "" } = academicContext || {};
  const prompts = getSystemPrompts(userName, institution, courses, specialNotes);

  // If there's an uploaded document, inject it into the system prompt
  const systemPrompt = documentContext
    ? `${prompts[mode]}\n\n--- ${userName.toUpperCase()}'S UPLOADED NOTES ---\n${documentContext}\n--- END OF NOTES ---\n\nUse these notes as your primary reference when answering.`
    : prompts[mode];

  const response = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 2048,
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
    // Strip markdown fences first
    const cleaned = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    // Extract the JSON array even if Claude added preamble/postamble text
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No JSON array found in response.");
    }
    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("Response was not a valid flashcard array.");
    }
    return parsed;
  } catch (err) {
    console.error("Flashcard parse error:", err, "\nRaw text:", text);
    throw new Error("Failed to parse generated flashcards. Please try again.");
  }
}

export async function generatePracticeQuiz(
  documentContext,
  modelId = DEFAULT_MODEL,
  numQuestions = 5,
  topicFocus = ""
) {
  let topicInstruction = "";
  if (topicFocus && topicFocus.trim()) {
    topicInstruction = `Specifically focus on these topics: "${topicFocus.trim()}".`;
  }

  const systemPrompt = `You are an expert study assistant. Generate a multiple-choice practice quiz based on the provided text. Return strictly a JSON array of objects.
  
${topicInstruction}

Output format MUST be JSON like this, with NO markdown formatting, NO \`\`\`json blocks, and NO extra text:
[
  { 
    "question": "Question text here?", 
    "options": ["Option A", "Option B", "Option C", "Option D"], 
    "correctAnswer": "Option B", 
    "explanation": "Explanation for why Option B is correct." 
  }
]
Note: Ensure the 'correctAnswer' exactly matches one of the strings in the 'options' array.`;

  const inputMessage = documentContext
    ? `Here is the material to base the quiz on:\n\n${documentContext}\n\nGenerate EXACTLY ${numQuestions} questions.`
    : `I don't have notes uploaded right now. Create EXACTLY ${numQuestions} general knowledge questions on Logic & Critical Thinking.`;

  const response = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 2048,
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
    const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array found in response.");
    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("Response was not a valid quiz array.");
    }
    return parsed;
  } catch (err) {
    console.error("Quiz parse error:", err, "\nRaw text:", text);
    throw new Error("Failed to parse generated quiz. Please try again.");
  }
}

export async function generateFillBlanks(
  documentContext,
  modelId = DEFAULT_MODEL,
  numItems = 5,
  topicFocus = ""
) {
  let topicInstruction = "";
  if (topicFocus && topicFocus.trim()) {
    topicInstruction = `Specifically focus on these topics: "${topicFocus.trim()}".`;
  }

  const systemPrompt = `You are an expert study assistant. Generate fill-in-the-blanks challenges based on the provided text. Return strictly a JSON array of objects.
  
${topicInstruction}

Output format MUST be JSON like this, with NO markdown formatting, NO \`\`\`json blocks, and NO extra text:
[
  { 
    "sentence": "The cell ___ regulates what enters and exits.", 
    "answer": "membrane", 
    "hint": "Outer layer of the cell" 
  }
]
Note: Use '___' (three underscores) for the blank in the sentence. Keep answers to 1-3 words.`;

  const inputMessage = documentContext
    ? `Here is the material to base the exercises on:\n\n${documentContext}\n\nGenerate EXACTLY ${numItems} fill-in-the-blanks sentences.`
    : `I don't have notes uploaded right now. Create EXACTLY ${numItems} general fill-in-the-blanks sentences on Communications.`;

  const response = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 2048,
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
    const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array found in response.");
    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("Response was not a valid fill-in-the-blanks array.");
    }
    return parsed;
  } catch (err) {
    console.error("Fill-blanks parse error:", err, "\nRaw text:", text);
    throw new Error("Failed to parse generated fill-in-the-blanks. Please try again.");
  }
}

// ── generateNotes ─────────────────────────────────────────────────────────────
// Takes document text (PDF, PPTX, DOCX, TXT, transcription)
// Returns structured study notes as markdown.
export async function generateNotes(documentText, modelId = DEFAULT_MODEL) {
  if (!documentText || documentText.trim() === "") {
    throw new Error("No document content to generate notes from.");
  }

  const system = `You are an expert study notes writer. Transform raw documents — lecture slides, transcriptions, PDFs, or any study material — into clean, well-structured study notes.

Format your notes using this exact structure:

## 📌 Overview
One paragraph summarising the main topic and purpose of the material.

## 🔑 Key Concepts
For each major concept:
**Concept Name** — clear, concise definition or explanation.

## 👤 Key Figures / Scholars (if any)
**Name** — their main idea or contribution relevant to this topic.

## 📖 Detailed Notes
Organised by topic/section. Use sub-headings, bullet points, and bold key terms.

## ❓ Likely Exam Questions
5 questions an examiner would most likely ask, based on this material.

## 🗂️ Summary
A short 3-5 sentence summary she can read the night before an exam.

Write for a Communication & Journalism diploma student. Be thorough but clear. Use markdown formatting throughout.`;

  const response = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 2048,
      system,
      messages: [
        {
          role: "user",
          content: `Please generate comprehensive study notes from the following document:\n\n${documentText}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Note generation failed.");
  }

  const data = await response.json();
  return data.content[0].text;
}

// ── generateSummary ─────────────────────────────────────────────────────────
export async function generateSummary(documentText, modelId = DEFAULT_MODEL) {
  if (!documentText || documentText.trim() === "") {
    throw new Error("No document content to generate summary from.");
  }

  const system = `You are an expert summarizer. Your task is to extract the most important information and summarize the provided document text concisely. Make it easy to digest quickly. Format with markdown bullet points.`;

  const response = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 1024,
      system,
      messages: [
        {
          role: "user",
          content: `Please generate a concise summary from the following text:\n\n${documentText}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Summary generation failed.");
  }

  const data = await response.json();
  return data.content[0].text;
}