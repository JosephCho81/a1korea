/* 라인업 영상 — 모든 기기에서 화면에 들어오면 무음 자동 재생, 화면 밖으로 나가면 멈춘다. */
(function () {
  var video = document.querySelector('.lineup-media video');
  if (!video) return;

  /* 앞부분(0~start초)은 회사 로고 인트로 — 제품 상자가 나오는 지점부터 재생하고, 반복도 그 지점으로 */
  var start = parseFloat(video.dataset.start) || 0;
  function toStart() { if (video.currentTime < start) video.currentTime = start; }
  video.addEventListener('loadedmetadata', toStart);
  video.addEventListener('play', toStart);
  video.addEventListener('ended', function () { video.currentTime = start; video.play(); });

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function play() { var p = video.play(); if (p && p.catch) p.catch(function () {}); }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) play(); else video.pause();
    }, { threshold: 0.35 }).observe(video);
  } else {
    play();
  }
})();
