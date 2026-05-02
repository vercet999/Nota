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