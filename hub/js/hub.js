/* 패널 선택 시 플래시 전환 후 이동 */
function goTo(url) {
  const flash = document.getElementById('flash');
  flash.classList.add('on');
  setTimeout(() => { window.location.href = url; }, 300);
}
