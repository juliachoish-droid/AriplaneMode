import { supabase } from "./supabase-init.js";

// 썸네일 업로드
export async function uploadImage(ownerId, docId, file){
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `users/${ownerId}/contents/${docId}/thumbnail.${ext}`;

  const { error } = await supabase
    .storage
    .from("media")
    .upload(path, file, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}

// 콘텐츠 생성
export async function createContent(ownerId = "me", data = {}) {
  const payload = {
    ownerId,
    ...data,
    created_at: new Date().toISOString(),
  };

  const { data: row, error } = await supabase
    .from("contents")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return row;
}

// 업데이트
export async function updateContent(id, patch){
  const { error } = await supabase
    .from("contents")
    .update(patch)
    .eq("id", id);

  if (error) throw error;
}

// 목록 불러오기
export async function fetchMyContents(ownerId = "me") {
  const { data, error } = await supabase
    .from("contents")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// 프로필 (없으면 null)
export async function fetchProfile(ownerId = "me") {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("owner_id", ownerId)
      .maybeSingle();

    if (error) return null;
    return data ?? null;
  } catch {
    return null;
  }
}

// Storage 업로드 (gallery / video 공용)
export async function uploadFile(ownerId, contentId, file, kind = "media") {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const safeName = file.name.replaceAll(" ", "_");
  const path = `users/${ownerId}/contents/${contentId}/${kind}.${ext}`;

  const { error } = await supabase
    .storage
    .from("media")
    .upload(path, file, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}
