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
    <div className="view-container">
      <div className="view-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <div className="view-title">
          <NotebookPen size={22} style={{ color: "var(--accent)" }} />
          <span>Study Notes</span>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden", gap: "1px", background: "var(--border)" }}>
        {/* Sidebar List */}
        <div style={{ width: "320px", background: "var(--bg-surface)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 600, margin: 0 }}>All Notes</h3>
            <button className="btn-primary" style={{ padding: "6px 12px", gap: "6px", fontSize: "13px" }} onClick={handleCreateNew}>
              <Plus size={14} /> New
            </button>
          </div>
          
          <div style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {loading ? (
              <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>
            ) : notes.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
                <NotebookPen size={32} style={{ opacity: 0.2, margin: "0 auto 12px", display: "block" }} />
                No notes yet.<br/><br/>Click "New" to generate notes from a file or chat.
              </div>
            ) : (
              notes.map(note => (
                <div 
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                  style={{
                    padding: "12px", background: selectedNote?.id === note.id ? "var(--amber-glow)" : "var(--bg-raised)",
                    border: "1px solid",
                    borderColor: selectedNote?.id === note.id ? "var(--border-amber)" : "var(--border)",
                    borderRadius: "8px", cursor: "pointer", position: "relative",
                    transition: "all 0.2s"
                  }}
                >
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px", paddingRight: "20px" }}>
                    {note.title}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    {new Date(note.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                  
                  <button 
                    onClick={(e) => handleDelete(note.id, e)}
                    style={{ position: "absolute", top: "10px", right: "10px", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                    title="Delete note"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, background: "var(--bg-surface)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {selectedNote ? (
            <>
              <div style={{ padding: "20px 32px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontSize: "20px", margin: 0 }}>{selectedNote.title}</h2>
                <button className="btn-secondary" style={{ gap: "6px" }} onClick={downloadNote}>
                  <Download size={16} /> Download .md
                </button>
              </div>
              <div className="assistant-text" style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
                <ReactMarkdown>{selectedNote.content}</ReactMarkdown>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "15px" }}>
              Select a note to view its content.
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={() => !generating && setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: "500px", padding: 0 }}>
            <div style={{ padding: "20px", borderBottom: "1px solid var(--border)" }}>
              <h2 style={{ fontSize: "18px", margin: 0 }}>Generate New Notes</h2>
            </div>
            
            <div style={{ padding: "20px", maxHeight: "60vh", overflowY: "auto" }}>
              {error && <div style={{ marginBottom: "16px", padding: "12px", background: "rgba(224,80,80,0.1)", color: "#e07060", borderRadius: "8px", fontSize: "13px" }}>⚠️ {error}</div>}
              
              {generating ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-secondary)" }}>
                  <Loader2 size={32} className="animate-spin" style={{ margin: "0 auto 16px", display: "block", color: "var(--accent)" }} />
                  Generating comprehensive notes...<br/>This may take a minute.
                </div>
              ) : !createSource ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <button 
                    onClick={() => setCreateSource("file")}
                    style={{ padding: "16px", background: "var(--bg-raised)", border: "1px solid var(--border)", borderRadius: "8px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", color: "var(--text-primary)", fontSize: "15px", fontWeight: 500, textAlign: "left" }}
                  >
                    <div style={{ background: "rgba(232, 160, 48, 0.1)", padding: "10px", borderRadius: "50%", color: "#e8a030" }}>
                      <FileText size={24} />
                    </div>
                    <div>
                      From Uploaded File
                      <div style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 400, marginTop: "2px" }}>Extract notes from a document in your library</div>
                    </div>
                  </button>
                  <button 
                    onClick={() => setCreateSource("chat")}
                    style={{ padding: "16px", background: "var(--bg-raised)", border: "1px solid var(--border)", borderRadius: "8px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", color: "var(--text-primary)", fontSize: "15px", fontWeight: 500, textAlign: "left" }}
                  >
                    <div style={{ background: "rgba(74, 158, 255, 0.1)", padding: "10px", borderRadius: "50%", color: "#4a9eff" }}>
                      <MessageSquare size={24} />
                    </div>
                    <div>
                      From Chat History
                      <div style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 400, marginTop: "2px" }}>Condense a previous conversation into notes</div>
                    </div>
                  </button>
                </div>
              ) : createSource === "file" ? (
                <div>
                  <button onClick={() => setCreateSource(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "4px", fontSize: "14px" }}><ArrowLeft size={16} /> Back</button>
                  <h3 style={{ fontSize: "15px", marginBottom: "12px" }}>Select a document</h3>
                  {docs.length === 0 ? (
                    <div style={{ color: "var(--text-muted)", padding: "20px 0", textAlign: "center" }}>No documents found.</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {docs.map(d => (
                        <button key={d.id} onClick={() => handleGenerateFromFile(d)} style={{ padding: "12px", background: "var(--bg-raised)", border: "1px solid var(--border)", borderRadius: "8px", display: "flex", flexDirection: "column", alignItems: "flex-start", cursor: "pointer" }}>
                          <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>{d.file_name}</span>
                          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{new Date(d.created_at).toLocaleDateString()}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <button onClick={() => setCreateSource(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "4px", fontSize: "14px" }}><ArrowLeft size={16} /> Back</button>
                  <h3 style={{ fontSize: "15px", marginBottom: "12px" }}>Select a chat session</h3>
                  {sessions.length === 0 ? (
                    <div style={{ color: "var(--text-muted)", padding: "20px 0", textAlign: "center" }}>No chat sessions found.</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {sessions.map(s => (
                        <button key={s.id} onClick={() => handleGenerateFromChat(s)} style={{ padding: "12px", background: "var(--bg-raised)", border: "1px solid var(--border)", borderRadius: "8px", display: "flex", flexDirection: "column", alignItems: "flex-start", cursor: "pointer" }}>
                          <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>{s.title || "Untitled"}</span>
                          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{new Date(s.updated_at).toLocaleDateString()}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)", textAlign: "right" }}>
              <button className="btn-secondary" onClick={() => !generating && setShowCreateModal(false)} disabled={generating}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
