# Nota Study AI

A personal AI study assistant built for focused study sessions, note review, and exam preparation.

## Features
- Chat with Claude using context from uploaded notes
- Upload PDF or `.txt` files so the assistant can answer from your material
- Choose between three study modes:
  - Normal: clear, thorough answers
  - Simplify: simple explanations with everyday examples
  - Exam Mode: structured, exam-ready answers
- Switch between Claude Haiku and Claude Sonnet models
- Use quick prompts for summaries, practice questions, key definitions, and Daily Guide-style rewrites
- Search chat history and bookmark useful messages
- Personalize the app with a saved name and accent color

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Set up your API key
```bash
cp .env.example .env
```
Then open `.env` and replace `your_claude_api_key_here` with your actual Claude API key.
Get one from: https://console.anthropic.com/

### 3. Run locally
```bash
npm run dev
```
Open http://localhost:5173

### 4. Build for production
```bash
npm run build
```

## Deploy to Vercel
1. Push to GitHub
2. Connect repo on vercel.com
3. Add `VITE_CLAUDE_API_KEY` in Vercel > Settings > Environment Variables
4. Deploy

## Troubleshooting
- If Vercel still says the API key is missing after you add `VITE_CLAUDE_API_KEY`, trigger a new deployment. In this app, Vite reads `import.meta.env.VITE_CLAUDE_API_KEY` at build time, so the value will not appear in an already deployed build.
