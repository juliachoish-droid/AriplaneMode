import { fetchMyContents } from "./myroom-api.js";
const contents = await fetchMyContents("me");



const listEls = {
  music: document.getElementById("contentList-music"),
  gallery: document.getElementById("contentList-gallery"),
  video: document.getElementById("contentList-video"),
};
// console.log("listEls check:", listEls);

function createContentCard(panelKey, { id, title, location, date, thumbnail, videoSrc, moodTags, memory }) {
  const contentList = listEls[panelKey];
  
  if (!contentList) return;

  const article = document.createElement("article");
  article.className = `content-card ${panelKey === "video" ? "is-video" : ""}`;
  if (panelKey === "music") article.classList.add("is-youtube");

  article.dataset.contentId = id; // ✅ 이제 에러 안 남

  article.innerHTML = `
    <div class="content-card__meta">
      <span class="content-card__pin">📍</span>
      <span class="content-card__location">${location ?? ""}</span>
    </div>

    <div class="content-card__thumb"></div>

    <div class="content-card__footer">
      <h4 class="content-card__title">${title ?? ""}</h4>
      <time class="content-card__date">${date ?? ""}</time>
    </div>
  `;

  const thumb = article.querySelector(".content-card__thumb");

  // 썸네일
  if (thumbnail) thumb.style.backgroundImage = `url(${thumbnail})`;

  // ✅ 비디오면 video 태그 추가
  if (panelKey === "video" && videoSrc) {
    const video = document.createElement("video");
    video.className = "content-card__video";
    video.src = videoSrc;

    video.muted = true;        // 자동재생 필수 조건
    video.playsInline = true;  // iOS 사파리 대응
    video.loop = true;         // 원하면
    video.preload = "metadata";

    thumb.appendChild(video);

    // hover 재생/정지
    thumb.addEventListener("mouseenter", () => {
      video.play().catch(() => {}); // 자동재생 막히면 조용히 무시
      thumb.classList.add("is-playing");
    });

    thumb.addEventListener("mouseleave", () => {
      video.pause();
      video.currentTime = 0; // 원하면 처음으로
      thumb.classList.remove("is-playing");
    });
  }

  article.addEventListener("click", () => {
  // ✅ 1개 콘텐츠만 찾아서 열기
  window.openMyRoomContentById?.(id);
  });

  contentList.appendChild(article);
}

// ✅ 이걸 새로 추가
export function renderContents(list) {
  if (!Array.isArray(list)) return;

  list.forEach(item => {
    // panelKey는 네 데이터 구조에 맞게
    // 예시:
    const panelKey = item.type ?? "gallery";
    createContentCard(panelKey, item);
  });
}

contents.forEach(item => {
  // console.log("type=", item.type, "-> list?", !!listEls[item.type], item);
  createContentCard(item.type, item);
});

// console.log("✅ contents length:", contents.length);
// console.log("✅ render finished");

/*
console.log("after render:",
  document.querySelectorAll(".content-card").length,
  "music children:", document.getElementById("contentList-music")?.children.length,
  "gallery children:", document.getElementById("contentList-gallery")?.children.length,
  "video children:", document.getElementById("contentList-video")?.children.length
);
*/




// ✅ NEW: detailPanel 기반 상세창
const detailPanel = document.getElementById("detailPanel");
const detailViews = detailPanel ? [...detailPanel.querySelectorAll(".detail-view")] : [];

function showDetailView(detailName) {
  if (!detailPanel) {
    console.error("detailPanel(#detailPanel) not found");
    return;
  }

  detailPanel.classList.add("is-open");
  detailPanel.setAttribute("aria-hidden", "false");
  document.body.classList.add("detail-open");

  detailViews.forEach(v => v.classList.remove("is-active"));

  const target = detailPanel.querySelector(`.detail-view[data-detail="${detailName}"]`);
  if (!target) {
    console.error("detail view not found:", detailName);
    return;
  }
  target.classList.add("is-active");
}

function closeDetailPanel(){
  document.activeElement?.blur?.();

  detailPanel.classList.remove("is-open");
  detailPanel.setAttribute("aria-hidden", "true");
  document.body.classList.remove("detail-open");

  // 열린 view들도 정리(선택)
  detailViews.forEach(v => v.classList.remove("is-active"));
}

document.addEventListener("click", (e) => {
  const card = e.target.closest(".content-card[data-content-id]");
  if (!card) return;

  const id = card.dataset.contentId;
  const item = contents.find(x => x.id === id);
  if (!item) return;

});


function fillForm(detailName, c) {
  if (!detailPanel) return;
  const form = detailPanel.querySelector(`.detail-view[data-detail="${detailName}"]`);
  if (!form) return;

  // ✅ 공통 채우기 (placeholder 기반)
  const titleEl = form.querySelector('.js-title') || form.querySelector('input[placeholder="Enter the title"]');
  const dateEl  = form.querySelector('.js-date')  || form.querySelector('input[placeholder="Enter the date"]');
  const locEl   = form.querySelector('.js-location') || form.querySelector('input[placeholder="Enter the location"]');
  const memoEl  = form.querySelector('.js-memo') || form.querySelector("textarea");

  if (titleEl) titleEl.value = c.title || "";
  if (dateEl)  dateEl.value  = c.date || "";
  if (locEl)   locEl.value   = c.location || "";
  if (memoEl)  memoEl.value  = c.memory || "";

  // ✅ moodTags (버튼 pill UI면 “선택된 것처럼” 표시만)
  // 지금은 구조가 고정이라, 여기서는 그냥 패스하거나 나중에 “active 토글” 로직 추가

  // ✅ 타입별 미디어 채우기
  if (detailName === "add-gallery") {
    // photo-square에 background-image 넣기
    const square = form.querySelector(".js-photo-square");
    if (square && c.thumbnail) square.style.backgroundImage = `url("${c.thumbnail}")`;

    // filled 상태로 바꾸고 싶으면 (CSS가 data-state로 제어할 때)
    const box = form.querySelector(".upload-box.photo-box");
    if (box) box.dataset.state = c.thumbnail ? "filled" : "empty";
  }

  if (detailName === "add-video") {
    // video preview src 넣기
    const v = form.querySelector(".js-video-preview");
    if (v && c.videoSrc) v.src = c.videoSrc;

    const box = form.querySelector(".upload-box.video-box");
    if (box) box.dataset.state = c.videoSrc ? "filled" : "empty";
  }

  if (detailName === "add-music") {
    // 음악은 iframe/youtube url이 DB에 없어서 썸네일만이라도 보여주기
    const thumbImg = form.querySelector(".js-thumb");
    if (thumbImg && c.thumbnail) thumbImg.src = c.thumbnail;

    const box = form.querySelector(".upload-box.music-box");
    if (box) box.dataset.state = c.thumbnail ? "filled" : "empty";
  }

    // ✅ MoodTag 데이터 기반 active 표시
  const selected = new Set((c.moodTags || []).map(t => String(t).trim().toLowerCase()));

  const pills = [...form.querySelectorAll(".tag-pill")];
  pills.forEach(pill => {
    // 버튼 텍스트 정리: "Relaxing / Chill×" 같은 거에서 × 제거
    const label = pill.textContent.replace("×", "").trim().toLowerCase();

    const isOn = selected.has(label);

    pill.classList.toggle("is-active", isOn);
    pill.setAttribute("aria-pressed", isOn ? "true" : "false");
  });

    // ✅ READ ONLY: 상세보기는 수정 불가
  setReadOnly(form, true);

}

function setReadOnly(scopeEl, on = true) {
  if (!scopeEl) return;

  // 입력들 잠그기
  scopeEl.querySelectorAll("input, textarea, select").forEach(el => {
    // input은 readonly가 UX 좋고, 파일은 disabled가 맞음
    if (el.type === "file") {
      el.disabled = on;
    } else {
      el.readOnly = on;
      el.disabled = on; // select 같은 애들까지 확실히
    }
  });

  // 버튼들도 잠그기 (닫기/뒤로 같은 건 예외)
  scopeEl.querySelectorAll("button").forEach(btn => {
    if (btn.closest(".close-center-page-btn")) return; // X는 살아야 함
    btn.disabled = on;
    btn.setAttribute("aria-disabled", on ? "true" : "false");
  });

  // 클릭/포커스까지 막기(완전 잠금)
  scopeEl.classList.toggle("is-readonly", on);
}

function openReadOnly(c){
  // console.log("🟢 openReadOnly called with:", c);
  if (Array.isArray(c)) {
    console.warn("openReadOnly got array. Using first item.", c);
    c = c[0];
  }
  showDetailView("view");

  document.getElementById("viewTitle").textContent = c.title || "";
  document.getElementById("viewDate").textContent = c.date || "";
  document.getElementById("viewLocation").textContent =
    c.location ? `📍 ${c.location}` : "";
  document.getElementById("viewMemory").textContent = c.memory || "";

  const media = document.getElementById("viewMedia");

  // 🔥 초기화 (중요)
  media.innerHTML = "";
  media.style.backgroundImage = "none";
  media.classList.remove("is-youtube-zoom");
  media.removeAttribute("data-yt-id");
  media.removeAttribute("data-playing");

  // ✅ VIDEO → 항상 재생
  if (c.type === "video" && c.videoSrc){
    const video = document.createElement("video");
    video.src = c.videoSrc;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;        // ⭐ autoplay 필수
    video.playsInline = true;  // iOS 대응
    video.controls = false;    // 읽기전용이니까 컨트롤 없음

    media.appendChild(video);
  }
  // ✅ MUSIC / PHOTO → 썸네일
  else if (c.thumbnail){
    media.style.backgroundImage = `url("${c.thumbnail}")`;

    if (c.type === "music") {
      media.classList.add("is-youtube-zoom");
      const match = String(c.thumbnail).match(/\/vi\/([^/]+)\//);
      if (match) media.dataset.ytId = match[1];
    }
  }

  // 태그
  const tagsWrap = document.getElementById("viewTags");
  tagsWrap.innerHTML = "";
  (c.moodTags || []).forEach(t => {
    tagsWrap.insertAdjacentHTML(
      "beforeend",
      `<span class="tag-pill is-active"><span class="dot"></span>${t}</span>`
    );
  });
}

// 음악 썸네일 클릭 시 유튜브 재생
document.getElementById("viewMedia")?.addEventListener("click", (e) => {
  const media = e.currentTarget;
  const ytId = media?.dataset?.ytId;
  if (!ytId) return;
  if (media.dataset.playing === "true") return;

  media.dataset.playing = "true";
  media.classList.remove("is-youtube-zoom");
  media.style.backgroundImage = "none";
  media.innerHTML = `
    <iframe
      src="https://www.youtube.com/embed/${ytId}?autoplay=1&playsinline=1"
      title="YouTube music player"
      frameborder="0"
      allow="autoplay; encrypted-media; picture-in-picture"
      allowfullscreen
    ></iframe>
  `;
});

window.openReadOnly = openReadOnly;
window.closeDetailPanel = closeDetailPanel;
window.showDetailView = showDetailView;

window.openMyRoomContentById = (contentId) => {
  const content = contents.find(c => String(c.id) === String(contentId));
  if (!content) {
    console.warn("No content found for id:", contentId);
    return;
  }

  // 왼쪽 패널
  window.myRoomNav?.openNav?.();
  window.myRoomNav?.showPanel?.(content.type);

  // 오른쪽 디테일(읽기전용)
  window.openReadOnly?.(content);
};
