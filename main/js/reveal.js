/* 스크롤 등장 애니메이션
   초기 은닉 클래스(.rv)를 JS가 직접 부여한다 — 스크립트가 실패하면 콘텐츠는 그대로 보인다.
   requestAnimationFrame은 쓰지 않는다: 비활성 탭에서 콜백이 지연되면 콘텐츠가 숨은 채 남는다. */
(function(){
  var SEL = '.pillar, .pc, .cap-item, .cred-b, .cust-row, .trade-b, .tmode, .rrow, .cd-list > div, .iq-item, .cp-item';
  var els = Array.prototype.slice.call(document.querySelectorAll(SEL));
  if(!els.length) return;

  els.forEach(function(el){ el.classList.add('rv'); });

  var last = 0;

  /* 화면 하단선을 넘어선 요소를 노출. 지나쳐 스크롤해도(top이 음수) 노출되므로 숨은 채 남지 않는다. */
  function sweep(){
    last = Date.now();
    var line = window.innerHeight * 0.94;
    for(var i = els.length - 1; i >= 0; i--){
      var el = els[i];
      if(!el.offsetParent) continue;            /* 숨겨진 화면(.pv) 안 — 전환 시 다시 검사 */
      if(el.getBoundingClientRect().top < line){
        el.classList.add('vis');
        els.splice(i, 1);
      }
    }
  }

  function schedule(){
    if(!els.length) return;
    if(Date.now() - last < 80) return;
    sweep();
  }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('load', function(){ last = 0; sweep(); });
  window.revealSweep = function(){ last = 0; sweep(); };   /* 화면 전환 직후 라우터가 호출 */

  /* 스크롤 이벤트가 유실되는 환경에서도 콘텐츠가 숨은 채 남지 않도록 하는 보조 스윕.
     남은 요소가 없으면 스스로 멈춘다. */
  var poll = setInterval(function(){
    if(!els.length){ clearInterval(poll); return; }
    last = 0; sweep();
  }, 400);

  sweep();
})();
