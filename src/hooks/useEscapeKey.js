// ─── useEscapeKey.js ────────────────────────────────────────────────────────
// Closes a modal on Escape — standard modal behavior that none of Nota's
// modals had. Especially relevant on iPad with an external keyboard.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from "react";

export function useEscapeKey(isOpen, onClose) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);
}
