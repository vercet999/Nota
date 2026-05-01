import { requireSupabase } from "./supabase";

const getNow = () => new Date().toISOString();

async function touchSession(sessionId) {
  const supabase = requireSupabase();
  const { error } = await supabase
    .from("sessions")
    .update({ updated_at: getNow() })
    .eq("id", sessionId);

  if (error) throw error;
}

export async function createSession(mode, model) {
  const supabase = requireSupabase();
  const now = getNow();
  const { data, error } = await supabase
    .from("sessions")
    .insert({
      title: "New Study Session",
      mode,
      model,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSessionTitle(sessionId, title) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("sessions")
    .update({ title, updated_at: getNow() })
    .eq("id", sessionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function saveMessage(sessionId, role, content) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("messages")
    .insert({
      session_id: sessionId,
      role,
      content,
      created_at: getNow(),
    })
    .select()
    .single();

  if (error) throw error;
  await touchSession(sessionId);
  return data;
}

export async function saveDocument(sessionId, fileName, extractedText) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("documents")
    .insert({
      session_id: sessionId,
      file_name: fileName,
      extracted_text: extractedText,
      created_at: getNow(),
    })
    .select()
    .single();

  if (error) throw error;
  await touchSession(sessionId);
  return data;
}

export async function getSessions() {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(10);

  if (error) throw error;
  return data;
}

export async function getSessionMessages(sessionId) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function deleteSession(sessionId) {
  const supabase = requireSupabase();
  const { error: documentsError } = await supabase
    .from("documents")
    .delete()
    .eq("session_id", sessionId);

  if (documentsError) throw documentsError;

  const { error: messagesError } = await supabase
    .from("messages")
    .delete()
    .eq("session_id", sessionId);

  if (messagesError) throw messagesError;

  const { error } = await supabase.from("sessions").delete().eq("id", sessionId);

  if (error) throw error;
}
