// ─── App.jsx ────────────────────────────────────────────────────────────────
// Root component. Layout: header → chat window → controls → input
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from "react";
import {
  PanelLeft,
  Plus,
  Search,
  FolderDown,
  GraduationCap,
  Send,
  ChevronDown,
  AlertTriangle,
  Zap,
  Brain,
  FileText,
  HelpCircle,
  Key,
  Newspaper,
  Library,
  Clock,
} from "lucide-react";
import { useChat } from "./hooks/useChat";
import { ChatWindow } from "./components/ChatWindow";
import { ModeSelector } from "./components/ModeSelector";
import { FileUpload } from "./components/FileUpload";
import { SettingsModal } from "./components/SettingsModal";
import { TypewriterWelcome } from "./components/TypewriterWelcome";
import { FlashcardsView } from "./components/FlashcardsView";
import { SearchModal } from "./components/SearchModal";
import { UploadedFilesModal } from "./components/UploadedFilesModal";
import { HistoryDrawer } from "./components/HistoryDrawer";
import { MODELS } from "./utils/claudeApi";

export default function App() {
  const [userName, setUserName] = useState(
    () => localStorage.getItem("study_userName") || "",
  );
  const [accentColor, setAccentColor] = useState(
    () => localStorage.getItem("study_accentColor") || "#e8a030",
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isFlashcardsOpen, setIsFlashcardsOpen] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("study_bookmarks") || "[]");
    } catch {
      return [];
    }
  });

  const getInitials = (name) => {
    return (
      name
        .split(" ")
        .map((n) => n.charAt(0))
        .slice(0, 2)
        .join("")
        .toUpperCase() || "RA"
    );
  };

  const toggleBookmark = (id) => {
    setBookmarks((prev) => {
      const newBookmarks = prev.includes(id)
        ? prev.filter((b) => b !== id)
        : [...prev, id];
      localStorage.setItem("study_bookmarks", JSON.stringify(newBookmarks));
      return newBookmarks;
    });
  };

  const activeName = userName.trim() || "Royalty";

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", accentColor);
  }, [accentColor]);

  const {
    messages,
    mode,
    setMode,
    selectedModel,
    setSelectedModel,
    isLoading,
    error,
    uploadedFileName,
    uploadedFiles,
    documentContext,
    sendUserMessage,
    handleFileUpload,
    clearSession,
    loadSession,
  } = useChat();

  const [inputText, setInputText] = useState("");
  const textareaRef = useRef(null);

  const handleSubmit = async () => {
    if (!inputText.trim() || isLoading) return;
    const text = inputText;
    setInputText("");
    setShowActionMenu(false);
    textareaRef.current?.focus();
    await sendUserMessage(text, activeName);
  };

  const handleKeyDown = (e) => {
    // Send on Enter, new line on Shift+Enter
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSaveSettings = (name, color) => {
    setUserName(name);
    setAccentColor(color);
    localStorage.setItem("study_userName", name);
    localStorage.setItem("study_accentColor", color);
    setIsSettingsOpen(false);
  };

  // Quick prompt buttons for common tasks
  const QUICK_PROMPTS = [
    {
      label: "Summarise my notes",
      text: "Summarise the key points from my uploaded notes.",
      icon: <FileText size={14} />,
    },
    {
      label: "Practice questions",
      text: "Generate 5 exam practice questions from my notes.",
      icon: <HelpCircle size={14} />,
    },
    {
      label: "Key definitions",
      text: "List the most important definitions and terms I need to know.",
      icon: <Key size={14} />,
    },
    {
      label: "Rewrite for Daily Guide",
      text: "Rewrite the following story in Daily Guide newspaper style:\n\n[Paste your story here]",
      icon: <Newspaper size={14} />,
    },
  ];

  const renderModelSwitcher = () => (
    <div className="custom-dropdown-container">
      <button
        className="welcome-model-select"
        onClick={() => setShowModelDropdown(!showModelDropdown)}
        style={{ display: "flex", alignItems: "center", gap: "4px" }}
      >
        {
          MODELS[
            Object.keys(MODELS).find((k) => MODELS[k].id === selectedModel)
          ]?.label
        }{" "}
        <span
          style={{
            opacity: 0.6,
            display: "inline-flex",
            alignItems: "center",
            gap: "2px",
          }}
        >
          {selectedModel.includes("haiku") ? (
            <Zap size={12} />
          ) : (
            <Brain size={12} />
          )}{" "}
          {
            MODELS[
              Object.keys(MODELS).find((k) => MODELS[k].id === selectedModel)
            ]?.badge
          }
        </span>
        <ChevronDown size={14} style={{ marginLeft: 4 }} />
      </button>
      {showModelDropdown && (
        <div className="custom-dropdown-menu">
          {Object.values(MODELS).map((m) => (
            <button
              key={m.id}
              className={`custom-dropdown-item ${selectedModel === m.id ? "active" : ""}`}
              onClick={() => {
                setSelectedModel(m.id);
                setShowModelDropdown(false);
              }}
            >
              <span>{m.label}</span>
              <span
                className="dropdown-badge"
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                {m.id.includes("haiku") ? (
                  <Zap size={12} />
                ) : (
                  <Brain size={12} />
                )}
                {m.badge}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="app-layout">
      {/* ── Expandable Left Sidebar ── */}
      <aside className={`left-sidebar ${isSidebarOpen ? "expanded" : ""}`}>
        <div className="sidebar-content-wrapper">
          <div className="sidebar-top">
            <button
              className="sidebar-item"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <span className="sidebar-item-icon">
                <PanelLeft size={20} strokeWidth={1.5} />
              </span>
              <span className="sidebar-item-label">
                {isSidebarOpen ? "Close Sidebar" : "Expand Sidebar"}
              </span>
            </button>
            <button
              className="sidebar-item"
              onClick={() => {
                clearSession();
                setIsFlashcardsOpen(false);
              }}
            >
              <span className="sidebar-item-icon">
                <Plus size={20} strokeWidth={1.5} />
              </span>
              <span className="sidebar-item-label">New Session</span>
            </button>
            <button
              className="sidebar-item"
              onClick={() => setIsSearchOpen(true)}
            >
              <span className="sidebar-item-icon">
                <Search size={20} strokeWidth={1.5} />
              </span>
              <span className="sidebar-item-label">Search</span>
            </button>
            <button
              className="sidebar-item"
              onClick={() => setIsFlashcardsOpen(true)}
            >
              <span className="sidebar-item-icon">
                <Library size={20} strokeWidth={1.5} />
              </span>
              <span className="sidebar-item-label">Flashcards</span>
            </button>
            <button
              className="sidebar-item"
              onClick={() => setIsFilesModalOpen(true)}
              title="Uploaded Files"
            >
              <span className="sidebar-item-icon">
                <FolderDown size={20} strokeWidth={1.5} />
              </span>
              <span className="sidebar-item-label">Uploaded Files</span>
            </button>
            <button
              className="sidebar-item"
              onClick={() => setIsHistoryOpen(true)}
              title="Chat History"
            >
              <span className="sidebar-item-icon">
                <Clock size={20} strokeWidth={1.5} />
              </span>
              <span className="sidebar-item-label">Chat History</span>
            </button>
          </div>
          <div className="sidebar-bottom">
            <button
              className="sidebar-item"
              onClick={() => setIsSettingsOpen(true)}
            >
              <span className="sidebar-item-icon profile-icon-wrap">
                <div
                  className="profile-btn-small"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "var(--text-primary)",
                    color: "var(--bg-base)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  {getInitials(activeName)}
                </div>
              </span>
              <span className="sidebar-item-label">{activeName} Settings</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="main-content-wrapper">
        <div className="mobile-top-bar">
          <button
            className="icon-btn mobile-sidebar-toggle"
            onClick={() => setIsSidebarOpen(true)}
          >
            <PanelLeft size={20} strokeWidth={1.5} />
          </button>
          <div className="mobile-model-switcher-wrapper">
            {messages.length === 0 && renderModelSwitcher()}
          </div>
          <div style={{ width: 32 }}></div>
        </div>
        <div className="app-container">
          {isFlashcardsOpen ? (
            <FlashcardsView
              onBack={() => setIsFlashcardsOpen(false)}
              uploadedFiles={uploadedFiles}
              messages={messages}
              modelId={selectedModel}
            />
          ) : messages.length === 0 ? (
            <div className="welcome-screen">
              <header className="welcome-header">
                <button className="icon-btn">
                  <GraduationCap size={20} strokeWidth={1.5} />
                </button>
              </header>
              <main className="welcome-main">
                <div className="welcome-typewriter-wrapper">
                  <TypewriterWelcome userName={activeName} />
                </div>
                <div className="welcome-input-container">
                  <div className="welcome-input-border">
                    <div
                      className="custom-dropdown-container"
                      style={{ display: "flex", alignItems: "center" }}
                    >
                      <Plus
                        size={20}
                        className="welcome-plus-btn"
                        onClick={() => setShowActionMenu(!showActionMenu)}
                        style={
                          showActionMenu
                            ? {
                                transform: "rotate(45deg)",
                                transition: "transform 0.2s",
                                color: "var(--accent)",
                              }
                            : { transition: "transform 0.2s" }
                        }
                      />
                      {showActionMenu && (
                        <div
                          className="custom-dropdown-menu"
                          style={{
                            left: 0,
                            bottom: "calc(100% + 10px)",
                            padding: "12px",
                            minWidth: "240px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                          }}
                        >
                          <ModeSelector
                            activeMode={mode}
                            onModeChange={setMode}
                          />
                          <FileUpload
                            onFileUpload={(file) => {
                              handleFileUpload(file);
                              setShowActionMenu(false);
                            }}
                            uploadedFileName={uploadedFileName}
                            isLoading={isLoading}
                          />
                        </div>
                      )}
                    </div>
                    <textarea
                      ref={textareaRef}
                      className="welcome-textarea"
                      placeholder="How can I help you today?"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={isLoading}
                      rows={1}
                    />
                    <div className="welcome-model-indicator hidden-on-mobile">
                      {renderModelSwitcher()}
                      <button
                        className="icon-btn send-icon-btn"
                        onClick={handleSubmit}
                        disabled={isLoading || !inputText.trim()}
                      >
                        <Send size={16} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="welcome-controls-outside">
                  <div className="quick-prompts" style={{ padding: 0 }}>
                    {QUICK_PROMPTS.map((qp) => (
                      <button
                        key={qp.label}
                        className="quick-prompt-btn"
                        onClick={() => {
                          setInputText(qp.text);
                          setShowActionMenu(false);
                          textareaRef.current?.focus();
                        }}
                        disabled={isLoading}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <span style={{ opacity: 0.7 }}>{qp.icon}</span>
                        {qp.label}
                      </button>
                    ))}
                  </div>
                </div>
              </main>
            </div>
          ) : (
            <>
              {/* ── Header ── */}
              <header className="app-header">
                <div className="header-left">
                  <h1 className="app-title">Nota</h1>
                  <span className="app-subtitle">Study AI</span>
                </div>
                <div
                  className="header-right"
                  style={{ display: "flex", gap: "8px" }}
                >
                  {messages.length > 0 && (
                    <button
                      className="clear-btn"
                      onClick={() => {
                        clearSession();
                        setIsFlashcardsOpen(false);
                      }}
                      title="Start a new session"
                    >
                      New Session
                    </button>
                  )}
                </div>
              </header>

              {/* ── Chat Area ── */}
              <main className="chat-area">
                <ChatWindow
                  messages={messages}
                  isLoading={isLoading}
                  userName={activeName}
                  searchQuery={searchQuery}
                  showBookmarks={showBookmarks}
                  bookmarks={bookmarks}
                  onToggleBookmark={toggleBookmark}
                />
              </main>

              {/* ── Error banner ── */}
              {error && (
                <div
                  className="error-banner"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    justifyContent: "center",
                  }}
                >
                  <AlertTriangle size={16} /> {error}
                </div>
              )}

              {/* ── Quick Prompts ── */}
              <div className="quick-prompts" style={{ padding: "0 24px 12px" }}>
                {QUICK_PROMPTS.map((qp) => (
                  <button
                    key={qp.label}
                    className="quick-prompt-btn"
                    onClick={() => {
                      setInputText(qp.text);
                      setShowActionMenu(false);
                      textareaRef.current?.focus();
                    }}
                    disabled={isLoading}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span style={{ opacity: 0.7 }}>{qp.icon}</span>
                    {qp.label}
                  </button>
                ))}
              </div>

              {/* ── Input Area ── */}
              <div className="input-area" style={{ position: "relative" }}>
                <div className="chat-input-wrapper">
                  <div
                    className="custom-dropdown-container"
                    style={{
                      position: "absolute",
                      left: "6px",
                      zIndex: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                  >
                    <button
                      className={`plus-btn ${showActionMenu ? "active" : ""}`}
                      onClick={() => setShowActionMenu(!showActionMenu)}
                      disabled={isLoading}
                      aria-label="Toggle actions"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                    </button>
                    {showActionMenu && (
                      <div
                        className="custom-dropdown-menu"
                        style={{
                          left: 0,
                          bottom: "calc(100% + 10px)",
                          padding: "12px",
                          minWidth: "240px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                        }}
                      >
                        <ModeSelector
                          activeMode={mode}
                          onModeChange={setMode}
                        />
                        <FileUpload
                          onFileUpload={(file) => {
                            handleFileUpload(file);
                            setShowActionMenu(false);
                          }}
                          uploadedFileName={uploadedFileName}
                          isLoading={isLoading}
                        />
                      </div>
                    )}
                  </div>

                  <textarea
                    ref={textareaRef}
                    className="message-input"
                    placeholder="Ask anything — type your question or paste your notes..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    rows={1}
                  />

                  <button
                    className="send-btn"
                    onClick={handleSubmit}
                    disabled={isLoading || !inputText.trim()}
                    style={{
                      position: "absolute",
                      right: "6px",
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                  >
                    {isLoading ? (
                      <span className="sending">...</span>
                    ) : (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M22 2L11 13"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M22 2L15 22L11 13L2 9L22 2Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentName={userName}
        currentColor={accentColor}
        onSave={handleSaveSettings}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        messages={messages}
        onSelectMessage={(id) => {
          const el = document.getElementById(`msg-${id}`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }}
      />

      <UploadedFilesModal
        isOpen={isFilesModalOpen}
        onClose={() => setIsFilesModalOpen(false)}
        uploadedFiles={uploadedFiles}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onLoadSession={(id) => {
          loadSession(id);
          setIsFlashcardsOpen(false);
        }}
      />
    </div>
  );
}
