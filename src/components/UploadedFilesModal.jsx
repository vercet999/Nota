import React from 'react'
import { X, FileText, Download } from 'lucide-react'

export function UploadedFilesModal({ isOpen, onClose, uploadedFiles }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" style={{ zIndex: 100 }}>
      <div className="modal-content" style={{ maxWidth: '600px', width: '90%', padding: '24px' }}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <FileText size={24} style={{ color: 'var(--accent)' }}/> Uploaded Files
        </h2>

        <div className="search-results" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {uploadedFiles.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {uploadedFiles.map(file => (
                <div
                  key={file.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FileText size={24} style={{ color: 'var(--text-muted)' }} />
                    <div style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: 500 }}>
                      {file.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
              No files uploaded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
