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
  uploadFileToStorage,
  getSessionMessages,
  getSessionDocuments,
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

      // Fetch messages and documents in parallel
      const [msgs, docs] = await Promise.all([
        getSessionMessages(id),
        getSessionDocuments(id).catch(() => []), // don't fail if no docs
      ]);

      setSessionId(id);
      setMessages(msgs);

      // Restore document context — concatenate all docs from that session
      if (docs && docs.length > 0) {
        const combinedText = docs
          .map((d) => `[${d.file_name}]\n${d.extracted_text}`)
          .join("\n\n---\n\n");
        setDocumentContext(combinedText);

        // Restore uploaded files list so the UI shows the file names
        setUploadedFiles(
          docs.map((d) => ({ id: d.id, name: d.file_name, text: d.extracted_text }))
        );
        setUploadedFileName(docs[docs.length - 1].file_name);
      } else {
        // No documents for this session — clear any stale context
        setDocumentContext("");
        setUploadedFiles([]);
        setUploadedFileName("");
      }
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

      const userMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
      };
      const updatedMessages = [...messages, userMessage];

      // Optimistically update UI so message doesn't "vanish"
      setMessages(updatedMessages);
      setIsLoading(true);
      setError(null);

      let currentSessionId = sessionId;

      try {
        // Create session on first message
        if (!currentSessionId) {
          const session = await createSession(mode, selectedModel).catch(
            (e) => {
              console.warn("Could not create DB session", e);
              return null;
            },
          );
          if (session) {
            currentSessionId = session.id;
            setSessionId(currentSessionId);

            // Generate title in background
            generateSessionTitle(text, selectedModel)
              .then((title) => {
                updateSessionTitle(currentSessionId, title).catch(() => {});
              })
              .catch(() => {});
          }
        }

        if (currentSessionId) {
          await saveMessage(currentSessionId, "user", text).catch((e) =>
            console.warn("Could not save message", e),
          );
        }

        const reply = await sendMessage(
          updatedMessages,
          mode,
          documentContext,
          userNameForApi,
          selectedModel,
        );

        if (currentSessionId) {
          await saveMessage(currentSessionId, "assistant", reply).catch((e) =>
            console.warn("Could not save reply", e),
          );
        }

        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", content: reply },
        ]);
      } catch (err) {
        setError(err.message || "Failed to establish connection.");
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
          // Try uploading raw file to Supabase Storage; fall back to text-only if it fails
          let fileUrl = null;
          try {
            fileUrl = await uploadFileToStorage(file, sessionId);
          } catch (storageErr) {
            console.warn("Storage upload failed, saving text only:", storageErr);
          }
          const ext = file.name.split(".").pop().toLowerCase();
          await saveDocument(sessionId, file.name, text, fileUrl, ext);
        }

        // Add a system-style message to the chat so she knows it worked
        const sysMsg = `I've loaded **${file.name}**. I can now answer questions based on its content. What would you like to know?`;
        if (sessionId) {
          await saveMessage(sessionId, "assistant", sysMsg).catch(() => {});
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

  // ── Load a saved document back into context (from Files Library) ───────────
  const loadDocumentIntoContext = useCallback((fileName, text) => {
    setDocumentContext(text);
    setUploadedFileName(fileName);
    setUploadedFiles((prev) => {
      const exists = prev.find((f) => f.name === fileName);
      if (exists) return prev;
      return [...prev, { id: crypto.randomUUID(), name: fileName, text }];
    });
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `📂 I've loaded **${fileName}** from your files library. Ask me anything about it.`,
      },
    ]);
  }, []);

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
    loadDocumentIntoContext,
    clearSession,
    loadSession,
  };
}