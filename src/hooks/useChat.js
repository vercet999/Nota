// ─── useChat.js ─────────────────────────────────────────────────────────────
// Central state hook for the chat interface.
// Manages: messages, mode, uploaded document, loading state, errors
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from "react";
import {
  sendMessage,
  DEFAULT_MODEL,
  generateSessionTitle,
} from "../utils/claudeApi";
import { extractTextFromFile } from "../utils/pdfExtract";
import {
  createSession,
  updateSessionTitle,
  saveMessage,
  saveDocument,
  getSessionMessages,
} from "../utils/db";

export function useChat() {
  const [sessionId, setSessionId] = useState(null); // null if new, UUID if saved
  const [messages, setMessages] = useState([]); // [{role, content}]
  const [mode, setModeState] = useState(
    () => localStorage.getItem("study_mode") || "normal",
  );
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL); // default model

  const setMode = useCallback((newMode) => {
    setModeState(newMode);
    localStorage.setItem("study_mode", newMode);
  }, []); // current study mode
  const [isLoading, setIsLoading] = useState(false); // waiting for API
  const [error, setError] = useState(null); // error string or null
  const [documentContext, setDocumentContext] = useState(""); // extracted text from upload
  const [uploadedFileName, setUploadedFileName] = useState(""); // display name
  const [uploadedFiles, setUploadedFiles] = useState([]); // [{ id, name, text }]

  // ── Load a session ─────────────────────────────────────────────────────────
  const loadSession = useCallback(async (id) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getSessionMessages(id);
      setSessionId(id);
      setMessages(data); // Map if needed, but the structure '{id, role, content}' matches what we need mostly

      // Optionally we could load documents if necessary
      // Reset uploaded files for now, since we aren't fetching documents for view yet
      // Or we can just leave existing uploaded documents mostly alone
      // but ideally we'd fetch the document contents, but skipping for simplicity
      // unless specified.
    } catch (err) {
      setError(`Could not load session: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Send a message ─────────────────────────────────────────────────────────
  const sendUserMessage = useCallback(
    async (text, userNameForApi) => {
      if (!text.trim() || isLoading) return;

      let currentSessionId = sessionId;

      // Create session on first message
      if (!currentSessionId) {
        try {
          const session = await createSession(mode, selectedModel);
          currentSessionId = session.id;
          setSessionId(currentSessionId);

          // Generate title in background
          generateSessionTitle(text, selectedModel).then((title) => {
            updateSessionTitle(currentSessionId, title);
          });
        } catch (err) {
          setError(`Failed to create session: ${err.message}`);
          return;
        }
      }

      const userMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
      };
      const updatedMessages = [...messages, userMessage];

      setMessages(updatedMessages);
      setIsLoading(true);
      setError(null);

      try {
        await saveMessage(currentSessionId, "user", text);
        const reply = await sendMessage(
          updatedMessages,
          mode,
          documentContext,
          userNameForApi,
          selectedModel,
        );
        await saveMessage(currentSessionId, "assistant", reply);
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", content: reply },
        ]);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, mode, documentContext, isLoading, selectedModel, sessionId],
  );

  // ── Handle file upload ─────────────────────────────────────────────────────
  const handleFileUpload = useCallback(
    async (file) => {
      setIsLoading(true);
      setError(null);
      try {
        const text = await extractTextFromFile(file);
        const newFile = { id: crypto.randomUUID(), name: file.name, text };
        setUploadedFiles((prev) => [...prev, newFile]);
        setDocumentContext(text);
        setUploadedFileName(file.name);

        if (sessionId) {
          await saveDocument(sessionId, file.name, text);
        }

        // Add a system-style message to the chat so she knows it worked
        const sysMsg = `I've loaded **${file.name}**. I can now answer questions based on its content. What would you like to know?`;
        if (sessionId) {
          await saveMessage(sessionId, "assistant", sysMsg);
        }
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: sysMsg,
          },
        ]);
      } catch (err) {
        setError(`Could not read file: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId],
  );

  // ── Clear everything for a fresh session ──────────────────────────────────
  const clearSession = useCallback(() => {
    setSessionId(null);
    setMessages([]);
    setDocumentContext("");
    setUploadedFileName("");
    setUploadedFiles([]);
    setError(null);
  }, []);

  return {
    sessionId,
    messages,
    mode,
    setMode,
    selectedModel,
    setSelectedModel,
    isLoading,
    error,
    uploadedFileName,
    uploadedFiles,
    documentContext,
    sendUserMessage,
    handleFileUpload,
    clearSession,
    loadSession,
  };
}
