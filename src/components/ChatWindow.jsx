// ─── ChatWindow.jsx ─────────────────────────────────────────────────────────
// Scrollable message history. Auto-scrolls to latest message.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react'
import { MessageBubble, TypingIndicator } from './MessageBubble'
import { TypewriterWelcome } from './TypewriterWelcome'

export function ChatWindow({ messages, isLoading, userName }) {
  const bottomRef = useRef(null)

  // Auto-scroll when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  return (
    <div className="chat-window">
      {messages.length === 0 && <TypewriterWelcome userName={userName} />}

      {messages.map((msg, index) => (
        <MessageBubble key={index} message={msg} />
      ))}

      {isLoading && <TypingIndicator />}

      <div ref={bottomRef} />
    </div>
  )
}
