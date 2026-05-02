// ─── HistoryDrawer.jsx ────────────────────────────────────────────────────────
// Full chat management modal. Opened from Settings.
// Features: view chats and delete with confirmation.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from "react";
import { X, MessageSquare, Trash2, AlertTriangle } from "lucide-react";
import { getSessions, deleteSession } from "../utils/db";

// ── Single session row ────────────────────────────────────────────────────────
function SessionItem({ session, onLoad, onDeleteRequest }) {
  const date = new Date(session.updated_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="chat-manager-item">
      <div
        className="chat-manager-item-body"
        onClick={() => onLoad(session.id)}
      >
        <span className="chat-manager-item-title">
          {session.title || "Untitled"}
        </span>
        <span className="chat-manager-item-meta">
          {session.mode && (
            <span className="chat-manager-mode-badge">{session.mode}</span>
          )}
          <span>{date}</span>
        </span>
      </div>
      <div className="chat-manager-actions">
        <button
          className="chat-manager-action-btn delete"
          onClick={() => onDeleteRequest(session)}
          title="Delete permanently"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

// ── Delete confirmation dialog ─────────────────────────────────────────────────
function DeleteConfirm({ session, onConfirm, onCancel }) {
  return (
    <div className="delete-confirm-overlay" onClick={onCancel}>
      <div className="delete-confirm-box" onClick={(e) => e.stopPropagation()}>
        <AlertTriangle
          size={28}
          style={{ color: "#e05050", marginBottom: "12px" }}
        />
        <p className="delete-confirm-title">Delete this chat?</p>
        <p className="delete-confirm-subtitle">
          "{session.title || "Untitled"}" will be permanently removed. This
          cannot be undone.
        </p>
        <div className="delete-confirm-btns">
          <button className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="delete-confirm-btn" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function HistoryDrawer({ isOpen, onClose, onLoadSession }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const active = await getSessions();
      setSessions(active || []);
    } catch (err) {
      console.error("Failed to load chats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) fetchAll();
  }, [isOpen, fetchAll]);

  const handleDeleteConfirmed = async () => {
    if (!confirmDelete) return;
    await deleteSession(confirmDelete.id);
    setConfirmDelete(null);
    fetchAll();
  };

  const handleLoad = (id) => {
    onLoadSession(id);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100 }}>
        <div
          className="modal-content chat-manager-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="modal-header"
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                margin: 0,
                fontSize: "18px",
              }}
            >
              <MessageSquare size={20} style={{ color: "var(--accent)" }} />
              Manage Chats
            </h2>
            <button
              className="close-btn"
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-secondary)",
              }}
            >
              <X size={20} />
            </button>
          </div>

          <div
            className="chat-manager-list"
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px 16px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            {loading && (
              <p
                style={{
                  color: "var(--text-muted)",
                  padding: "20px 0",
                  textAlign: "center",
                }}
              >
                Loading...
              </p>
            )}
            {!loading && sessions.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 0",
                  color: "var(--text-muted)",
                }}
              >
                <MessageSquare
                  size={40}
                  style={{
                    opacity: 0.2,
                    margin: "0 auto 12px",
                    display: "block",
                  }}
                />
                No chats yet.
              </div>
            )}
            {!loading &&
              sessions.map((s) => (
                <SessionItem
                  key={s.id}
                  session={s}
                  onLoad={handleLoad}
                  onDeleteRequest={setConfirmDelete}
                />
              ))}
          </div>
        </div>
      </div>

      {confirmDelete && (
        <DeleteConfirm
          session={confirmDelete}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </>
  );
}
