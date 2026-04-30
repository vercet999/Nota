import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteSession, getSessions } from "../utils/db";

const formatSessionDate = (date) =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(date));

export function HistoryDrawer({ isOpen, onLoadSession }) {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const savedSessions = await getSessions();
      setSessions(savedSessions);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) refreshSessions();
  }, [isOpen, refreshSessions]);

  const handleDelete = async (event, sessionId) => {
    event.stopPropagation();

    try {
      await deleteSession(sessionId);
      await refreshSessions();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="history-drawer">
      <div className="history-drawer-title">History</div>

      {isLoading && <div className="history-empty">Loading sessions...</div>}
      {error && <div className="history-error">{error}</div>}
      {!isLoading && !error && sessions.length === 0 && (
        <div className="history-empty">No saved sessions yet.</div>
      )}

      {!isLoading && sessions.length > 0 && (
        <div className="history-list">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="history-item"
              onClick={() => onLoadSession(session.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  onLoadSession(session.id);
                }
              }}
              role="button"
              tabIndex={0}
              title={session.title}
            >
              <span className="history-item-main">
                <span className="history-item-title">
                  {session.title || "New Study Session"}
                </span>
                <span className="history-item-meta">
                  {session.mode} -{" "}
                  {formatSessionDate(session.updated_at || session.created_at)}
                </span>
              </span>
              <button
                type="button"
                className="history-delete-btn"
                aria-label="Delete session"
                onClick={(event) => handleDelete(event, session.id)}
              >
                <Trash2 size={14} strokeWidth={1.8} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
