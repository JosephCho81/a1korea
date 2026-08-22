/* 품목 상세 모달 — 열기 · 닫기 */
function openP(id){
  const p=PD[id]; if(!p)return;
  const rows=p.specs.map(([k,v])=>`<tr><td>${k}</td><td>${v}</td></tr>`).join('');
  const tags=p.apps.map(a=>`<span class="app-tag">${a}</span>`).join('');
  document.getElementById('modal-c').innerHTML=`
    <div class="modal-cat">${p.cat}</div>
    <div class="modal-ttl">${p.name}</div>
    <div class="modal-origin">공급 원산지: ${p.origin}</div>
    <div class="modal-hr"></div>
    <div class="modal-desc">${p.desc}</div>
    <div class="modal-grid">
      <div>
        <div class="m-sec-ttl">대표 규격 (Typical Specification)</div>
        <table class="spec-tb"><tbody>${rows}</tbody></table>
      </div>
      <div>
        <div class="m-sec-ttl">적용 분야 (Applications)</div>
        <div class="app-tags">${tags}</div>

      </div>
    </div>`;
  document.getElementById('pmodal').classList.add('on');
  document.body.style.overflow='hidden';

  /* 모달을 히스토리 항목으로 만든다 — 모바일에서 뒤로가기의 첫 기대는
     "사이트를 떠나는 것"이 아니라 "열린 모달을 닫는 것"이다. */
  history.pushState({modal:id}, '', location.href);
}

/* fromPop: popstate가 이미 그 항목을 소비한 뒤 호출된 경우 — 되감지 않는다 */
function closeP(fromPop){
  const box=document.getElementById('pmodal');
  if(!box.classList.contains('on')) return;
  box.classList.remove('on');
  document.body.style.overflow='';
  if(fromPop!==true && history.state && history.state.modal) history.back();
}

function modalOpen(){ return document.getElementById('pmodal').classList.contains('on'); }

document.getElementById('pmodal').addEventListener('click',e=>{if(e.target===document.getElementById('pmodal'))closeP();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeP();});
