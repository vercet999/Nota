import { useState, useEffect } from "react";
import { NotebookPen, Plus, Trash2, Download, FileText, MessageSquare, Loader2, ArrowLeft } from "lucide-react";
import { getNotes, deleteNote, saveNote, getAllDocuments, getSessions, getSessionMessages } from "../utils/db";
import { generateNotes } from "../utils/claudeApi";
import ReactMarkdown from "react-markdown";

export function NotesView({ onBack, modelId }) {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createSource, setCreateSource] = useState(null); // 'file' | 'chat'
  
  const [docs, setDocs] = useState([]);
  const [sessions, setSessions] = useState([]);
  
  const [generating, setGenerating] = useState(false);
  const [isMobileListVisible, setIsMobileListVisible] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const data = await getNotes();
      setNotes(data || []);
      if (data && data.length > 0 && !selectedNote) {
        setSelectedNote(data[0]);
      } else if (data.length === 0) {
        setSelectedNote(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadDocsAndSessions = async () => {
    const [fetchedDocs, fetchedSessions] = await Promise.all([
      getAllDocuments(),
      getSessions()
    ]);
    setDocs(fetchedDocs || []);
    setSessions(fetchedSessions || []);
  };

  const handleCreateNew = async () => {
    await loadDocsAndSessions();
    setCreateSource(null);
    setShowCreateModal(true);
  };

  const handleGenerateFromFile = async (doc) => {
    if (!doc.extracted_text) return;
    setGenerating(true);
    setError("");
    try {
      const result = await generateNotes(doc.extracted_text, modelId);
      const newNote = await saveNote(doc.file_name, result);
      await fetchNotes();
      setSelectedNote(newNote);
      setIsMobileListVisible(false);
      setShowCreateModal(false);
    } catch (err) {
      setError(err.message || "Failed to generate notes.");
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateFromChat = async (session) => {
    setGenerating(true);
    setError("");
    try {
      const messages = await getSessionMessages(session.id);
      if (!messages || messages.length === 0) {
         throw new Error("This chat is empty.");
      }
      const combinedText = messages.map(m => m.content).join("\n\n");
      const result = await generateNotes(combinedText, modelId);
      const title = session.title || "Chat Notes";
      const newNote = await saveNote(title, result);
      await fetchNotes();
      setSelectedNote(newNote);
      setIsMobileListVisible(false);
      setShowCreateModal(false);
    } catch (err) {
      setError(err.message || "Failed to generate notes.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    await deleteNote(id);
    if (selectedNote?.id === id) {
      setSelectedNote(null);
      setIsMobileListVisible(true);
    }
    await fetchNotes();
  };

  const downloadNote = () => {
    if (!selectedNote) return;
    const blob = new Blob([selectedNote.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedNote.title.replace(/\.[^.]+$/, "")}-notes.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", background: "var(--bg-base)", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button className="icon-btn" onClick={onBack} title="Back to Chat">
            <ArrowLeft size={20} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>
            <NotebookPen size={18} style={{ color: "var(--accent)" }} />
            Study Notes
          </div>
        </div>
        <button 
          className="btn-primary" 
          style={{ padding: "6px 12px", gap: "6px", fontSize: "13px" }} 
          onClick={handleCreateNew}
        >
          <Plus size={14} /> New Note
        </button>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden", background: "var(--bg-base)", position: "relative" }}>
        
        {/* Sidebar List (hidden on mobile if a note is selected) */}
        <div 
          className={`notes-sidebar ${selectedNote && !isMobileListVisible ? 'mobile-hidden' : ''}`}
          style={{ 
            width: "300px", 
            background: "var(--bg-surface)", 
            display: "flex", 
            flexDirection: "column", 
            borderRight: "1px solid var(--border)",
            flexShrink: 0
          }}
        >
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {loading ? (
              <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>Loading notes...</div>
            ) : notes.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
                <NotebookPen size={32} style={{ opacity: 0.2, margin: "0 auto 12px", display: "block" }} />
                No notes found.<br/><br/>Click "New Note" to generate notes from a document or past chat.
              </div>
            ) : (
              notes.map(note => (
                <div 
                  key={note.id}
                  onClick={() => { setSelectedNote(note); setIsMobileListVisible(false); }}
                  style={{
                    padding: "16px", 
                    background: selectedNote?.id === note.id ? "var(--amber-glow)" : "var(--bg-raised)",
                    border: "1px solid",
                    borderColor: selectedNote?.id === note.id ? "var(--border-amber)" : "transparent",
                    borderRadius: "12px", 
                    cursor: "pointer", 
                    position: "relative",
                    transition: "all 0.2s ease"
                  }}
                >
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px", paddingRight: "24px", lineHeight: "1.3" }}>
                    {note.title}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {new Date(note.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    
                    <button 
                      onClick={(e) => handleDelete(note.id, e)}
                      style={{ 
                        background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer",
                        opacity: selectedNote?.id === note.id ? 1 : 0.6
                      }}
                      title="Delete note"
                      className="delete-hover"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Content Area */}
        <div 
          className={`notes-content-area ${!selectedNote || isMobileListVisible ? 'mobile-hidden' : ''}`}
          style={{ 
            flex: 1, 
            display: "flex", 
            flexDirection: "column", 
            overflow: "hidden", 
            background: "var(--bg-base)"
          }}
        >
          {selectedNote ? (
            <>
              <div className="notes-content-header" style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-surface)", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <button 
                    className="mobile-only-btn icon-btn" 
                    onClick={() => setIsMobileListVisible(true)}
                    style={{ display: "none" }}
                  >
                     <ArrowLeft size={18} />
                  </button>
                  <h2 style={{ fontSize: "18px", margin: 0, fontWeight: 600, color: "var(--text-primary)" }}>{selectedNote.title}</h2>
                </div>
                <button className="btn-secondary" style={{ padding: "6px 12px", fontSize: "13px", gap: "6px", display: "flex", alignItems: "center", borderRadius: "6px" }} onClick={downloadNote}>
                  <Download size={14} /> <span className="hide-on-mobile">Download .md</span>
                </button>
              </div>
              <div className="assistant-text notes-markdown-container" style={{ flex: 1, padding: "32px 40px", overflowY: "auto", maxWidth: "800px", margin: "0 auto" }}>
                <ReactMarkdown>{selectedNote.content}</ReactMarkdown>
              </div>
            </>
          ) : (
            <div className="hide-on-mobile" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "15px" }}>
               <NotebookPen size={48} style={{ opacity: 0.1, marginBottom: "16px" }} />
               Select a note from the list, or create a new one.
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={() => !generating && setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: "520px", width: "90%", padding: 0 }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
              <h2 style={{ fontSize: "18px", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <NotebookPen size={20} style={{ color: "var(--accent)" }} />
                Generate New Notes
              </h2>
            </div>
            
            <div style={{ padding: "24px", maxHeight: "65vh", overflowY: "auto", minHeight: "200px" }}>
              {error && <div style={{ marginBottom: "16px", padding: "12px", background: "rgba(224,80,80,0.1)", color: "#e07060", borderRadius: "8px", fontSize: "13px" }}>⚠️ {error}</div>}
              
              {generating ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-secondary)" }}>
                  <Loader2 size={36} className="animate-spin" style={{ margin: "0 auto 16px", display: "block", color: "var(--accent)" }} />
                  <div style={{ fontSize: "16px", fontWeight: 500, color: "var(--text-primary)", marginBottom: "4px" }}>Generating notes...</div>
                  <div style={{ fontSize: "13px" }}>This may take a minute or two.</div>
                </div>
              ) : !createSource ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <button 
                    onClick={() => setCreateSource("file")}
                    style={{ padding: "16px 20px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "12px", display: "flex", alignItems: "center", gap: "16px", cursor: "pointer", textAlign: "left", transition: "border-color 0.2s" }}
                  >
                    <div style={{ background: "rgba(232, 160, 48, 0.1)", padding: "12px", borderRadius: "50%", color: "#e8a030" }}>
                      <FileText size={24} />
                    </div>
                    <div>
                      <div style={{ color: "var(--text-primary)", fontSize: "15px", fontWeight: 600, marginBottom: "2px" }}>From Uploaded File</div>
                      <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>Extract structured notes from a document in your library.</div>
                    </div>
                  </button>
                  <button 
                    onClick={() => setCreateSource("chat")}
                    style={{ padding: "16px 20px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "12px", display: "flex", alignItems: "center", gap: "16px", cursor: "pointer", textAlign: "left", transition: "border-color 0.2s" }}
                  >
                    <div style={{ background: "rgba(74, 158, 255, 0.1)", padding: "12px", borderRadius: "50%", color: "#4a9eff" }}>
                      <MessageSquare size={24} />
                    </div>
                    <div>
                      <div style={{ color: "var(--text-primary)", fontSize: "15px", fontWeight: 600, marginBottom: "2px" }}>From Chat History</div>
                      <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>Condense a previous study conversation into concise notes.</div>
                    </div>
                  </button>
                </div>
              ) : createSource === "file" ? (
                <div>
                  <button onClick={() => setCreateSource(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", marginBottom: "20px", display: "flex", alignItems: "center", gap: "4px", fontSize: "14px" }}>
                    <ArrowLeft size={16} /> Back
                  </button>
                  <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "16px", color: "var(--text-primary)" }}>Select a document</h3>
                  {docs.length === 0 ? (
                    <div style={{ color: "var(--text-muted)", padding: "30px 0", textAlign: "center", background: "var(--bg-surface)", borderRadius: "12px" }}>No documents found in your library.</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {docs.map(d => (
                        <button key={d.id} onClick={() => handleGenerateFromFile(d)} style={{ padding: "14px 16px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "10px", display: "flex", flexDirection: "column", alignItems: "flex-start", cursor: "pointer", transition: "border-color 0.2s" }}>
                          <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px", textAlign: "left" }}>{d.file_name}</span>
                          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Library document · {new Date(d.created_at).toLocaleDateString()}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <button onClick={() => setCreateSource(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", marginBottom: "20px", display: "flex", alignItems: "center", gap: "4px", fontSize: "14px" }}>
                    <ArrowLeft size={16} /> Back
                  </button>
                  <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "16px", color: "var(--text-primary)" }}>Select a chat session</h3>
                  {sessions.length === 0 ? (
                    <div style={{ color: "var(--text-muted)", padding: "30px 0", textAlign: "center", background: "var(--bg-surface)", borderRadius: "12px" }}>No past chat sessions found.</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {sessions.map(s => (
                        <button key={s.id} onClick={() => handleGenerateFromChat(s)} style={{ padding: "14px 16px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "10px", display: "flex", flexDirection: "column", alignItems: "flex-start", cursor: "pointer", transition: "border-color 0.2s" }}>
                          <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px", textAlign: "left" }}>{s.title || "Untitled Session"}</span>
                          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Updated {new Date(s.updated_at).toLocaleDateString()}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end" }}>
               {!generating && (
                 <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
               )}
            </div>
          </div>
        </div>
      )}

      {/* We add a small intrinsic stylesheet string chunk since it's only for this component */}
      <style>{`
        .delete-hover:hover { color: #e05050 !important; }
        @media (max-width: 768px) {
          .notes-sidebar { width: 100% !important; border-right: none !important; }
          .mobile-hidden { display: none !important; }
          .mobile-only-btn { display: flex !important; }
          .hide-on-mobile { display: none !important; }
          .notes-content-header { padding: 12px 16px !important; }
          .notes-markdown-container { padding: 20px !important; }
        }
      `}</style>
    </div>
  );
}

