// ─── MicButton.jsx ──────────────────────────────────────────────────────────
// Small icon button that toggles voice input. Renders nothing if the
// browser doesn't support SpeechRecognition (no broken button shown).
// ─────────────────────────────────────────────────────────────────────────────

import { Mic, Square } from "lucide-react";
import { useVoiceInput } from "../hooks/useVoiceInput";

export function MicButton({ onTranscript, disabled, className = "icon-btn" }) {
  const { isSupported, isListening, toggleListening } = useVoiceInput(onTranscript);

  if (!isSupported) return null;

  return (
    <button
      type="button"
      className={`${className} mic-btn ${isListening ? "listening" : ""}`}
      onClick={toggleListening}
      disabled={disabled}
      title={isListening ? "Stop recording" : "Speak your question"}
      aria-label={isListening ? "Stop recording" : "Speak your question"}
    >
      {isListening ? <Square size={16} strokeWidth={1.5} /> : <Mic size={16} strokeWidth={1.5} />}
    </button>
  );
}
