/* 모바일 햄버거 메뉴 · 페이지 내 앵커 이동 */
var navLinks = document.querySelector('.nav-links');

function drawerOpen(){ return navLinks.classList.contains('open'); }

function openDrawer(){
  navLinks.classList.add('open');
  /* 드로어를 히스토리 항목으로 — 메뉴를 연 뒤 뒤로가기는 사이트 이탈이 아니라 메뉴 닫기다 */
  history.pushState({drawer:1}, '', location.href);
}

function closeDrawer(fromPop){
  if(!drawerOpen()) return;
  navLinks.classList.remove('open');
  if(fromPop !== true && history.state && history.state.drawer) history.back();
}

document.getElementById('hamb').addEventListener('click', function () {
  if(drawerOpen()) closeDrawer(); else openDrawer();
});

window.addEventListener('popstate', function () {
  if(drawerOpen()){ closeDrawer(true); return; }
});

/* 한 장짜리 랜딩이라 섹션 이동마다 히스토리가 쌓이면
   뒤로가기를 몇 번 눌러야 들어온 곳(허브)으로 돌아가게 된다.
   앵커 이동은 push 대신 replace — 뒤로가기는 항상 직전 사이트로 나간다. */
document.querySelectorAll('a[href^="#"]').forEach(function (a) {
  a.addEventListener('click', function (e) {
    var hash = a.getAttribute('href');
    if(hash === '#' ) return;
    var target = document.querySelector(hash);
    if(!target) return;

    e.preventDefault();

    /* 드로어 안의 링크였다면 드로어 항목까지 여기서 함께 정리된다 */
    if(drawerOpen()) navLinks.classList.remove('open');

    target.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    });
    history.replaceState(history.state && history.state.drawer ? null : history.state, '', hash);
  });
});
