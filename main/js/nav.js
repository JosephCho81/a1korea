/* 모바일 드로어 메뉴 */
function mmOpen(){ return document.getElementById('mobilemenu').classList.contains('open'); }

function toggleMM(){
  if(mmOpen()){ closeMM(); return; }
  document.getElementById('hambtn').classList.add('open');
  document.getElementById('mobilemenu').classList.add('open');
  /* 드로어도 히스토리 항목으로 — 메뉴를 연 뒤 뒤로가기를 누르면
     사이트를 떠나는 대신 메뉴가 닫혀야 한다. */
  history.pushState({drawer:1}, '', location.href);
}

/* fromPop: popstate가 이미 그 항목을 소비한 뒤 호출된 경우 */
function closeMM(fromPop){
  if(!mmOpen()) return;
  document.getElementById('hambtn').classList.remove('open');
  document.getElementById('mobilemenu').classList.remove('open');
  if(fromPop!==true && history.state && history.state.drawer) history.back();
}

/* 드로어를 연 채 외부 사이트로 나가는 경우 — 드로어 항목을 덮어써서
   되돌아왔을 때 뒤로가기를 한 번 더 눌러야 하는 유령 항목을 남기지 않는다. */
function leaveTo(url){
  if(mmOpen()){
    document.getElementById('hambtn').classList.remove('open');
    document.getElementById('mobilemenu').classList.remove('open');
    if(history.state && history.state.drawer) history.replaceState(null, '', location.href);
  }
  location.href = url;
}
