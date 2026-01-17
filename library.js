import { myRoomContentsDB as myRoomDB } from "./myroom-data.js";
import { fetchProfiles, fetchContents } from "./search-api.js";

import {
  fetchBookmarkedContentIds,
  fetchFollowedRoomIds,
  toggleBookmark,
  toggleFollow
} from "./social-api.js";

const ME = "me";

// state
let loadedUsers = [];
let loadedContents = [];
let bookmarkedIds = [];
let followedIds = [];

// limits
const CONTENT_STEP = 6;
const ROOM_STEP = 4;
let contentLimit = CONTENT_STEP;
let roomLimit = ROOM_STEP;

// dom
const recommendedEl = document.getElementById("recommendedRooms");
const bookmarkedEl = document.getElementById("bookmarkedContents");
const followedEl = document.getElementById("followedRooms");
const btnMoreContents = document.getElementById("btnMoreContents");
const btnMoreRooms = document.getElementById("btnMoreRooms");

// helpers
const userKey = (u) => String(u?.owner_id ?? "");
const isMineUser = (uid) => String(uid) === ME;
const isMineContent = (c) => String(c?.ownerId ?? c?.owner_id ?? "") === ME;

function normalizeContent(c){
  return {
    ...c,
    ownerId: c.ownerId ?? c.owner_id,
    date: c.date ?? c.created_at,
  };
}

function mergeUniqueById(list){
  const map = new Map();
  for (const item of list){
    const id = String(item?.id ?? "");
    if (!id) continue;
    map.set(id, item);
  }
  return Array.from(map.values());
}

const followedSet = () => new Set(followedIds.map(String));
const bookmarkedSet = () => new Set(bookmarkedIds.map(String));

// init
async function initLibrary(){
  const savedMyRoom = JSON.parse(localStorage.getItem("myroom_contents") || "[]");

  const [profiles, contents, bm, fw] = await Promise.all([
    fetchProfiles(),
    fetchContents(),
    fetchBookmarkedContentIds(ME),
    fetchFollowedRoomIds(ME),
  ]);

  loadedUsers = profiles || [];
  bookmarkedIds = bm || [];
  followedIds = fw || [];

  const merged = [
    ...(contents || []).map(normalizeContent),
    ...(myRoomDB || []).map(normalizeContent),
    ...(savedMyRoom || []).map(normalizeContent),
  ];
  loadedContents = mergeUniqueById(merged);

  renderAll();

  window.__debug = {
    state: () => ({ loadedUsers, loadedContents, bookmarkedIds, followedIds })
  };
}

function renderAll(){
  renderRecommendedRooms();
  renderFollowedRooms();
  renderBookmarkedContents();
}

// recommended
function renderRecommendedRooms(){
  if (!recommendedEl) return;

  const fset = followedSet();
  const picks = loadedUsers
    .filter(u => {
      const uid = userKey(u);
      return uid && !isMineUser(uid) && !fset.has(uid);
    })
    .slice(0, 4);

  if (picks.length === 0){
    recommendedEl.innerHTML = `<p class="empty">No recommendations right now.</p>`;
    return;
  }

  recommendedEl.innerHTML = picks.map(u => {
    const uid = userKey(u);
    return `
      <a class="rec-avatar"
         href="Room.html?user=${encodeURIComponent(uid)}&from=library"
         aria-label="${u.name ?? "User"} room"
         style="background-image:url('${u.avatar || ""}')">
        <button class="rec-follow-btn ${followedSet().has(uid) ? "is-active" : ""}"
                type="button"
                data-follow-id="${uid}"
                aria-label="Follow room">
          <span class="rec-follow-icon rec-follow-icon--outline">☆</span>
          <span class="rec-follow-icon rec-follow-icon--filled">★</span>
        </button>
      </a>
    `;
  }).join("");
}

// followed
function renderFollowedRooms(){
  if (!followedEl) return;

  const fset = followedSet();
  const all = loadedUsers.filter(u => fset.has(userKey(u)));

  if (all.length === 0){
    followedEl.innerHTML = `<p class="empty">No followed rooms yet.</p>`;
    if (btnMoreRooms) btnMoreRooms.style.display = "none";
    return;
  }

  const visible = all.slice(0, roomLimit);

  followedEl.innerHTML = visible.map(u => {
    const uid = userKey(u);
    return `
      <a class="follow-item" href="Room.html?user=${encodeURIComponent(uid)}&from=library">
        <div class="avatar">
          <button class="content-save-btn is-active"
                  type="button"
                  data-follow-id="${uid}"
                  aria-label="Toggle follow">
            <span class="star-icon star-icon--outline">☆</span>
            <span class="star-icon star-icon--filled">★</span>
          </button>
          ${u.avatar ? `<img src="${u.avatar}" alt="${u.name ?? "User"} avatar">` : ""}
        </div>
        <div class="meta">
          <div class="name">${u.name ?? "User"}’s Rooms</div>
          <div class="desc">“${u.bio ?? ""}”</div>
        </div>
      </a>
    `;
  }).join("");

  if (btnMoreRooms) {
    btnMoreRooms.style.display = all.length > roomLimit ? "inline-flex" : "none";
  }
}

// bookmarked
function renderBookmarkedContents(){
  if (!bookmarkedEl) return;

  const bset = bookmarkedSet();
  const all = loadedContents.filter(c => bset.has(String(c.id)));

  contentLimit = Math.min(contentLimit, Math.max(CONTENT_STEP, all.length));

  if (all.length === 0){
    bookmarkedEl.innerHTML = `<p class="empty">No bookmarked contents yet.</p>`;
    if (btnMoreContents) btnMoreContents.style.display = "none";
    return;
  }

  const visible = all.slice(0, contentLimit);

  bookmarkedEl.innerHTML = visible.map(c => {
    const mine = isMineContent(c);
    return `
      <a class="bm-card${c.type === "music" ? " bm-card--youtube" : ""}"
         href="Room.html?user=${encodeURIComponent(c.ownerId)}&content=${encodeURIComponent(c.id)}&from=library"
         style="background-image:url('${c.thumbnail || ""}')">

        ${
          !mine
            ? `<button class="content-save-btn ${bset.has(String(c.id)) ? "is-active" : ""}"
                      type="button"
                      data-save-id="${c.id}"
                      aria-label="Save content">
                 <span class="star-icon star-icon--outline">☆</span>
                 <span class="star-icon star-icon--filled">★</span>
               </button>`
            : ""
        }

        <div class="bm-text">
          <div class="bm-title">${c.title ?? "Untitled"}</div>
          <div class="bm-sub">${c.date ?? ""}</div>
          <div class="bm-sub">${c.location ?? ""}</div>
        </div>
      </a>
    `;
  }).join("");

  if (btnMoreContents) {
    btnMoreContents.style.display = all.length > contentLimit ? "inline-flex" : "none";
  }
}

// load more
btnMoreRooms?.addEventListener("click", () => {
  roomLimit += ROOM_STEP;
  renderFollowedRooms();
});

btnMoreContents?.addEventListener("click", () => {
  contentLimit += CONTENT_STEP;
  renderBookmarkedContents();
});

// follow toggle (recommended + followed)
recommendedEl?.addEventListener("click", async (e) => {
  const btn = e.target.closest(".rec-follow-btn");
  if (!btn) return;

  e.preventDefault();
  e.stopPropagation();

  const uid = String(btn.dataset.followId ?? "");
  if (!uid || isMineUser(uid)) return;

  await toggleFollow(ME, uid);
  followedIds = await fetchFollowedRoomIds(ME);
  renderRecommendedRooms();
  renderFollowedRooms();
});

followedEl?.addEventListener("click", async (e) => {
  const btn = e.target.closest(".content-save-btn");
  if (!btn) return;

  e.preventDefault();
  e.stopPropagation();

  const uid = String(btn.dataset.followId ?? "");
  if (!uid || isMineUser(uid)) return;

  await toggleFollow(ME, uid);
  followedIds = await fetchFollowedRoomIds(ME);
  renderRecommendedRooms();
  renderFollowedRooms();
});

// bookmark toggle (bookmarked list only)
bookmarkedEl?.addEventListener("click", async (e) => {
  const btn = e.target.closest(".content-save-btn");
  if (!btn) return;

  e.preventDefault();
  e.stopPropagation();

  const cid = String(btn.dataset.saveId ?? "");
  if (!cid) return;

  const c = loadedContents.find(x => String(x.id) === cid);
  if (c && isMineContent(c)) return;

  await toggleBookmark(ME, cid);
  bookmarkedIds = await fetchBookmarkedContentIds(ME);
  renderBookmarkedContents();
});

initLibrary().catch(err => console.error(err));
