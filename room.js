import { supabase } from "./supabase-init.js";
import {
  fetchBookmarkedContentIds,
  fetchFollowedRoomIds,
  toggleBookmark,
  toggleFollow
} from "./social-api.js";

const ME = "me";

// -------- params
const qs = new URLSearchParams(location.search);
const ownerId = qs.get("user") || ME;
const openContentId = qs.get("content");
const from = (qs.get("from") || "").toLowerCase();

// -------- DOM
const backBtn = document.getElementById("btnBackToSearch");
const followBtn = document.getElementById("roomFollowBtn");

const roomTitleEl = document.getElementById("roomTitle");
const roomAvatarEl = document.getElementById("roomAvatar");
const roomBioEl = document.getElementById("roomBio");
const roomTagsEl = document.getElementById("roomTags");

const listEl = document.getElementById("roomContentsList");

// overlay DOM (room.html 기준)
const overlay = document.getElementById("detailOverlay");
const btnClose = document.querySelector(".close-center-page-btn");
const detailSaveBtn = document.getElementById("detailSaveBtn");

const viewMedia = document.getElementById("viewMedia");
const viewTitle = document.getElementById("viewTitle");
const viewDate = document.getElementById("viewDate");
const viewLocation = document.getElementById("viewLocation");
const viewTags = document.getElementById("viewTags");
const viewMemory = document.getElementById("viewMemory");

// -------- state
let profile = null;
let roomContents = [];
let bookmarkedIds = [];
let followedIds = [];
let currentContentId = null;

// -------- back href
if (backBtn) {
  if (from === "library") backBtn.href = "Library.html";
  else backBtn.href = "Search.html";
}

// -------- DB fetch helpers
async function fetchProfile(owner_id) {
  const { data, error } = await supabase
    .from("profiles")
    .select("owner_id,name,avatar,bio,tags")
    .eq("owner_id", owner_id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function fetchContentsByOwner(owner_id) {
  const { data, error } = await supabase
    .from("contents")
    .select("id,title,type,thumbnail,videoSrc,moodTags,date,location,memory,created_at,owner_id")
    .eq("owner_id", owner_id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

async function fetchContentById(id) {
  const { data, error } = await supabase
    .from("contents")
    .select("id,title,type,thumbnail,videoSrc,moodTags,date,location,memory,created_at,owner_id")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// -------- render: profile
function renderProfile(p) {
  if (roomTitleEl) roomTitleEl.textContent = p?.name ? `${p.name}’s Room` : "Room";
  if (roomAvatarEl) roomAvatarEl.src = p?.avatar || "";
  if (roomBioEl) roomBioEl.textContent = p?.bio || "";

  if (roomTagsEl) {
    const tags = p?.tags || [];
    roomTagsEl.innerHTML = tags.map(t => `<span class="tag-pill--highlight">#${t}</span>`).join("");
  }
}

// -------- render: follow button
function renderFollowBtn() {
  if (!followBtn) return;

  const isMine = ownerId === ME;
  followBtn.style.display = isMine ? "none" : "inline-flex";

  const on = followedIds.includes(String(ownerId));
  followBtn.classList.toggle("is-active", on);
  followBtn.textContent = on ? "Following" : "Follow";
}

// -------- render: contents
function isBookmarked(id) {
  return bookmarkedIds.includes(String(id));
}

function renderContents(list) {
  if (!listEl) return;

  if (!list || list.length === 0) {
    listEl.innerHTML = `<p class="empty">No contents yet.</p>`;
    return;
  }

  listEl.innerHTML = list.map(c => {
    const mine = String(c.owner_id) === ME;

    return `
      <a class="content-item" href="#" data-content-id="${c.id}">
        <div class="thumb ${c.type === "music" ? "thumb--youtube" : ""}"
             style="background-image:url('${c.thumbnail || ""}')"></div>

        ${!mine ? `
          <button class="content-save-btn ${isBookmarked(c.id) ? "is-active" : ""}"
                  type="button"
                  data-save-id="${c.id}"
                  aria-label="Save content">
            <span class="star-icon star-icon--outline">☆</span>
            <span class="star-icon star-icon--filled">★</span>
          </button>
        ` : ""}

        <div class="content-meta">
          <div class="content-title">${c.title ?? "Untitled"}</div>
          <div class="content-sub">${c.date ?? ""}</div>
          <div class="content-sub">${c.location ?? ""}</div>
        </div>
      </a>
    `;
  }).join("");
}

// -------- overlay
function syncDetailSaveBtn() {
  if (!detailSaveBtn || !currentContentId) return;
  const on = bookmarkedIds.includes(String(currentContentId));
  detailSaveBtn.classList.toggle("is-active", on);
  detailSaveBtn.textContent = on ? "Saved" : "Save";
}

function openDetail(c) {
  currentContentId = String(c.id);

  if (viewTitle) viewTitle.textContent = c.title ?? "Untitled";
  if (viewDate) viewDate.textContent = c.date ?? "";
  if (viewLocation) viewLocation.textContent = c.location ?? "";

  const tags = c.moodTags || [];
  if (viewTags) viewTags.innerHTML = tags.map(t => `<span class="tag-pill--highlight">#${t}</span>`).join("");

  if (viewMemory) viewMemory.textContent = c.memory ?? "";

  if (viewMedia) {
    viewMedia.classList.remove("is-youtube-zoom");
    viewMedia.style.backgroundImage = "";
    viewMedia.innerHTML = "";

    if (c.type === "music" && c.videoSrc) {
      viewMedia.classList.add("is-youtube-zoom");
      viewMedia.innerHTML = `
        <iframe
          width="100%" height="240"
          src="${c.videoSrc}"
          title="YouTube player"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen></iframe>
      `;
    } else if (c.thumbnail) {
      viewMedia.style.backgroundImage = `url('${c.thumbnail}')`;
    } else {
      viewMedia.innerHTML = `<div class="empty">No media</div>`;
    }
  }

  syncDetailSaveBtn();
  overlay?.classList.add("is-open");
  overlay?.setAttribute("aria-hidden", "false");

  const url = new URL(location.href);
  url.searchParams.set("content", c.id);
  history.replaceState({}, "", url);
}

function closeDetail() {
  overlay?.classList.remove("is-open");
  overlay?.setAttribute("aria-hidden", "true");
  currentContentId = null;

  const url = new URL(location.href);
  url.searchParams.delete("content");
  history.replaceState({}, "", url);
}

// -------- events
followBtn?.addEventListener("click", async (e) => {
  e.preventDefault();
  if (ownerId === ME) return;
  await toggleFollow(ME, ownerId);
  followedIds = await fetchFollowedRoomIds(ME);
  renderFollowBtn();
});

listEl?.addEventListener("click", async (e) => {
  const saveBtn = e.target.closest(".content-save-btn");
  if (saveBtn) {
    e.preventDefault();
    e.stopPropagation();

    const cid = String(saveBtn.dataset.saveId ?? "");
    if (!cid) return;

    await toggleBookmark(ME, cid);
    bookmarkedIds = await fetchBookmarkedContentIds(ME);

    // 버튼 상태만 갱신
    saveBtn.classList.toggle("is-active", bookmarkedIds.includes(cid));
    if (currentContentId === cid) syncDetailSaveBtn();
    return;
  }

  const card = e.target.closest(".content-item");
  if (!card) return;

  e.preventDefault();
  const cid = String(card.dataset.contentId ?? "");
  const c = roomContents.find(x => String(x.id) === cid);
  if (c) openDetail(c);
});

detailSaveBtn?.addEventListener("click", async (e) => {
  e.preventDefault();
  if (!currentContentId) return;

  await toggleBookmark(ME, currentContentId);
  bookmarkedIds = await fetchBookmarkedContentIds(ME);

  syncDetailSaveBtn();
  renderContents(roomContents);
});

btnClose?.addEventListener("click", (e) => {
  e.preventDefault();
  closeDetail();
});

overlay?.addEventListener("click", (e) => {
  if (e.target === overlay) closeDetail();
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeDetail();
});

// -------- init
(async function init() {
  try {
    [profile, roomContents, bookmarkedIds, followedIds] = await Promise.all([
      fetchProfile(ownerId),
      fetchContentsByOwner(ownerId),
      fetchBookmarkedContentIds(ME),
      fetchFollowedRoomIds(ME),
    ]);

    renderProfile(profile);
    renderFollowBtn();
    renderContents(roomContents);

    if (openContentId) {
      const found = roomContents.find(x => String(x.id) === String(openContentId));
      const c = found || await fetchContentById(openContentId);
      if (c) openDetail(c);
    }

    window.__debug = {
      state: () => ({ ownerId, profile, roomContents, bookmarkedIds, followedIds })
    };
  } catch (err) {
    console.error("Room init failed:", err);
  }
})();

console.log("[ROOM] user param =", qs.get("user"), "-> ownerId =", ownerId);
