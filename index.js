import { fetchMyContents } from "./myroom-api.js";

const fakeScroll = document.querySelector(".fake-scroll");
const space = document.getElementById("space");

function pickImageUrl(item) {
  return item.thumbnail || item.imageUrl || item.url || "";
}

function toTime(item) {
  const v = item.createdAt || item.date || item.updatedAt;
  const t = Date.parse(v);
  return Number.isFinite(t) ? t : 0;
}

function renderCards(items) {
  space.innerHTML = "";

  items.forEach((item) => {
    const imgUrl = pickImageUrl(item);
    if (!imgUrl) return;

    const card = document.createElement("div");
    card.className = "card";

    const img = document.createElement("img");
    img.onload = () => console.log("loaded");
    img.onerror = () => console.log("failed");
    img.src = imgUrl;
    img.alt = item.title || "photo";
    img.loading = "lazy";

    card.appendChild(img);
    space.appendChild(card);
  });
}

// ✅ 카드 생성 이후에 호출해야 함
function setupScroll3D() {
  if (!fakeScroll) return;

  const cards = Array.from(document.querySelectorAll("#space .card"));
  if (cards.length === 0) return;

  const TOTAL = cards.length;
  const Z_SPACING = 1000;

  // fakeScroll 높이도 카드 수에 맞게 늘려줘야 스크롤이 됨
  fakeScroll.style.height = `${(TOTAL + 6) * 800}px`;

  const cardData = cards.map((card, i) => {
    const X_RANGE = 900; // 좌우
    const Y_RANGE = 400;  // 상하

    const x = (Math.random() - 0.5) * X_RANGE;
    const y = (Math.random() - 0.5) * Y_RANGE;

    const baseZ = -i * Z_SPACING;
    return { card, x, y, baseZ };
  });

  function update() {
    const scrollMax = fakeScroll.offsetHeight - innerHeight;
    if (scrollMax <= 0) return;

    const t = scrollY / scrollMax;
    const camZ = t * (TOTAL + 3) * Z_SPACING * 0.5;

    cardData.forEach(({ card, x, y, baseZ }) => {
      const z = baseZ + camZ;
      const depth = Math.abs(z) / (Z_SPACING * 2);

      card.style.transform = `
        translate3d(${x}px, ${y}px, ${z}px)
        translate(-50%, -50%)
      `;
      card.style.opacity = Math.max(0, 1 - depth * 0.5);
    });
  }

  // 중복 리스너 방지
  window.removeEventListener("scroll", window.__homeScroll3D);
  window.__homeScroll3D = () => requestAnimationFrame(update);
  window.addEventListener("scroll", window.__homeScroll3D);

  update();
}

async function initHomeCards() {
  try {
    const contents = await fetchMyContents("me");

    const recent6 = contents
      .filter((c) => pickImageUrl(c))
      .sort((a, b) => toTime(b) - toTime(a))
      .slice(0, 10);

    renderCards(recent6);

    // ✅ 중요: 렌더링 후!
    setupScroll3D();
  }  catch (err) {
  console.error("홈 카드 로드 실패 (raw):", err);
  console.error("홈 카드 로드 실패 (json):", JSON.stringify(err, null, 2));
  }

}

initHomeCards();
