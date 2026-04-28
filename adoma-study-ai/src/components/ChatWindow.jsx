// ─── ChatWindow.jsx ─────────────────────────────────────────────────────────
// Scrollable message history. Auto-scrolls to latest message.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react'
import { MessageBubble, TypingIndicator } from './MessageBubble'

const WELCOME_MESSAGE = `Hi Adoma 👋 I'm your personal study assistant.

Here's what I can do:
- **Answer questions** from your notes or any topic you're studying
- **Upload a PDF or .txt** of your notes and I'll study them with you
- **Switch modes** — Normal for clear answers, Simplify to break it down, Exam Mode for structured exam answers, Journalism for story feedback

What are you working on today?`

export function ChatWindow({ messages, isLoading }) {
  const bottomRef = useRef(null)

  // Auto-scroll when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  return (
    <div className="chat-window">
      {messages.length === 0 && (
        <div className="message-bubble assistant welcome">
          <div className="assistant-text">
            {/* Render welcome message as simple text to avoid import overhead */}
            {WELCOME_MESSAGE.split('\n').map((line, i) => {
              if (line.startsWith('- **')) {
                const parts = line.replace('- **', '').split('**')
                return (
                  <p key={i} className="welcome-item">
                    <strong>{parts[0]}</strong>{parts[1]}
                  </p>
                )
              }
              if (line === '') return <br key={i} />
              return <p key={i}>{line}</p>
            })}
          </div>
        </div>
      )}

      {messages.map((msg, index) => (
        <MessageBubble key={index} message={msg} />
      ))}

      {isLoading && <TypingIndicator />}

      <div ref={bottomRef} />
    </div>
  )
}
