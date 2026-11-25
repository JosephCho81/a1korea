const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
// 기본은 3D 첫 화면, ?hero=video 면 영상 첫 화면
const heroMode = new URLSearchParams(location.search).get('hero') !== 'video';
gsap.registerPlugin(ScrollTrigger);

// 첫 화면을 3D로 볼 때: 영상 히어로를 빼고 공정도를 맨 위로
if (heroMode) {
  document.querySelector('.hero').remove();
} else {
  const hv = document.querySelector('.hero video');
  hv.poster = hv.dataset.poster; hv.src = hv.dataset.src; hv.play().catch(() => {});
}
document.querySelectorAll('#cap .c[data-mode]').forEach(c => { if (c.dataset.mode !== (heroMode ? 'hero' : 'section')) c.remove(); });

let lenis;
if (!reduce) {
  lenis = new Lenis({ lerp: 0.1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const nav = document.getElementById('nav');
addEventListener('scroll', () => nav.classList.toggle('solid', scrollY > innerHeight * 0.6), { passive: true });

// 히어로 등장
if (!heroMode && !reduce) {
  gsap.to('.hero h1 .l i', { y: 0, duration: 1.4, ease: 'expo.out', stagger: 0.1, delay: 0.15 });
  gsap.to('.hero p, .meta', { opacity: 1, duration: 1, delay: 0.9, stagger: 0.15 });
  gsap.to('.hero video', { scale: 1, yPercent: 10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
}

// 공정 3D — 스크롤 단계마다 확대
// three.js 로드·장면 구성이 메인 스레드를 오래 잡아 히어로 영상이 멈춘다 → 첫 스크롤 때 준비
let line = null;
const loadScript = src => new Promise((ok, fail) => { const el = document.createElement('script'); el.src = src; el.onload = ok; el.onerror = fail; document.head.appendChild(el); });
let line3d;
function load3d() {
  return line3d ||= loadScript('https://cdn.jsdelivr.net/npm/three@0.147.0/build/three.min.js')
    .then(() => Promise.all(['utils/BufferGeometryUtils.js', 'environments/RoomEnvironment.js'].map(f => loadScript('https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/' + f))))
    .then(() => loadScript('js/steel-line.js'))
    .then(() => { line = SteelLine.mount(document.getElementById('gl'), document.getElementById('labels')); if (step >= 0) line.focus(step); });
}
// 모바일은 3D가 무겁고 작아서 공정 사진으로 대신한다
const MOB = matchMedia('(max-width: 760px)').matches;
const PHOTOS = ['p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'];
let phs = [];
if (MOB) {
  const gl = document.getElementById('gl');
  phs = [...document.querySelectorAll('#cap .c')].map((_, i) => { const d = document.createElement('div'); d.className = 'ph'; d.style.backgroundImage = `url(media/m/${PHOTOS[i] || PHOTOS[PHOTOS.length - 1]}.jpg)`; gl.appendChild(d); return d; });
  document.querySelector('.legend').remove();
} else if (heroMode) load3d(); else addEventListener('scroll', load3d, { once: true, passive: true });
const caps = [...document.querySelectorAll('#cap .c')];
const dots = document.getElementById('dots');
caps.forEach((_, i) => { const b = document.createElement('button'); b.setAttribute('aria-label', (i + 1) + '단계'); dots.appendChild(b); });
const dotBtns = [...dots.children];
let step = -1;
function setStep(i) {
  if (i === step) return; step = i;
  if (line) line.focus(i);
  phs.forEach((p, k) => k === i
    ? gsap.fromTo(p, { opacity: p.style.opacity || 0, scale: 1.06 }, { opacity: 1, scale: 1, duration: reduce ? 0 : 0.9, ease: 'power2.out', overwrite: true })
    : gsap.to(p, { opacity: 0, duration: reduce ? 0 : 0.6, overwrite: true }));
  caps.forEach((c, k) => c.classList.toggle('on', k === i));
  dotBtns.forEach((d, k) => d.classList.toggle('on', k === i));
  document.getElementById('scrollHint').classList.toggle('off', i > 0);
}
const lineST = ScrollTrigger.create({
  trigger: '.line', start: 'top top', end: '+=' + caps.length * 40 + '%', pin: true,
  onUpdate: s => setStep(Math.min(caps.length - 1, Math.floor(s.progress * caps.length * 0.999)))
});
dotBtns.forEach((d, i) => d.addEventListener('click', () => {
  const y = lineST.start + (lineST.end - lineST.start) * ((i + 0.5) / caps.length);
  lenis ? lenis.scrollTo(y) : scrollTo({ top: y, behavior: 'smooth' });
}));
setStep(0);
// 스크롤이 멈추면 가장 가까운 공정 단계로 맞춘다 (휠 두어 번이면 다음 공정)
ScrollTrigger.addEventListener('scrollEnd', () => {
  if (!lineST.isActive) return;
  const n = caps.length, pts = [0, ...caps.map((_, i) => (i + 0.5) / n), 1], p = lineST.progress;
  const to = pts.reduce((a, b) => Math.abs(b - p) < Math.abs(a - p) ? b : a);
  if (Math.abs(to - p) < 0.004) return;
  const y = lineST.start + (lineST.end - lineST.start) * to;
  lenis ? lenis.scrollTo(y, { duration: 0.6 }) : scrollTo({ top: y, behavior: 'smooth' });
});

// 원료가 오는 길 — 장면 교차
const scenes = gsap.utils.toArray('.scene');
const vids = scenes.map(s => s.querySelector('video'));
const railItems = gsap.utils.toArray('.rail div');
// 장면 k는 타임라인 k-0.5에 나타나기 시작해 k+0.5부터 사라진다 → 보이는 동안 재생
let inStory = false;
function syncScenes(t) {
  vids.forEach((v, k) => {
    const on = inStory && t >= k - 0.6 && (k === scenes.length - 1 || t < k + 1.15);
    if (t >= k - 1.6) v.preload = 'auto';
    if (on && v.paused) v.play().catch(() => {});
    else if (!on && !v.paused) v.pause();
  });
  const a = Math.max(0, Math.min(scenes.length - 1, Math.floor(t + 0.5)));
  railItems.forEach((r, k) => r.classList.toggle('on', k === a));
}
ScrollTrigger.create({ trigger: '.story', start: 'top bottom', once: true, onEnter: () => { vids[0].preload = vids[1].preload = 'auto'; } });
const tl = gsap.timeline({
  onUpdate() { syncScenes(this.time()); },
  scrollTrigger: {
    trigger: '.story', start: 'top top', end: '+=' + scenes.length * 90 + '%', pin: true, scrub: 0.6,
    onToggle: s => { inStory = s.isActive; syncScenes(tl.time()); }
  }
});
scenes.forEach((s, i) => {
  if (!i) return;
  tl.to(scenes[i - 1].querySelector('.c'), { y: -50, opacity: 0, duration: 0.35 }, i - 0.5)
    .fromTo(s, { opacity: 0, scale: 1.05 }, { opacity: 1, scale: 1, duration: 0.6 }, i - 0.5)
    .from(s.querySelector('.c'), { y: 50, opacity: 0, duration: 0.4 }, i - 0.2);
});
tl.to({}, { duration: 0.4 });

// 문의 배경 영상은 보일 때만 재생
const cv = document.querySelector('.contact video');
new IntersectionObserver(es => es[0].isIntersecting ? (cv.preload = 'auto', cv.play().catch(() => {})) : cv.pause()).observe(cv);

// 품목 목록 · 상세 패널 (내용은 main/js/data.js)
const ITEMS = [
  ['deox', '탈산제', 'Al 25–65 / 90+%', '국내 · 포스코엠텍', 'deox'],
  ['recarb_lump', '가탄제 · 소괴탄', 'FC 80–91%', '중국 · 러시아', 'lump'],
  ['recarb_pow', '가탄제 · 분탄', 'FC 75–82%', '중국 · 러시아', 'powder'],
  ['fesi', '페로실리콘', 'Si 75 · Si 60', '중국', 'fesi'],
  ['alscrap', '알루미늄 스크랩', 'ISRI · UBC · 70 Chip', '국내 · 미국 · 유럽 · 일본', 'alscrap'],
  ['simet', '메탈실리콘', '441 · 553 · 3303', '중국', 'simet'],
  ['alingot', '알루미늄 잉곳', 'P1020 · ADC12', 'ALBA · EGA · Rusal', 'alingot'],
  ['steel', '철강 제품 · EAF Dust', '형강 · 철근 · 후판', '국내 · 중동', 'steel']
];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
document.getElementById('rows').innerHTML = ITEMS.map(([k, n, s, o, img]) =>
  `<button class="row" data-k="${k}" data-img="media/img/${img}.jpg"><h3>${n}</h3><span class="s">${s}</span><span class="o">${o}</span><span class="go">→</span></button>`).join('');

const peek = document.getElementById('peek'), peekImg = peek.querySelector('img');
let px = 0, py = 0, tx = 0, ty = 0;
document.querySelectorAll('.row').forEach(r => {
  r.addEventListener('mouseenter', () => { peekImg.src = r.dataset.img; peek.classList.add('on'); });
  r.addEventListener('mouseleave', () => peek.classList.remove('on'));
  r.addEventListener('click', () => openPanel(r.dataset.k, r.dataset.img));
});
addEventListener('mousemove', e => { tx = e.clientX + 40; ty = e.clientY - 120; });
(function follow() { px += (tx - px) * 0.16; py += (ty - py) * 0.16; peek.style.transform = `translate(${px}px,${py}px)` + (peek.classList.contains('on') ? '' : ' scale(.9)'); requestAnimationFrame(follow); })();

const panel = document.getElementById('panel'), scrim = document.getElementById('scrim');
let lastFocus;
function openPanel(k, img) {
  const d = PD[k]; if (!d) return;
  lastFocus = document.activeElement;
  panel.innerHTML = `<button class="x" aria-label="닫기">×</button>
    <figure><img src="${img}" alt=""></figure>
    <div class="b"><div class="cat">${esc(d.cat)}</div><h3>${esc(d.name)}</h3><div class="org">원산지 · ${esc(d.origin)}</div>
    <h4>규격</h4><dl>${d.specs.map(([a, b]) => `<div><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join('')}</dl>
    <h4>쓰이는 곳</h4><ul>${d.apps.map(a => `<li>${esc(a)}</li>`).join('')}</ul>
    <a class="ask" href="mailto:a1@a1kor.com?subject=${encodeURIComponent('[문의] ' + d.name)}">이 품목 문의하기</a></div>`;
  panel.querySelector('.x').addEventListener('click', closePanel);
  panel.classList.add('open'); scrim.classList.add('open'); panel.setAttribute('aria-hidden', 'false');
  lenis && lenis.stop(); panel.focus();
}
function closePanel() {
  panel.classList.remove('open'); scrim.classList.remove('open'); panel.setAttribute('aria-hidden', 'true');
  lenis && lenis.start(); lastFocus && lastFocus.focus();
}
scrim.addEventListener('click', closePanel);
addEventListener('keydown', e => { if (e.key === 'Escape' && panel.classList.contains('open')) closePanel(); });

// 내비 앵커는 Lenis로 부드럽게
document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const t = document.querySelector(a.getAttribute('href')); if (!t || !lenis) return;
  e.preventDefault(); lenis.scrollTo(t);
}));
