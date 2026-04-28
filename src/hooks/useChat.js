// ─── useChat.js ─────────────────────────────────────────────────────────────
// Central state hook for the chat interface.
// Manages: messages, mode, uploaded document, loading state, errors
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react'
import { sendMessage } from '../utils/claudeApi'
import { extractTextFromFile } from '../utils/pdfExtract'

export function useChat() {
  const [messages, setMessages] = useState([])           // [{role, content}]
  const [mode, setModeState] = useState(() => localStorage.getItem('study_mode') || 'normal')
  
  const setMode = useCallback((newMode) => {
    setModeState(newMode)
    localStorage.setItem('study_mode', newMode)
  }, [])             // current study mode
  const [isLoading, setIsLoading] = useState(false)      // waiting for API
  const [error, setError] = useState(null)               // error string or null
  const [documentContext, setDocumentContext] = useState('') // extracted text from upload
  const [uploadedFileName, setUploadedFileName] = useState('') // display name

  // ── Send a message ─────────────────────────────────────────────────────────
  const sendUserMessage = useCallback(async (text, userNameForApi) => {
    if (!text.trim() || isLoading) return

    const userMessage = { role: 'user', content: text }
    const updatedMessages = [...messages, userMessage]

    setMessages(updatedMessages)
    setIsLoading(true)
    setError(null)

    try {
      const reply = await sendMessage(updatedMessages, mode, documentContext, userNameForApi)
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [messages, mode, documentContext, isLoading])

  // ── Handle file upload ─────────────────────────────────────────────────────
  const handleFileUpload = useCallback(async (file) => {
    setIsLoading(true)
    setError(null)
    try {
      const text = await extractTextFromFile(file)
      setDocumentContext(text)
      setUploadedFileName(file.name)

      // Add a system-style message to the chat so she knows it worked
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `📄 I've loaded **${file.name}**. I can now answer questions based on its content. What would you like to know?`
        }
      ])
    } catch (err) {
      setError(`Could not read file: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ── Clear everything for a fresh session ──────────────────────────────────
  const clearSession = useCallback(() => {
    setMessages([])
    setDocumentContext('')
    setUploadedFileName('')
    setError(null)
  }, [])

  return {
    messages,
    mode,
    setMode,
    isLoading,
    error,
    uploadedFileName,
    documentContext,
    sendUserMessage,
    handleFileUpload,
    clearSession
  }
}
