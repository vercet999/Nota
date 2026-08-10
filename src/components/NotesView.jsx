import { useState, useEffect } from "react";
import { NotebookPen, Plus, Trash2, Download, FileText, MessageSquare, Loader2, ArrowLeft, Search } from "lucide-react";
import { getNotes, deleteNote, saveNote, getSummaries, deleteSummary, saveSummary, getAllDocuments, getSessions, getSessionMessages } from "../utils/db";
import { generateNotes, generateSummary } from "../utils/claudeApi";
import ReactMarkdown from "react-markdown";
import JSZip from "jszip";
import { convertMarkdownToDocxBlob } from "../utils/docxExport";

export function NotesView({ onBack, modelId }) {
  const [activeTab, setActiveTab] = useState("notes"); // 'notes' | 'summaries'
  const [searchQuery, setSearchQuery] = useState("");
  
  const [notes, setNotes] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createSource, setCreateSource] = useState(null); // 'file' | 'chat'
  
  const [docs, setDocs] = useState([]);
  const [sessions, setSessions] = useState([]);
  
  const [generating, setGenerating] = useState(false);
  const [isMobileListVisible, setIsMobileListVisible] = useState(true);

  useEffect(() => {
    setSelectedItem(null);
    fetchItems();
  }, [activeTab]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      if (activeTab === "notes") {
        const data = await getNotes();
        setNotes(data || []);
        if (data && data.length > 0 && !selectedItem) setSelectedItem(data[0]);
        else if (data.length === 0) setSelectedItem(null);
      } else {
        const data = await getSummaries();
        setSummaries(data || []);
        if (data && data.length > 0 && !selectedItem) setSelectedItem(data[0]);
        else if (data.length === 0) setSelectedItem(null);
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
      let result, newItem;
      if (activeTab === "notes") {
        result = await generateNotes(doc.extracted_text, modelId);
        newItem = await saveNote(doc.file_name, result);
      } else {
        result = await generateSummary(doc.extracted_text, modelId);
        newItem = await saveSummary(doc.file_name, result);
      }
      await fetchItems();
      setSelectedItem(newItem);
      setIsMobileListVisible(false);
      setShowCreateModal(false);
    } catch (err) {
      setError(err.message || "Failed to generate.");
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
      const title = session.title || "Chat " + (activeTab === "notes" ? "Notes" : "Summary");

      let result, newItem;
      if (activeTab === "notes") {
        result = await generateNotes(combinedText, modelId);
        newItem = await saveNote(title, result);
      } else {
        result = await generateSummary(combinedText, modelId);
        newItem = await saveSummary(title, result);
      }

      await fetchItems();
      setSelectedItem(newItem);
      setIsMobileListVisible(false);
      setShowCreateModal(false);
    } catch (err) {
      setError(err.message || "Failed to generate.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete this ${activeTab === "notes" ? "note" : "summary"}?`)) return;
    
    if (activeTab === "notes") await deleteNote(id);
    else await deleteSummary(id);

    if (selectedItem?.id === id) {
      setSelectedItem(null);
      setIsMobileListVisible(true);
    }
    await fetchItems();
  };

  const downloadItem = () => {
    if (!selectedItem) return;
    const blob = new Blob([selectedItem.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedItem.title.replace(/\.[^.]+$/, "")}-${activeTab === "notes" ? "notes" : "summary"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAll = async () => {
    const itemsToExport = activeTab === "notes" ? notes : summaries;
    if (!itemsToExport || itemsToExport.length === 0) {
      alert(`No ${activeTab} to export.`);
      return;
    }

    try {
      const zip = new JSZip();

      for (const item of itemsToExport) {
        const docxBlob = await convertMarkdownToDocxBlob(item.content);
        const fileName = `${item.title.replace(/[\/\?<>\\:\*\|"]/g, "_")}.docx`;
        zip.file(fileName, docxBlob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `All_${activeTab === "notes" ? "Notes" : "Summaries"}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export all items.");
    }
  };

  const getFilteredItems = () => {
    const items = activeTab === "notes" ? notes : summaries;
    if (!searchQuery.trim()) return items;
    const lowerQuery = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.content.toLowerCase().includes(lowerQuery)
    );
  };
  const filteredItems = getFilteredItems();

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
            Study {activeTab === "notes" ? "Notes" : "Summaries"}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button 
            className="btn-secondary" 
            style={{ padding: "6px 12px", gap: "6px", fontSize: "13px" }} 
            onClick={handleExportAll}
          >
            <Download size={14} /> Export All
          </button>
          <button 
            className="btn-primary" 
            style={{ padding: "6px 12px", gap: "6px", fontSize: "13px" }} 
            onClick={handleCreateNew}
          >
            <Plus size={14} /> New {activeTab === "notes" ? "Note" : "Summary"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden", background: "var(--bg-base)", position: "relative" }}>
        
        {/* Sidebar List (hidden on mobile if an item is selected) */}
        <div 
          className={`notes-sidebar ${selectedItem && !isMobileListVisible ? 'mobile-hidden' : ''}`}
          style={{ 
            width: "300px", 
            background: "var(--bg-surface)", 
            display: "flex", 
            flexDirection: "column", 
            borderRight: "1px solid var(--border)",
            flexShrink: 0
          }}
        >
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '8px 16px 0 16px' }}>
            <button
              onClick={() => setActiveTab('notes')}
              style={{
                flex: 1, padding: '10px 0', background: 'none', border: 'none',
                borderBottom: activeTab === 'notes' ? '2px solid var(--accent)' : '2px solid transparent',
                fontWeight: activeTab === 'notes' ? 600 : 500,
                color: activeTab === 'notes' ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer', transition: 'all 0.2s', fontSize: '14px'
              }}
            >
              Notes
            </button>
            <button
              onClick={() => setActiveTab('summaries')}
              style={{
                flex: 1, padding: '10px 0', background: 'none', border: 'none',
                borderBottom: activeTab === 'summaries' ? '2px solid var(--accent)' : '2px solid transparent',
                fontWeight: activeTab === 'summaries' ? 600 : 500,
                color: activeTab === 'summaries' ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer', transition: 'all 0.2s', fontSize: '14px'
              }}
            >
              Summaries
            </button>
          </div>

          {/* Search Bar */}
          <div style={{ padding: '12px 16px 4px 16px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px 8px 30px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-base)',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {loading ? (
              <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>Loading {activeTab}...</div>
            ) : filteredItems.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
                <NotebookPen size={32} style={{ opacity: 0.2, margin: "0 auto 12px", display: "block" }} />
                No {activeTab} found.<br/><br/>
                {searchQuery ? "Try a different search." : `Click "New ${activeTab === "notes" ? "Note" : "Summary"}" to generate from a document or past chat.`}
              </div>
            ) : (
              filteredItems.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => { setSelectedItem(item); setIsMobileListVisible(false); }}
                  style={{
                    padding: "16px", 
                    background: selectedItem?.id === item.id ? "var(--amber-glow)" : "var(--bg-raised)",
                    border: "1px solid",
                    borderColor: selectedItem?.id === item.id ? "var(--border-amber)" : "transparent",
                    borderRadius: "12px", 
                    cursor: "pointer", 
                    position: "relative",
                    transition: "all 0.2s ease"
                  }}
                >
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px", paddingRight: "24px", lineHeight: "1.3" }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {new Date(item.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    
                    <button 
                      onClick={(e) => handleDelete(item.id, e)}
                      style={{ 
                        background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer",
                        opacity: selectedItem?.id === item.id ? 1 : 0.6
                      }}
                      title={`Delete ${activeTab === "notes" ? "note" : "summary"}`}
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
          className={`notes-content-area ${!selectedItem || isMobileListVisible ? 'mobile-hidden' : ''}`}
          style={{ 
            flex: 1, 
            display: "flex", 
            flexDirection: "column", 
            overflow: "hidden", 
            background: "var(--bg-base)"
          }}
        >
          {selectedItem ? (
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
                  <h2 style={{ fontSize: "18px", margin: 0, fontWeight: 600, color: "var(--text-primary)" }}>{selectedItem.title}</h2>
                </div>
                <button className="btn-secondary" style={{ padding: "6px 12px", fontSize: "13px", gap: "6px", display: "flex", alignItems: "center", borderRadius: "6px" }} onClick={downloadItem}>
                  <Download size={14} /> <span className="hide-on-mobile">Download .md</span>
                </button>
              </div>
              <div className="assistant-text notes-markdown-container" style={{ flex: 1, padding: "32px 40px", overflowY: "auto", maxWidth: "800px", margin: "0 auto" }}>
                <ReactMarkdown>{selectedItem.content}</ReactMarkdown>
              </div>
            </>
          ) : (
            <div className="hide-on-mobile" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "15px" }}>
               <NotebookPen size={48} style={{ opacity: 0.1, marginBottom: "16px" }} />
               Select a {activeTab === "notes" ? "note" : "summary"} from the list, or create a new one.
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
                Generate New {activeTab === "notes" ? "Notes" : "Summary"}
              </h2>
            </div>
            
            <div style={{ padding: "24px", maxHeight: "65vh", overflowY: "auto", minHeight: "200px" }}>
              {error && <div style={{ marginBottom: "16px", padding: "12px", background: "rgba(224,80,80,0.1)", color: "#e07060", borderRadius: "8px", fontSize: "13px" }}>⚠️ {error}</div>}
              
              {generating ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-secondary)" }}>
                  <Loader2 size={36} className="animate-spin" style={{ margin: "0 auto 16px", display: "block", color: "var(--accent)" }} />
                  <div style={{ fontSize: "16px", fontWeight: 500, color: "var(--text-primary)", marginBottom: "4px" }}>Generating {activeTab === "notes" ? "notes" : "summary"}...</div>
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
                      <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>Extract structured {activeTab === "notes" ? "notes" : "summaries"} from a document in your library.</div>
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
                      <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>Condense a previous study conversation into concise {activeTab === "notes" ? "notes" : "summaries"}.</div>
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

