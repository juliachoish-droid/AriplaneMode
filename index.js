const cards = Array.from(document.querySelectorAll('.card'));
const fakeScroll = document.querySelector('.fake-scroll');

if (!fakeScroll || cards.length === 0) {
 
} else {
  const TOTAL = cards.length;
  const Z_SPACING = 800;

  const cardData = cards.map((card, i) => {
    const x = (Math.random() - 0.5) * 400;
    const y = (Math.random() - 0.5) * 300;
    const baseZ = -i * Z_SPACING;   // 카드 수 늘어나도 자동으로 늘어나서 간격 유지됨!
    return { card, x, y, baseZ };
  });

  function update() {
    const scrollMax = fakeScroll.offsetHeight - innerHeight;
    if (scrollMax <= 0) return;

    const t = scrollY / scrollMax;
    const camZ = t * (TOTAL + 3) * Z_SPACING * 0.5;//카드 수 늘면 csnZ도 이동 폭 커짐

    cardData.forEach(({ card, x, y, baseZ }) => {
      const z = baseZ + camZ;
      const depth = Math.abs(z) / (Z_SPACING * 2);//깊이 계산해서 투명하게 조절

      card.style.transform = `
        translate3d(${x}px, ${y}px, ${z}px)
        translate(-50%, -50%)
      `;
      card.style.opacity = Math.max(0, 1 - depth * 0.5);
    });
  }

  window.addEventListener('scroll', () => requestAnimationFrame(update));
  update();
}
