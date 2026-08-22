/* 스크롤 등장 애니메이션 · 해시 앵커 위치 보정
   초기 은닉은 html.rvon 이 붙었을 때만 적용된다 — 스크립트가 실패하면 콘텐츠는 그대로 보인다.
   IntersectionObserver 대신 스윕 방식: 앵커로 건너뛰어도 지나친 요소가 숨은 채 남지 않는다. */
(function () {
  var els = Array.prototype.slice.call(document.querySelectorAll('.rv'));
  if (!els.length) return;

  document.documentElement.classList.add('rvon');

  var last = 0;

  function sweep() {
    last = Date.now();
    var line = window.innerHeight * 0.94;
    for (var i = els.length - 1; i >= 0; i--) {
      var el = els[i];
      if (!el.offsetParent) continue;
      if (el.getBoundingClientRect().top < line) {
        el.classList.add('show');
        els.splice(i, 1);
      }
    }
  }

  function schedule() {
    if (!els.length) return;
    if (Date.now() - last < 80) return;
    sweep();
  }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('load', function () { last = 0; sweep(); });

  /* 스크롤 이벤트가 유실되는 환경의 보조 스윕 — 남은 요소가 없으면 스스로 멈춘다 */
  var poll = setInterval(function () {
    if (!els.length) { clearInterval(poll); return; }
    last = 0; sweep();
  }, 400);

  sweep();
})();

/* 해시로 진입하면 지연 로드 이미지 때문에 레이아웃이 늘어나 최초 앵커 스크롤이 어긋난다 — 로드 후 보정 */
if (location.hash) {
  var jumpToHash = function () {
    var t = document.querySelector(location.hash);
    if (!t) return;
    var root = document.documentElement, prev = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    t.scrollIntoView();
    root.style.scrollBehavior = prev;
  };
  window.addEventListener('load', jumpToHash);
  setTimeout(jumpToHash, 400);
}
