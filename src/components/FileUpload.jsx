// ─── FileUpload.jsx ─────────────────────────────────────────────────────────
// Drag-and-drop + click-to-upload for PDFs and .txt files
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef } from 'react'
import { FileText } from 'lucide-react'

export function FileUpload({ onFileUpload, uploadedFileName, isLoading }) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef(null)

  const handleFile = (file) => {
    if (!file) return
    const name = file.name.toLowerCase()
    const ext = name.split('.').pop()
    const allowedExts = ['pdf', 'txt', 'docx', 'doc', 'pptx']
    const allowedTypes = [
      'application/pdf', 
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ]
    
    if (!allowedExts.includes(ext) && !allowedTypes.includes(file.type)) {
      alert('Only PDF, TXT, DOCX, DOC, and PPTX files are supported.')
      return
    }
    
    // Cap file size at 10MB (10 * 1024 * 1024 bytes)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      alert(`File is too large. Max allowed size is 10MB.`);
      return;
    }

    onFileUpload(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  return (
    <div
      className={`file-upload ${isDragging ? 'dragging' : ''} ${uploadedFileName ? 'has-file' : ''} ${isLoading ? 'disabled' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => !isLoading && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,.docx,.doc,.pptx"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files[0])}
      />

      {uploadedFileName ? (
        <div className="file-loaded">
          <span className="file-icon"><FileText size={16} /></span>
          <span className="file-name">{uploadedFileName}</span>
          <span className="file-status">loaded</span>
        </div>
      ) : (
        <div className="file-prompt">
          <span className="upload-icon">⬆</span>
          <span>{isDragging ? 'Drop it here' : 'Upload notes (PDF, DOCX, PPTX, TXT)'}</span>
        </div>
      )}
    </div>
  )
}
