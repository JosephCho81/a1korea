/* 아이소메트릭 니트릴 장갑 딥핑 라인 — 손 모양 틀이 응고제 · 니트릴 · 세척조를 지나 장갑이 되어 벗겨진다.
   필요: three r147 + examples/js BufferGeometryUtils · RoomEnvironment
   GloveLine.mount(container, { view: { t: [x, y, z], size, fx, fy }, drift }) */
(function () {
  const PI = Math.PI;
  const ss = u => u * u * (3 - 2 * u);
  function hash(n) { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); }

  function mount(container, opts = {}) {
    const lowPower = innerWidth < 760;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, lowPower ? 1.5 : 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new THREE.RoomEnvironment(), 0.06).texture;
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 300);
    const camDir = new THREE.Vector3(1, 0.95, 1.15).normalize();
    scene.add(new THREE.HemisphereLight(0xd6dde6, 0x0e1116, 0.25));
    const sun = new THREE.DirectionalLight(0xfff2e2, 1.4);
    sun.position.set(14, 26, 12); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 16, bottom: -16, near: 1, far: 80 });
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02;
    scene.add(sun);

    const defs = {
      concrete: [0x8A9198, 0.95, 0], lane: [0xD8A12C, 0.8, 0], steel: [0x59636E, 0.5, 0.55], steelDk: [0x353B43, 0.55, 0.5],
      steelLt: [0x9AA4AE, 0.35, 0.7], stainless: [0xB9C1C9, 0.28, 0.85], yellow: [0xD7981F, 0.55, 0.2], blue: [0x3F5E7C, 0.55, 0.3],
      oven: [0x7D868F, 0.6, 0.4], black: [0x15171A, 0.7, 0.1], pallet: [0x9C7B55, 0.9, 0], wrap: [0xDDE3E8, 0.3, 0.1]
    };
    const MAT = {};
    function getMat(k) {
      if (MAT[k]) return MAT[k];
      const d = defs[k];
      return MAT[k] = new THREE.MeshStandardMaterial({ color: d[0], roughness: d[1], metalness: d[2], envMapIntensity: 0.35 });
    }
    const _o = new THREE.Object3D(), _o2 = new THREE.Object3D();
    const lists = {};
    function add(g, k, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
      _o.position.set(x, y, z); _o.rotation.set(rx, ry, rz); _o.scale.set(1, 1, 1); _o.updateMatrix(); g.applyMatrix4(_o.matrix);
      if (g.index) g = g.toNonIndexed();
      Object.keys(g.attributes).forEach(a => { if (a !== 'position' && a !== 'normal' && a !== 'uv') g.deleteAttribute(a); });
      (lists[k] || (lists[k] = [])).push(g);
    }
    const box = (w, h, d, k, x, y, z, rx, ry, rz) => add(new THREE.BoxGeometry(w, h, d), k, x, y, z, rx, ry, rz);
    const cyl = (r, h, k, x, y, z, rx, ry, rz, s = 12) => add(new THREE.CylinderGeometry(r, r, h, s), k, x, y, z, rx, ry, rz);
    function hcol(k, x, z, y0, y1, s = 0.22) { const h = y1 - y0, c = (y0 + y1) / 2; box(s, h, 0.04, k, x, c, z + s / 2); box(s, h, 0.04, k, x, c, z - s / 2); box(0.04, h, s, k, x, c, z); }
    function beam(k, a, c, t = 0.12, t2) {
      const len = Math.hypot(c[0] - a[0], c[1] - a[1], c[2] - a[2]), g = new THREE.BoxGeometry(t, t2 || t, len);
      _o2.position.set((a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2); _o2.lookAt(c[0], c[1], c[2]); _o2.updateMatrix(); g.applyMatrix4(_o2.matrix); add(g, k);
    }
    function railing(pts, y, h = 0.8) {
      for (let i = 0; i < pts.length - 1; i++) {
        const [x1, z1] = pts[i], [x2, z2] = pts[i + 1];
        beam('yellow', [x1, y + h, z1], [x2, y + h, z2], 0.045); beam('yellow', [x1, y + h / 2, z1], [x2, y + h / 2, z2], 0.035);
        const n = Math.max(1, Math.round(Math.hypot(x2 - x1, z2 - z1) / 1.1));
        for (let k = 0; k <= n; k++) { const u = k / n; box(0.045, h, 0.045, 'yellow', x1 + (x2 - x1) * u, y + h / 2, z1 + (z2 - z1) * u); }
      }
    }

    // ── 바닥
    box(26, 0.5, 9.4, 'concrete', 1, -0.25, 0.4);
    box(26, 0.02, 0.12, 'lane', 1, 0.01, 4.6);

    // ── 오버헤드 체인 레일 (앞 · 뒤 · 양 끝 반원)
    const RAIL_Y = 4.3, ZF = 0, ZB = -1.8, XL = -10, XR = 9.6, R = (ZF - ZB) / 2, ZC = (ZF + ZB) / 2;
    beam('steelDk', [XL, RAIL_Y + 0.1, ZF], [XR, RAIL_Y + 0.1, ZF], 0.14, 0.2);
    beam('steelDk', [XL, RAIL_Y + 0.1, ZB], [XR, RAIL_Y + 0.1, ZB], 0.14, 0.2);
    for (let k = 0; k < 8; k++) {
      const a0 = k / 8 * PI, a1 = (k + 1) / 8 * PI;
      beam('steelDk', [XR + Math.sin(a0) * R, RAIL_Y + 0.1, ZC + Math.cos(a0) * R], [XR + Math.sin(a1) * R, RAIL_Y + 0.1, ZC + Math.cos(a1) * R], 0.14, 0.2);
      beam('steelDk', [XL - Math.sin(a0) * R, RAIL_Y + 0.1, ZC - Math.cos(a0) * R], [XL - Math.sin(a1) * R, RAIL_Y + 0.1, ZC - Math.cos(a1) * R], 0.14, 0.2);
    }
    // 앞쪽 기둥은 빼고 뒤 기둥에서 내민 보로 레일을 건다 (손 모양 틀을 가리지 않게)
    for (let x = XL + 1; x < XR; x += 2.6) { hcol('steel', x, ZB - 0.5, 0, RAIL_Y + 0.4); beam('steel', [x, RAIL_Y + 0.4, ZB - 0.5], [x, RAIL_Y + 0.4, ZF], 0.16, 0.2); }

    // ── 공정 설비 (앞쪽 주행 구간 x 기준)
    const DIP = [
      { x0: -7.4, x1: -5.6, liquid: 0xD8DCD3, name: 'coag' },
      { x0: -2.8, x1: -0.6, liquid: 0x2F5FC4, name: 'nitrile' },
      { x0: 5.2, x1: 6.6, liquid: 0x8EC3D6, name: 'leach' }
    ];
    const liquidMats = [];
    DIP.forEach(d => {
      const w = d.x1 - d.x0 + 0.9, cx = (d.x0 + d.x1) / 2;
      box(w, 1.5, 1.3, 'stainless', cx, 0.75, ZF);
      box(w + 0.08, 0.08, 1.38, 'steelLt', cx, 1.52, ZF);
      const lm = new THREE.MeshStandardMaterial({ color: d.liquid, roughness: 0.15, metalness: 0.1, envMapIntensity: 0.8 });
      const surf = new THREE.Mesh(new THREE.BoxGeometry(w - 0.12, 0.04, 1.18), lm); surf.position.set(cx, 1.44, ZF); surf.receiveShadow = true; scene.add(surf); liquidMats.push(lm);
      for (let k = 0; k < 3; k++) cyl(0.05, 0.9, 'steelLt', cx - w / 2 + 0.3 + k * 0.3, 0.6, ZF + 0.72, 0, 0, 0, 8);
    });
    // 순환 탱크 · 배관 (니트릴)
    cyl(0.55, 1.6, 'stainless', -1.7, 0.8, -3.0, 0, 0, 0, 20); add(new THREE.SphereGeometry(0.55, 20, 8, 0, PI * 2, 0, PI / 2), 'stainless', -1.7, 1.6, -3.0);
    beam('steelLt', [-1.7, 1.2, -2.45], [-1.7, 1.2, -0.66], 0.08);
    box(0.7, 0.5, 0.5, 'blue', -0.6, 0.25, -3.0); cyl(0.18, 0.5, 'steel', -0.6, 0.62, -3.0, 0, 0, PI / 2, 12);
    // 건조 오븐 (응고제 후)
    box(2.0, 2.0, 1.5, 'oven', -3.9, 3.0, ZF); box(2.1, 0.1, 1.6, 'steelDk', -3.9, 4.05, ZF);
    [-4.6, -3.2].forEach(x => hcol('steel', x, ZF + 0.85, 0, 2.0, 0.18));
    // 경화 오븐 (긴 터널)
    box(4.4, 2.1, 1.6, 'oven', 2.4, 3.0, ZF); box(4.5, 0.12, 1.7, 'steelDk', 2.4, 4.1, ZF);
    for (let x = 0.6; x <= 4.2; x += 0.6) box(0.04, 2.0, 0.04, 'steelDk', x, 3.0, ZF + 0.81);
    [1.0, 3.8].forEach(x => { cyl(0.18, 1.4, 'steelLt', x, 4.8, ZF - 0.3, 0, 0, 0, 12); });
    [0.4, 4.4].forEach(x => hcol('steel', x, ZF + 0.9, 0, 1.95, 0.18));
    const ovenGlow = new THREE.MeshStandardMaterial({ color: 0x120400, emissive: 0xFF6A1A, emissiveIntensity: 0.9, roughness: 1, envMapIntensity: 0 });
    [0.18, 4.62].forEach(x => { const g = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.5, 1.2), ovenGlow); g.position.set(x, 3.0, ZF); scene.add(g); });
    // 비딩 브러시 · 탈형 스테이션
    cyl(0.16, 1.0, 'yellow', 4.85, 1.75, ZF, PI / 2, 0, 0, 12);
    box(1.6, 0.18, 1.4, 'steel', 7.6, 1.6, ZF); hcol('steel', 6.9, ZF + 0.6, 0, 1.5, 0.18); hcol('steel', 8.3, ZF + 0.6, 0, 1.5, 0.18);
    beam('steelLt', [7.1, 2.0, ZF + 0.55], [7.6, 1.9, ZF + 0.2], 0.06);
    box(1.4, 0.8, 1.0, 'blue', 8.2, 0.4, 1.9); // 장갑 받는 통
    box(1.3, 0.05, 0.9, 'steelDk', 8.2, 0.81, 1.9);
    railing([[-9.6, 1.0], [-9.6, -2.8]], 0);
    // 포장 · 출하: 박스 컨베이어 + 팔레트 적재
    beam('steelDk', [9.0, 0.8, 2.8], [12.6, 0.8, 2.8], 0.1, 0.12); beam('steelDk', [9.0, 0.8, 3.6], [12.6, 0.8, 3.6], 0.1, 0.12);
    for (let x = 9.1; x < 12.6; x += 0.3) cyl(0.05, 0.8, 'steelLt', x, 0.86, 3.2, PI / 2, 0, 0, 8);
    for (let x = 9.3; x < 12.6; x += 1.1) { hcol('steel', x, 2.8, 0, 0.75, 0.12); hcol('steel', x, 3.6, 0, 0.75, 0.12); }

    // ── ㈜한국에이원 장갑 상자 (Glovetree 파랑 · 검정 · 오트밀 — glove/img 실물 상자 디자인)
    const BOXV = {
      blue: { bg: '#1E8BE0', bar: '#FFFFFF', text: '#FFFFFF', side: '#1E8BE0', logo: 'Glovetree plus' },
      black: { bg: '#141414', bar: '#ECEDEF', text: '#FFFFFF', side: '#141414', logo: 'Glovetree', script: 'The Black' },
      oat: { bg: '#B7BABD', bar: '#F2B51E', text: '#F2B51E', side: '#F2B51E', logo: 'Glovetree', oat: true }
    };
    function tex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t; }
    function boxMaterials(v) {
      const d = BOXV[v];
      const top = tex(512, 268, (x, w, h) => {
        x.fillStyle = d.bg; x.fillRect(0, 0, w, h);
        x.fillStyle = d.bar; x.fillRect(w * 0.43, 0, w * 0.085, h); x.fillRect(0, h * 0.5, w, h * 0.13);
        x.strokeStyle = 'rgba(0,0,0,.18)'; x.setLineDash([4, 4]); x.beginPath(); x.ellipse(w * 0.47, h * 0.56, w * 0.17, h * 0.17, 0, 0, Math.PI * 2); x.stroke(); x.setLineDash([]);
        x.fillStyle = d.text; x.font = '900 40px Arial, sans-serif'; x.fillText('NITRILE', w * 0.05, h * 0.2); x.fillText('GLOVES', w * 0.05, h * 0.36);
        x.font = '22px Arial, sans-serif'; x.fillText('Powder free', w * 0.05, h * 0.46);
        x.fillStyle = v === 'oat' ? d.text : '#FFFFFF'; x.font = 'bold 22px Arial, sans-serif'; x.fillText(d.logo, w * 0.66, h * 0.9);
        if (d.script) { x.font = 'italic 30px Georgia, serif'; x.fillText(d.script, w * 0.72, h * 0.17); }
        if (v === 'blue') { x.fillStyle = '#FFFFFF'; x.fillRect(w * 0.8, h * 0.08, w * 0.15, h * 0.13); x.fillStyle = d.bg; x.font = 'bold 24px Arial, sans-serif'; x.fillText('White', w * 0.815, h * 0.18); }
        if (d.oat) { x.fillStyle = d.text; x.font = '28px Georgia, serif'; x.fillText('COATS', w * 0.7, h * 0.78); }
      });
      const side = tex(512, 72, (x, w, h) => {
        x.fillStyle = '#F4F5F6'; x.fillRect(0, 0, w, h);
        x.fillStyle = d.side; x.fillRect(w * 0.43, 0, w * 0.085, h);
        x.fillStyle = v === 'oat' ? '#8D9095' : d.side; x.font = '900 30px Arial, sans-serif'; x.fillText('NITRILE GLOVES', w * 0.04, h * 0.62);
        x.font = 'bold 18px Arial, sans-serif'; x.fillText(d.logo, w * 0.6, h * 0.6);
      });
      const end = tex(140, 72, (x, w, h) => { x.fillStyle = d.bg; x.fillRect(0, 0, w, h); x.fillStyle = d.bar; x.fillRect(0, h * 0.42, w, h * 0.18); });
      const m = t => new THREE.MeshStandardMaterial({ map: t, roughness: 0.65, metalness: 0, envMapIntensity: 0.3 });
      const mt = m(top), ms = m(side), me = m(end), mb = new THREE.MeshStandardMaterial({ color: 0xE9EBED, roughness: 0.8 });
      return [me, me, mt, mb, ms, ms]; // +x -x +y -y +z -z
    }
    const BOX_SIZE = [0.62, 0.17, 0.33], boxGeo = new THREE.BoxGeometry(...BOX_SIZE);
    const boxMats = { blue: boxMaterials('blue'), black: boxMaterials('black'), oat: boxMaterials('oat') };
    const stacks = { blue: [], black: [], oat: [] };
    function pallet(px, pz, layers, variants) {
      box(1.5, 0.14, 1.2, 'pallet', px, 0.07, pz);
      for (let l = 0; l < layers; l++) for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) {
        const v = variants[(l + j) % variants.length];
        stacks[v].push([px - 0.33 + i * 0.66, 0.14 + 0.085 + l * 0.175, pz - 0.36 + j * 0.36]);
      }
    }
    pallet(10.3, 1.2, 6, ['blue']); pallet(12.1, 1.2, 5, ['black', 'blue']); pallet(12.1, -0.6, 6, ['oat']);
    box(1.62, 1.4, 1.22, 'wrap', 10.3, 0.86, -0.6);

    Object.keys(lists).forEach(k => {
      const mesh = new THREE.Mesh(THREE.BufferGeometryUtils.mergeBufferGeometries(lists[k]), getMat(k));
      mesh.castShadow = k !== 'concrete' && k !== 'lane'; mesh.receiveShadow = true; scene.add(mesh);
    });

    // ── 손 모양 틀 (손목이 위, 손가락이 아래)
    function handGeo(withRod) {
      const parts = [];
      const put = (g, x, y, z, rz = 0, sx = 1, sz = 1) => { g.scale(sx, 1, sz); g.rotateZ(rz); g.translate(x, y, z); parts.push(g.index ? g.toNonIndexed() : g); };
      if (withRod) put(new THREE.CylinderGeometry(0.025, 0.025, 0.42, 6), 0, 0.21, 0);
      put(new THREE.CylinderGeometry(0.12, 0.14, 0.55, 14), 0, -0.27, 0, 0, 1, 0.62);
      put(new THREE.CapsuleGeometry(0.16, 0.16, 4, 12), 0, -0.7, 0, 0, 1.05, 0.42);
      [[-0.12, 0.17], [-0.04, 0.21], [0.04, 0.2], [0.12, 0.15]].forEach(([x, l]) => put(new THREE.CapsuleGeometry(0.045, l, 3, 8), x, -0.92 - l / 2, 0));
      put(new THREE.CapsuleGeometry(0.05, 0.14, 3, 8), 0.2, -0.78, 0.02, 0.55);
      parts.forEach(g => Object.keys(g.attributes).forEach(a => { if (a !== 'position' && a !== 'normal' && a !== 'uv') g.deleteAttribute(a); }));
      const g = THREE.BufferGeometryUtils.mergeBufferGeometries(parts); g.scale(1.5, 1.5, 1.5); return g;
    }
    const LOOP = 2 * (XR - XL) + 2 * PI * R, NF = 34;
    const formers = new THREE.InstancedMesh(handGeo(true), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45, metalness: 0.05, envMapIntensity: 0.4 }), NF);
    formers.castShadow = true; scene.add(formers);
    const ceramic = new THREE.Color(0xEAE6DF), coag = new THREE.Color(0xDCDFD8), nitrile = new THREE.Color(0x2F6BE0), tmpC = new THREE.Color();
    // 날아가는 장갑 + 통 안에 쌓인 장갑
    const NG = 1, flying = new THREE.InstancedMesh(handGeo(false), new THREE.MeshStandardMaterial({ color: 0x3D6FD6, roughness: 0.5, envMapIntensity: 0.4 }), NG); flying.castShadow = true; scene.add(flying);
    const pileN = 26, pile = new THREE.InstancedMesh(handGeo(false), new THREE.MeshStandardMaterial({ color: 0x3D6FD6, roughness: 0.55, envMapIntensity: 0.4 }), pileN);
    for (let i = 0; i < pileN; i++) { _o.position.set(7.75 + hash(i) * 0.9, 0.84 + hash(i + 7) * 0.08, 1.6 + hash(i + 3) * 0.6); _o.rotation.set(PI / 2 + (hash(i + 9) - 0.5) * 0.6, hash(i + 11) * PI * 2, (hash(i + 5) - 0.5) * 0.8); _o.scale.set(0.5, 0.5, 0.2); _o.updateMatrix(); pile.setMatrixAt(i, _o.matrix); }
    pile.castShadow = true; scene.add(pile);
    // 컨베이어 위 상자
    Object.keys(stacks).forEach(v => {
      const im = new THREE.InstancedMesh(boxGeo, boxMats[v], stacks[v].length);
      stacks[v].forEach((p, i) => { _o.position.set(...p); _o.rotation.set(0, 0, 0); _o.scale.set(1, 1, 1); _o.updateMatrix(); im.setMatrixAt(i, _o.matrix); });
      im.castShadow = true; im.receiveShadow = true; scene.add(im);
    });
    const NBX = 5, boxes = new THREE.InstancedMesh(boxGeo, boxMats.blue, NBX); boxes.castShadow = true; scene.add(boxes);

    // 체인 경로: s → 앞 구간(왼→오) · 오른쪽 반원 · 뒤 구간(오→왼) · 왼쪽 반원
    const L1 = XR - XL, A = PI * R;
    function chainAt(s, out) {
      s = ((s % LOOP) + LOOP) % LOOP;
      if (s < L1) return out.set(XL + s, RAIL_Y, ZF), 0;
      s -= L1; if (s < A) { const a = s / R; return out.set(XR + Math.sin(a) * R, RAIL_Y, ZC + Math.cos(a) * R), 1; }
      s -= A; if (s < L1) return out.set(XR - s, RAIL_Y, ZB), 2;
      s -= L1; const a = s / R; return out.set(XL - Math.sin(a) * R, RAIL_Y, ZC - Math.cos(a) * R), 3;
    }
    function dipAt(x) { for (const d of DIP) { const e = 0.7; if (x > d.x0 - e && x < d.x1 + e) { const u = x < d.x0 ? (x - d.x0 + e) / e : x > d.x1 ? (d.x1 + e - x) / e : 1; return ss(Math.max(0, Math.min(1, u))) * 1.05; } } return 0; }
    // 앞 구간에서 지난 공정에 따라 틀 색: 응고제 → 니트릴(파랑) → 탈형 후 다시 세라믹
    function coatAt(x, seg) {
      if (seg !== 0) return 0;
      if (x > 7.3) return 0; if (x > -1.4) return 2; if (x > -6.6) return 1; return 0;
    }

    const P = new THREE.Vector3(), cur = Object.assign({ t: [0, 2, 0], size: 10, fx: 0.5, fy: 0.5 }, opts.view || {});
    let visible = true; new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(container);
    function resize() { const w = container.clientWidth, h = container.clientHeight; renderer.setSize(w, h, false); renderer.domElement.style.width = w + 'px'; renderer.domElement.style.height = h + 'px'; }
    addEventListener('resize', resize); resize(); if (window.ResizeObserver) new ResizeObserver(resize).observe(container);
    const clock = new THREE.Clock(), reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, tmpM = new THREE.Matrix4();
    const state = { speed: 1 }; let tt = 0, last = 0;

    (function loop() {
      requestAnimationFrame(loop);
      if (!visible) return;
      const now = clock.getElapsedTime(), dt = Math.min(0.1, now - last); last = now;
      tt += reduce ? 0 : dt * state.speed;
      const w = container.clientWidth, h = container.clientHeight, asp = w / h;
      const drift = opts.drift ? Math.sin(tt * 0.06) * opts.drift : 0;
      const W = cur.size * asp; cam.left = -cur.fx * W; cam.right = (1 - cur.fx) * W; cam.top = cur.fy * cur.size; cam.bottom = -(1 - cur.fy) * cur.size; cam.updateProjectionMatrix();
      const tg = new THREE.Vector3(cur.t[0] + drift, cur.t[1], cur.t[2]); cam.position.copy(tg).addScaledVector(camDir, 60); cam.lookAt(tg);

      const base = tt * 0.9;
      for (let i = 0; i < NF; i++) {
        const seg = chainAt(base + i * LOOP / NF, P), x = P.x, dip = seg === 0 ? dipAt(x) : 0;
        _o.position.set(P.x, P.y - 0.63 - dip, P.z); _o.rotation.set(0, 0, 0); _o.scale.set(1, 1, 1);
        if (seg === 0) _o.rotation.z = -Math.sin(tt * 2 + i) * 0.03;
        _o.updateMatrix(); formers.setMatrixAt(i, _o.matrix);
        const c = coatAt(x, seg); formers.setColorAt(i, c === 2 ? nitrile : c === 1 ? coag : ceramic);
      }
      formers.instanceMatrix.needsUpdate = true; formers.instanceColor.needsUpdate = true;
      // 탈형: 틀이 7.3 지점을 지날 때마다 장갑 한 켤레가 통으로 날아간다
      {
        const k = ((base - (7.3 - XL)) / (LOOP / NF) % 1 + 1) % 1;
        _o.position.set(7.3 + k * 0.9, 2.4 + Math.sin(k * PI) * 0.7 - k * 1.4, ZF + k * 1.8);
        _o.rotation.set(k * 2.4, k * 1.3, -k * 1.2); _o.scale.set(1 - k * 0.5, 1 - k * 0.5, 1 - k * 0.8); _o.updateMatrix(); flying.setMatrixAt(0, _o.matrix);
      }
      flying.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < NBX; i++) { const u = ((tt * 0.12 + i / NBX) % 1); _o.position.set(9.1 + u * 3.4, 1.0, 3.2); _o.rotation.set(0, 0, 0); _o.scale.set(1, 1, 1); _o.updateMatrix(); boxes.setMatrixAt(i, _o.matrix); }
      boxes.instanceMatrix.needsUpdate = true;
      ovenGlow.emissiveIntensity = 0.85 + Math.sin(tt * 3) * 0.08;

      renderer.render(scene, cam);
    })();

    return { setSpeed(v) { gsap.to(state, { speed: v, duration: 0.6 }); } };
  }

  window.GloveLine = { mount };
})();
