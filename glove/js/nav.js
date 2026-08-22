/* 모바일 햄버거 메뉴 — 열기/닫기 */
var navLinks = document.querySelector('.nav-links');

document.getElementById('hamb').addEventListener('click', function () {
  navLinks.classList.toggle('open');
});

navLinks.querySelectorAll('a').forEach(function (a) {
  a.addEventListener('click', function () {
    if (window.innerWidth <= 900) navLinks.classList.remove('open');
  });
});
