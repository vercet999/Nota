// ─── BottomTabBar.jsx ───────────────────────────────────────────────────────
// Native-feeling primary navigation for iPhone-width screens. Only rendered
// via CSS (max-width: 768px) — on iPad the existing sidebar stays, matching
// how Apple's own apps (Notes, Mail) use a rail on iPad and a tab bar on
// iPhone.
// ─────────────────────────────────────────────────────────────────────────────

import { MessageCircle, Library, BrainCircuit, NotebookPen, Menu } from "lucide-react";

const TABS = [
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "flashcards", label: "Cards", icon: Library },
  { id: "quiz", label: "Quiz", icon: BrainCircuit },
  { id: "notes", label: "Notes", icon: NotebookPen },
];

export function BottomTabBar({ activeView, onSelectView, onOpenMore }) {
  return (
    <nav className="bottom-tab-bar">
      {TABS.map(({ id, label, icon: Icon }) => {
        const isActive = activeView === id;
        return (
          <button
            key={id}
            className={`tab-bar-item ${isActive ? "active" : ""}`}
            onClick={() => onSelectView(id)}
          >
            <Icon size={22} strokeWidth={isActive ? 2 : 1.5} />
            <span>{label}</span>
          </button>
        );
      })}
      <button className="tab-bar-item" onClick={onOpenMore}>
        <Menu size={22} strokeWidth={1.5} />
        <span>More</span>
      </button>
    </nav>
  );
}
