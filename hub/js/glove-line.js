/* 아이소메트릭 니트릴 장갑 딥핑 라인
   틀 세척(산 · 알칼리 · 브러시 · 온수) → 응고제 → 건조 → 니트릴 2회 → 겔화 → 예비 세척 → 비딩 → 경화 오븐 → 후 세척 → 공기 탈형
   → 검사대 → 자동 포장 → 팔레트. 뒤쪽은 배합실(라텍스 · 교반 탱크 · 칠러)과 배관 랙.
   필요: three r147 + examples/js BufferGeometryUtils · RoomEnvironment
   GloveLine.mount(container, { view: { t: [x, y, z], size, fx, fy }, drift }) */
(function () {
  const PI = Math.PI;
  const ss = u => u * u * (3 - 2 * u);
  const fr = v => v - Math.floor(v);
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
    Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 18, bottom: -18, near: 1, far: 80 });
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02;
    scene.add(sun);

    // ── 재질
    const defs = {
      concrete: [0x8A9198, 0.95, 0], lane: [0xD8A12C, 0.8, 0], laneW: [0xC9CDD1, 0.8, 0], steel: [0x59636E, 0.5, 0.55], steelDk: [0x353B43, 0.55, 0.5],
      steelLt: [0x9AA4AE, 0.35, 0.7], stainless: [0xB9C1C9, 0.28, 0.85], yellow: [0xD7981F, 0.55, 0.2], blue: [0x3F5E7C, 0.55, 0.3],
      trim: [0x2C5FC9, 0.5, 0.2], oven: [0xC3C9CF, 0.55, 0.35], panel: [0xD9DDE1, 0.6, 0.1], machine: [0xE4E7EA, 0.5, 0.1],
      black: [0x15171A, 0.7, 0.1], pallet: [0x9C7B55, 0.9, 0], wrap: [0xDDE3E8, 0.3, 0.1], rubber: [0x24272B, 0.85, 0]
    };
    const MAT = {
      lamp: new THREE.MeshStandardMaterial({ color: 0x0A1A0E, emissive: 0x37E07A, emissiveIntensity: 1.3, roughness: 1, envMapIntensity: 0 }),
      lampR: new THREE.MeshStandardMaterial({ color: 0x1A0A0A, emissive: 0xFF5A3A, emissiveIntensity: 1.1, roughness: 1, envMapIntensity: 0 }),
      light: new THREE.MeshStandardMaterial({ color: 0xE8F2FF, emissive: 0xDCEBFF, emissiveIntensity: 0.75, roughness: 0.4, envMapIntensity: 0 }),
      glass: new THREE.MeshStandardMaterial({ color: 0x1C2A36, roughness: 0.08, metalness: 0.4, envMapIntensity: 1 })
    };
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
    const dome = (r, k, x, y, z) => add(new THREE.SphereGeometry(r, 20, 8, 0, PI * 2, 0, PI / 2), k, x, y, z);
    function hcol(k, x, z, y0, y1, s = 0.22) { const h = y1 - y0, c = (y0 + y1) / 2; box(s, h, 0.04, k, x, c, z + s / 2); box(s, h, 0.04, k, x, c, z - s / 2); box(0.04, h, s, k, x, c, z); }
    function beam(k, a, c, t = 0.12, t2) {
      const len = Math.hypot(c[0] - a[0], c[1] - a[1], c[2] - a[2]), g = new THREE.BoxGeometry(t, t2 || t, len);
      _o2.position.set((a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2); _o2.lookAt(c[0], c[1], c[2]); _o2.updateMatrix(); g.applyMatrix4(_o2.matrix); add(g, k);
    }
    // 배관: 점들을 잇는 원통 + 꺾이는 곳 이음쇠
    function pipe(pts, r, k) {
      for (let i = 0; i < pts.length - 1; i++) {
        const a = new THREE.Vector3(...pts[i]), c = new THREE.Vector3(...pts[i + 1]), len = a.distanceTo(c);
        const g = new THREE.CylinderGeometry(r, r, len, 8); g.rotateX(PI / 2);
        _o2.position.copy(a).add(c).multiplyScalar(0.5); _o2.lookAt(c); _o2.updateMatrix(); g.applyMatrix4(_o2.matrix); add(g, k);
        if (i > 0) add(new THREE.SphereGeometry(r * 1.3, 8, 6), k, ...pts[i]);
      }
    }
    function railing(pts, y, h = 0.8) {
      for (let i = 0; i < pts.length - 1; i++) {
        const [x1, z1] = pts[i], [x2, z2] = pts[i + 1];
        beam('yellow', [x1, y + h, z1], [x2, y + h, z2], 0.045); beam('yellow', [x1, y + h / 2, z1], [x2, y + h / 2, z2], 0.035);
        const n = Math.max(1, Math.round(Math.hypot(x2 - x1, z2 - z1) / 1.1));
        for (let k = 0; k <= n; k++) { const u = k / n; box(0.045, h, 0.045, 'yellow', x1 + (x2 - x1) * u, y + h / 2, z1 + (z2 - z1) * u); }
      }
    }
    function ctrlPanel(x, z, red) {
      box(0.55, 1.15, 0.3, 'panel', x, 0.6, z); box(0.57, 0.06, 0.32, 'steelDk', x, 1.2, z);
      box(0.32, 0.22, 0.02, 'glass', x - 0.05, 0.92, z + 0.16);
      box(0.06, 0.06, 0.02, 'lamp', x + 0.18, 0.95, z + 0.16); box(0.06, 0.06, 0.02, red ? 'lampR' : 'lamp', x + 0.18, 0.84, z + 0.16);
      beam('steelDk', [x, 0.3, z - 0.15], [x, 0.3, z - 0.75], 0.05);
    }

    // ── 바닥 · 통로 표시
    box(28.5, 0.5, 11.6, 'concrete', 0.4, -0.25, -0.9);
    box(28.5, 0.02, 0.12, 'lane', 0.4, 0.01, 4.65);
    box(25.5, 0.02, 0.08, 'lane', -0.2, 0.01, 1.75);
    box(25.5, 0.02, 0.08, 'laneW', -0.2, 0.01, -2.75);
    for (let x = -12.6; x < 12.6; x += 0.8) box(0.38, 0.02, 0.12, 'lane', x, 0.012, 1.95, 0, 0.6, 0);

    // ── 오버헤드 체인 레일 (앞 · 뒤 · 양 끝 반원)
    const RAIL_Y = 4.3, ZF = 0, ZB = -1.8, XL = -12.2, XR = 12.2, R = (ZF - ZB) / 2, ZC = (ZF + ZB) / 2;
    beam('steelDk', [XL, RAIL_Y + 0.1, ZF], [XR, RAIL_Y + 0.1, ZF], 0.14, 0.2);
    beam('steelDk', [XL, RAIL_Y + 0.1, ZB], [XR, RAIL_Y + 0.1, ZB], 0.14, 0.2);
    for (let k = 0; k < 8; k++) {
      const a0 = k / 8 * PI, a1 = (k + 1) / 8 * PI;
      beam('steelDk', [XR + Math.sin(a0) * R, RAIL_Y + 0.1, ZC + Math.cos(a0) * R], [XR + Math.sin(a1) * R, RAIL_Y + 0.1, ZC + Math.cos(a1) * R], 0.14, 0.2);
      beam('steelDk', [XL - Math.sin(a0) * R, RAIL_Y + 0.1, ZC - Math.cos(a0) * R], [XL - Math.sin(a1) * R, RAIL_Y + 0.1, ZC - Math.cos(a1) * R], 0.14, 0.2);
    }
    // 구동 스프로킷 (양 끝)
    [[XR, 1], [XL, -1]].forEach(([x]) => { cyl(R - 0.05, 0.12, 'steel', x, RAIL_Y + 0.28, ZC, 0, 0, 0, 24); box(0.5, 0.5, 0.5, 'trim', x, RAIL_Y + 0.6, ZC); });
    // 앞쪽 기둥은 빼고 뒤 기둥에서 내민 보로 레일을 건다 (손 모양 틀을 가리지 않게)
    for (let x = XL + 0.8; x < XR; x += 2.6) { hcol('steel', x, ZB - 0.5, 0, RAIL_Y + 0.4); beam('steel', [x, RAIL_Y + 0.4, ZB - 0.5], [x, RAIL_Y + 0.4, ZF], 0.16, 0.2); }

    // ── 담금조 (x0~x1: 틀이 완전히 잠기는 구간)
    const DIP = [
      { x0: -11.2, x1: -10.6, liquid: 0xE6D98E, name: 'acid' },
      { x0: -9.4, x1: -8.8, liquid: 0xD3E6DC, name: 'alkali' },
      { x0: -6.9, x1: -6.4, liquid: 0x9FCFE0, name: 'rinse', steam: true },
      { x0: -5.1, x1: -4.4, liquid: 0xE4E6E0, name: 'coag', drip: 0xE9ECE6 },
      { x0: -1.4, x1: -0.6, liquid: 0x2F5FC4, name: 'nitrile1', drip: 0x3D6FD6, feed: true },
      { x0: 0.6, x1: 1.4, liquid: 0x2A55B8, name: 'nitrile2', drip: 0x2F62CF, feed: true },
      { x0: 3.9, x1: 4.4, liquid: 0x8EC3D6, name: 'preleach', steam: true },
      { x0: 10.2, x1: 10.7, liquid: 0x8EC3D6, name: 'postleach', steam: true }
    ];
    const EDGE = 0.6, TM = 0.4;
    const liquidMats = [];
    DIP.forEach((d, i) => {
      const w = d.x1 - d.x0 + 2 * TM, cx = (d.x0 + d.x1) / 2;
      d.cx = cx; d.w = w;
      box(w, 1.5, 1.3, 'stainless', cx, 0.75, ZF);
      box(w + 0.08, 0.08, 1.38, 'steelLt', cx, 1.52, ZF);
      for (let k = -1; k <= 1; k += 2) box(0.05, 1.45, 1.34, 'steelLt', cx + k * w * 0.25, 0.73, ZF); // 보강 리브
      box(w - 0.1, 0.12, 0.16, 'stainless', cx, 1.36, ZF + 0.73); // 넘침 홈통
      cyl(0.05, 0.6, 'steelLt', cx + w / 2 - 0.15, 1.05, ZF + 0.73, 0, 0, 0, 8);
      [-1, 1].forEach(sx => [-1, 1].forEach(sz => box(0.1, 0.12, 0.1, 'steelDk', cx + sx * (w / 2 - 0.1), 0.06, ZF + sz * 0.55)));
      const lm = new THREE.MeshStandardMaterial({ color: d.liquid, roughness: 0.12, metalness: 0.1, envMapIntensity: 0.85 });
      const surf = new THREE.Mesh(new THREE.BoxGeometry(w - 0.12, 0.04, 1.18), lm); surf.position.set(cx, 1.44, ZF); surf.receiveShadow = true; scene.add(surf); liquidMats.push(lm);
      if (d.feed) { // 니트릴 순환: 배관 랙에서 내려와 조 뒤로 들어간다
        pipe([[cx - 0.3, 2.9, -3.1], [cx - 0.3, 1.0, -3.1], [cx - 0.3, 1.0, -0.66]], 0.06, 'trim');
        pipe([[cx + 0.3, 0.35, -0.66], [cx + 0.3, 0.35, -3.1], [cx + 0.3, 2.7, -3.1]], 0.05, 'steelLt');
        box(0.4, 0.35, 0.35, 'trim', cx + 0.3, 0.18, -1.9); cyl(0.12, 0.3, 'steel', cx + 0.3, 0.3, -1.6, PI / 2, 0, 0, 10);
      }
      if (d.steam) { cyl(0.04, 1.2, 'steelLt', cx - w / 2 + 0.2, 0.9, ZF - 0.72, 0, 0, 0, 6); box(0.25, 0.2, 0.2, 'yellow', cx - w / 2 + 0.2, 0.25, ZF - 0.75); }
    });

    // ── 브러시 세척 (회전하는 세로 롤러 한 쌍)
    const stripeTex = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 8; const x = c.getContext('2d'); x.fillStyle = '#D7981F'; x.fillRect(0, 0, 64, 8); x.fillStyle = '#8A5E10'; for (let i = 0; i < 8; i++) x.fillRect(i * 8, 0, 3, 8); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.wrapS = THREE.RepeatWrapping; t.repeat.set(2, 1); return t; })();
    const brushMat = new THREE.MeshStandardMaterial({ map: stripeTex, roughness: 0.9, envMapIntensity: 0.2 });
    const rollers = [];
    function roller(r, h, x, y, z, axis) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 16), brushMat);
      const pivot = new THREE.Group(); pivot.position.set(x, y, z);
      if (axis === 'x') pivot.rotation.z = PI / 2;
      pivot.add(m); m.castShadow = true; scene.add(pivot); rollers.push(m);
    }
    roller(0.12, 1.3, -7.9, 2.85, 0.27); roller(0.12, 1.3, -7.9, 2.85, -0.27);
    box(0.2, 0.1, 1.36, 'steel', -7.9, 3.55, ZF); [0.42, -0.42].forEach(z => { box(0.1, 3.5, 0.1, 'steel', -7.9, 1.75, z * 1.5); box(0.3, 0.3, 0.3, 'trim', -7.9, 3.7, z * 1.5); });
    box(0.9, 0.3, 1.0, 'stainless', -7.9, 0.15, ZF);
    // 비딩: 손목 끝을 말아 주는 가로 롤러 한 쌍
    roller(0.08, 0.9, 5.3, 3.2, 0.2, 'x'); roller(0.08, 0.9, 5.3, 3.2, -0.2, 'x');
    hcol('steel', 5.3, 0.55, 0, 3.4, 0.14); beam('steel', [5.3, 3.4, 0.55], [5.3, 3.4, -0.3], 0.1); box(0.35, 0.3, 0.3, 'trim', 5.3, 3.55, 0.55);

    // ── 오븐 (건조 · 겔화 · 경화) — 틀이 통과하는 단열 터널
    const glowMats = [];
    function oven(x0, x1, stacks) {
      const w = x1 - x0, cx = (x0 + x1) / 2;
      box(w, 2.1, 1.4, 'oven', cx, 3.0, ZF);
      box(w + 0.1, 0.12, 1.5, 'steelDk', cx, 4.1, ZF);
      box(w + 0.02, 0.18, 1.42, 'trim', cx, 2.15, ZF);
      for (let x = x0 + 0.4; x < x1 - 0.2; x += 0.45) box(0.04, 1.7, 0.04, 'steelLt', x, 3.1, ZF + 0.72);
      box(Math.min(0.8, w * 0.4), 0.35, 0.03, 'glass', cx, 3.35, ZF + 0.72);
      [x0 + 0.2, x1 - 0.2].forEach(x => hcol('steel', x, ZF + 0.85, 0, 2.0, 0.16));
      [x0 + 0.2, x1 - 0.2].forEach(x => hcol('steel', x, ZF - 0.85, 0, 2.0, 0.16));
      box(0.6, 0.8, 0.5, 'steel', cx, 3.0, ZF - 0.95); cyl(0.1, 0.5, 'yellow', cx + 0.2, 3.4, ZF - 1.25, PI / 2, 0, 0, 8); // 버너
      const gm = new THREE.MeshStandardMaterial({ color: 0x120400, emissive: 0xFF6A1A, emissiveIntensity: 0.9, roughness: 1, envMapIntensity: 0 });
      [x0 - 0.01, x1 + 0.01].forEach(x => { const g = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.5, 1.1), gm); g.position.set(x, 3.0, ZF); scene.add(g); });
      glowMats.push(gm);
      (stacks || []).forEach(x => { cyl(0.16, 1.6, 'steelLt', x, 4.9, ZF - 0.3, 0, 0, 0, 12); cyl(0.2, 0.1, 'steelDk', x, 5.7, ZF - 0.3, 0, 0, 0, 12); });
    }
    oven(-3.6, -2.2, [-2.9]);
    oven(2.1, 3.1, []);
    oven(5.8, 9.4, [6.6, 8.6]);
    beam('steelLt', [6.6, 4.6, -0.3], [8.6, 4.6, -0.3], 0.14); // 배기 헤더

    // ── 공기 탈형 (노즐 매니폴드) → 받는 통
    box(0.15, 0.15, 1.1, 'steelDk', 11.4, 2.5, ZF + 0.05);
    for (let k = 0; k < 4; k++) cyl(0.03, 0.25, 'steelLt', 11.4, 2.35, ZF - 0.35 + k * 0.25, PI / 2 + 0.6, 0, 0, 6);
    hcol('steel', 11.4, ZF + 0.75, 0, 2.6, 0.14); beam('steel', [11.4, 2.6, ZF + 0.75], [11.4, 2.6, ZF - 0.55], 0.1);
    pipe([[11.4, 2.5, -0.55], [11.4, 2.5, -1.2], [11.4, 0.2, -1.2]], 0.04, 'steelLt'); box(0.5, 0.4, 0.4, 'trim', 11.4, 0.2, -1.5);
    box(1.3, 0.8, 1.0, 'trim', 12.2, 0.4, 1.9); box(1.2, 0.05, 0.9, 'steelDk', 12.2, 0.81, 1.9); // 받는 통
    box(0.9, 0.05, 0.8, 'stainless', 11.85, 1.6, 1.15, 0.5, 0, 0); // 미끄럼판

    // ── 검사대 (라이트 테이블)
    box(1.5, 0.06, 0.9, 'steelLt', 10.3, 0.9, 2.7); box(1.36, 0.02, 0.76, 'light', 10.3, 0.94, 2.7);
    [[-0.68, -0.38], [0.68, -0.38], [-0.68, 0.38], [0.68, 0.38]].forEach(([dx, dz]) => box(0.05, 0.88, 0.05, 'steel', 10.3 + dx, 0.44, 2.7 + dz));
    box(0.05, 0.9, 0.9, 'steel', 9.6, 1.35, 2.7); box(0.04, 0.12, 0.8, 'light', 9.62, 1.75, 2.7);

    // ── 자동 계수 · 포장기
    box(1.6, 1.4, 1.1, 'machine', 8.4, 0.7, 2.9); box(1.62, 0.2, 1.12, 'trim', 8.4, 1.1, 2.9);
    box(0.9, 0.5, 0.02, 'glass', 8.5, 0.7, 3.46); box(0.06, 0.06, 0.02, 'lamp', 9.0, 1.3, 3.46);
    add(new THREE.CylinderGeometry(0.4, 0.12, 0.45, 4), 'stainless', 8.7, 1.62, 2.9, 0, PI / 4, 0); // 투입 호퍼
    box(0.35, 0.8, 0.35, 'panel', 9.4, 0.4, 3.4); box(0.3, 0.2, 0.02, 'glass', 9.4, 0.65, 3.58);
    // 상자 컨베이어 (포장기 → 팔레트)
    const CV0 = 3.5, CV1 = 7.6, CVZ = 2.9;
    beam('steelDk', [CV0, 0.8, CVZ - 0.3], [CV1, 0.8, CVZ - 0.3], 0.08, 0.12); beam('steelDk', [CV0, 0.8, CVZ + 0.3], [CV1, 0.8, CVZ + 0.3], 0.08, 0.12);
    for (let x = CV0 + 0.1; x < CV1; x += 0.25) cyl(0.045, 0.58, 'steelLt', x, 0.86, CVZ, PI / 2, 0, 0, 8);
    for (let x = CV0 + 0.2; x < CV1; x += 1.0) { box(0.06, 0.75, 0.06, 'steel', x, 0.38, CVZ - 0.3); box(0.06, 0.75, 0.06, 'steel', x, 0.38, CVZ + 0.3); }

    // ── 제어반 · 통로
    [[-9.9, 1.2], [-4.75, 1.2], [0.0, 1.2], [4.15, 1.2, 1], [7.6, 1.2], [10.9, 1.2]].forEach(([x, z, r]) => ctrlPanel(x, z, r));
    // 라인 뒤 점검 통로 (앞 구간과 귀환 구간 사이)
    const CWY = 1.3;
    box(23.4, 0.06, 0.5, 'steel', -0.3, CWY, -1.05);
    for (let x = -11.8; x <= 11.4; x += 1.8) { box(0.06, CWY, 0.06, 'steel', x, CWY / 2, -0.85); box(0.06, CWY, 0.06, 'steel', x, CWY / 2, -1.25); }
    railing([[-12.0, -1.3], [11.4, -1.3]], CWY);
    for (let k = 0; k < 6; k++) box(0.5, 0.06, 0.3, 'steel', -12.25 - k * 0.22, CWY - (k + 1) * (CWY / 7), -1.05); // 계단
    railing([[-9.6, 1.6], [-9.6, 4.2]], 0);

    // ── 배관 랙 (배합실 → 라인)
    const PRZ = -3.1;
    for (let x = -11.2; x <= 9.6; x += 2.6) { hcol('steel', x, PRZ, 0, 3.1, 0.14); beam('steel', [x, 3.1, PRZ - 0.25], [x, 3.1, PRZ + 0.25], 0.08); }
    pipe([[-11.4, 2.9, PRZ], [9.8, 2.9, PRZ]], 0.07, 'trim');
    pipe([[-11.4, 2.7, PRZ], [9.8, 2.7, PRZ]], 0.06, 'steelLt');
    pipe([[-11.4, 3.25, PRZ + 0.1], [9.8, 3.25, PRZ + 0.1]], 0.05, 'yellow');
    // 응고제 공급
    pipe([[-4.75, 2.7, PRZ], [-4.75, 0.9, PRZ], [-4.75, 0.9, -0.66]], 0.05, 'steelLt');
    // 온수 · 세척수 공급
    [-10.9, -9.1, -6.65, 4.15, 10.45].forEach(x => pipe([[x, 3.25, PRZ + 0.1], [x, 0.7, PRZ + 0.1], [x, 0.7, -0.66]], 0.04, 'yellow'));

    // ── 배합실 (라텍스 저장 · 교반 · 칠러 · 보일러)
    const CZ = -4.7;
    box(16.5, 0.03, 3.0, 'laneW', -3.6, 0.01, CZ);
    [-11.0, -9.2].forEach(x => { // 라텍스 저장 탱크
      cyl(0.75, 3.0, 'stainless', x, 1.5, CZ, 0, 0, 0, 24); dome(0.75, 'stainless', x, 3.0, CZ);
      for (let k = 0; k < 4; k++) { const a = k / 4 * PI * 2 + PI / 4; box(0.08, 0.5, 0.08, 'steelDk', x + Math.cos(a) * 0.65, 0.25, CZ + Math.sin(a) * 0.65); }
      box(0.04, 3.0, 0.3, 'yellow', x + 0.78, 1.6, CZ + 0.2);
      for (let y = 0.3; y < 3.0; y += 0.3) box(0.04, 0.03, 0.3, 'yellow', x + 0.8, y, CZ + 0.2);
      pipe([[x, 0.4, CZ + 0.75], [x, 0.4, CZ + 1.3], [-6.8, 0.4, CZ + 1.3]], 0.05, 'steelLt');
    });
    const agitators = [];
    [-6.4, -4.8, -3.2].forEach(x => { // 교반 탱크 + 모터
      cyl(0.6, 1.8, 'stainless', x, 0.9, CZ, 0, 0, 0, 22); cyl(0.62, 0.06, 'steelLt', x, 1.82, CZ, 0, 0, 0, 22);
      box(1.5, 0.08, 0.3, 'steel', x, 1.9, CZ); box(0.32, 0.42, 0.32, 'trim', x, 2.2, CZ); cyl(0.12, 0.2, 'steelDk', x, 2.5, CZ, 0, 0, 0, 10);
      const sh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.04), getMat('steelLt')); sh.position.set(x, 1.95, CZ); scene.add(sh); agitators.push(sh);
      pipe([[x, 0.25, CZ + 0.6], [x, 0.25, CZ + 1.0], [x, 2.7, CZ + 1.0], [x, 2.7, PRZ]], 0.045, 'trim');
    });
    railing([[-7.3, CZ - 1.0], [-2.3, CZ - 1.0]], 0);
    // 칠러 (팬 3개)
    box(2.2, 1.1, 1.1, 'blue', -0.6, 0.55, CZ); box(2.22, 0.06, 1.12, 'steelDk', -0.6, 1.12, CZ);
    const fans = [];
    [-1.3, -0.6, 0.1].forEach(x => { cyl(0.28, 0.08, 'black', x, 1.17, CZ, 0, 0, 0, 16); const f = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.02, 0.08), getMat('steelLt')); f.position.set(x, 1.23, CZ); scene.add(f); fans.push(f); });
    for (let x = -1.6; x < 0.5; x += 0.15) box(0.03, 0.8, 0.02, 'steelDk', x, 0.5, CZ + 0.56);
    pipe([[0.3, 0.8, CZ + 0.55], [0.3, 0.8, CZ + 1.2], [0.3, 2.9, CZ + 1.2], [0.3, 2.9, PRZ]], 0.05, 'steelLt');
    // 온수 보일러 (가로 원통)
    cyl(0.55, 2.2, 'steelLt', 3.4, 0.75, CZ, 0, 0, PI / 2, 20); [2.3, 4.5].forEach(x => cyl(0.56, 0.05, 'trim', x, 0.75, CZ, 0, 0, PI / 2, 20));
    box(0.3, 0.2, 1.0, 'steelDk', 2.7, 0.1, CZ); box(0.3, 0.2, 1.0, 'steelDk', 4.1, 0.1, CZ);
    cyl(0.12, 2.6, 'steelLt', 4.6, 1.8, CZ - 0.3, 0, 0, 0, 10);
    pipe([[3.4, 1.3, CZ], [3.4, 3.25, CZ], [3.4, 3.25, PRZ + 0.1]], 0.05, 'yellow');
    // 약품 드럼 · IBC 통
    for (let i = 0; i < 4; i++) cyl(0.22, 0.65, i % 2 ? 'trim' : 'blue', 6.4 + (i % 2) * 0.5, 0.33, CZ - 0.3 + (i >> 1) * 0.5, 0, 0, 0, 14);
    box(0.9, 0.9, 0.9, 'wrap', 7.9, 0.5, CZ); box(0.95, 0.1, 0.95, 'steelDk', 7.9, 0.05, CZ);
    for (let k = -1; k <= 1; k++) { box(0.92, 0.03, 0.03, 'steelDk', 7.9, 0.5 + k * 0.3, CZ + 0.46); box(0.03, 0.9, 0.03, 'steelDk', 7.9 + k * 0.3, 0.5, CZ + 0.46); }

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
    pallet(2.4, CVZ, 6, ['blue']); pallet(0.6, CVZ, 5, ['black', 'blue']); pallet(-1.2, CVZ, 6, ['oat']);
    // 지게차 · 운반 팔레트 — 빈 지게차가 들어가 포장 팔레트를 들고 후진, 다시 들어가 내려놓고 빈 채로 나온다 (loop의 fkAt)
    const FK_X = -5.0, CARGO_X = -3.0;
    const cargo = new THREE.Group(); cargo.position.set(CARGO_X, 0, CVZ); scene.add(cargo);
    { const m = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.14, 1.2), getMat('pallet')); m.position.y = 0.07; m.castShadow = m.receiveShadow = true; cargo.add(m); }
    ['blue', 'oat'].forEach((v, vi) => {
      const pos = [];
      for (let l = 0; l < 5; l++) for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) if ((l + j) % 2 === vi) pos.push([-0.33 + i * 0.66, 0.14 + 0.085 + l * 0.175, -0.36 + j * 0.36]);
      const im = new THREE.InstancedMesh(boxGeo, boxMats[v], pos.length);
      pos.forEach((q, i) => { _o.position.set(...q); _o.rotation.set(0, 0, 0); _o.scale.set(1, 1, 1); _o.updateMatrix(); im.setMatrixAt(i, _o.matrix); });
      im.castShadow = im.receiveShadow = true; cargo.add(im);
    });
    const forklift = new THREE.Group(), forks = new THREE.Group(), fkWheels = [];
    forklift.position.set(FK_X, 0, CVZ); forklift.add(forks); scene.add(forklift);
    const fk = (g, k, x, y, z, parent = forklift) => { const m = new THREE.Mesh(g, getMat(k)); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };
    const fkBox = (w, h, d, k, x, y, z, parent) => fk(new THREE.BoxGeometry(w, h, d), k, x, y, z, parent);
    fkBox(0.9, 0.5, 0.65, 'yellow', 0, 0.45, 0); fkBox(0.5, 0.5, 0.6, 'yellow', -0.2, 0.95, 0); fkBox(0.52, 0.04, 0.62, 'black', -0.2, 1.5, 0);
    [[-0.55, 0.3], [-0.55, -0.3], [0.55, 0.3], [0.55, -0.3]].forEach(([a, b]) => fkBox(0.04, 0.6, 0.04, 'black', -0.2 + a * 0.45, 1.2, b));
    fkBox(0.08, 1.6, 0.5, 'steelDk', 0.5, 0.8, 0);
    fkBox(0.06, 0.4, 0.46, 'steelDk', 0.57, 0.3, 0, forks); fkBox(0.9, 0.04, 0.1, 'steelDk', 1.0, 0.1, -0.2, forks); fkBox(0.9, 0.04, 0.1, 'steelDk', 1.0, 0.1, 0.2, forks);
    [[-0.35, -0.32], [-0.35, 0.32], [0.3, -0.32], [0.3, 0.32]].forEach(([x, z]) => { const g = new THREE.CylinderGeometry(0.14, 0.14, 0.1, 12); g.rotateX(PI / 2); fkWheels.push(fk(g, 'rubber', x, 0.14, z)); });
    // 구간: [초, 지게차 x(FK_X 기준), 포크 높이, 팔레트를 들고 있나]. 각 구간 끝 값으로 보간
    const FK_IN = (CARGO_X - 0.75) - (FK_X + 0.6), FK_OUT = -2.0, LIFT = 0.22;
    const FK_KEYS = [
      [1.5, FK_OUT, 0, 0],  // 빈 채로 대기
      [3.0, FK_IN, 0, 0],   // 팔레트 밑으로 진입
      [1.0, FK_IN, LIFT, 1], // 들어 올림
      [3.2, FK_OUT, LIFT, 1], // 들고 후진
      [1.5, FK_OUT, LIFT, 1],
      [3.2, FK_IN, LIFT, 1], // 다시 진입
      [1.0, FK_IN, 0, 1],    // 내려놓음
      [3.0, FK_OUT, 0, 0]    // 빈 채로 후진
    ];
    const FK_T = FK_KEYS.reduce((t, k) => t + k[0], 0);
    function fkAt(t) {
      let r = fr(t / FK_T) * FK_T, prev = FK_KEYS[FK_KEYS.length - 1];
      for (const k of FK_KEYS) {
        if (r < k[0]) { const u = ss(r / k[0]); return { x: prev[1] + (k[1] - prev[1]) * u, lift: prev[2] + (k[2] - prev[2]) * u, carry: k[3] }; }
        r -= k[0]; prev = k;
      }
      return { x: prev[1], lift: prev[2], carry: prev[3] };
    }

    Object.keys(lists).forEach(k => {
      const mesh = new THREE.Mesh(THREE.BufferGeometryUtils.mergeBufferGeometries(lists[k]), getMat(k));
      mesh.castShadow = k !== 'concrete' && k !== 'lane' && k !== 'laneW' && k !== 'light'; mesh.receiveShadow = true; scene.add(mesh);
    });

    // ── 손 모양 틀 (손목이 위, 손가락이 아래)
    function handGeo(withRod) {
      const parts = [];
      const put = (g, x, y, z, rz = 0, sx = 1, sz = 1) => { g.scale(sx, 1, sz); g.rotateZ(rz); g.translate(x, y, z); parts.push(g.index ? g.toNonIndexed() : g); };
      if (withRod) { put(new THREE.CylinderGeometry(0.025, 0.025, 0.42, 6), 0, 0.21, 0); put(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 10), 0, 0.03, 0); }
      put(new THREE.CylinderGeometry(0.12, 0.14, 0.55, 14), 0, -0.27, 0, 0, 1, 0.62);
      put(new THREE.CapsuleGeometry(0.16, 0.16, 4, 12), 0, -0.7, 0, 0, 1.05, 0.42);
      [[-0.12, 0.17], [-0.04, 0.21], [0.04, 0.2], [0.12, 0.15]].forEach(([x, l]) => put(new THREE.CapsuleGeometry(0.045, l, 3, 8), x, -0.92 - l / 2, 0));
      put(new THREE.CapsuleGeometry(0.05, 0.14, 3, 8), 0.2, -0.78, 0.02, 0.55);
      parts.forEach(g => Object.keys(g.attributes).forEach(a => { if (a !== 'position' && a !== 'normal' && a !== 'uv') g.deleteAttribute(a); }));
      const g = THREE.BufferGeometryUtils.mergeBufferGeometries(parts); g.scale(1.5, 1.5, 1.5); return g;
    }
    const LOOP = 2 * (XR - XL) + 2 * PI * R, NF = lowPower ? 18 : 22;
    const formers = new THREE.InstancedMesh(handGeo(true), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, metalness: 0.05, envMapIntensity: 0.45 }), NF);
    formers.castShadow = true; scene.add(formers);
    const ceramic = new THREE.Color(0xEAE6DF), wet = new THREE.Color(0xF4F1EA), coag = new THREE.Color(0xDCDFD8), nitLt = new THREE.Color(0x6E95E6), nitrile = new THREE.Color(0x2F6BE0), cured = new THREE.Color(0x3A68C9);
    // 날아가는 장갑 + 통 안 · 검사대 위 장갑
    const NG = 1, flying = new THREE.InstancedMesh(handGeo(false), new THREE.MeshStandardMaterial({ color: 0x3D6FD6, roughness: 0.5, envMapIntensity: 0.4 }), NG); flying.castShadow = true; scene.add(flying);
    const pileN = 14, pile = new THREE.InstancedMesh(handGeo(false), new THREE.MeshStandardMaterial({ color: 0x3D6FD6, roughness: 0.55, envMapIntensity: 0.4 }), pileN);
    for (let i = 0; i < pileN; i++) {
      if (i < 10) { _o.position.set(11.75 + hash(i) * 0.9, 0.84 + hash(i + 7) * 0.08, 1.6 + hash(i + 3) * 0.6); _o.rotation.set(PI / 2 + (hash(i + 9) - 0.5) * 0.6, hash(i + 11) * PI * 2, (hash(i + 5) - 0.5) * 0.8); _o.scale.set(0.5, 0.5, 0.2); }
      else { const j = i - 10; _o.position.set(9.85 + (j % 4) * 0.3, 0.97, 2.5 + (j >> 2) * 0.4); _o.rotation.set(-PI / 2, 0, PI / 2 + (hash(j) - 0.5) * 0.3); _o.scale.set(0.45, 0.45, 0.15); }
      _o.updateMatrix(); pile.setMatrixAt(i, _o.matrix);
    }
    pile.castShadow = true; scene.add(pile);
    Object.keys(stacks).forEach(v => {
      const im = new THREE.InstancedMesh(boxGeo, boxMats[v], stacks[v].length);
      stacks[v].forEach((p, i) => { _o.position.set(...p); _o.rotation.set(0, 0, 0); _o.scale.set(1, 1, 1); _o.updateMatrix(); im.setMatrixAt(i, _o.matrix); });
      im.castShadow = true; im.receiveShadow = true; scene.add(im);
    });
    const NBX = 5, boxes = new THREE.InstancedMesh(boxGeo, boxMats.blue, NBX); boxes.castShadow = true; scene.add(boxes);

    // ── 입자 (니트릴 · 응고제 방울 · 김 · 오븐 배기 · 탈형 공기)
    const smokeTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
    function stream(n, color, size, extra) {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      const m = new THREE.PointsMaterial(Object.assign({ color, size, sizeAttenuation: false }, extra || {}));
      const p = new THREE.Points(g, m); p.frustumCulled = false; scene.add(p); return p;
    }
    const dripSites = DIP.filter(d => d.drip);
    const drips = dripSites.map(d => stream(14, d.drip, 2.6));
    const steamSites = DIP.filter(d => d.steam);
    const steam = stream(18 * steamSites.length, 0xEEF3F7, 24, { map: smokeTex, transparent: true, opacity: 0.2, depthWrite: false });
    const stackPts = [6.6, 8.6, -2.9];
    const exhaust = stream(14 * stackPts.length, 0xD3D8DD, 20, { map: smokeTex, transparent: true, opacity: 0.16, depthWrite: false });
    const air = stream(24, 0xFFFFFF, 2.2, { transparent: true, opacity: 0.75 });

    // 체인 경로: s → 앞 구간(왼→오) · 오른쪽 반원 · 뒤 구간(오→왼) · 왼쪽 반원
    const L1 = XR - XL, A = PI * R;
    function chainAt(s, out) {
      s = ((s % LOOP) + LOOP) % LOOP;
      if (s < L1) return out.set(XL + s, RAIL_Y, ZF), 0;
      s -= L1; if (s < A) { const a = s / R; return out.set(XR + Math.sin(a) * R, RAIL_Y, ZC + Math.cos(a) * R), 1; }
      s -= A; if (s < L1) return out.set(XR - s, RAIL_Y, ZB), 2;
      s -= L1; const a = s / R; return out.set(XL - Math.sin(a) * R, RAIL_Y, ZC - Math.cos(a) * R), 3;
    }
    function dipAt(x) {
      for (const d of DIP) if (x > d.x0 - EDGE && x < d.x1 + EDGE) {
        const u = x < d.x0 ? (x - d.x0 + EDGE) / EDGE : x > d.x1 ? (d.x1 + EDGE - x) / EDGE : 1;
        return ss(Math.max(0, Math.min(1, u))) * 1.05;
      }
      return 0;
    }
    // 앞 구간에서 지난 공정에 따라 틀 색: 세척(젖음) → 응고제 → 니트릴 1차(연파랑) → 2차 → 경화 → 탈형 후 다시 세라믹
    function coatAt(x, seg) {
      if (seg !== 0) return ceramic;
      if (x > 11.5) return ceramic; if (x > 9.4) return cured; if (x > 1.4) return nitrile; if (x > -0.6) return nitLt;
      if (x > -4.4) return coag; if (x > -10.6) return wet; return ceramic;
    }

    const P = new THREE.Vector3(), cur = Object.assign({ t: [0, 2, 0], size: 10, fx: 0.5, fy: 0.5 }, opts.view || {});
    let visible = true; new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(container);
    function project() { const w = container.clientWidth, h = container.clientHeight, W = cur.size * w / h; cam.left = -cur.fx * W; cam.right = (1 - cur.fx) * W; cam.top = cur.fy * cur.size; cam.bottom = -(1 - cur.fy) * cur.size; cam.updateProjectionMatrix(); }
    // setSize는 캔버스를 지운다 → 칸 크기가 바뀌는 동안 빈 프레임이 깜빡이지 않게 바로 다시 그림
    let started = false;
    function resize() { const w = container.clientWidth, h = container.clientHeight; renderer.setSize(w, h, false); renderer.domElement.style.width = w + 'px'; renderer.domElement.style.height = h + 'px'; if (started) { project(); renderer.render(scene, cam); } }
    addEventListener('resize', resize); resize(); if (window.ResizeObserver) new ResizeObserver(resize).observe(container);
    const clock = new THREE.Clock(), reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const state = { speed: 1 }; let tt = 0, last = 0;
    const SPACING = LOOP / NF, STRIP_X = 11.5;

    (function loop() {
      requestAnimationFrame(loop);
      if (!visible) return;
      const now = clock.getElapsedTime(), dt = Math.min(0.1, now - last); last = now;
      tt += reduce ? 0 : dt * state.speed;
      const drift = opts.drift ? Math.sin(tt * 0.06) * opts.drift : 0;
      project();
      const tg = new THREE.Vector3(cur.t[0] + drift, cur.t[1], cur.t[2]); cam.position.copy(tg).addScaledVector(camDir, 60); cam.lookAt(tg);

      const base = tt * 0.9;
      for (let i = 0; i < NF; i++) {
        const seg = chainAt(base + i * SPACING, P), x = P.x, dip = seg === 0 ? dipAt(x) : 0;
        _o.position.set(P.x, P.y - 0.63 - dip, P.z); _o.rotation.set(0, 0, 0); _o.scale.set(1, 1, 1);
        if (seg === 0) {
          // 담글 때 · 올라올 때 진행 방향으로 기울고, 잠긴 동안 천천히 돈다
          const slope = (dipAt(x + 0.05) - dipAt(x - 0.05)) / 0.1;
          _o.rotation.z = -Math.sin(tt * 2 + i) * 0.03 + slope * 0.08;
          if (dip > 1.0) _o.rotation.y = Math.sin(tt * 1.6 + i) * 0.2;
        }
        _o.updateMatrix(); formers.setMatrixAt(i, _o.matrix);
        formers.setColorAt(i, coatAt(x, seg));
      }
      formers.instanceMatrix.needsUpdate = true; formers.instanceColor.needsUpdate = true;
      // 탈형: 틀이 STRIP_X를 지날 때마다 공기에 불려 장갑이 통으로 날아간다
      const k = fr((base - (STRIP_X - XL)) / SPACING);
      {
        _o.position.set(STRIP_X + k * 0.7, 2.6 + Math.sin(k * PI) * 0.6 - k * 1.7, ZF + k * 1.9);
        _o.rotation.set(k * 2.4, k * 1.3, -k * 1.2); _o.scale.set(1 - k * 0.5, 1 - k * 0.5, 1 - k * 0.8); _o.updateMatrix(); flying.setMatrixAt(0, _o.matrix);
      }
      flying.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < NBX; i++) { const u = fr(tt * 0.1 + i / NBX); _o.position.set(CV1 - u * (CV1 - CV0 - 0.3), 1.0, CVZ); _o.rotation.set(0, 0, 0); _o.scale.set(1, 1, 1); _o.updateMatrix(); boxes.setMatrixAt(i, _o.matrix); }
      boxes.instanceMatrix.needsUpdate = true;
      const fs = fkAt(tt);
      forklift.position.x = FK_X + fs.x; forks.position.y = fs.lift; fkWheels.forEach(w => { w.rotation.z = -fs.x / 0.14; });
      cargo.position.set(CARGO_X + (fs.carry ? fs.x - FK_IN : 0), fs.carry ? fs.lift : 0, CVZ);

      rollers.forEach((r, i) => { r.rotation.y = tt * (i % 2 ? -6 : 6); });
      agitators.forEach((a, i) => { a.rotation.y = tt * (2 + i * 0.4); });
      fans.forEach((f, i) => { f.rotation.y = tt * 9 + i; });
      glowMats.forEach((m, i) => { m.emissiveIntensity = 0.85 + Math.sin(tt * 3 + i) * 0.08; });

      // 방울: 조에서 막 올라온 틀 끝에서 액면으로 떨어진다
      drips.forEach((p, s) => {
        const d = dripSites[s], a = p.geometry.attributes.position.array, n = a.length / 3;
        for (let i = 0; i < n; i++) {
          const ph = fr(tt * 1.6 + hash(i + s * 31)), x = d.x1 + 0.12 + hash(i * 3 + s) * 0.3;
          const y0 = 3.67 - 1.7 - dipAt(x);
          a[i * 3] = x; a[i * 3 + 1] = y0 + (1.46 - y0) * ph * ph; a[i * 3 + 2] = ZF + (hash(i * 7 + s) - 0.5) * 0.25;
        }
        p.geometry.attributes.position.needsUpdate = true;
      });
      {
        const a = steam.geometry.attributes.position.array;
        steamSites.forEach((d, s) => { for (let j = 0; j < 18; j++) { const i = s * 18 + j, ph = fr(tt * 0.25 + hash(i)); a[i * 3] = d.cx + (hash(i + 3) - 0.5) * d.w * 0.9 + ph * 0.3; a[i * 3 + 1] = 1.5 + ph * 2.0; a[i * 3 + 2] = ZF + (hash(i + 9) - 0.5) * 0.9 + ph * 0.3; } });
        steam.geometry.attributes.position.needsUpdate = true;
        const b = exhaust.geometry.attributes.position.array;
        stackPts.forEach((x, s) => { for (let j = 0; j < 14; j++) { const i = s * 14 + j, ph = fr(tt * 0.18 + hash(i + 50)); b[i * 3] = x + ph * 0.9 + (hash(i) - 0.5) * 0.2; b[i * 3 + 1] = 5.8 + ph * 2.4; b[i * 3 + 2] = ZF - 0.3 + ph * 0.5; } });
        exhaust.geometry.attributes.position.needsUpdate = true;
        const c = air.geometry.attributes.position.array, burst = Math.max(0, 1 - k * 2.5);
        for (let i = 0; i < 24; i++) { const r = (1 - burst) * 0.9 + hash(i) * 0.3; c[i * 3] = STRIP_X + (hash(i + 1) - 0.3) * r * 0.8; c[i * 3 + 1] = 2.35 - hash(i + 2) * r * 0.9; c[i * 3 + 2] = ZF - 0.3 + hash(i + 4) * 0.6 + r * 0.8; }
        air.material.opacity = 0.75 * burst; air.geometry.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, cam); started = true;
    })();

    return { setSpeed(v) { gsap.to(state, { speed: v, duration: 0.6 }); } };
  }

  window.GloveLine = { mount };
})();
