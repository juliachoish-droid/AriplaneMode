import { myRoomContentsDB as myRoomDB } from "./myroom-data.js";
import { usersDB, contentsDB } from "./search-data.js";


let q = "";
const LIMIT = 3;
let userLimit = LIMIT;
let contentLimit = LIMIT;


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


const savedMyRoom = JSON.parse(localStorage.getItem("myroom_contents") || "[]");

// ✅ 샘플 + myroom-data.js + 로컬 저장 합치기
const mergedContentsAll = [...contentsDB, ...(myRoomDB || []), ...savedMyRoom];
currentUsers = usersDB;
currentContents = mergedContentsAll;
searchableContents = mergedContentsAll;


// 화면 상태 헤더 보여주기-> 검색결과 보여주기로.
function setBeforeSearch() {
  hero?.classList.remove("is-hidden");
  results?.classList.add("is-hidden");
}

function setAfterSearch() {
  hero?.classList.add("is-hidden");
  results?.classList.remove("is-hidden");
}

// DB fetch 제거: 로컬 샘플 + 마이룸 데이터만 사용


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
      <a class="room-item" href="Room.html?user=${u.id}">
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
        href="Room.html?user=${encodeURIComponent(c.ownerId)}&content=${encodeURIComponent(c.id)}">

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

  // 텍스트도 태그도 아무것도 없으면 초기 화면
  if (!qLocal && activeTags.length === 0) {
    setBeforeSearch();
    return;
  }

  setAfterSearch();

  currentUsers = usersDB.filter(u => matchItem(u, qLocal, activeTags));
  currentContents = mergedContentsAll.filter(c => matchItem(c, qLocal, activeTags));

  renderUsers(currentUsers);
  renderContents(currentContents);

  // console.log("qLocal:", qLocal, "activeTags:", activeTags);
  // console.log("merged:", mergedContentsAll.length, "matched:", currentContents.length);
  // console.log("sample item:", mergedContentsAll[0]);

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
document.querySelectorAll(".tag-pill").forEach((pill) => {
  pill.addEventListener("click", () => {
    pill.classList.toggle("is-active"); // ✅ 다중선택 OK
    runSearch(); // ✅ 텍스트+태그 동시에 반영
  });
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
