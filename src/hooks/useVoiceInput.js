// ─── useVoiceInput.js ───────────────────────────────────────────────────────
// Wraps the browser's built-in SpeechRecognition API. No external service,
// no extra API cost — works in Chrome/Edge; gracefully unsupported elsewhere
// (isSupported is false, callers should hide the mic button).
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect, useCallback } from "react";

export function useVoiceInput(onResult) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const isSupported =
    typeof window !== "undefined" &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    if (!isSupported) return;
    const SpeechRecognitionImpl =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionImpl();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(" ");
      onResultRef.current?.(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    return () => recognition.abort();
  }, [isSupported]);

  const toggleListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
    } else {
      setIsListening(true);
      recognition.start();
    }
  }, [isListening]);

  return { isSupported, isListening, toggleListening };
}
