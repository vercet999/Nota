// ─── Dashboard.jsx ──────────────────────────────────────────────────────────
// Landing view shown before any chat starts. Replaces the bare typewriter
// welcome with real context: her courses, recent sessions, quick actions.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { NotebookPen, Library, BrainCircuit, FileText, ArrowRight } from "lucide-react";
import { getDueFlashcardsCount } from "../utils/db";

const QUICK_ACTIONS = [
  { id: "notes", label: "Generate Notes", icon: NotebookPen },
  { id: "flashcards", label: "Flashcards", icon: Library },
  { id: "quiz", label: "Practice Quiz", icon: BrainCircuit },
  { id: "fill-blanks", label: "Fill in Blanks", icon: FileText },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function parseCourses(coursesText) {
  if (!coursesText || !coursesText.trim()) return [];
  return coursesText
    .split("\n")
    .map((c) => c.trim())
    .filter(Boolean);
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export function Dashboard({ userName, institution, courses, onSelectView, onLoadSession }) {
  const [recentSessions, setRecentSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [dueCount, setDueCount] = useState(0);
  const courseList = parseCourses(courses);

  useEffect(() => {
    getDueFlashcardsCount().then(setDueCount).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    import("../utils/db.js")
      .then(({ getSessions }) => getSessions())
      .then((data) => {
        if (!cancelled) setRecentSessions((data || []).slice(0, 4));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingSessions(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <motion.div
      className="dashboard"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item} className="dashboard-greeting">
        <h1>
          {getGreeting()}, {userName}
        </h1>
        {institution && <p className="dashboard-institution">{institution}</p>}
      </motion.div>

      {courseList.length > 0 && (
        <motion.div variants={item} className="dashboard-courses">
          {courseList.map((course) => (
            <span key={course} className="course-pill">
              {course}
            </span>
          ))}
        </motion.div>
      )}

      <motion.div variants={item} className="dashboard-actions">
        {QUICK_ACTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className="dashboard-action-card"
            onClick={() => onSelectView(id)}
          >
            <div style={{ position: "relative" }}>
              <Icon size={20} strokeWidth={1.5} />
              {id === "flashcards" && dueCount > 0 && (
                <span className="dashboard-badge">{dueCount}</span>
              )}
            </div>
            <span>{label}</span>
          </button>
        ))}
      </motion.div>

      {!loadingSessions && recentSessions.length > 0 && (
        <motion.div variants={item} className="dashboard-recents">
          <span className="dashboard-recents-label">Pick up where you left off</span>
          <div className="dashboard-recents-list">
            {recentSessions.map((s) => (
              <button
                key={s.id}
                className="dashboard-recent-item"
                onClick={() => onLoadSession(s.id)}
              >
                <span className="dashboard-recent-title">{s.title || "Untitled"}</span>
                <ArrowRight size={14} strokeWidth={1.5} />
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
