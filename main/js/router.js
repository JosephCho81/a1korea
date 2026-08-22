/* 해시 기반 화면 전환 라우터 */
const PAGES = ['home','products','trading','about','contact'];

/* 마지막으로 그린 화면 — 뒤로가기가 화면을 실제로 바꿨을 때만 스크롤을 올리기 위해 */
let lastPage = null;

/* 주소창의 해시가 곧 현재 화면 — 뒤로가기·새로고침·링크 공유의 기준점 */
function currentPage(){
  const p = (location.hash || '').replace('#','');
  return PAGES.includes(p) ? p : 'home';
}

function render(page){
  closeMM(true);                              /* 히스토리는 호출부에서 정리한다 */
  const el=document.getElementById('pv-'+page);
  if(!el) return false;
  document.querySelectorAll('.pv').forEach(v=>v.classList.remove('on'));
  el.classList.add('on');

  /* 네비게이션 활성 상태 업데이트 */
  document.querySelectorAll('.nav-links li span').forEach(s=>s.classList.remove('active'));
  const navEl=document.getElementById('n-'+page);
  if(navEl) navEl.classList.add('active');

  lastPage = page;

  /* 새로 드러난 화면의 등장 애니메이션 재검사 */
  if(window.revealSweep) window.revealSweep();
  return true;
}

function go(page){
  const url = page === 'home' ? location.pathname : '#' + page;

  /* 드로어·모달이 열린 채 이동하면 오버레이가 만든 히스토리 항목이 유령으로 남는다.
     화면만 먼저 닫고, 그 항목을 새 화면 항목으로 덮어써서 소비한다. */
  const overlay = mmOpen() || modalOpen();
  closeMM(true);
  closeP(true);

  if(overlay){
    if(page === currentPage()){ history.back(); return; }   /* 덮어쓰면 같은 항목이 두 번 쌓인다 */
    history.replaceState({page}, '', url);
  } else if(page !== currentPage()){
    history.pushState({page}, '', url);
  }

  if(render(page)) window.scrollTo({top:0,behavior:'smooth'});
}

/* 뒤로/앞으로 가기 — 애니메이션 없이 즉시 복원 */
window.addEventListener('popstate', function(){
  /* 오버레이가 열려 있으면 이번 뒤로가기는 사이트 이탈이 아니라 오버레이 닫기다 */
  if(modalOpen()){ closeP(true); return; }
  if(mmOpen()){ closeMM(true); return; }

  const page = currentPage();
  const changed = page !== lastPage;
  render(page);
  if(changed) window.scrollTo({top:0,behavior:'auto'});
});

/* 해시가 붙은 주소로 바로 진입한 경우 (예: /#products) */
(function initFromHash(){
  const init = () => render(currentPage());
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
