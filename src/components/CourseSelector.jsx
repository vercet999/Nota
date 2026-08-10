// ─── CourseSelector.jsx ─────────────────────────────────────────────────────
// Optional per-conversation course tag, pulled from the Profile's course
// list. Tagging is opt-in — untagged sessions just show no badge.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from "react";
import { GraduationCap, ChevronDown, X } from "lucide-react";

function parseCourses(coursesText) {
  if (!coursesText || !coursesText.trim()) return [];
  return coursesText
    .split("\n")
    .map((c) => c.trim())
    .filter(Boolean);
}

export function CourseSelector({ courses, selectedCourse, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const courseList = parseCourses(courses);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (courseList.length === 0) return null;

  return (
    <div className="custom-dropdown-container" ref={ref}>
      <button
        className="btn-secondary course-selector-trigger"
        onClick={() => setOpen(!open)}
        style={{ display: "flex", alignItems: "center", gap: "6px", width: "100%", justifyContent: "space-between" }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <GraduationCap size={16} style={{ color: "var(--accent)" }} />
          {selectedCourse || "Tag a course (optional)"}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {selectedCourse && (
            <X
              size={14}
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
            />
          )}
          <ChevronDown size={14} style={{ opacity: 0.6, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
        </span>
      </button>
      {open && (
        <div className="custom-dropdown-menu" style={{ bottom: "auto", top: "calc(100% + 6px)", left: 0, right: 0, width: "100%", minWidth: "unset" }}>
          {courseList.map((course) => (
            <button
              key={course}
              className={`custom-dropdown-item ${selectedCourse === course ? "active" : ""}`}
              onClick={() => {
                onChange(course);
                setOpen(false);
              }}
            >
              {course}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
