/* 모바일 햄버거 메뉴 · 페이지 내 앵커 이동 · 첫 화면 지나면 흰 바탕 */
var navLinks = document.querySelector('.nav-links');
var navBar = document.getElementById('nav');
var heroEl = document.getElementById('top');

/* 파란 첫 화면 위에선 투명 · 흰 글씨, 벗어나거나 드로어가 열리면 흰 바탕 */
function syncNav(){
  var past = heroEl ? heroEl.getBoundingClientRect().bottom < 64 : true;
  navBar.classList.toggle('solid', past || drawerOpen());
}
window.addEventListener('scroll', syncNav, { passive: true });
window.addEventListener('resize', syncNav);

function drawerOpen(){ return navLinks.classList.contains('open'); }

function openDrawer(){
  navLinks.classList.add('open');
  syncNav();
  /* 드로어를 히스토리 항목으로 — 메뉴를 연 뒤 뒤로가기는 사이트 이탈이 아니라 메뉴 닫기다 */
  history.pushState({drawer:1}, '', location.href);
}

function closeDrawer(fromPop){
  if(!drawerOpen()) return;
  navLinks.classList.remove('open');
  syncNav();
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
    if(drawerOpen()){ navLinks.classList.remove('open'); syncNav(); }

    target.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    });
    history.replaceState(history.state && history.state.drawer ? null : history.state, '', hash);
  });
});

syncNav();

/* 모바일 하단 문의 바 — 첫 화면을 지나면 보이고, 문의 섹션이 보이면 숨김 */
(function(){var d=document.getElementById('dock'),h=document.getElementById('top'),c=document.getElementById('contact');
function f(){var r=c.getBoundingClientRect();d.classList.toggle('on',h.getBoundingClientRect().bottom<0&&r.top>innerHeight*0.6);}
addEventListener('scroll',f,{passive:true});f();})();
