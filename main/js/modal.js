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
}

function closeP(){
  document.getElementById('pmodal').classList.remove('on');
  document.body.style.overflow='';
}

document.getElementById('pmodal').addEventListener('click',e=>{if(e.target===document.getElementById('pmodal'))closeP();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeP();});
