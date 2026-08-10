# Nota — Study AI 📚

Nota is a personal study assistant for turning notes, lectures, and uploaded documents into focused learning support. It helps students chat with their course material, extract key ideas, generate quizzes, and revise with AI-backed study workflows.

## Features

- 💬 AI chat with course and document context
- 📄 Upload PDFs, DOCX, and text files for study assistance
- 🧠 Multiple study modes: Normal, Simplify, Exam Mode, and Journalism Coach
- 📝 Generate flashcards, practice quizzes, and fill-in-the-blank drills
- 🔎 Search and review saved notes, summaries, and session history
- 🎯 Course-aware learning with profile and study context controls
- 💾 Local storage and Supabase-backed session persistence
- 📱 PWA-friendly frontend for a smoother desktop/mobile experience

## Tech stack

- React + Vite
- Express server for Claude API proxying
- Anthropic Claude API
- Supabase for profile/session persistence
- PDF/DOCX text extraction utilities

## Project structure

```text
.
├── src/
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
├── public/
├── .env.example
├── server.js
├── vite.config.js
├── package.json
├── README.md
└── index.html
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Then add your credentials in `.env`:

```env
VITE_CLAUDE_API_KEY=your_claude_api_key_here
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

- Get your Claude API key from: https://console.anthropic.com/
- Configure Supabase if you want saved sessions, notes, and profile data

### 3. Run locally

```bash
npm run dev
```

The app will run on:

```text
http://localhost:3000
```

### 4. Build for production

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

## Deployment

This project is designed to run on a Node environment with environment variables configured. For deployment platforms such as Vercel or Render, set the same variables in the host environment and ensure the server can start successfully.

Typical required variables:

- `VITE_CLAUDE_API_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Notes

- The app proxies Claude calls through the local Express server in `server.js`.
- Some features fall back to browser localStorage if Supabase is unavailable.
- For best results, upload clean notes and PDFs before starting a deep study session.

## License

This project is currently unlicensed unless otherwise specified by the repository owner.
