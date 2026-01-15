import { supabase } from "./supabase-init.js";
import { usersDB, contentsDB } from "./search-data.js";

const BOOKMARK_OWNER = "me";

export default async function seedSearchData() {
  // 1) profiles 업서트
  const profilesPayload = usersDB.map(u => ({
  owner_id: u.id,
  name: u.name ?? "",
  avatar: u.avatar ?? "/images/user-placeholder.png", // ✅ null 방지
  bio: u.bio ?? "",
  tags: u.tags ?? [],
}));




    const { data: pData, error: pErr } = await supabase
    .from("profiles")
    .insert(profilesPayload, { ignoreDuplicates: true });

    if (pErr) {
    console.error("❌ profiles insert error:", pErr);
    throw pErr;
    }


  // 2) contents insert (uuid는 DB가 생성)
  // 기존 c1,c2... id는 버리고, insert 결과로 uuid를 받아서 bookmarks 매칭에 씀
  const contentsPayload = contentsDB.map(c => ({
    ownerId: c.ownerId,
    type: c.type === "photo" ? "gallery" : c.type,
    title: c.title ?? "",
    date: c.date ?? "",
    location: c.location ?? "",
    memory: c.memory ?? "",
    moodTags: c.tags ?? [],
    thumbnail: c.thumbnail ?? "",
    videoSrc: c.videoSrc ?? ""
    }));
     


  const { data: insertedContents, error: cErr } = await supabase
    .from("contents")
    .insert(contentsPayload)
    .select("id, title"); // id 가져오기

  if (cErr) throw cErr;

  // 3) bookmarks insert (search-data.js에서 bookmarked: true인 것만)
  // contentsDB의 index 기준으로 insertedContents도 동일 순서라고 가정(보통 유지됨)
  const bookmarkRows = [];
  for (let i = 0; i < contentsDB.length; i++) {
    if (!contentsDB[i].bookmarked) continue;
    const newId = insertedContents?.[i]?.id;
    if (!newId) continue;
    bookmarkRows.push({ ownerId: BOOKMARK_OWNER, contentId: newId });
  }

  if (bookmarkRows.length) {
  const { error: bErr } = await supabase
    .from("bookmarks")
    .insert(bookmarkRows, { ignoreDuplicates: true });

  if (bErr) throw bErr;
    }


  console.log("✅ Seed complete:", {
    profiles: profilesPayload.length,
    contents: contentsPayload.length,
    bookmarks: bookmarkRows.length,
  });
}
