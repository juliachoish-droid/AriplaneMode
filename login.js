/*
   1. 로그인 / 회원가입 멀티 스텝 화면 전환 로직
   - data-step / data-show-step 부분
   - 한 화면 안에서 새로고침 없이 단계 전환
*/

document.addEventListener('DOMContentLoaded', () => {
  // 모든 스텝 섹션 수집
  const stepSections = Array.from(document.querySelectorAll('[data-step]'));
  // 스텝을 전환시키는 트리거 버튼들
  const triggers = document.querySelectorAll('[data-show-step]');

  if (!stepSections.length || !triggers.length) return;

  // 유효한 스텝인지 확인하는 함수
  const isValidStep = (step) =>
    stepSections.some((section) => section.dataset.step === step);

  // 특정 스텝만 활성화하는 함수
  const showStep = (step) => {
    if (!isValidStep(step)) return;

    stepSections.forEach((section) => {
      section.classList.toggle(
        'is-active',
        section.dataset.step === step
      );
    });

    // 스텝 전환 시 화면 상단으로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 버튼 클릭 시 해당 스텝으로 이동
  triggers.forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      const targetStep = trigger.dataset.showStep;
      showStep(targetStep);
    });
  });
});


/* 
   2. 태그 버튼 선택 / 해제 토글 기능
   - 로그인 화면, 검색 화면에서 공통 사용
 */
document.querySelectorAll(".tag-option").forEach((btn) => {
  btn.addEventListener("click", () => {
    btn.classList.toggle("is-active");
  });
});


/* 
   3. 컬러(테마) 선택 버튼
   - 하나만 선택 가능 (radio 버튼처럼 동작)
 */

document.addEventListener('DOMContentLoaded', () => {
  const colorOptions = document.querySelectorAll('.color-option');

  colorOptions.forEach(option => {
    option.addEventListener('click', () => {
      // 기존 선택 전부 해제
      colorOptions.forEach(btn =>
        btn.classList.remove('selected')
      );

      // 클릭한 항목만 선택
      option.classList.add('selected');

      // 선택된 테마 값 (필요 시 저장/활용 가능)
      const theme = option.dataset.theme;
      // console.log('selected theme:', theme);
    });
  });
});


/*
   4. 이메일 인증 모달 열기 / 닫기 로직
   - 인증 완료 후 다음 단계 버튼 활성화
 */

document.addEventListener('DOMContentLoaded', () => {
  const modalOverlay = document.getElementById('emailModal');
  const openModalBtn = document.querySelector('.Makeaccount-button3');
  const closeModalBtn = modalOverlay?.querySelector('.emailModal-Xbutton');
  const verifyNextBtn =
    document.querySelector('[data-step="signup-email"] .Makeaccount-button4');

  if (!modalOverlay || !openModalBtn || !closeModalBtn) return;

  // 모달 열기
  const openModal = () =>
    modalOverlay.classList.add('is-active');

  // 모달 닫기 + 인증 완료 처리
  const closeModal = () => {
    modalOverlay.classList.remove('is-active');
    openModalBtn.textContent = 'Verified';
    openModalBtn.classList.add('is-verified');
    verifyNextBtn?.classList.remove('is-hidden');
  };

  openModalBtn.addEventListener('click', (event) => {
    event.preventDefault();
    openModal();
  });

  closeModalBtn.addEventListener('click', (event) => {
    event.preventDefault();
    closeModal();
  });

  // 오버레이 바깥 클릭 시 모달 닫기
  modalOverlay.addEventListener('click', (event) => {
    if (event.target === modalOverlay) {
      closeModal();
    }
  });
});


/* =====================================================
   5. 프로필 이미지 업로드 & 미리보기 기능
   - 파일 업로드 시 즉시 아바타에 반영
===================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const profileInput = document.getElementById('profileInput');
  const avatarPreview = document.querySelector('.avatar');

  if (!profileInput || !avatarPreview) return;

  profileInput.addEventListener('change', () => {
    const [file] = profileInput.files || [];

    // 파일이 없을 경우 초기화
    if (!file) {
      avatarPreview.style.backgroundImage = '';
      avatarPreview.classList.remove('has-image');
      return;
    }

    // 파일을 DataURL로 읽어서 미리보기 표시
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (typeof dataUrl === 'string') {
        avatarPreview.style.backgroundImage = `url('${dataUrl}')`;
        avatarPreview.classList.add('has-image');
      }
    };
    reader.readAsDataURL(file);
  });
});
