import { fetchProfiles, fetchContents } from "./search-api.js";


let q = "";
const LIMIT = 3;
let userLimit = LIMIT;
let contentLimit = LIMIT;
let allUsers = [];
let allContents = [];



// DOM
const hero = document.getElementById("hero");
const results = document.getElementById("searchResults");
const input = document.getElementById("searchInput");
const btn = document.getElementById("searchBtn");

const usersWrap = document.getElementById("followedRoomsList");
const contentsWrap = document.getElementById("bookmarkedContentsList");
const btnMoreUsers = document.getElementById("btnMoreRooms");
const btnMoreContents = document.getElementById("btnMoreContents");


let currentUsers = [];
let currentContents = [];
let searchableContents = [];


async function initSearchData(){
  const [profiles, contents] = await Promise.all([fetchProfiles(), fetchContents()]);

  allUsers = profiles || [];
  allContents = (contents || []).map(mapContentRow);

  // 초기엔 “현재 결과”도 원본으로 세팅
  currentUsers = allUsers;
  searchableContents = allContents;
  currentContents = allContents;

  setBeforeSearch();
}


initSearchData().catch(err => {
  console.error("initSearchData failed:", err);
  setBeforeSearch();
});



// 화면 상태 헤더 보여주기-> 검색결과 보여주기로.
function setBeforeSearch() {
  hero?.classList.remove("is-hidden");
  results?.classList.add("is-hidden");
}

function setAfterSearch() {
  hero?.classList.add("is-hidden");
  results?.classList.remove("is-hidden");
}

function mapContentRow(c){
  return {
    ...c,
    ownerId: c.ownerId ?? c.owner_id,
    date: c.date ?? c.created_at,       // 화면 표시용
    tags: c.tags ?? c.moodTags ?? [],   // 검색 매칭용
  };
}

// 렌더: Rooms
function renderUsers(list) {
  if (!usersWrap) return;

  if (!list || list.length === 0) {
    usersWrap.innerHTML = `<p class="empty">Oops! No rooms found.</p>`;
    if (btnMoreUsers) btnMoreUsers.style.display = "none";
    return;
  }

  usersWrap.innerHTML = "";

  list.slice(0, userLimit).forEach(u => {
    usersWrap.insertAdjacentHTML("beforeend", `
      <a class="room-item" href="Room.html?user=${encodeURIComponent(u.owner_id)}&from=search">
        <div class="avatar">
          ${
            u.avatar
              ? `<img src="${u.avatar}" alt="${u.name} avatar" loading="lazy">`
              : `<span class="avatar-fallback">🙂</span>`
          }
        </div>
        <div class="room-meta">
          <div class="room-name">${u.name}’s Rooms</div>
          <div class="room-desc">“${u.bio ?? ""}”</div>
        </div>
      </a>
    `);
  });

  if (btnMoreUsers) {
    btnMoreUsers.style.display = list.length > userLimit ? "inline-flex" : "none";
  }
}

// 렌더: Contents
function renderContents(list) {
  // console.log("contentsWrap:", contentsWrap, "listLen:", list?.length, "contentLimit:", contentLimit);
  if (!contentsWrap) return;

  if (!list || list.length === 0) {
  contentsWrap.innerHTML = `<p class="empty">Oops! No contents found.</p>`;
  if (btnMoreContents) btnMoreContents.style.display = "none";
  return;
  }


  contentsWrap.innerHTML = "";

  list.slice(0, contentLimit).forEach(c => {
    contentsWrap.insertAdjacentHTML("beforeend", `
      <a class="content-item"
        href="Room.html?user=${encodeURIComponent(c.ownerId)}&content=${encodeURIComponent(c.id)}&from=search">

        <div class="thumb ${c.type === "music" ? "thumb--youtube" : ""}"
            style="background-image:url('${c.thumbnail || ""}')"></div>

        <div class="content-meta">
          <div class="content-title">${c.title ?? "Untitled"}</div>
          <div class="content-sub">${c.date ?? ""}</div>
          <div class="content-sub">${c.location ?? ""}</div>
        </div>
      </a>
    `);
  });

  if (btnMoreContents) {
    btnMoreContents.style.display = list.length > contentLimit ? "inline-flex" : "none";
  }
}

// 검색 매칭
function includesQuery(item, q) {
  const hay = [
    item.name,
    item.bio,
    item.title,
    item.location,
    item.date,
    ...(item.tags || [])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return hay.includes(q);
}


function matchItem(item, q, activeTags){
  const hay = [
    item.name,
    item.bio,
    item.title,
    item.location,
    item.date,
    ...(item.tags || []),
    ...(item.moodTags || [])
  ].filter(Boolean).join(" ").toLowerCase();

  const textOk = !q || hay.includes(q);
  const tagsOk = activeTags.length === 0 || activeTags.some(t => hay.includes(t)); // ✅ OR 조건 
  return textOk && tagsOk;
}


function runSearch() {
  userLimit = LIMIT;
  contentLimit = LIMIT;

  const qLocal = (input?.value ?? "").trim().toLowerCase();
  const activeTags = getActiveTags();

  // 아무것도 없으면 "검색 전" 상태로 + 현재 결과도 원본으로 복구
  if (!qLocal && activeTags.length === 0) {
    currentUsers = allUsers;
    currentContents = allContents;
    setBeforeSearch();
    return;
  }

  setAfterSearch();

  const baseUsers = allUsers;
  const baseContents = allContents;

  const filteredUsers = baseUsers.filter(u => matchItem(u, qLocal, activeTags));
  const filteredContents = baseContents.filter(c => matchItem(c, qLocal, activeTags));

  renderUsers(filteredUsers);
  renderContents(filteredContents);

  currentUsers = filteredUsers;
  currentContents = filteredContents;
}




// 이벤트: 검색 버튼/엔터
btn?.addEventListener("click", runSearch);
input?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") runSearch();
});
input?.addEventListener("input", () => {
  if (!input.value.trim()) setBeforeSearch();
});

// 태그 필터링
function getActiveTags(){
  return Array.from(document.querySelectorAll(".tag-pill.is-active"))
    .map(p => p.textContent.replace("×", "").trim().toLowerCase());
}

// 태그 클릭 이벤트
// ✅ 태그 클릭 이벤트 (이벤트 위임: 새로 렌더돼도 항상 먹음)
document.addEventListener("click", (e) => {
  const pill = e.target.closest(".tag-pill");
  if (!pill) return;

  // tag-pill이 <a>면 기본 이동 막기 (첫 클릭만 먹는 문제 방지)
  e.preventDefault();

  pill.classList.toggle("is-active");
  runSearch();
});



// 초기 화면
setBeforeSearch();

btnMoreUsers?.addEventListener("click", () => {
  if (!currentUsers || currentUsers.length === 0) return;
  userLimit += LIMIT;
  renderUsers(currentUsers);
});

btnMoreContents?.addEventListener("click", () => {
  if (!currentContents || currentContents.length === 0) return;
  contentLimit += LIMIT;
  renderContents(currentContents);
});

window.searchableContents = searchableContents;
