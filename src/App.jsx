// ─── App.jsx ────────────────────────────────────────────────────────────────
// Root component. Layout: header → chat window → controls → input
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react'
import { useChat } from './hooks/useChat'
import { ChatWindow } from './components/ChatWindow'
import { ModeSelector } from './components/ModeSelector'
import { FileUpload } from './components/FileUpload'
import { SettingsModal } from './components/SettingsModal'

export default function App() {
  const [userName, setUserName] = useState(() => localStorage.getItem('study_userName') || '')
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('study_accentColor') || '#e8a030')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [showActionMenu, setShowActionMenu] = useState(false)

  const activeName = userName.trim() || 'Royalty'

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accentColor)
  }, [accentColor])

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
    setShowActionMenu(false)
    textareaRef.current?.focus()
    await sendUserMessage(text, activeName)
  }

  const handleKeyDown = (e) => {
    // Send on Enter, new line on Shift+Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleSaveSettings = (name, color) => {
    setUserName(name)
    setAccentColor(color)
    localStorage.setItem('study_userName', name)
    localStorage.setItem('study_accentColor', color)
    setIsSettingsOpen(false)
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
          <h1 className="app-title">Nota</h1>
          <span className="app-subtitle">Study AI</span>
        </div>
        <div className="header-right" style={{ display: 'flex', gap: '8px' }}>
          {messages.length > 0 && (
            <button className="clear-btn" onClick={clearSession} title="Start a new session">
              New Session
            </button>
          )}
          <button className="clear-btn" onClick={() => setIsSettingsOpen(true)} title="Settings" aria-label="Settings">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
        </div>
      </header>

      {/* ── Chat Area ── */}
      <main className="chat-area">
        <ChatWindow messages={messages} isLoading={isLoading} userName={activeName} />
      </main>

      {/* ── Error banner ── */}
      {error && (
        <div className="error-banner">
          ⚠️ {error}
        </div>
      )}

      {/* ── Input Area ── */}
      <div className="input-area" style={{ position: 'relative' }}>
        
        {/* Action Menu Popover */}
        {showActionMenu && (
          <div className="action-menu-popover">
            <div className="controls-bar" style={{ borderTop: 'none', padding: 0 }}>
              <ModeSelector activeMode={mode} onModeChange={setMode} />
              <FileUpload
                onFileUpload={(file) => {
                  handleFileUpload(file)
                  setShowActionMenu(false)
                }}
                uploadedFileName={uploadedFileName}
                isLoading={isLoading}
              />
            </div>
            
            <div className="quick-prompts" style={{ padding: 0 }}>
              {QUICK_PROMPTS.map((qp) => (
                <button
                  key={qp.label}
                  className="quick-prompt-btn"
                  onClick={() => {
                    setInputText(qp.text)
                    setShowActionMenu(false)
                    textareaRef.current?.focus()
                  }}
                  disabled={isLoading}
                >
                  {qp.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <button 
          className={`plus-btn ${showActionMenu ? 'active' : ''}`}
          onClick={() => setShowActionMenu(!showActionMenu)}
          disabled={isLoading}
          aria-label="Toggle actions"
        >
          +
        </button>

        <textarea
          ref={textareaRef}
          className="message-input"
          placeholder="Ask anything — type your question or paste your notes..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          rows={1}
          style={{ minHeight: '44px' }}
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

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentName={userName}
        currentColor={accentColor}
        onSave={handleSaveSettings}
      />
    </div>
  )
}
