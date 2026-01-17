import { supabase } from "./supabase-init.js";

// ===== Bookmarks (bookmarks: ownerid text, contentid uuid) =====
export async function fetchBookmarkedContentIds(ownerid = "me") {
  const { data, error } = await supabase
    .from("bookmarks")
    .select("contentid")
    .eq("ownerid", ownerid);

  if (error) {
    console.error("fetchBookmarkedContentIds error:", error);
    return [];
  }
  return (data || []).map(r => String(r.contentid));
}

export async function toggleBookmark(ownerid = "me", contentid) {
  contentid = String(contentid);

  const { data: existing, error: selErr } = await supabase
    .from("bookmarks")
    .select("contentid")
    .eq("ownerid", ownerid)
    .eq("contentid", contentid)
    .maybeSingle();

  if (selErr) {
    console.error("toggleBookmark select error:", selErr);
    return null;
  }

  if (existing) {
    const { error: delErr } = await supabase
      .from("bookmarks")
      .delete()
      .eq("ownerid", ownerid)
      .eq("contentid", contentid);

    if (delErr) console.error("toggleBookmark delete error:", delErr);
    return false;
  }

  const { error: insErr } = await supabase
    .from("bookmarks")
    .insert({ ownerid, contentid });

  if (insErr) {
    console.error("toggleBookmark insert error:", insErr);
    return null;
  }
  return true;
}

// ===== Follows (room_follows: followerid text, followedid text) =====
export async function fetchFollowedRoomIds(followerid = "me") {
  const { data, error } = await supabase
    .from("room_follows")
    .select("followedid")
    .eq("followerid", followerid);

  if (error) {
    console.error("fetchFollowedRoomIds error:", error);
    return [];
  }
  return (data || []).map(r => String(r.followedid));
}

export async function toggleFollow(followerid = "me", followedid) {
  followedid = String(followedid);

  const { data: existing, error: selErr } = await supabase
    .from("room_follows")
    .select("followedid")
    .eq("followerid", followerid)
    .eq("followedid", followedid)
    .maybeSingle();

  if (selErr) {
    console.error("toggleFollow select error:", selErr);
    return null;
  }

  if (existing) {
    const { error: delErr } = await supabase
      .from("room_follows")
      .delete()
      .eq("followerid", followerid)
      .eq("followedid", followedid);

    if (delErr) console.error("toggleFollow delete error:", delErr);
    return false;
  }

  const { error: insErr } = await supabase
    .from("room_follows")
    .insert({ followerid, followedid });

  if (insErr) {
    console.error("toggleFollow insert error:", insErr);
    return null;
  }
  return true;
}
