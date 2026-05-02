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

export async function saveDocument(sessionId, fileName, extractedText) {
  const { data, error } = await supabase.from("documents").insert([
    {
      session_id: sessionId,
      file_name: fileName,
      extracted_text: extractedText,
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
