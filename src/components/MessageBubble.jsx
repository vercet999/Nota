// ─── MessageBubble.jsx ──────────────────────────────────────────────────────
// Renders a single chat message. Assistant messages render markdown.
// ─────────────────────────────────────────────────────────────────────────────

import ReactMarkdown from 'react-markdown'

export function MessageBubble({ message }) {
  const isUser = message.role === 'user'

  return (
    <div className={`message-bubble ${isUser ? 'user' : 'assistant'}`}>
      {isUser ? (
        <p className="user-text">{message.content}</p>
      ) : (
        <div className="assistant-text">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
      )}
    </div>
  )
}

// ── Typing indicator shown while waiting for API ───────────────────────────
export function TypingIndicator() {
  return (
    <div className="message-bubble assistant typing-bubble">
      <div className="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  )
}
