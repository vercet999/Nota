// ─── ModeSelector.jsx ───────────────────────────────────────────────────────
// The 4 study mode buttons. Each changes the AI's system prompt/personality.
// ─────────────────────────────────────────────────────────────────────────────

const MODES = [
  {
    id: 'normal',
    label: 'Normal',
    icon: '💬',
    description: 'Clear, thorough answers'
  },
  {
    id: 'simple',
    label: 'Simplify',
    icon: '🔦',
    description: 'Break it down simply'
  },
  {
    id: 'exam',
    label: 'Exam Mode',
    icon: '🎯',
    description: 'Structured, scoreable answers'
  },
  {
    id: 'journalism',
    label: 'Journalism',
    icon: '📰',
    description: 'News writing & story feedback'
  }
]

export function ModeSelector({ activeMode, onModeChange }) {
  return (
    <div className="mode-selector">
      <span className="mode-label">Study Mode</span>
      <div className="mode-pills">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            className={`mode-pill ${activeMode === mode.id ? 'active' : ''} mode-${mode.id}`}
            onClick={() => onModeChange(mode.id)}
            title={mode.description}
          >
            <span className="mode-icon">{mode.icon}</span>
            <span className="mode-name">{mode.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
