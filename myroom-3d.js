import * as THREE from "https://unpkg.com/three@0.158.0/build/three.module.js";
import { fetchMyContents } from "./myroom-api.js";

const contents = await fetchMyContents("me");
// 이후 기존에 myRoomContentsDB 쓰던 부분을 contents로 치환

let camDist = 30; //시작 줌(거리).

// 그래드 중에는 클릭 방지
let downX = 0, downY = 0;
let dragged = false;
const DRAG_THRESHOLD = 6; // px


const container = document.getElementById('webgl-container');

// 클릭목록만들기
const clickablePhotos = []; // raycast 대상들
const raycaster = new THREE.Raycaster();
const mouseNdc = new THREE.Vector2();

// Scene
const scene = new THREE.Scene();


const isMobileView = () =>
  window.matchMedia('(pointer: coarse)').matches || window.innerWidth <870;
let isMobile = isMobileView();

const BASE_FOV_DESKTOP = 50;
const BASE_FOV_MOBILE = 70;

const MIN_DIST=15;
const MAX_DIST=30;

const MIN_FOV = 40;
const MAX_FOV = 80;
let currentFov = isMobile ? BASE_FOV_MOBILE : BASE_FOV_DESKTOP;

// Camera
const camera = new THREE.PerspectiveCamera(
  currentFov,
  window.innerWidth / window.innerHeight,
  0.1,
  180
);
camera.position.set(0, 0, 0);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
// 사진화질이 너무 안좋아서 추가함..개선하긴 했는데 2 넘어가면 로드 시간이 너무 오래걸리는 단점이 있었음.
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// Texture
const texLoader = new THREE.TextureLoader();
const wallTexture = texLoader.load(
  'https://krmdylpesyfmbjumprqs.supabase.co/storage/v1/object/public/media/contents/background/wall9.png',
  (tex) => {
    if (tex.colorSpace !== undefined) {
      tex.colorSpace = THREE.SRGBColorSpace;
    }
  },
  undefined,
  (err) => {
    console.warn('wall 이미지 로드 실패', err);
  }
);

// Sphere Room
const roomRadius = 40;
const roomGeo = new THREE.SphereGeometry(roomRadius, 60, 60);
const roomMat = new THREE.MeshBasicMaterial({
  map: wallTexture,
  side: THREE.BackSide
});
const room = new THREE.Mesh(roomGeo, roomMat);
scene.add(room);

// ====== Photos on the inner wall (sphere) ======
const photoLoader = new THREE.TextureLoader();

// GC 줄이기: 매번 new Vector3() 안 만들고 재사용
const _out = new THREE.Vector3();

function applyCoverToSquare(tex, zoom = 1.0, focusY = 0.5) {
  // tex.image가 있어야 계산 가능
  const imgW = tex.image?.width;
  const imgH = tex.image?.height;
  if (!imgW || !imgH) return;

  const imgAspect = imgW / imgH;      // 원본 비율
  const squareAspect = 1;             // 정사각형

  // cover: 정사각형에 꽉 차게(비율 유지 + 크롭)
  let repeatX = 1, repeatY = 1;
  if (imgAspect > squareAspect) {
    // 가로로 긴 사진 → 좌우 잘라야 함
    repeatX = squareAspect / imgAspect;
  } else {
    // 세로로 긴 사진 → 위아래 잘라야 함
    repeatY = imgAspect / squareAspect;
  }

  // 추가 줌(1.0이면 기본 cover, 1.8이면 더 확대)
  repeatX /= zoom;
  repeatY /= zoom;

  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(repeatX, repeatY);

  // 중앙 크롭(필요하면 위쪽으로 올릴 수 있게 focusY)
  const offsetX = (1 - repeatX) / 2;
  const offsetY = (1 - repeatY) * focusY; // 0.5면 중앙, 0.4면 살짝 위
  tex.offset.set(offsetX, offsetY);

  tex.needsUpdate = true;
}

function addWallPhoto({
  imgUrl,
  w = 6,
  h = 4,
  yaw = 0,
  pitch = 0.12,
  push = 0.25,
  framePad = 0.18,
  contentId,
}) {

  // ✅ [여기] 빈 / 이상한 URL 방어
  if (!imgUrl || typeof imgUrl !== "string" || !imgUrl.trim()) {
    console.warn("🟨 skip texture load: empty imgUrl", imgUrl, contentId);
    return;
  }

  // console.log("🧪 trying to load texture:", imgUrl);

  photoLoader.load(
    imgUrl,
    (tex) => {
      if (tex.colorSpace !== undefined) tex.colorSpace = THREE.SRGBColorSpace;

      const isYouTubeThumb = typeof imgUrl === "string" && imgUrl.includes("img.youtube.com");

      if (isYouTubeThumb) {
        // 180% 확대 = repeat를 줄이면 "줌 인" 됨
        const zoom = 1 / 1.8; // ≈ 0.555...

        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;

        tex.repeat.set(zoom, zoom);

        // 중앙 정렬
        tex.offset.set((1 - zoom) / 2, (1 - zoom) / 2);

        tex.needsUpdate = true;
      }

      // ===== PHOTO =====
      // ✅ 1) 이미지 원본 비율 가져오기
        const imgW = tex.image?.width;
        const imgH = tex.image?.height;

        if (imgW && imgH) {
          const imgAspect = imgW / imgH;   // 가로/세로 비율

        } else {
          console.warn("tex.image size not ready?", imgUrl, tex.image);
        }

        const photoMat = new THREE.MeshBasicMaterial({
          map: tex,
          side: THREE.DoubleSide,
        });

        const photoGeo = new THREE.PlaneGeometry(w, h);  // ✅ 여기서 새 h가 적용됨
        const photoMesh = new THREE.Mesh(photoGeo, photoMat);
        photoMesh.userData.contentId = contentId;     // ✅ 어떤 콘텐츠인지 저장
        photoMesh.userData.imgUrl = imgUrl;
        clickablePhotos.push(photoMesh);              // ✅ 클릭 대상 등록


        const r = roomRadius - push;
        const x = r * Math.sin(yaw) * Math.cos(pitch);
        const y = r * Math.sin(pitch);
        const z = r * Math.cos(yaw) * Math.cos(pitch);

        photoMesh.position.set(x, y, z);
        photoMesh.lookAt(0, 0, 0);

      // ===== FRAME (behind) =====
      const frameGeo = new THREE.PlaneGeometry(w + framePad, h + framePad);
      const frameMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95,
      });
      const frameMesh = new THREE.Mesh(frameGeo, frameMat);

      frameMesh.position.copy(photoMesh.position);
      frameMesh.quaternion.copy(photoMesh.quaternion);

      // push out a bit (avoid z-fighting)
      _out.set(0, 0, 1).applyQuaternion(photoMesh.quaternion);
      frameMesh.position.addScaledVector(_out, 0.01);
      photoMesh.position.addScaledVector(_out, 0.02);

      scene.add(frameMesh);
      scene.add(photoMesh);
    },
    undefined,
    (err) => {
      console.error("❌ texture load failed:", imgUrl, err);
      console.log("🔗 open this url:", imgUrl);
    }
  );
}


function renderMyRoomWallPhotos() {
  const slotsByType = {
    gallery: [
      { yaw: -0.12, pitch:  0.13, w: 7, h: 7, push: 1 },
      { yaw: -0.25, pitch:  0.28, w: 7, h: 7, push: 3 },
      { yaw:  0.01, pitch:  0.3, w: 7, h: 7, push: 3 },
      { yaw: -0.36, pitch:  0.10, w: 7, h: 7, push: 1 },
      { yaw:  0.11, pitch:  0.12, w: 7, h: 7, push: 1 },
      { yaw: -0.22, pitch: -0.07, w: 7, h: 7, push: 3 },
      { yaw: -0.01, pitch: -0.09, w: 7, h: 7, push: 1 },
    ],
    video: [
      { yaw: 0.9, pitch: 0.032, w: 6, h: 6, push: 0.5 },
    ],
    music: [
      { yaw:  2.75, pitch:  0.158,  w: 6, h: 6, push: 0.3 },
      { yaw:  2.95, pitch:  0.158,  w: 6, h: 6, push: 0.4 },
      { yaw:  3.15, pitch:  0.158,  w: 6, h: 6, push: 0.3 },
      { yaw:  3.34, pitch:  0.158,  w: 6, h: 6, push: 0.5 },
      { yaw:  2.9,  pitch: -0.09, w: 7, h: 7, push: 0.5 },
    ]
  };

  const contentsByType = {
    gallery: contents.filter(c => c.type === "gallery"),
    video: contents.filter(c => c.type === "video"),
    music: contents.filter(c => c.type === "music"),
  };

  const YAW_OFFSET = Math.PI; // ✅ 180도 뒤집기 (지금처럼 sphere에 붙일 거면 유지)

  Object.entries(contentsByType).forEach(([type, items]) => {
    const slots = slotsByType[type];
    if (!slots || !items || items.length === 0) return;

    const count = Math.min(items.length, slots.length);

    for (let i = 0; i < count; i++) {
      const p = items[i];
      const s = slots[i];

      addWallPhoto({
        imgUrl: p.thumbnail,
        w: s.w,
        h: s.h,
        yaw: s.yaw + YAW_OFFSET,
        pitch: s.pitch,
        push: s.push,
        contentId: p.id,
      });
    }
  });
}

renderMyRoomWallPhotos();


// Frame (debug)
const frameDistance = 6;
const frameGeo = new THREE.BoxGeometry(2.2, 1.4, 0.05);
const frameMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
const frame = new THREE.Mesh(frameGeo, frameMat);
frame.visible = false;
scene.add(frame);

// Drag control
// 
let yaw = 0;
let pitch = 0;

let isDragging = false;
let lastX = 0;
let lastY = 0;

const YAW_SENSITIVITY = isMobile ? 0.003 : 0.005;
const PITCH_SENSITIVITY = isMobile ? 0.003 : 0.005;

function onPointerDown(e) {
  if (document.body.classList.contains("detail-open")) return;
  isDragging = true;
  dragged = false;
  downX = e.clientX;
  downY = e.clientY;
  lastX = e.clientX;
  lastY = e.clientY;
  document.body.classList.add('dragging');
}

function onPointerMove(e) {
  if (document.body.classList.contains("detail-open")) return;
  if (!isDragging) return;

  const moveDist = Math.hypot(e.clientX - downX, e.clientY - downY);
  if (moveDist > DRAG_THRESHOLD) dragged = true;

  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;
  lastX = e.clientX;
  lastY = e.clientY;

  yaw   += dx * YAW_SENSITIVITY;
  pitch -= dy * PITCH_SENSITIVITY;

  const limit = Math.PI / 2 - 0.1;
  pitch = Math.max(-limit, Math.min(limit, pitch));
}

function handlePick(e){
  if (document.body.classList.contains("detail-open")) return;
  // 1) canvas 좌표 → NDC 변환
  const rect = renderer.domElement.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

  mouseNdc.set(x, y);
  raycaster.setFromCamera(mouseNdc, camera);

  // 2) 클릭 가능한 사진들만 히트테스트
  const hits = raycaster.intersectObjects(clickablePhotos, false);
  if (!hits.length) return;

  const mesh = hits[0].object;
  const contentId = mesh.userData.contentId;
  if (!contentId) return;

  // 3) URL만 갱신 (페이지 이동 X)
  const url = new URL(window.location.href);
  url.searchParams.set("content", contentId);
  window.history.pushState({}, "", url);

  // 4) 오른쪽 detailPanel 열기 (네가 전역으로 만든 함수)
  window.openMyRoomContentById?.(contentId);

  // ✅ 왼쪽 사이드바 열기 + 타입 패널로 이동
const content = contents.find(c => String(c.id) === String(contentId));
if (content) {
  window.myRoomMenu?.openNav?.();
  window.myRoomMenu?.showPanel?.(content.type); // "gallery" | "music" | "video"
}

}



function onPointerUp(e) {
  isDragging = false;
  document.body.classList.remove('dragging');

  if (!dragged) handlePick(e); // ✅ e 전달
}

container.addEventListener('pointerdown', onPointerDown);
window.addEventListener('pointermove', onPointerMove);
window.addEventListener('pointerup', onPointerUp);
window.addEventListener('pointercancel', onPointerUp);

function onWheel(event) {
  event.preventDefault();
  if (event.deltaY === 0) return;

  const delta = event.deltaY;

  // ✅ 1. 거리 줌 (메인)
  camDist += delta * 0.01;
  camDist = Math.max(MIN_DIST, Math.min(MAX_DIST, camDist));

  // ✅ 2. 화각 줌 (보조, 작게)
  currentFov += delta * 0.02;
  currentFov = Math.max(MIN_FOV, Math.min(MAX_FOV, currentFov));

  camera.fov = currentFov;
  camera.updateProjectionMatrix();
}


container.addEventListener('wheel', onWheel, { passive: false });


// Camera update
const dir = new THREE.Vector3();
const tmp = new THREE.Vector3();

function updateCamera() {
  dir.set(
    Math.sin(yaw) * Math.cos(pitch),
    Math.sin(pitch),
    Math.cos(yaw) * Math.cos(pitch)
  );

  camera.position.copy(tmp.copy(dir).multiplyScalar(camDist));
  camera.lookAt(0, 0, 0);

  frame.position.copy(tmp.copy(dir).multiplyScalar(frameDistance));
  frame.lookAt(0, 0, 0);
}


// Resize
window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  isMobile = isMobileView();

  renderer.setSize(w, h);
  camera.aspect = w / h;
  currentFov = Math.max(MIN_FOV, Math.min(MAX_FOV, currentFov));
  camera.fov = currentFov;
  camera.far = 200;
  camera.updateProjectionMatrix();
});

// Loop
function animate() {
  requestAnimationFrame(animate);
  updateCamera();
  renderer.render(scene, camera);
}
animate();
