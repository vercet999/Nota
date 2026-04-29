// ─── ModeSelector.jsx ───────────────────────────────────────────────────────
// The 4 study mode buttons. Each changes the AI's system prompt/personality.
// ─────────────────────────────────────────────────────────────────────────────

import { MessageSquareText, Lightbulb, Target } from 'lucide-react'

const MODES = [
  {
    id: 'normal',
    label: 'Normal',
    icon: MessageSquareText,
    description: 'Clear, thorough answers'
  },
  {
    id: 'simple',
    label: 'Simplify',
    icon: Lightbulb,
    description: 'Break it down simply'
  },
  {
    id: 'exam',
    label: 'Exam Mode',
    icon: Target,
    description: 'Structured, scoreable answers'
  }
]

export function ModeSelector({ activeMode, onModeChange, isWelcome }) {
  return (
    <div className="mode-selector">
      {!isWelcome && <span className="mode-label">Study Mode</span>}
      <div className="mode-pills">
        {MODES.map((mode) => {
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              className={`mode-pill ${activeMode === mode.id ? 'active' : ''} mode-${mode.id}`}
              onClick={() => onModeChange(mode.id)}
              title={mode.description}
            >
              <Icon size={14} strokeWidth={1.5} className="mode-icon-svg" />
              <span className="mode-name">{mode.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
