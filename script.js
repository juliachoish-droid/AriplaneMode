// script.js (ALL pages) — namespaced to avoid collisions
(() => {
  const burgerBtn = document.querySelector('.burger-btn');
  const mobileMenu = document.querySelector('#mobileMenu');
  const mobileCloseBtn = document.querySelector('.mobile-menu__close');
  const mobileOverlay = document.querySelector('.mobile-overlay');

  function openMenu(){
    document.body.classList.add('menu-open');
    burgerBtn?.setAttribute('aria-expanded', 'true');
    mobileMenu?.setAttribute('aria-hidden', 'false');
  }

  function closeMenu(){
    document.body.classList.remove('menu-open');
    burgerBtn?.setAttribute('aria-expanded', 'false');
    mobileMenu?.setAttribute('aria-hidden', 'true');
  }

  if (burgerBtn && mobileMenu) {
    burgerBtn.addEventListener('click', () => {
      const isOpen = document.body.classList.contains('menu-open');
      isOpen ? closeMenu() : openMenu();
    });
  }

  mobileCloseBtn?.addEventListener('click', closeMenu);
  mobileOverlay?.addEventListener('click', closeMenu);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  document.querySelectorAll('.mobile-menu a').forEach(a => {
    a.addEventListener('click', closeMenu);
  });
})();

// localstorage에 저장상태 저장
const STORAGE_KEY = "saved_contents";

if (!localStorage.getItem(STORAGE_KEY)) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
}
