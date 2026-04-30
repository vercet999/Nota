# Adoma — Study AI 📚

A personal AI study assistant built for Adoma, Communication & Journalism student at UniMAC.

## Features (Starter)
- 💬 Chat with context from uploaded notes
- 📄 Upload PDFs or .txt notes — AI reads them with you
- 🎯 4 Study Modes: Normal, Simplify, Exam Mode, Journalism Coach
- ⚡ Quick prompts: Summarise, Practice Questions, Key Definitions, Daily Guide rewrite

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
3. Add `VITE_CLAUDE_API_KEY` in Vercel → Settings → Environment Variables
4. Deploy

## Next steps
See `PROMPTS.md` for AI Studio prompts to add: Practice Quiz, Flashcards, Summary Tool, Pomodoro timer.
