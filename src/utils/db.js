import { supabase } from "./supabase";

export async function createSession(mode, model) {
  const { data, error } = await supabase
    .from("sessions")
    .insert([{ mode, model, title: "New Conversation" }])
    .select()
    .single();

  if (error) {
    console.error("Error creating session:", error);
    throw error;
  }
  return data;
}

export async function updateSessionTitle(sessionId, title) {
  const { data, error } = await supabase
    .from("sessions")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", sessionId)
    .select()
    .single();

  if (error) {
    console.error("Error updating session title:", error);
    throw error;
  }
  return data;
}

export async function saveMessage(sessionId, role, content) {
  const { data, error } = await supabase
    .from("messages")
    .insert([{ session_id: sessionId, role, content }]);

  if (error) {
    console.error("Error saving message:", error);
    throw error;
  }

  // Also update session updated_at
  await supabase
    .from("sessions")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", sessionId);

  return data;
}

export async function saveDocument(sessionId, fileName, extractedText, fileUrl = null, fileType = null) {
  const { data, error } = await supabase.from("documents").insert([
    {
      session_id: sessionId,
      file_name: fileName,
      extracted_text: extractedText,
      file_url: fileUrl,
      file_type: fileType,
    },
  ]);

  if (error) {
    console.error("Error saving document:", error);
    throw error;
  }
  return data;
}

export async function getSessions() {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error fetching sessions:", error);
    throw error;
  }

  return data;
}

export async function getSessionMessages(sessionId) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }
  return data;
}

export async function getSessionDocuments(sessionId) {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching documents:", error);
    throw error;
  }
  return data;
}

export async function deleteSession(sessionId) {
  const { data, error } = await supabase
    .from("sessions")
    .delete()
    .eq("id", sessionId);

  if (error) {
    console.error("Error deleting session:", error);
    throw error;
  }
  return data;
}

// ── Notes ───────────────────────────────────────────────────────────────────

export async function getNotes() {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("Notes table may not exist, falling back to localStorage:", error);
    const local = localStorage.getItem("nota_notes");
    return local ? JSON.parse(local) : [];
  }
  return data;
}

export async function saveNote(title, content) {
  const { data, error } = await supabase
    .from("notes")
    .insert([{ title, content }])
    .select()
    .single();

  if (error) {
    console.warn("Notes table error, using localStorage:", error);
    const local = localStorage.getItem("nota_notes");
    let parsed = local ? JSON.parse(local) : [];
    const newNote = { id: crypto.randomUUID(), title, content, created_at: new Date().toISOString() };
    parsed.unshift(newNote);
    localStorage.setItem("nota_notes", JSON.stringify(parsed));
    return newNote;
  }
  return data;
}

export async function deleteNote(id) {
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) {
    console.warn("Notes table delete error, using localStorage:", error);
    const local = localStorage.getItem("nota_notes");
    if (local) {
      let parsed = JSON.parse(local);
      parsed = parsed.filter(n => n.id !== id);
      localStorage.setItem("nota_notes", JSON.stringify(parsed));
    }
  }
}

// ── Summaries ─────────────────────────────────────────────────────────────

export async function getSummaries() {
  const { data, error } = await supabase
    .from("summaries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("Summaries table may not exist, falling back to localStorage:", error);
    const local = localStorage.getItem("nota_summaries");
    return local ? JSON.parse(local) : [];
  }
  return data;
}

export async function saveSummary(title, content) {
  const { data, error } = await supabase
    .from("summaries")
    .insert([{ title, content }])
    .select()
    .single();

  if (error) {
    console.warn("Summaries table error, using localStorage:", error);
    const local = localStorage.getItem("nota_summaries");
    let parsed = local ? JSON.parse(local) : [];
    const newSummary = { id: crypto.randomUUID(), title, content, created_at: new Date().toISOString() };
    parsed.unshift(newSummary);
    localStorage.setItem("nota_summaries", JSON.stringify(parsed));
    return newSummary;
  }
  return data;
}

export async function deleteSummary(id) {
  const { error } = await supabase.from("summaries").delete().eq("id", id);
  if (error) {
    console.warn("Summaries table delete error, using localStorage:", error);
    const local = localStorage.getItem("nota_summaries");
    if (local) {
      let parsed = JSON.parse(local);
      parsed = parsed.filter(n => n.id !== id);
      localStorage.setItem("nota_summaries", JSON.stringify(parsed));
    }
  }
}


// ── Profile (adaptive per-semester context) ──────────────────────────────────
// Single-row table: institution, current courses, and optional freeform
// guidance for the AI. Update this each semester instead of touching code.

export async function getProfile() {
  const { data, error } = await supabase
    .from("profile")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    console.warn("Profile table unavailable, falling back to localStorage:", error);
    const local = localStorage.getItem("nota_profile");
    return local ? JSON.parse(local) : null;
  }
  return data;
}

export async function saveProfile(profile) {
  const { data, error } = await supabase
    .from("profile")
    .upsert([{ id: 1, ...profile, updated_at: new Date().toISOString() }])
    .select()
    .single();

  if (error) {
    console.warn("Profile table error, using localStorage:", error);
    localStorage.setItem("nota_profile", JSON.stringify(profile));
    return profile;
  }
  return data;
}

// ── Flashcard deck (persistent, spaced-repetition) ───────────────────────────
// Newly generated cards are saved here so they enter a real review rotation,
// instead of only existing for the browsing session they were created in.

export async function saveFlashcardsToDeck(cards, sourceLabel = "") {
  const rows = cards.map((c) => ({
    term: c.term,
    definition: c.definition,
    source_label: sourceLabel,
  }));

  const { data, error } = await supabase.from("flashcards").insert(rows).select();

  if (error) {
    console.warn("Could not save flashcards to deck:", error);
    return [];
  }
  return data;
}

export async function getDueFlashcards() {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("flashcards")
    .select("*")
    .lte("next_review_date", today)
    .order("next_review_date", { ascending: true });

  if (error) {
    console.warn("Could not load due flashcards:", error);
    return [];
  }
  return data || [];
}

export async function getDueFlashcardsCount() {
  const today = new Date().toISOString().slice(0, 10);
  const { count, error } = await supabase
    .from("flashcards")
    .select("id", { count: "exact", head: true })
    .lte("next_review_date", today);

  if (error) {
    console.warn("Could not count due flashcards:", error);
    return 0;
  }
  return count || 0;
}

export async function reviewFlashcard(cardId, rating, currentCard) {
  const { scheduleNextReview } = await import("./spacedRepetition.js");
  const updates = scheduleNextReview(currentCard, rating);

  const { data, error } = await supabase
    .from("flashcards")
    .update({ ...updates, last_reviewed_at: new Date().toISOString() })
    .eq("id", cardId)
    .select()
    .single();

  if (error) {
    console.warn("Could not save review:", error);
    return null;
  }
  return data;
}

/**
 * Upload the raw file to Supabase Storage bucket "nota-files".
 * Returns the public URL of the uploaded file.
 */
export async function uploadFileToStorage(file, sessionId) {
  const safeName = file.name.replace(/[^a-z0-9._-]/gi, "_");
  const path = `${sessionId}/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage
    .from("nota-files")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    console.error("Storage upload error:", error);
    throw error;
  }

  const { data: urlData } = supabase.storage
    .from("nota-files")
    .getPublicUrl(path);

  return urlData.publicUrl;
}

/**
 * Fetch all documents across all sessions — for the Files Library.
 * Joins session title for display.
 */
export async function getAllDocuments() {
  const { data, error } = await supabase
    .from("documents")
    .select("*, sessions(title)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching all documents:", error);
    throw error;
  }
  return data;
}