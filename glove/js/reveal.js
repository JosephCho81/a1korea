/* 스크롤 등장 애니메이션 · 해시 앵커 위치 보정 */
if ('IntersectionObserver' in window) {
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('show'); io.unobserve(e.target); }
    });
  }, { threshold: 0, rootMargin: '0px 0px -60px 0px' });
  document.querySelectorAll('.rv').forEach(function (el) { io.observe(el); });
} else {
  document.querySelectorAll('.rv').forEach(function (el) { el.classList.add('show'); });
}

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
