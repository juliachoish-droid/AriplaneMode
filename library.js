import { usersDB, contentsDB } from "./search-data.js";
import { myRoomContentsDB as myRoomDB } from "./myroom-data.js";
import {
  getSavedContentIds,
  getFollowedRoomIds,
  isContentSaved,
  toggleContentSaved,
  isRoomFollowed,
  toggleRoomFollow
} from "./storage-utils.js";


const savedMyRoom = JSON.parse(localStorage.getItem("myroom_contents") || "[]");
const mergedContentsAll = [...contentsDB, ...(myRoomDB || []), ...savedMyRoom];

const recommendedEl = document.getElementById("recommendedRooms");
const bookmarkedEl = document.getElementById("bookmarkedContents");
const followedEl = document.getElementById("followedRooms");

const btnMoreContents = document.getElementById("btnMoreContents");
const btnMoreRooms = document.getElementById("btnMoreRooms");


// ---- limits
const CONTENT_STEP = 6;
const ROOM_STEP = 4;
let contentLimit = CONTENT_STEP;
let roomLimit = ROOM_STEP;


// ---- helpers
function escapeHtml(str=""){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

let toastTimer = null;
let toastEl = null;

function hideUndoToast(){
  if (!toastEl) return;
  toastEl.classList.remove("is-visible");
}

function showUndoToast(message, onUndo){
  if (!toastEl){
    toastEl = document.createElement("div");
    toastEl.className = "toast-undo";
    toastEl.innerHTML = `
      <span class="toast-undo__msg"></span>
      <button type="button" class="toast-undo__btn">Undo</button>
    `;
    document.body.appendChild(toastEl);
  }

  toastEl.querySelector(".toast-undo__msg").textContent = message;
  const btn = toastEl.querySelector(".toast-undo__btn");
  btn.onclick = (e) => {
    e.preventDefault();
    onUndo?.();
    hideUndoToast();
  };

  toastEl.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideUndoToast, 4000);
}


// ---- Recommended (optional)
function renderRecommendedRooms(){
  if (!recommendedEl) return;

  const followedIds = new Set(getFollowedRoomIds().map(String));
  const picks = usersDB
    .filter(u => !followedIds.has(String(u.id)))
    .slice(0, 4);

  recommendedEl.innerHTML = picks.map(u => `
    <a class="rec-avatar"
       href="Room.html?user=${encodeURIComponent(u.id)}&from=library"
       aria-label="${u.name} room"
       style="background-image:url('${u.avatar || ""}')">
      <button class="rec-follow-btn ${isRoomFollowed(u.id) ? "is-active" : ""}"
              type="button"
              data-follow-id="${u.id}"
              aria-label="Follow room">
        <span class="rec-follow-icon rec-follow-icon--outline">☆</span>
        <span class="rec-follow-icon rec-follow-icon--filled">★</span>
      </button>
    </a>
  `).join("");

  if (picks.length === 0){
    recommendedEl.innerHTML = `<p class="empty">No recommendations right now.</p>`;
    return;
  }
}


// =========북마크콘텐츠===========

function getBookmarkedContents(){
  const savedIds = getSavedContentIds().map(String);
  const savedSet = new Set(savedIds);
  return contentsDB.filter(c => savedSet.has(String(c.id)));
}

function renderBookmarkedContents(){
  if (!bookmarkedEl) return;

  const savedIds = getSavedContentIds();
  const savedSet = new Set(savedIds);
  const all = getBookmarkedContents();

  const savedContents = contentsDB.filter(c => savedSet.has(String(c.id)));

  contentLimit = Math.min(contentLimit, Math.max(CONTENT_STEP, all.length));

  if (savedContents.length === 0){
    bookmarkedEl.innerHTML = `<p class="empty">No bookmarked contents yet.</p>`;
    return;
  }

  // 🔸 일단 처음엔 6개만 보여도 OK (나중에 load more 연결)
  const visible = savedContents.slice(0, contentLimit);

  bookmarkedEl.innerHTML = visible.map(c => `
    <a class="bm-card${c.type === "music" ? " bm-card--youtube" : ""}"
       href="Room.html?user=${encodeURIComponent(c.ownerId)}&content=${encodeURIComponent(c.id)}&from=library"
       style="background-image:url('${c.thumbnail || ""}')">
      <button class="content-save-btn ${isContentSaved(c.id) ? "is-active" : ""}"
              type="button"
              data-save-id="${c.id}"
              aria-label="Save content">
        <span class="star-icon star-icon--outline">☆</span>
        <span class="star-icon star-icon--filled">★</span>
      </button>
      <div class="bm-text">
        <div class="bm-title">${c.title ?? "Untitled"}</div>
        <div class="bm-sub">${c.date ?? ""}</div>
        <div class="bm-sub">${c.location ?? ""}</div>
      </div>
    </a>
  `).join("");

    //✅ 버튼 표시 조건
  if (btnMoreContents){
    btnMoreContents.style.display =
      savedContents.length > contentLimit ? "inline-flex" : "none";
  }
}



// =========팔로울룸===========
function getFollowedRooms(){
  const ids = getFollowedRoomIds().map(String);
  const set = new Set(ids);
  return usersDB.filter(u => set.has(String(u.id)));
}

function renderFollowedRooms(){
  if (!followedEl) return;

  const all = getFollowedRooms();

  if (all.length === 0){
    followedEl.innerHTML = `<p class="empty">No followed rooms yet.</p>`;
    if (btnMoreRooms) btnMoreRooms.style.display = "none";
    return;
  }

  const visible = all.slice(0, roomLimit);

  followedEl.innerHTML = visible.map(u => `
    <a class="follow-item" href="Room.html?user=${encodeURIComponent(u.id)}&from=library">
      <div class="avatar">
        <button class="content-save-btn ${isRoomFollowed(u.id) ? "is-active" : ""}"
                type="button"
                data-follow-id="${u.id}"
                aria-label="Toggle follow">
          <span class="star-icon star-icon--outline">☆</span>
          <span class="star-icon star-icon--filled">★</span>
        </button>
        ${u.avatar ? `<img src="${u.avatar}" alt="${u.name} avatar">` : ""}
      </div>
      <div class="meta">
        <div class="name">${u.name}’s Rooms</div>
        <div class="desc">“${u.bio ?? ""}”</div>
      </div>
    </a>
  `).join("");

  if (btnMoreRooms){
    btnMoreRooms.style.display = all.length > roomLimit ? "inline-flex" : "none";
  }
}



// ---- Load more handlers
btnMoreContents?.addEventListener("click", () => {
  contentLimit += CONTENT_STEP;
  renderBookmarkedContents();
});

btnMoreRooms?.addEventListener("click", () => {
  roomLimit += ROOM_STEP;
  renderFollowedRooms();
});

// ---- followed room star toggle
followedEl?.addEventListener("click", (e) => {
  const followBtn = e.target.closest(".content-save-btn");
  if (!followBtn) return;

  e.preventDefault();
  e.stopPropagation();

  const id = followBtn.dataset.followId;
  const wasFollowed = isRoomFollowed(id);
  toggleRoomFollow(id);
  renderFollowedRooms();

  showUndoToast(
    wasFollowed ? "Unfollowed room." : "Followed room.",
    () => {
      toggleRoomFollow(id);
      renderFollowedRooms();
    }
  );
});

// ---- recommended follow toggle
recommendedEl?.addEventListener("click", (e) => {
  const followBtn = e.target.closest(".rec-follow-btn");
  if (!followBtn) return;

  e.preventDefault();
  e.stopPropagation();

  const id = followBtn.dataset.followId;
  const wasFollowed = isRoomFollowed(id);
  toggleRoomFollow(id);
  renderRecommendedRooms();
  renderFollowedRooms();

  showUndoToast(
    wasFollowed ? "Unfollowed room." : "Followed room.",
    () => {
      toggleRoomFollow(id);
      renderRecommendedRooms();
      renderFollowedRooms();
    }
  );
});

// ---- bookmark card save toggle
bookmarkedEl?.addEventListener("click", (e) => {
  const saveBtn = e.target.closest(".content-save-btn");
  if (!saveBtn) return;

  e.preventDefault();
  e.stopPropagation();

  const id = saveBtn.dataset.saveId;
  const wasSaved = isContentSaved(id);
  toggleContentSaved(id);
  renderBookmarkedContents();

  showUndoToast(
    wasSaved ? "Removed from bookmarks." : "Saved to bookmarks.",
    () => {
      toggleContentSaved(id);
      renderBookmarkedContents();
    }
  );
});


// init
renderRecommendedRooms();
renderBookmarkedContents();
renderFollowedRooms();

window.__debug = {
  getFollowedRoomIds
};
