
import {
  createContent,
  uploadFile,
  updateContent,
  fetchMyContents
} from "./myroom-api.js";

// import { renderContents } from "./myroom-contentcard.js";


// ===============유튜브 영상 업로드용===================

document.querySelectorAll(".upload-box.music-box").forEach((box) => {
  const btnOpen = box.querySelector(".js-open");
  const editWrap = box.querySelector(".js-edit");
  const input = box.querySelector(".js-url");
  const btnDone = box.querySelector(".js-done");
  const square = box.querySelector(".js-square");
  const thumb = box.querySelector(".js-thumb");
  const player = box.querySelector(".js-player");
  const btnEdit = box.querySelector(".js-editBtn");

  let currentId = null;
  let loadTimer = null;

  function setState(state) {
    box.dataset.state = state;

    square?.classList.remove("is-playing");
    if (player) player.src = "";
    if (state === "editing") setTimeout(() => input?.focus(), 0);
    if (state === "empty" && thumb) thumb.removeAttribute("src");
  }

  function getYouTubeId(url) {
    try {
      const u = new URL(url);
      if (u.hostname.includes("youtube.com")) {
        const v = u.searchParams.get("v");
        if (v) return v;
        const parts = u.pathname.split("/").filter(Boolean);
        const idx = parts.findIndex((p) => p === "shorts" || p === "embed");
        if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
      }
      if (u.hostname.includes("youtu.be")) return u.pathname.replace("/", "");
      return null;
    } catch {
      return null;
    }
  }

  function setThumb(id) {
    if (!thumb) return;
    const candidates = [
      `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
      `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
      `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
    ];
    let i = 0;
    thumb.onerror = () => {
      i += 1;
      if (i < candidates.length) thumb.src = candidates[i];
    };
    thumb.src = candidates[i];
  }

  function openFallback(id) {
    window.open(`https://www.youtube.com/watch?v=${id}`, "_blank", "noopener");
  }

  function startPlayback() {
    if (!currentId || !square || !player) return;
    square.classList.add("is-playing");
    player.src = `https://www.youtube.com/embed/${currentId}?autoplay=1&rel=0&modestbranding=1`;

    if (loadTimer) window.clearTimeout(loadTimer);
    loadTimer = window.setTimeout(() => {
      openFallback(currentId);
    }, 4000);

    const onLoad = () => {
      if (loadTimer) window.clearTimeout(loadTimer);
      loadTimer = null;
      player.removeEventListener("load", onLoad);
    };
    player.addEventListener("load", onLoad);
  }

  setState("empty");

  btnOpen?.addEventListener("click", () => setState("editing"));

  btnDone?.addEventListener("click", () => {
    const id = getYouTubeId(input?.value.trim() ?? "");
    if (!id) {
      alert("유효한 YouTube 링크를 넣어줘!");
      return;
    }
    currentId = id;
    setThumb(id);
    setState("preview");
  });

  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") btnDone?.click();
  });

  square?.addEventListener("click", (e) => {
    if (e.target.closest(".js-editBtn")) return;
    startPlayback();
  });

  btnEdit?.addEventListener("click", () => {
    currentId = null;
    setState("editing");
  });

  
});
// ===============유튜브 영상 업로드 끝===================


// =================사진업로드용==================
const galleryForm = document.querySelector('form[data-detail="add-gallery"]');

if (galleryForm) {
  const photoBox     = galleryForm.querySelector(".upload-box.photo-box");
  const photoInput   = galleryForm.querySelector(".js-photo-file");
  const openBtn      = galleryForm.querySelector(".js-photo-open");
  const editBtn      = galleryForm.querySelector(".js-photo-editBtn") || galleryForm.querySelector(".js-editBtn");
  const photoSquare  = galleryForm.querySelector(".js-photo-square");

  function openPhotoPicker() {
    photoInput?.click();
  }

  openBtn?.addEventListener("click", openPhotoPicker);
  editBtn?.addEventListener("click", openPhotoPicker);

  photoInput?.addEventListener("change", () => {
    const file = photoInput.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    photoSquare.style.backgroundImage = `url(${url})`;
    photoBox.dataset.state = "filled";
  });
}
// =================사진업로드용 끝==================



// =================비디오업로드용==================
const videoForm = document.querySelector('form[data-detail="add-video"]');

if (videoForm) {
  const box      = videoForm.querySelector(".upload-box.video-box");
  const openBtn  = videoForm.querySelector(".js-video-open");
  const editBtn  = videoForm.querySelector(".js-video-editBtn");
  const input    = videoForm.querySelector(".js-video-file");
  const square   = videoForm.querySelector(".js-video-square");
  const videoEl  = videoForm.querySelector(".js-video-preview");

  function openPicker(){ input.click(); }
  openBtn.addEventListener("click", openPicker);
  editBtn.addEventListener("click", openPicker);

  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    videoEl.src = url;
    videoEl.muted = true;        // ✅ 자동재생 필수
    videoEl.playsInline = true;  // ✅ iOS 대응
    videoEl.loop = true;         // (원하면)
    box.dataset.state = "filled";
  });

  // ✅ hover 재생/정지 (썸네일 네모 안에서만)
  square.addEventListener("mouseenter", () => {
    if (box.dataset.state !== "filled") return;
    videoEl.play().catch(() => {});
  });

  square.addEventListener("mouseleave", () => {
    if (box.dataset.state !== "filled") return;
    videoEl.pause();
    videoEl.currentTime = 0; // 원하면 처음으로
  });
}
// =================비디오업로드용 끝==================





const saveBtn = document.getElementById("btnSave");
const detailPanel = document.getElementById("detailPanel");

// ✅ 현재 열려있는 패널(form)을 받아서 값만 뽑는 함수
function pickInputs(form){
  const title =
    form.querySelector('input[placeholder="Enter the title"]')?.value?.trim() ?? "";

  const date =
    form.querySelector('input[placeholder="Enter the date"]')?.value?.trim() ?? "";

  const locationText =
    form.querySelector(".js-location")?.value?.trim() ??
    form.querySelector('input[placeholder="Enter the location"]')?.value?.trim() ??
    "";

  const memory =
    form.querySelector("textarea")?.value?.trim() ?? "";

  const moodTags = [...form.querySelectorAll(".tag-pill.is-active")]
    .map(btn => btn.textContent.replace("×", "").trim());

  // ✅ key는 DB 컬럼명 location으로, 값은 locationText로
  return { title, date, location: locationText, memory, moodTags };
}

async function handleSave() {
  const activeForm = detailPanel?.querySelector(".detail-view.is-active");
  if (!activeForm) return;

  const type = activeForm.dataset.detail?.replace("add-", "") ?? "gallery";
  const ownerId = "me";

  // ✅ 여기서 form(=activeForm) 넘겨서 값 가져오기
  const { title, date, location, memory, moodTags } = pickInputs(activeForm);

  if (!title) {
    alert("제목을 써주셈");
    return;
  }

  saveBtn.disabled = true;

  try {
    const row = await createContent(ownerId, {
      type,
      title,
      date,
      location, 
      memory,
      moodTags,
      thumbnail: "",
      videoSrc: ""
    });

    if (type === "gallery") {
      const file = activeForm.querySelector(".js-photo-file")?.files?.[0];
      if (!file) throw new Error("사진 파일 없음");

      const url = await uploadFile(ownerId, row.id, file, "thumbnail");
      await updateContent(row.id, { thumbnail: url });
    }

    if (type === "video") {
      const file = activeForm.querySelector(".js-video-file")?.files?.[0];
      if (!file) throw new Error("비디오 파일 없음");

      const url = await uploadFile(ownerId, row.id, file, "video");
      await updateContent(row.id, {
        videoSrc: url,
        thumbnail: "images/video-placeholder.jpg"
      });
    }


    if (type === "music") {
      const thumb = activeForm.querySelector(".js-thumb")?.src ?? "";
      await updateContent(row.id, { thumbnail: thumb });
    }

    alert("저장 완료 ✅");
    window.location.reload();

  } catch (err) {
    console.error("❌ REAL ERROR:", err);
    alert("저장 실패:\n" + (err?.message || JSON.stringify(err)));
  } finally {
    saveBtn.disabled = false;
  }
}

saveBtn?.addEventListener("click", handleSave);
console.log("✅ Save button wired:", !!saveBtn);
