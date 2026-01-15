import { fetchProfile } from "./myroom-api.js";

// 기존 setProfileImage()가 myRoomProfileDB.avatar 쓰던 걸 avatar로 바꾸기
let avatarSrc = "profiles/me.png"; // fallback


(async() => {
  // ----- Elements -----
  const sidenav = document.getElementById('mySidenav');
  const sidenavHome = document.getElementById('sidenavHome');
  const sidenavPanelsWrap = document.getElementById('sidenavPanels');
  const panels = document.querySelectorAll('.panel');

  const titleEl = document.getElementById('sidenavTitle');
  const backBtn = document.querySelector('.header-back');
  const myMenuIcon = document.getElementById('myMenuIcon');

  // ✅ 토글 손잡이 버튼(하나)
  const toggleTab = document.querySelector('.side-tab--toggle');

  // Right detail panel
  const detailPanel = document.getElementById('detailPanel');
  const detailTitle = document.getElementById('detailTitle');
  const detailViews = document.querySelectorAll('.detail-view');

  // overlay (있으면)
  const overlay = document.getElementById('menuOverlay');

  // ----- Helpers -----
  function setTabUI(isOpen){
    if (!toggleTab) return;
    const textEl = toggleTab.querySelector('.side-tab__text');
    const iconEl = toggleTab.querySelector('.side-tab__icon');

    if (!textEl || !iconEl) return;

    if (isOpen){
      textEl.textContent = 'Close';
      iconEl.textContent = '‹';
      toggleTab.setAttribute('aria-label', 'Close sidebar');
    } else {
      textEl.textContent = 'Open';
      iconEl.textContent = '›';
      toggleTab.setAttribute('aria-label', 'Open sidebar');
    }
  }

  function openNav(){
    document.body.classList.add('sidebar-open');
    sidenav?.setAttribute('aria-hidden', 'false');
    overlay?.classList.add('is-active');
    setTabUI(true);
  }

  const openBtn = document.querySelector(".burger-btn");

  function closeNav(){
    document.body.classList.remove('sidebar-open');
    sidenav?.setAttribute('aria-hidden', 'true');
    overlay?.classList.remove('is-active');
    setTabUI(false);
    showHome();
    closeDetail();
    // 사이드바 안에 있던 포커스 밖으로 빼기
    openBtn?.focus();
  }

  function toggleNav(){
    const isOpen = document.body.classList.contains('sidebar-open');
    isOpen ? closeNav() : openNav();
  }

  // ----- Profile image wiring -----
  const profileImgTop = document.getElementById("myroomProfileImg");
  const profileImgPanel = document.getElementById("myroomProfileImgPanel");

  function setProfileImage(){
  const profileImgTop = document.getElementById("myroomProfileImg");
  const profileImgPanel = document.getElementById("myroomProfileImgPanel");

  const src = avatarSrc || "profiles/me.png";

  if (profileImgTop) profileImgTop.src = src;
  if (profileImgPanel) profileImgPanel.src = src;
  }



  // ----- Home / Panel navigation -----
  function showHome(){
    if (!sidenavHome) return;
    sidenavHome.style.display = 'grid';
    panels.forEach(p => p.classList.remove('is-active'));
    backBtn?.classList.add('is-hidden');
    if (titleEl) titleEl.textContent = 'My Room';
    myMenuIcon?.classList.remove('is-hidden');
  }

  function showPanel(panelKey){
    if (!sidenavHome) return;
    sidenavHome.style.display = 'none';

    panels.forEach(p => p.classList.remove('is-active'));
    const panel = document.querySelector(`.panel[data-panel="${panelKey}"]`);
    panel?.classList.add('is-active');

    backBtn?.classList.remove('is-hidden');
    if (titleEl) titleEl.textContent = panelKey.charAt(0).toUpperCase() + panelKey.slice(1);

    myMenuIcon?.classList.add('is-hidden');
  }

    // ✅ 다른 모듈(three.js)에서도 사이드바를 열고 패널 전환할 수 있게 공개
  window.myRoomNav = {
    openNav,
    closeNav,
    toggleNav,
    showPanel,
    showHome,
  };


  // ----- Detail panel -----
  function openDetail(detailKey){
    detailPanel?.classList.add('is-open');
    detailPanel?.setAttribute('aria-hidden', 'false');
    document.body.classList.add('detail-open');

    detailViews.forEach(v => v.classList.remove('is-active'));
    const view = document.querySelector(`.detail-view[data-detail="${detailKey}"]`);
    view?.classList.add('is-active');

    if (!detailTitle) return;
    if (detailKey === 'add-music') detailTitle.textContent = 'Add Music';
    else if (detailKey === 'add-gallery') detailTitle.textContent = 'Add Photo';
    else if (detailKey === 'add-video') detailTitle.textContent = 'Add Video';
    else detailTitle.textContent = 'Add content';
  }

  function closeDetail(){
    detailPanel?.classList.remove('is-open');
    detailPanel?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('detail-open');
    detailViews.forEach(v => v.classList.remove('is-active'));
  }

    // ----- Expose API for Three.js (global) -----
  window.myRoomMenu = {
    openNav,
    closeNav,
    showPanel,
    showHome,
  };

  // ----- Events -----
  toggleTab?.addEventListener('click', toggleNav);
  overlay?.addEventListener('click', closeNav);

  sidenavHome?.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-panel]');
    if (!link) return;
    e.preventDefault();
    showPanel(link.dataset.panel);
  });

  backBtn?.addEventListener('click', showHome);

  myMenuIcon?.addEventListener('click', () => {
    showPanel('profile');
  });

  myMenuIcon?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      showPanel('profile');
    }
  });

  sidenavPanelsWrap?.addEventListener('click', (e) => {
    const btn = e.target.closest('.open-form-btn');
    if (!btn) return;

    // data-form="music" / "gallery" / "video"
    openDetail(`add-${btn.dataset.form}`);
  });

  detailPanel?.addEventListener('click', (e) => {
    const tag = e.target.closest('.tag-pill');
    if (!tag) return;
    tag.classList.toggle('is-active');
  });

  document.addEventListener('click', (e) => {
    if (e.target.closest('.detail-close') || e.target.closest('.close-center-page-btn')) {
      closeDetail();
    }
  });

  // ESC로 닫기(선택)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDetail();
      closeNav();
    }
  });

  // ----- Init -----
  showHome();
  setTabUI(false);

  // ✅ DB에서 프로필 불러오기
  let profile = null;
  try {
    profile = await fetchProfile("me");
  } catch {
    // keep fallback avatarSrc
  }
  avatarSrc = profile?.avatar || avatarSrc;

  setProfileImage();
  })();
