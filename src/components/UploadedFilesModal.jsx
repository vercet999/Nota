// ─── UploadedFilesModal.jsx ──────────────────────────────────────────────────
// Files Library — shows all saved documents from Supabase.
// Features: download original, load into context, generate notes.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import {
  X, FileText, Download, BookOpen, NotebookPen,
  FileSpreadsheet, Presentation, Loader2,
} from "lucide-react";
import { getAllDocuments, saveNote } from "../utils/db";
import { generateNotes } from "../utils/claudeApi";
import ReactMarkdown from "react-markdown";

function FileIcon({ type }) {
  const t = (type || "").toLowerCase();
  if (t === "pptx") return <Presentation size={20} style={{ color: "#e8a030" }} />;
  if (t === "docx" || t === "doc") return <FileSpreadsheet size={20} style={{ color: "#4a9eff" }} />;
  if (t === "pdf") return <FileText size={20} style={{ color: "#e06fa0" }} />;
  return <FileText size={20} style={{ color: "var(--text-muted)" }} />;
}

function NotesOverlay({ notes, fileName, onClose }) {
  const downloadNotes = () => {
    const blob = new Blob([notes], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName.replace(/\.[^.]+$/, "")}-notes.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 300 }} onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "720px", width: "94%", maxHeight: "88vh",
          display: "flex", flexDirection: "column", padding: 0,
        }}
      >
        <div className="modal-header" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <h2 style={{ fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <NotebookPen size={18} style={{ color: "var(--accent)" }} />
            Notes — {fileName}
          </h2>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={downloadNotes}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "6px 14px", background: "var(--bg-raised)",
                border: "1px solid var(--border)", borderRadius: "6px",
                color: "var(--text-secondary)", fontSize: "13px", cursor: "pointer",
              }}
            >
              <Download size={14} /> Download .md
            </button>
            <button className="close-btn" onClick={onClose}><X size={20} /></button>
          </div>
        </div>
        <div className="assistant-text" style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          <ReactMarkdown>{notes}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

export function UploadedFilesModal({ isOpen, onClose, onLoadIntoContext, modelId }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatingFor, setGeneratingFor] = useState(null);
  const [notesResult, setNotesResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    getAllDocuments()
      .then((data) => setDocs(data || []))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const handleGenerateNotes = async (doc) => {
    setGeneratingFor(doc.id);
    setError("");
    try {
      const notes = await generateNotes(doc.extracted_text, modelId);
      await saveNote(doc.file_name, notes);
      setNotesResult({ fileName: doc.file_name, notes });
    } catch (err) {
      setError(`Could not generate notes: ${err.message}`);
    } finally {
      setGeneratingFor(null);
    }
  };

  const handleLoadIntoContext = (doc) => {
    onLoadIntoContext(doc.file_name, doc.extracted_text);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" style={{ zIndex: 100 }} onClick={onClose}>
        <div
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: "640px", width: "92%", maxHeight: "82vh",
            display: "flex", flexDirection: "column", padding: 0,
          }}
        >
          {/* Header */}
          <div className="modal-header" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
            <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <BookOpen size={20} style={{ color: "var(--accent)" }} />
              Files Library
            </h2>
            <button className="close-btn" onClick={onClose}><X size={20} /></button>
          </div>

          {error && (
            <div style={{ padding: "10px 20px", background: "rgba(224,80,80,0.1)", color: "#e07060", fontSize: "13px", borderBottom: "1px solid var(--border)" }}>
              ⚠️ {error}
            </div>
          )}

          {/* List */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {loading && (
              <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "30px 0" }}>Loading files...</p>
            )}

            {!loading && docs.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
                <FileText size={40} style={{ opacity: 0.2, margin: "0 auto 12px", display: "block" }} />
                No files saved yet. Upload notes in a chat session.
              </div>
            )}

            {!loading && docs.map((doc) => (
              <div
                key={doc.id}
                className="chat-manager-item"
                style={{ flexDirection: "column", alignItems: "flex-start", gap: "10px" }}
              >
                {/* File info row */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
                  <FileIcon type={doc.file_type} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: "14px", fontWeight: 500, color: "var(--text-primary)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {doc.file_name}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {doc.sessions?.title || "Untitled session"} ·{" "}
                      {new Date(doc.created_at).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </div>
                  </div>

                  {/* Download original if URL exists */}
                  {doc.file_url && (
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="chat-manager-action-btn"
                      title="Download original file"
                      style={{ textDecoration: "none" }}
                    >
                      <Download size={15} />
                    </a>
                  )}
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: "8px", paddingLeft: "30px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => handleLoadIntoContext(doc)}
                    style={{
                      padding: "5px 12px",
                      background: "var(--amber-glow)",
                      border: "1px solid var(--border-amber)",
                      borderRadius: "6px",
                      color: "var(--accent)",
                      fontSize: "12px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <BookOpen size={12} /> Load into chat
                  </button>

                  <button
                    onClick={() => handleGenerateNotes(doc)}
                    disabled={generatingFor === doc.id}
                    style={{
                      padding: "5px 12px",
                      background: "var(--bg-raised)",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                      color: "var(--text-secondary)",
                      fontSize: "12px",
                      cursor: generatingFor === doc.id ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      opacity: generatingFor === doc.id ? 0.6 : 1,
                    }}
                  >
                    {generatingFor === doc.id ? (
                      <><Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> Generating...</>
                    ) : (
                      <><NotebookPen size={12} /> Generate Notes</>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {notesResult && (
        <NotesOverlay
          notes={notesResult.notes}
          fileName={notesResult.fileName}
          onClose={() => setNotesResult(null)}
        />
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}