// ─── ChatWindow.jsx ─────────────────────────────────────────────────────────
// Scrollable message history. Auto-scrolls to latest message.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react'
import { MessageBubble, TypingIndicator } from './MessageBubble'
import { TypewriterWelcome } from './TypewriterWelcome'

export function ChatWindow({ messages, isLoading, userName, searchQuery, showBookmarks, bookmarks, onToggleBookmark }) {
  const bottomRef = useRef(null)

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (!searchQuery && !showBookmarks) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading, searchQuery, showBookmarks])

  let filteredMessages = messages
  if (showBookmarks) {
    filteredMessages = filteredMessages.filter(m => bookmarks.includes(m.id))
  }
  if (searchQuery) {
    const query = searchQuery.toLowerCase()
    filteredMessages = filteredMessages.filter(m => m.content.toLowerCase().includes(query))
  }

  return (
    <div className="chat-window">
      {messages.length === 0 && <TypewriterWelcome userName={userName} />}

      {filteredMessages.map((msg, index) => (
        <MessageBubble 
          key={msg.id || index} 
          message={msg} 
          isBookmarked={bookmarks && bookmarks.includes(msg.id)}
          onToggleBookmark={onToggleBookmark}
        />
      ))}

      {isLoading && <TypingIndicator />}

      <div ref={bottomRef} />
    </div>
  )
}
