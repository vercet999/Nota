// ─── HistoryDrawer.jsx ────────────────────────────────────────────────────────
// Full chat management modal. Opened from Settings.
// Features: view active/archived chats, pin, archive, delete with confirmation.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from "react";
import {
  X, MessageSquare, Trash2, Pin, PinOff,
  Archive, ArchiveRestore, AlertTriangle,
} from "lucide-react";
import {
  getSessions, getArchivedSessions,
  deleteSession, pinSession, archiveSession,
} from "../utils/db";

// ── Single session row ────────────────────────────────────────────────────────
function SessionItem({ session, onLoad, onPin, onArchive, onDeleteRequest, isArchived }) {
  const date = new Date(session.updated_at).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div className="chat-manager-item">
      {session.pinned && (
        <span className="chat-manager-pin-badge" title="Pinned">📌</span>
      )}
      <div className="chat-manager-item-body" onClick={() => onLoad(session.id)}>
        <span className="chat-manager-item-title">{session.title || "Untitled"}</span>
        <span className="chat-manager-item-meta">
          {session.mode && <span className="chat-manager-mode-badge">{session.mode}</span>}
          <span>{date}</span>
        </span>
      </div>
      <div className="chat-manager-actions">
        <button
          className="chat-manager-action-btn"
          onClick={() => onPin(session.id, !session.pinned)}
          title={session.pinned ? "Unpin" : "Pin to top"}
        >
          {session.pinned ? <PinOff size={15} /> : <Pin size={15} />}
        </button>
        <button
          className="chat-manager-action-btn"
          onClick={() => onArchive(session.id, !isArchived)}
          title={isArchived ? "Restore from archive" : "Archive"}
        >
          {isArchived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
        </button>
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
        <AlertTriangle size={28} style={{ color: "#e05050", marginBottom: "12px" }} />
        <p className="delete-confirm-title">Delete this chat?</p>
        <p className="delete-confirm-subtitle">
          "{session.title || "Untitled"}" will be permanently removed. This cannot be undone.
        </p>
        <div className="delete-confirm-btns">
          <button className="cancel-btn" onClick={onCancel}>Cancel</button>
          <button className="delete-confirm-btn" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function HistoryDrawer({ isOpen, onClose, onLoadSession }) {
  const [activeTab, setActiveTab] = useState("active");
  const [sessions, setSessions] = useState([]);
  const [archived, setArchived] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [active, arch] = await Promise.all([getSessions(), getArchivedSessions()]);
      setSessions(active || []);
      setArchived(arch || []);
    } catch (err) {
      console.error("Failed to load chats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (isOpen) fetchAll(); }, [isOpen, fetchAll]);

  const handlePin = async (id, pinned) => { await pinSession(id, pinned); fetchAll(); };
  const handleArchive = async (id, shouldArchive) => { await archiveSession(id, shouldArchive); fetchAll(); };
  const handleDeleteConfirmed = async () => {
    if (!confirmDelete) return;
    await deleteSession(confirmDelete.id);
    setConfirmDelete(null);
    fetchAll();
  };
  const handleLoad = (id) => { onLoadSession(id); onClose(); };

  if (!isOpen) return null;

  const list = activeTab === "active" ? sessions : archived;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content chat-manager-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <MessageSquare size={20} style={{ color: "var(--accent)" }} />
              Manage Chats
            </h2>
            <button className="close-btn" onClick={onClose}><X size={20} /></button>
          </div>

          <div className="chat-manager-tabs">
            <button
              className={`chat-manager-tab ${activeTab === "active" ? "active" : ""}`}
              onClick={() => setActiveTab("active")}
            >
              Active
              {sessions.length > 0 && <span className="chat-manager-count">{sessions.length}</span>}
            </button>
            <button
              className={`chat-manager-tab ${activeTab === "archived" ? "active" : ""}`}
              onClick={() => setActiveTab("archived")}
            >
              Archived
              {archived.length > 0 && <span className="chat-manager-count">{archived.length}</span>}
            </button>
          </div>

          <div className="chat-manager-list">
            {loading && (
              <p style={{ color: "var(--text-muted)", padding: "20px 0", textAlign: "center" }}>Loading...</p>
            )}
            {!loading && list.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
                <MessageSquare size={40} style={{ opacity: 0.2, margin: "0 auto 12px", display: "block" }} />
                {activeTab === "active" ? "No active chats yet." : "No archived chats."}
              </div>
            )}
            {!loading && list.map((s) => (
              <SessionItem
                key={s.id}
                session={s}
                isArchived={activeTab === "archived"}
                onLoad={handleLoad}
                onPin={handlePin}
                onArchive={handleArchive}
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