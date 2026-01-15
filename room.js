import { usersDB, contentsDB } from "./search-data.js";
import { myRoomContentsDB as myRoomDB } from "./myroom-data.js";
import {
  isContentSaved,
  toggleContentSaved,
  isRoomFollowed,
  toggleRoomFollow
} from "./storage-utils.js";

console.log("✅ room.js loaded", import.meta.url);

import "./myroom-addcontent.js";  // 🔥 이거 추가!!

// Room.html에는 webgl-container가 없어서 3D 스크립트는 조건부로 로드
if (document.getElementById("webgl-container")) {
  import("./myroom-3d.js");
}


//  내방 처리
function getRoomParams(){
  const sp = new URLSearchParams(location.search);
  return {
    userId: sp.get("user") || "me",
    contentId: sp.get("content"),
    from: sp.get("from"),
  };
}

const { userId, contentId, from } = getRoomParams();
const fromQuery = from ? `&from=${encodeURIComponent(from)}` : "";


// DOM
const roomFollowBtn = document.getElementById("roomFollowBtn");
const roomSaveBtn = document.getElementById("roomSaveBtn");       // 있으면
const detailSaveBtn = document.getElementById("detailSaveBtn");   // 오버레이 안 버튼
const savedMyRoom = JSON.parse(localStorage.getItem("myroom_contents") || "[]");
const mergedContentsAll = [...contentsDB, ...(myRoomDB || []), ...savedMyRoom];

// state
let currentContentId = null;
let toastTimer = null;
let toastEl = null;


const backBtn = document.getElementById("btnBackToSearch");
if (backBtn) {
  backBtn.href = (from === "library") ? "Library.html" : "Search.html";
}

if (from === "library") {
  // 뒤로가기 이벤트 잡아서 Library로 보내기
  window.addEventListener("popstate", () => {
    location.href = "Library.html";
  });

  // popstate 트리거용으로 history 한 칸 쌓기
  history.pushState({ from: "library" }, "", location.href);
}

// 내방이면 팔로우 막기
if (roomFollowBtn && userId === "me") {
  roomFollowBtn.disabled = true;
  roomFollowBtn.textContent = "This is you";
}

// DOM
const titleEl = document.getElementById("roomTitle");
const avatarEl = document.getElementById("roomAvatar");
const bioEl = document.getElementById("roomBio");
const listEl = document.getElementById("roomContentsList");
const tagsEl = document.getElementById("roomTags");
const viewDate = document.getElementById("viewDate");
// 저장상태
const viewLocation  = document.getElementById("viewLocation");



// 유저 찾기
const user = usersDB.find(u => u.id === userId);
const params = new URLSearchParams(location.search);


// 콘텐츠 필터
const userContents = mergedContentsAll.filter(c => String(c.ownerId) === String(userId));

  // 유저 정보 렌더(my.nnkown 구분)
  let roomTitle = "Room";

  if (userId === "me") {
    roomTitle = "My Room";
  } else if (user?.name) {
    roomTitle = `${user.name}’s Room`;
  } else {
    roomTitle = "Unknown Room";
  }

  if (titleEl) titleEl.textContent = roomTitle;

if (avatarEl) avatarEl.src = user?.avatar ?? "image/user1.png";
if (bioEl) bioEl.textContent = user?.bio ?? "";
// ✅ 유저 태그 렌더
if (tagsEl) {
  const tags = user?.tags || [];
  tagsEl.innerHTML = tags.length
    ? tags.map(t => `<span class="tag-pill--highlight"># ${t}</span>`).join("")
    : "";
}

// 콘텐츠 렌더
if (listEl) {
  if (userContents.length === 0) {
    listEl.innerHTML = `<p class="empty">No contents yet.</p>`;
  } else {
    listEl.innerHTML = "";
    userContents.forEach(c => {
      const saved = isContentSaved(c.id); // ⭐ 이 줄 추가
      
      listEl.insertAdjacentHTML("beforeend", `
        <a class="content-item" data-id="${c.id}" href="?user=${userId}&content=${c.id}${fromQuery}">
            <div class="thumb ${c.type === "music" ? "thumb--youtube" : ""}"
            style="background-image:url('${c.thumbnail || ""}')"></div>

            <!-- ✅ 카드별 저장 버튼 -->
            <button class="content-save-btn ${saved ? "is-active" : ""}"
                    type="button"
                    data-save-id="${c.id}"
                    aria-label="Save content">
              <span class="star-icon star-icon--outline">☆</span>
              <span class="star-icon star-icon--filled">★</span>
            </button>

            
            <div class="content-meta">
            <div class="content-title">${c.title ?? "Untitled"}</div>
            <div class="content-sub">${c.date ?? ""}</div>
            <div class="content-sub">${c.location ?? ""}</div>
            </div>
        </a>
        `);
    });
  }
}


// ✅ Overlay DOM
const overlay = document.getElementById("detailOverlay");
const btnClose = overlay?.querySelector(".close-center-page-btn");

const viewMedia = document.getElementById("viewMedia");
const viewTitle = document.getElementById("viewTitle");
const viewTags  = document.getElementById("viewTags");
const viewMemory  = document.getElementById("viewMemory");

// 상태 함수
function renderFollowBtn(userId){
  if (!roomFollowBtn) return;
  const followed = isRoomFollowed(userId);
  roomFollowBtn.classList.toggle("is-active", followed);
  roomFollowBtn.textContent = followed ? "★ Following" : "☆ Follow";
}

function renderSaveBtns(){
  const saved = currentContentId ? isContentSaved(currentContentId) : false;

  if (detailSaveBtn){
    detailSaveBtn.disabled = !currentContentId;
    detailSaveBtn.classList.toggle("is-active", saved);
    detailSaveBtn.textContent = saved ? "★ Saved" : "☆ Save";
  }

  if (roomSaveBtn){
    roomSaveBtn.disabled = !currentContentId;
    roomSaveBtn.classList.toggle("is-active", saved);
    roomSaveBtn.textContent = saved ? "★ Saved" : "☆ Save";
  }
}

function syncCardSaveButton(id){
  if (!listEl) return;
  const btn = listEl.querySelector(`.content-save-btn[data-save-id="${id}"]`);
  if (!btn) return;
  const saved = isContentSaved(id);
  btn.classList.toggle("is-active", saved);
}

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

function handleToggleSave(){
  if (!currentContentId) return;
  const wasSaved = isContentSaved(currentContentId);
  toggleContentSaved(currentContentId);
  renderSaveBtns();
  syncCardSaveButton(currentContentId);

  showUndoToast(
    wasSaved ? "Removed from bookmarks." : "Saved to bookmarks.",
    () => {
      toggleContentSaved(currentContentId);
      renderSaveBtns();
      syncCardSaveButton(currentContentId);
    }
  );
}


// 디테일창
function openDetail(item){
  currentContentId = item.id;
  renderSaveBtns();

  if (!overlay) return;

  overlay.classList.add("is-open");
  overlay.setAttribute("aria-hidden", "false");

  // media
  if (viewMedia){
    viewMedia.classList.remove("is-youtube-zoom");
    viewMedia.style.backgroundImage = "";
    viewMedia.innerHTML = "";

    if (item.type === "video" && item.url){
      viewMedia.innerHTML = `<video src="${item.url}" controls autoplay muted playsinline></video>`;
    } else {
      viewMedia.style.backgroundImage = `url('${item.thumbnail || ""}')`;
    }

    if (item.type === "music"){
      viewMedia.classList.add("is-youtube-zoom");
    }
  }

  // left text under image
  if (viewTitle) viewTitle.textContent = item.title ?? "Untitled";
  if (viewDate)  viewDate.textContent  = item.date ?? "";
  if (viewLocation)   viewLocation.textContent   = item.location ?? "";

  // right tags
  const tags = item.tags || item.moodTags || [];
  if (viewTags){
    viewTags.innerHTML = tags.map(t => `<span class="tag-pill--highlight">#${t}</span>`).join("");
  }

  // right memo
  if (viewMemory) viewMemory.textContent = item.description ?? item.memory ?? "";
}


detailSaveBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  handleToggleSave();
});

roomSaveBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  handleToggleSave();
});


function closeDetail(){
  if (!overlay) return;
  overlay.classList.remove("is-open");
  overlay.setAttribute("aria-hidden", "true");

  // 선택: 닫으면 URL에서 content 제거
  const url = new URL(location.href);
  url.searchParams.delete("content");
  history.replaceState({}, "", url);
}

// 닫기: X 버튼 / 바깥 클릭 / ESC
btnClose?.addEventListener("click", closeDetail);
overlay?.addEventListener("click", (e) => {
  if (e.target === overlay) closeDetail();
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeDetail();
});


// 카드클릭-> 팝업열기
listEl?.addEventListener("click", (e) => {
  const saveBtn = e.target.closest(".content-save-btn");
  if (saveBtn) {
    e.preventDefault();
    e.stopPropagation();

    const id = saveBtn.dataset.saveId;
    const wasSaved = isContentSaved(id);
    const nowSaved = toggleContentSaved(id);

    saveBtn.classList.toggle("is-active", nowSaved);

    showUndoToast(
      wasSaved ? "Removed from bookmarks." : "Saved to bookmarks.",
      () => {
        toggleContentSaved(id);
        syncCardSaveButton(id);
        if (String(currentContentId) === String(id)) {
          renderSaveBtns();
        }
      }
    );

    return; // ⭐ 여기서 종료 (디테일 안 열림)
  }

  const a = e.target.closest("a.content-item");
  if (!a) return;
  e.preventDefault();

  const id = a.dataset.id;
  const item = userContents.find(x => String(x.id) === String(id));
  if (!item) return;

  openDetail(item);

  // URL 상태 저장(뒤로가기/공유용)
  const url = new URL(location.href);
  url.searchParams.set("content", id);
  history.pushState({}, "", url);
});

function tryOpenDetailFromQuery(){
  if (!contentId) return;
  const item =
    userContents.find(x => String(x.id) === String(contentId)) ||
    mergedContentsAll.find(x => String(x.id) === String(contentId));
  if (item) openDetail(item);
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", tryOpenDetailFromQuery);
} else {
  tryOpenDetailFromQuery();
}

// follow click
roomFollowBtn?.addEventListener("click", () => {
  // userId는 네 파일에서 이미 const userId = ... 로 있음
  const wasFollowed = isRoomFollowed(userId);
  toggleRoomFollow(userId);
  renderFollowBtn(userId);
  showUndoToast(
    wasFollowed ? "Unfollowed room." : "Followed room.",
    () => {
      toggleRoomFollow(userId);
      renderFollowBtn(userId);
    }
  );
});

//초기랜더호출
renderFollowBtn(userId);
renderSaveBtns();
