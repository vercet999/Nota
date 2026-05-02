import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  RefreshCw,
  ChevronRight,
  BrainCircuit,
  MessageSquare,
  FileText,
  Layers,
  Settings2,
  Target,
  ChevronDown,
} from "lucide-react";
import { generatePracticeQuiz } from "../utils/claudeApi";

function ConfigDropdown({ label, icon, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = options.find((o) => o.value === value);

  return (
    <div>
      <label className="flashcard-config-label">
        {icon} {label}
      </label>
      <div className="custom-dropdown-container" ref={ref} style={{ display: "block" }}>
        <button
          className="welcome-model-select flashcard-config-trigger"
          onClick={() => setOpen(!open)}
          style={{ width: "100%", justifyContent: "space-between", display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px" }}
        >
          <span>{current?.label}</span>
          <ChevronDown size={14} style={{ opacity: 0.6, flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
        </button>
        {open && (
          <div className="custom-dropdown-menu" style={{ bottom: "auto", top: "calc(100% + 6px)", left: 0, right: 0, minWidth: "unset", width: "100%" }}>
            {options.map((opt) => (
              <button
                key={opt.value}
                className={`custom-dropdown-item ${value === opt.value ? "active" : ""}`}
                onClick={() => { onChange(opt.value); setOpen(false); }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function PracticeQuizView({ uploadedFiles, messages, modelId }) {
  const [quiz, setQuiz] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectionMade, setSelectionMade] = useState(false);
  const [sourceData, setSourceData] = useState("");
  
  const [numQuestions, setNumQuestions] = useState(5);
  const [topicFocus, setTopicFocus] = useState("");

  const [showSessionPicker, setShowSessionPicker] = useState(false);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError("");
    try {
      const q = await generatePracticeQuiz(sourceData, modelId, numQuestions, topicFocus);
      setQuiz(q);
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setScore(0);
      setIsFinished(false);
    } catch (err) {
      setError(err.message || "Failed to generate quiz.");
    } finally {
      setIsLoading(false);
    }
  };

  const selectDocument = (doc) => {
    setSourceData(doc.text);
    setSelectionMade(true);
  };

  const openSessionPicker = async () => {
    setShowSessionPicker(true);
    setLoadingSessions(true);
    try {
      const { getSessions } = await import("../utils/db.js");
      const sessions = await getSessions();
      setRecentSessions(sessions || []);
    } catch {
      setRecentSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  const selectSessionHistory = async (session) => {
    setShowSessionPicker(false);
    setLoadingSessions(true);
    try {
      const { getSessionMessages } = await import("../utils/db.js");
      const msgs = await getSessionMessages(session.id);
      const history = msgs.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n");
      if (!history) { setError("That conversation has no content."); return; }
      setSourceData(history);
      setSelectionMade(true);
    } catch {
      setError("Could not load that conversation. Try again.");
    } finally {
      setLoadingSessions(false);
    }
  };

  const selectCurrentChat = () => {
    const history = messages.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n");
    if (!history) { setError("Current chat is empty."); return; }
    setSourceData(history);
    setSelectionMade(true);
  };

  const handleAnswer = (option) => {
    if (selectedAnswer) return; // Prevent changing answer
    setSelectedAnswer(option);
    if (option === quiz[currentIndex].correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < quiz.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      setIsFinished(true);
    }
  };

  if (!selectionMade) {
    return (
      <div className="flashcards-view" style={{ padding: "24px", paddingTop: "64px", flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>
            Practice Quiz
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "32px", fontSize: "15px" }}>
            Test your knowledge with multiple-choice questions. Select a source to generate the quiz from.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
            {uploadedFiles.map((doc) => (
              <button key={doc.id} onClick={() => selectDocument(doc)} className="source-select-btn" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", border: "1px solid var(--border)", borderRadius: "12px", background: "var(--bg-surface)", cursor: "pointer", transition: "all 0.15s" }}>
                <FileText size={28} style={{ color: "var(--accent)" }} />
                <span style={{ fontWeight: 500, color: "var(--text-primary)", textAlign: "left" }}>{doc.name}</span>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Extracted text</span>
              </button>
            ))}

            <button onClick={selectCurrentChat} style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "24px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "12px", cursor: "pointer" }}>
              <MessageSquare size={28} style={{ color: messages.length > 0 ? "var(--accent)" : "var(--text-muted)" }} />
              <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>Current Chat</span>
            </button>

            <button onClick={openSessionPicker} style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "24px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "12px", cursor: "pointer" }}>
              <FileText size={28} style={{ color: "var(--accent)" }} />
              <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>From History</span>
            </button>
          </div>

          {error && <div className="error-banner" style={{ marginTop: "24px", borderRadius: "8px", background: "rgba(255, 100, 100, 0.1)", border: "1px solid rgba(255,100,100,0.3)", padding: "12px", color: "#e05050" }}>{error}</div>}

          {showSessionPicker && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }} onClick={() => setShowSessionPicker(false)}>
              <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px", width: "90%", maxWidth: "480px", maxHeight: "70vh", overflowY: "auto" }}>
                <h3 style={{ marginBottom: "16px", color: "var(--text-primary)" }}>Pick a conversation</h3>
                {loadingSessions && <p style={{ color: "var(--text-muted)" }}>Loading...</p>}
                {!loadingSessions && recentSessions.length === 0 && <p style={{ color: "var(--text-muted)" }}>No past conversations found.</p>}
                {!loadingSessions && recentSessions.map((s) => (
                  <button key={s.id} onClick={() => selectSessionHistory(s)} style={{ display: "block", width: "100%", textAlign: "left", padding: "12px", marginBottom: "8px", background: "var(--bg-raised)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", cursor: "pointer" }}>
                    <div style={{ fontWeight: 500 }}>{s.title || "Untitled"}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flashcards-view" style={{ padding: "24px", paddingTop: "64px", flex: 1, overflowY: "auto" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        
        {quiz.length === 0 ? (
          <div className="flashcard-config-wrapper" style={{ transition: "all 0.3s ease" }}>
            <h2 style={{ fontSize: "24px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>Configure Quiz</h2>
            <div className="flashcard-config-panel">
              <div className="flashcard-config-row">
                <ConfigDropdown
                  label="Number of Questions"
                  icon={<Layers size={16} style={{ color: "var(--accent)" }} />}
                  value={numQuestions}
                  options={[{ value: 5, label: "5 Questions" }, { value: 10, label: "10 Questions" }, { value: 15, label: "15 Questions" }]}
                  onChange={(v) => setNumQuestions(Number(v))}
                />
              </div>
              <div>
                <label className="flashcard-config-label"><Target size={16} style={{ color: "var(--accent)" }} /> Topic Focus (Optional):</label>
                <input type="text" className="flashcard-config-input" placeholder="e.g. Media Theory, Ethics..." value={topicFocus} onChange={(e) => setTopicFocus(e.target.value)} />
              </div>
              <button className="btn-primary" onClick={handleGenerate} disabled={isLoading} style={{ width: "100%", justifyContent: "center", padding: "12px", border: "none", borderRadius: "10px", marginTop: "16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                {isLoading ? (<><RefreshCw size={18} className="animate-spin" /> Generating Quiz...</>) : (<><BrainCircuit size={18} /> Start Quiz</>)}
              </button>
              {error && <div className="error-banner">{error}</div>}
            </div>
          </div>
        ) : isFinished ? (
          <div style={{ textAlign: "center", padding: "40px 20px", background: "var(--bg-surface)", borderRadius: "16px", border: "1px solid var(--border)" }}>
            <h2 style={{ fontSize: "28px", color: "var(--text-primary)", marginBottom: "16px" }}>Quiz Complete!</h2>
            <p style={{ fontSize: "18px", color: "var(--text-secondary)", marginBottom: "32px" }}>You scored {score} out of {quiz.length}</p>
            <button className="btn-primary" onClick={() => setSelectionMade(false)} style={{ padding: "12px 24px" }}>Start New Quiz</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Question {currentIndex + 1} of {quiz.length}</span>
              <span style={{ color: "var(--accent)", fontSize: "14px", fontWeight: 500 }}>Score: {score}</span>
            </div>
            
            <div style={{ background: "var(--bg-surface)", padding: "32px", borderRadius: "16px", border: "1px solid var(--border)" }}>
              <h3 style={{ fontSize: "20px", color: "var(--text-primary)", marginBottom: "32px", lineHeight: 1.5 }}>
                {quiz[currentIndex].question}
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {quiz[currentIndex].options.map((option, idx) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrectAnswer = option === quiz[currentIndex].correctAnswer;
                  let btnStyle = { textAlign: "left", padding: "16px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--bg-raised)", cursor: selectedAnswer ? "default" : "pointer", fontSize: "15px", color: "var(--text-primary)", transition: "all 0.2s" };
                  
                  if (selectedAnswer) {
                    if (isCorrectAnswer) {
                      btnStyle.background = "rgba(40, 200, 100, 0.1)";
                      btnStyle.borderColor = "rgba(40, 200, 100, 0.5)";
                    } else if (isSelected) {
                      btnStyle.background = "rgba(220, 80, 60, 0.1)";
                      btnStyle.borderColor = "rgba(220, 80, 60, 0.5)";
                    } else {
                      btnStyle.opacity = 0.5;
                    }
                  }
                  
                  return (
                    <button key={idx} disabled={!!selectedAnswer} onClick={() => handleAnswer(option)} style={btnStyle}>
                      {option}
                    </button>
                  );
                })}
              </div>

              {selectedAnswer && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: "24px", padding: "16px", borderRadius: "12px", background: "var(--bg-raised)", borderLeft: "4px solid var(--accent)" }}>
                  <p style={{ color: "var(--text-primary)", fontSize: "14px", lineHeight: 1.5 }}>{quiz[currentIndex].explanation}</p>
                </motion.div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="btn-primary" onClick={handleNext} disabled={!selectedAnswer} style={{ display: "flex", gap: "8px", alignItems: "center", padding: "12px 24px", opacity: selectedAnswer ? 1 : 0.5 }}>
                {currentIndex < quiz.length - 1 ? "Next Question" : "Finish Quiz"} <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
