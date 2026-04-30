import React, { useState, useEffect } from 'react'
import { RefreshCw, ChevronLeft, ChevronRight, Check, BrainCircuit, MessageSquare, FileText, ArrowLeft } from 'lucide-react'
import { generateFlashcards } from '../utils/claudeApi'

export function FlashcardsView({ onBack, uploadedFiles, messages, modelId }) {
  const [flashcards, setFlashcards] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectionMade, setSelectionMade] = useState(false)
  const [sourceData, setSourceData] = useState('')

  const handleGenerate = async () => {
    setIsLoading(true)
    setError('')
    try {
      const cards = await generateFlashcards(sourceData, modelId)
      setFlashcards(cards)
      setCurrentIndex(0)
      setIsFlipped(false)
    } catch (err) {
      setError(err.message || 'Failed to generate flashcards.')
    } finally {
      setIsLoading(false)
    }
  }

  const shuffleFlashcards = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5)
    setFlashcards(shuffled)
    setCurrentIndex(0)
    setIsFlipped(false)
  }

  const nextCard = () => {
    setIsFlipped(false)
    setCurrentIndex((prev) => (prev + 1) % flashcards.length)
  }

  const prevCard = () => {
    setIsFlipped(false)
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length)
  }

  const selectDocument = (file) => {
    setSourceData(file.text)
    setSelectionMade(true)
  }

  const selectChatHistory = () => {
    const history = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n')
    if (!history) {
      setError('Chat history is empty.')
      return
    }
    setSourceData(history)
    setSelectionMade(true)
  }

  // Auto-generate if selection made
  useEffect(() => {
    if (selectionMade && flashcards.length === 0) {
      handleGenerate()
    }
  }, [selectionMade])

  const resetSelection = () => {
    setSelectionMade(false)
    setFlashcards([])
    setSourceData('')
    setError('')
  }

  return (
    <div className="flashcards-view" style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '12px' }}>
        <button className="icon-btn" onClick={onBack} title="Back to Chat">
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ fontSize: '24px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BrainCircuit size={24} style={{ color: 'var(--accent)' }}/> Study Flashcards
        </h2>
      </div>

      {error && (
        <div className="error-banner mb-4" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(255,100,100,0.1)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '13px', marginBottom: '20px' }}>
          <span style={{ color: '#e07060' }}>Error:</span> {error}
        </div>
      )}

      {!selectionMade ? (
        <div className="flashcard-setup" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', marginTop: '40px' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '16px', color: 'var(--text-primary)' }}>Select content to generate flashcards from:</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>We will analyze the selected content and create a deck of flashcards with key concepts and definitions.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px', justifyContent: 'center' }}>
            {uploadedFiles.map(file => (
              <button 
                key={file.id}
                onClick={() => selectDocument(file)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '24px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                className="hover:border-[var(--accent)]"
              >
                <FileText size={32} style={{ color: 'var(--accent)' }} />
                <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{file.name}</span>
              </button>
            ))}

            <button 
              onClick={selectChatHistory}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                padding: '24px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                opacity: messages.length > 0 ? 1 : 0.5
              }}
              className="hover:border-[var(--accent)]"
            >
              <MessageSquare size={32} style={{ color: messages.length > 0 ? 'var(--accent)' : 'var(--text-muted)' }} />
              <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Chat History</span>
              {messages.length === 0 && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>(No chat history)</span>}
            </button>
          </div>
        </div>
      ) : isLoading ? (
        <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={32} className="spin" style={{ margin: '0 auto 24px', display: 'block', color: 'var(--accent)' }} />
          <p style={{ fontSize: '18px' }}>Generating flashcards from your notes...</p>
        </div>
      ) : flashcards.length > 0 ? (
        <div className="flashcards-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', marginTop: '24px', maxWidth: '700px', margin: '0 auto' }}>
          
          <div 
            className={`flashcard ${isFlipped ? 'flipped' : ''}`}
            onClick={() => setIsFlipped(!isFlipped)}
            style={{
              width: '100%',
              height: '350px',
              perspective: '1000px',
              cursor: 'pointer'
            }}
          >
            <div className="flashcard-inner" style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              textAlign: 'center',
              transition: 'transform 0.6s',
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
            }}>
              {/* Front (Term) */}
              <div className="flashcard-front" style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                flexDirection: 'column'
              }}>
                <span style={{ color: 'var(--accent)', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 'auto' }}>Term</span>
                <h3 style={{ fontSize: '32px', margin: 'auto 0', color: 'var(--text-primary)', fontWeight: 700 }}>
                  {flashcards[currentIndex].term}
                </h3>
                <div style={{ marginTop: 'auto', color: 'var(--text-muted)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RefreshCw size={14} /> Click to reveal definition
                </div>
              </div>

              {/* Back (Definition) */}
              <div className="flashcard-back" style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden',
                background: 'var(--bg-raised)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                transform: 'rotateY(180deg)',
                flexDirection: 'column'
              }}>
                <span style={{ color: 'var(--accent)', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 'auto' }}>Definition</span>
                <p style={{ fontSize: '20px', lineHeight: '1.6', margin: 'auto 0', color: 'var(--text-primary)', textAlign: 'center' }}>
                  {flashcards[currentIndex].definition}
                </p>
              </div>
            </div>
          </div>

          <div className="flashcard-controls" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 20px' }}>
            <button 
              onClick={prevCard}
              className="icon-btn hover:bg-[var(--bg-raised)]"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '12px', borderRadius: '50%' }}
              title="Previous Card"
            >
              <ChevronLeft size={24} />
            </button>
            
            <div style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-muted)' }}>
              {currentIndex + 1} <span style={{ opacity: 0.5 }}>/ {flashcards.length}</span>
            </div>

            <button 
              onClick={nextCard}
              className="icon-btn hover:bg-[var(--bg-raised)]"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '12px', borderRadius: '50%' }}
              title="Next Card"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
            <button 
              className="btn-secondary"
              onClick={shuffleFlashcards}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
            >
              <RefreshCw size={18} /> Shuffle
            </button>
            <button 
              className="btn-primary"
              onClick={handleGenerate}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
            >
              <RefreshCw size={18} /> Regenerate
            </button>
            <button 
              className="btn-secondary"
              onClick={resetSelection}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', opacity: 0.8 }}
            >
              Choose different content
            </button>
          </div>
          
        </div>
      ) : null}
    </div>
  )
}
