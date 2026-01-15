// search-api.js
import { supabase } from "./supabase-init.js";

export async function fetchProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*");
  if (error) throw error;
  return data ?? [];
}

export async function fetchContents() {
  const { data, error } = await supabase
    .from("contents")
    .select("*");
  if (error) throw error;
  return data ?? [];
}
