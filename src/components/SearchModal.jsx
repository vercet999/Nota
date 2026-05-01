import React, { useState, useEffect } from 'react'
import { Search, X, MessageSquare } from 'lucide-react'

export function SearchModal({ isOpen, onClose, messages, onSelectMessage }) {
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (isOpen) {
      setQuery('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const filteredMessages = messages.filter(m => 
    m.role === 'user' && 
    (query === '' || m.content.toLowerCase().includes(query.toLowerCase()))
  )

  return (
    <div className="modal-overlay" style={{ zIndex: 100 }} onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%', padding: '24px' }}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <Search size={24} style={{ color: 'var(--accent)' }}/> Search Chat History
        </h2>

        <div className="search-input-wrapper" style={{ position: 'relative', marginBottom: '24px' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="settings-input"
            placeholder="Type to search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ paddingLeft: '44px', width: '100%' }}
            autoFocus
          />
        </div>

        <div className="search-results" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {filteredMessages.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredMessages.map(m => (
                <button
                  key={m.id}
                  onClick={() => {
                    onSelectMessage(m.id)
                    onClose()
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '16px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s'
                  }}
                  className="hover:border-[var(--accent)]"
                >
                  <MessageSquare size={18} style={{ color: 'var(--text-muted)', marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ color: 'var(--text-primary)', fontSize: '14px', lineHeight: '1.5' }}>
                    {m.content}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
              No results found for "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
