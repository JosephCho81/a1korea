/* 해시 기반 화면 전환 라우터 */
const PAGES = ['home','products','trading','about','contact'];

/* 주소창의 해시가 곧 현재 화면 — 뒤로가기·새로고침·링크 공유의 기준점 */
function currentPage(){
  const p = (location.hash || '').replace('#','');
  return PAGES.includes(p) ? p : 'home';
}

function render(page){
  closeMM();
  const el=document.getElementById('pv-'+page);
  if(!el) return false;
  document.querySelectorAll('.pv').forEach(v=>v.classList.remove('on'));
  el.classList.add('on');

  /* 네비게이션 활성 상태 업데이트 */
  document.querySelectorAll('.nav-links li span').forEach(s=>s.classList.remove('active'));
  const navEl=document.getElementById('n-'+page);
  if(navEl) navEl.classList.add('active');
  return true;
}

function go(page){
  if(page !== currentPage()){
    history.pushState({page}, '', page === 'home' ? location.pathname : '#' + page);
  }
  if(render(page)) window.scrollTo({top:0,behavior:'smooth'});
}

/* 뒤로/앞으로 가기 — 애니메이션 없이 즉시 복원 */
window.addEventListener('popstate', function(){
  render(currentPage());
  window.scrollTo({top:0,behavior:'auto'});
});

/* 해시가 붙은 주소로 바로 진입한 경우 (예: /#products) */
(function initFromHash(){
  const init = () => render(currentPage());
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
