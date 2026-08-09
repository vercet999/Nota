// ─── MessageBubble.jsx ──────────────────────────────────────────────────────
// Renders a single chat message. Assistant messages render markdown.
// ─────────────────────────────────────────────────────────────────────────────

import ReactMarkdown from 'react-markdown'
import { motion } from 'motion/react'

export function MessageBubble({ message, isBookmarked, onToggleBookmark }) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      id={`msg-${message.id}`}
      className={`message-bubble ${isUser ? 'user' : 'assistant'}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {message.id && (
        <button 
          className={`bookmark-btn ${isBookmarked ? 'active' : ''}`}
          onClick={() => onToggleBookmark(message.id)}
          title={isBookmarked ? "Remove bookmark" : "Bookmark message"}
          aria-label="Toggle bookmark"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      )}
      {isUser ? (
        <p className="user-text">{message.content}</p>
      ) : (
        <div className="assistant-text">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
      )}
    </motion.div>
  )
}

// ── Typing indicator shown while waiting for API ───────────────────────────
export function TypingIndicator() {
  return (
    <motion.div
      className="message-bubble assistant typing-bubble"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </motion.div>
  )
}
