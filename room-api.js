import { supabase } from "./supabase-init.js";

export async function fetchProfile(ownerId){
  const { data, error } = await supabase
    .from("profiles")
    .select("owner_id,name,avatar,bio,tags")
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function fetchContentsByOwner(ownerId){
  const { data, error } = await supabase
    .from("contents")
    .select("id,title,type,thumbnail,videoSrc,moodTags,date,location,memory,created_at,owner_id")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchContentById(contentId){
  const { data, error } = await supabase
    .from("contents")
    .select("id,title,type,thumbnail,videoSrc,moodTags,date,location,memory,created_at,owner_id")
    .eq("id", contentId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
