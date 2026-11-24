/* 라인업 영상 — 데스크톱은 화면에 들어오면 무음 자동 재생, 터치 기기는 탭해야 재생(데이터 절약).
   화면 밖으로 나가면 멈추고, 돌아오면 재생 의사(wanted)가 있을 때만 이어서 재생한다. */
(function () {
  var box = document.querySelector('.lineup-media');
  var video = box && box.querySelector('video');
  if (!video) return;
  var btn = box.querySelector('.lv-btn');

  /* 앞부분(0~start초)은 회사 로고 인트로 — 제품 상자가 나오는 지점부터 재생하고, 반복도 그 지점으로 */
  var start = parseFloat(video.dataset.start) || 0;
  function toStart() { if (video.currentTime < start) video.currentTime = start; }
  video.addEventListener('loadedmetadata', toStart);
  video.addEventListener('play', toStart);
  video.addEventListener('ended', function () { video.currentTime = start; video.play(); });

  var desktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var wanted = desktop && !reduced;
  var visible = false;

  function sync() {
    if (wanted && visible) {
      var p = video.play();
      if (p && p.catch) p.catch(function () { wanted = false; });
    } else if (!video.paused) {
      video.pause();
    }
  }

  function toggle() {
    wanted = video.paused;
    if (wanted) visible = true;
    sync();
  }

  video.addEventListener('play', function () { box.classList.add('playing'); });
  video.addEventListener('pause', function () { box.classList.remove('playing'); });
  video.addEventListener('click', toggle);
  btn.addEventListener('click', toggle);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      sync();
    }, { threshold: 0.35 }).observe(video);
  } else {
    visible = true;
    sync();
  }
})();
