import { useState, useEffect } from "react";
import { X, FolderOpen } from "lucide-react";
import { useEscapeKey } from "../hooks/useEscapeKey";

export const COLORS = {
  neutral: [
    { id: "amber", value: "#e8a030", name: "Amber" },
    { id: "slate", value: "#607d8b", name: "Slate" },
    { id: "teal", value: "#009688", name: "Teal" },
    { id: "mocha", value: "#795548", name: "Mocha" },
    { id: "grey", value: "#9e9e9e", name: "Grey" },
  ],
  feminine: [
    { id: "rose", value: "#f06292", name: "Rose" },
    { id: "lilac", value: "#ba68c8", name: "Lilac" },
    { id: "peach", value: "#ff8a65", name: "Peach" },
    { id: "magenta", value: "#ec407a", name: "Magenta" },
    { id: "purple", value: "#ab47bc", name: "Purple" },
  ],
};

export function SettingsModal({
  isOpen,
  onClose,
  currentName,
  currentColor,
  currentInstitution,
  currentCourses,
  currentNotes,
  onSave,
  onManageChats,
}) {
  useEscapeKey(isOpen, onClose);
  const [nameInput, setNameInput] = useState(currentName);
  const [colorInput, setColorInput] = useState(currentColor || "#e8a030");
  const [institutionInput, setInstitutionInput] = useState(currentInstitution || "");
  const [coursesInput, setCoursesInput] = useState(currentCourses || "");
  const [notesInput, setNotesInput] = useState(currentNotes || "");

  useEffect(() => {
    if (isOpen) {
      setNameInput(currentName);
      setColorInput(currentColor || "#e8a030");
      setInstitutionInput(currentInstitution || "");
      setCoursesInput(currentCourses || "");
      setNotesInput(currentNotes || "");
    }
  }, [isOpen, currentName, currentColor, currentInstitution, currentCourses, currentNotes]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(nameInput, colorInput, institutionInput, coursesInput, notesInput);
  };

  const renderColorOptions = (title, options) => (
    <div style={{ marginBottom: "16px" }}>
      <label
        style={{
          display: "block",
          fontSize: "12px",
          color: "var(--text-muted)",
          marginBottom: "8px",
        }}
      >
        {title}
      </label>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {options.map((color) => (
          <button
            key={color.id}
            type="button"
            className={`color-swatch ${colorInput === color.value ? "selected" : ""}`}
            style={{ backgroundColor: color.value }}
            onClick={() => setColorInput(color.value)}
            title={color.name}
            aria-label={`Select ${color.name} color`}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="userNameInput">Name (What Nota calls you)</label>
            <input
              id="userNameInput"
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Royalty"
              className="settings-input"
            />
          </div>

          <div className="form-group">
            <label
              style={{
                display: "block",
                fontSize: "13px",
                color: "var(--text-secondary)",
                marginBottom: "12px",
              }}
            >
              Accent Color
            </label>
            {renderColorOptions("Neutral Options", COLORS.neutral)}
            {renderColorOptions("Feminine Options", COLORS.feminine)}
          </div>

          <div className="form-group" style={{ borderTop: "1px solid var(--border)", paddingTop: "20px", marginTop: "4px" }}>
            <label style={{ display: "block", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>
              Profile — update each semester
            </label>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: 0, marginBottom: "12px" }}>
              This is what Nota knows about your studies. Edit it here instead of touching code when courses change.
            </p>

            <div className="form-group">
              <label htmlFor="institutionInput">Institution / Program</label>
              <input
                id="institutionInput"
                type="text"
                value={institutionInput}
                onChange={(e) => setInstitutionInput(e.target.value)}
                placeholder="e.g. UniMAC, Faculty of Communication and Liberal Studies"
                className="settings-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="coursesInput">Current courses (one per line)</label>
              <textarea
                id="coursesInput"
                value={coursesInput}
                onChange={(e) => setCoursesInput(e.target.value)}
                placeholder={"Communication Skills II (GURC202)\nPolitics and Society (FCLS102)"}
                className="settings-input"
                rows={5}
                style={{ resize: "vertical", fontFamily: "inherit" }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="notesInput">Special guidance (optional)</label>
              <textarea
                id="notesInput"
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="e.g. For Research, always explain qualitative vs quantitative"
                className="settings-input"
                rows={3}
                style={{ resize: "vertical", fontFamily: "inherit" }}
              />
            </div>
          </div>

          <div className="form-group" style={{ borderTop: "1px solid var(--border)", paddingTop: "20px", marginTop: "4px" }}>
            <label style={{ display: "block", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "10px" }}>
              Chat History
            </label>
            <button
              type="button"
              onClick={() => { onClose(); onManageChats(); }}
              style={{
                width: "100%",
                padding: "10px 16px",
                background: "var(--bg-raised)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                color: "var(--text-primary)",
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                cursor: "pointer",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "border-color 0.15s",
              }}
            >
              <FolderOpen size={16} /> Manage Chats — view, delete
            </button>
          </div>

          <div className="modal-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button type="button" className="btn-secondary" onClick={onClose} style={{ padding: '8px 16px' }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" style={{ padding: '8px 16px' }}>
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}