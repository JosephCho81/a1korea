/* 패널 선택 시 플래시 전환 후 이동 */
var leaving = false;

function goTo(url) {
  if (leaving) return;                 /* 연타로 전환이 두 번 걸리지 않게 */
  leaving = true;
  document.getElementById('flash').classList.add('on');
  setTimeout(function () { window.location.href = url; }, 300);
}

/* 뒤로가기로 돌아오면 페이지가 bfcache에서 그대로 복원된다.
   흰 플래시 오버레이(z-index 9999 · pointer-events:all)가 켜진 채 남아 있어
   "뒤로가기가 안 먹는다"처럼 보인다 — 복원 시마다 초기 상태로 되돌린다. */
window.addEventListener('pageshow', function () {
  leaving = false;
  document.getElementById('flash').classList.remove('on');
});

/* 다른 사이트로 넘어가다 취소된 경우(예: 다운로드·차단)에도 오버레이를 걷는다 */
window.addEventListener('blur', function () {
  setTimeout(function () {
    if (leaving && document.visibilityState === 'visible') {
      leaving = false;
      document.getElementById('flash').classList.remove('on');
    }
  }, 1500);
});
