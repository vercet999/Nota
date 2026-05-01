import React, { useEffect, useState } from "react";
import { Clock, MessageSquare, Trash2, X } from "lucide-react";
import { getSessions, deleteSession } from "../utils/db";

export function HistoryDrawer({ isOpen, onClose, onLoadSession }) {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const data = await getSessions();
      setSessions(data);
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSessions();
    }
  }, [isOpen]);

  const handleDelete = async (e, sessionId) => {
    e.stopPropagation();
    try {
      await deleteSession(sessionId);
      fetchSessions();
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 100 }} onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "400px", width: "90%", padding: "24px" }}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <h2
          className="modal-title"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "24px",
          }}
        >
          <Clock size={24} style={{ color: "var(--accent)" }} /> Chat History
        </h2>

        {isLoading ? (
          <div
            style={{
              textAlign: "center",
              padding: "20px",
              color: "var(--text-muted)",
            }}
          >
            Loading sessions...
          </div>
        ) : sessions.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              color: "var(--text-muted)",
            }}
          >
            <MessageSquare
              size={48}
              style={{ opacity: 0.2, margin: "0 auto 16px" }}
            />
            No chat history found. Start a new conversation!
          </div>
        ) : (
          <div className="history-list">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="history-item"
                title={`Model: ${session.model || 'Unknown'}\nLast Updated: ${new Date(session.updated_at).toLocaleString()}`}
                onClick={() => {
                  onLoadSession(session.id);
                  onClose();
                }}
              >
                <div className="history-item-content">
                  <h4 className="history-item-title">
                    {session.title || "Untitled Session"}
                  </h4>
                  <div className="history-item-meta">
                    <span>{session.mode}</span>
                    <span>•</span>
                    <span>
                      {new Date(session.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button
                  className="history-item-delete"
                  onClick={(e) => handleDelete(e, session.id)}
                  aria-label="Delete session"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
