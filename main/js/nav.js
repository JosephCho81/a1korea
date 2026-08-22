/* 모바일 드로어 메뉴 */
function toggleMM(){
  const btn=document.getElementById('hambtn');
  const menu=document.getElementById('mobilemenu');
  btn.classList.toggle('open');
  menu.classList.toggle('open');
}
function closeMM(){
  document.getElementById('hambtn').classList.remove('open');
  document.getElementById('mobilemenu').classList.remove('open');
}
