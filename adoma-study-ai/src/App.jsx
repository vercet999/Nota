// ─── App.jsx ────────────────────────────────────────────────────────────────
// Root component. Layout: header → chat window → controls → input
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef } from 'react'
import { useChat } from './hooks/useChat'
import { ChatWindow } from './components/ChatWindow'
import { ModeSelector } from './components/ModeSelector'
import { FileUpload } from './components/FileUpload'

export default function App() {
  const {
    messages,
    mode,
    setMode,
    isLoading,
    error,
    uploadedFileName,
    sendUserMessage,
    handleFileUpload,
    clearSession
  } = useChat()

  const [inputText, setInputText] = useState('')
  const textareaRef = useRef(null)

  const handleSubmit = async () => {
    if (!inputText.trim() || isLoading) return
    const text = inputText
    setInputText('')
    textareaRef.current?.focus()
    await sendUserMessage(text)
  }

  const handleKeyDown = (e) => {
    // Send on Enter, new line on Shift+Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // Quick prompt buttons for common tasks
  const QUICK_PROMPTS = [
    { label: '📝 Summarise my notes', text: 'Summarise the key points from my uploaded notes.' },
    { label: '❓ Practice questions', text: 'Generate 5 exam practice questions from my notes.' },
    { label: '🔑 Key definitions', text: 'List the most important definitions and terms I need to know.' },
    { label: '📰 Rewrite for Daily Guide', text: 'Rewrite the following story in Daily Guide newspaper style:\n\n[Paste your story here]' }
  ]

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">Adoma</h1>
          <span className="app-subtitle">Study AI</span>
        </div>
        <div className="header-right">
          {messages.length > 0 && (
            <button className="clear-btn" onClick={clearSession} title="Start a new session">
              New Session
            </button>
          )}
        </div>
      </header>

      {/* ── Chat Area ── */}
      <main className="chat-area">
        <ChatWindow messages={messages} isLoading={isLoading} />
      </main>

      {/* ── Error banner ── */}
      {error && (
        <div className="error-banner">
          ⚠️ {error}
        </div>
      )}

      {/* ── Controls (mode + upload) ── */}
      <div className="controls-bar">
        <ModeSelector activeMode={mode} onModeChange={setMode} />
        <FileUpload
          onFileUpload={handleFileUpload}
          uploadedFileName={uploadedFileName}
          isLoading={isLoading}
        />
      </div>

      {/* ── Quick Prompts ── */}
      <div className="quick-prompts">
        {QUICK_PROMPTS.map((qp) => (
          <button
            key={qp.label}
            className="quick-prompt-btn"
            onClick={() => {
              setInputText(qp.text)
              textareaRef.current?.focus()
            }}
            disabled={isLoading}
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* ── Input Area ── */}
      <div className="input-area">
        <textarea
          ref={textareaRef}
          className="message-input"
          placeholder="Ask anything — type your question or paste your notes..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          rows={2}
        />
        <button
          className="send-btn"
          onClick={handleSubmit}
          disabled={isLoading || !inputText.trim()}
        >
          {isLoading ? (
            <span className="sending">...</span>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
