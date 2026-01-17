// search-api.js
import { supabase } from "./supabase-init.js";

export async function fetchProfiles() {
  const { data, error } = await supabase.from("profiles").select("*");
  if (error) {
    console.error("fetchProfiles error:", error);
    return [];
  }
  return data ?? [];
}

export async function fetchContents() {
  const { data, error } = await supabase
    .from("contents")
    .select(`
      *,
      profiles:owner_id (
        owner_id,
        name,
        avatar
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchContents(join) error:", error);
    return [];
  }
  return data ?? [];
}


