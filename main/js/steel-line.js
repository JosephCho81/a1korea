/* 아이소메트릭 제강 · 알루미늄 합금 라인 — 공정마다 어떤 원료가 들어가는지 보여준다.
   필요: three r147 + examples/js BufferGeometryUtils · RoomEnvironment
   SteelLine.mount(container, labelLayer) → { focus(i), steps, active } */
(function () {
  const PI = Math.PI;
  function hash(n) { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); }
  function rng(seed) { let s = seed % 2147483647 || 1; return () => (s = s * 16807 % 2147483647) / 2147483647; }
  const ss = u => u * u * (3 - 2 * u);
  // keys: [[t, v...], ...] 구간마다 smoothstep 보간
  function track(keys, t) {
    for (let i = 0; i < keys.length - 1; i++) {
      const a = keys[i], b = keys[i + 1];
      if (t >= a[0] && t <= b[0]) { const e = ss((t - a[0]) / (b[0] - a[0] || 1)); return a.slice(1).map((v, k) => v + (b[k + 1] - v) * e); }
    }
    return keys[keys.length - 1].slice(1);
  }

  function mount(container, labelLayer) {
    const lowPower = innerWidth < 760;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, lowPower ? 1.5 : 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.78;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new THREE.RoomEnvironment(), 0.06).texture;
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);
    const camDir = new THREE.Vector3(1, 0.95, 1.15).normalize();
    const target = new THREE.Vector3();

    scene.add(new THREE.HemisphereLight(0xd6dde6, 0x0e1116, 0.25));
    const sun = new THREE.DirectionalLight(0xfff2e2, 1.4);
    sun.position.set(34, 58, 26); sun.target.position.set(2, 0, 2); scene.add(sun.target);
    sun.castShadow = true;
    sun.shadow.mapSize.set(lowPower ? 2048 : 4096, lowPower ? 2048 : 4096);
    Object.assign(sun.shadow.camera, { left: -62, right: 62, top: 50, bottom: -50, near: 1, far: 180 });
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
    scene.add(sun);

    // ── 재질
    function ubcTexture() {
      const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
      x.fillStyle = '#868c93'; x.fillRect(0, 0, 128, 128);
      const cols = ['#b9bfc5', '#dcdfe2', '#9b2d2d', '#2c4f98', '#c49b22', '#eeeeee', '#5c6973', '#2e7a4a', '#a8aeb4'];
      for (let i = 0; i < 320; i++) { x.fillStyle = cols[i % cols.length]; x.save(); x.translate(hash(i) * 128, hash(i + 50) * 128); x.rotate(hash(i + 99) * 3); x.fillRect(-5, -2, 6 + hash(i + 7) * 9, 2 + hash(i + 3) * 4); x.restore(); }
      const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
    }
    const defs = {
      concrete: [0x8A9198, 0.95, 0], concreteDk: [0x737A82, 0.95, 0], lane: [0xD8A12C, 0.8, 0],
      steel: [0x59636E, 0.5, 0.55], steelDk: [0x353B43, 0.55, 0.5], steelLt: [0x8D98A4, 0.42, 0.6],
      panel: [0x4A565E, 0.55, 0.45], pipe: [0x808B96, 0.38, 0.7], yellow: [0xD7981F, 0.55, 0.2],
      copper: [0xB06A3C, 0.35, 0.85], graphite: [0x25272A, 0.4, 0.25], refr: [0x6C4232, 0.9, 0],
      refrLt: [0xBDAC9A, 0.9, 0], black: [0x15171A, 0.7, 0.1], bag: [0xE2E4E1, 1, 0], bagDk: [0x2C2E32, 1, 0],
      al: [0xC8CDD3, 0.3, 0.9], glass: [0x1C262E, 0.15, 0.7], house: [0x8B949C, 0.8, 0.2], blue: [0x3F5E7C, 0.55, 0.3]
    };
    const MAT = {};
    function glowMat(i = 2.4, c = 0xFF4A00) { return new THREE.MeshStandardMaterial({ color: 0x120400, emissive: c, emissiveIntensity: i * 0.7, roughness: 1, metalness: 0, envMapIntensity: 0 }); }
    function getMat(k) {
      if (MAT[k]) return MAT[k];
      if (k === 'glow') return MAT[k] = glowMat(2.4);
      if (k === 'ubc') return MAT[k] = new THREE.MeshStandardMaterial({ map: ubcTexture(), roughness: 0.6, metalness: 0.5, envMapIntensity: 0.5 });
      const d = defs[k];
      return MAT[k] = new THREE.MeshStandardMaterial({ color: d[0], roughness: d[1], metalness: d[2], envMapIntensity: 0.35 });
    }
    // 인스턴스 색이 주황일수록 스스로 빛나게 (뜨거운 빌릿 · 잉곳)
    function heatMat(opts) {
      const m = new THREE.MeshStandardMaterial(Object.assign({ color: 0xffffff, roughness: 0.45, metalness: 0.4, envMapIntensity: 0.5 }, opts));
      m.onBeforeCompile = sh => {
        sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>',
          '#include <emissivemap_fragment>\n#ifdef USE_INSTANCING_COLOR\ntotalEmissiveRadiance += vColor * smoothstep(0.2, 0.85, vColor.r - vColor.b) * 2.6;\n#endif');
      };
      return m;
    }

    // ── 정적 지오메트리는 재질별로 합쳐 드로콜을 줄인다
    const _o = new THREE.Object3D(), _o2 = new THREE.Object3D();
    function Batch(parent) {
      let lists = {};
      function add(g, k, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
        _o.position.set(x, y, z); _o.rotation.set(rx, ry, rz); _o.scale.set(sx, sy, sz); _o.updateMatrix();
        g.applyMatrix4(_o.matrix);
        if (g.index) g = g.toNonIndexed();
        Object.keys(g.attributes).forEach(a => { if (a !== 'position' && a !== 'normal' && a !== 'uv') g.deleteAttribute(a); });
        (lists[k] || (lists[k] = [])).push(g);
      }
      return {
        add,
        box: (w, h, d, k, x, y, z, rx, ry, rz) => add(new THREE.BoxGeometry(w, h, d), k, x, y, z, rx, ry, rz),
        cyl: (rt, rb, h, k, x, y, z, rx, ry, rz, s = 20) => add(new THREE.CylinderGeometry(rt, rb, h, s), k, x, y, z, rx, ry, rz),
        torus: (r, t, k, x, y, z, rx, ry, rz, arc = PI * 2, s = 32) => add(new THREE.TorusGeometry(r, t, 6, s, arc), k, x, y, z, rx, ry, rz),
        tube: (pts, r, k, seg = 32, rs = 8) => add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), seg, r, rs), k),
        flush() {
          Object.keys(lists).forEach(k => {
            const mesh = new THREE.Mesh(THREE.BufferGeometryUtils.mergeBufferGeometries(lists[k]), getMat(k));
            mesh.castShadow = k !== 'concrete' && k !== 'concreteDk' && k !== 'lane'; mesh.receiveShadow = true; parent.add(mesh);
          });
          lists = {};
        }
      };
    }
    function beam(b, k, a, c, t = 0.18, t2) {
      const len = Math.hypot(c[0] - a[0], c[1] - a[1], c[2] - a[2]), g = new THREE.BoxGeometry(t, t2 || t, len);
      _o2.position.set((a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2); _o2.lookAt(c[0], c[1], c[2]); _o2.updateMatrix();
      g.applyMatrix4(_o2.matrix); b.add(g, k);
    }
    function rod(b, k, a, c, r = 0.06, s = 8) {
      const len = Math.hypot(c[0] - a[0], c[1] - a[1], c[2] - a[2]), g = new THREE.CylinderGeometry(r, r, len, s);
      g.rotateX(PI / 2);
      _o2.position.set((a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2); _o2.lookAt(c[0], c[1], c[2]); _o2.updateMatrix();
      g.applyMatrix4(_o2.matrix); b.add(g, k);
    }
    function hcol(b, k, x, z, y0, y1, s = 0.34) {
      const h = y1 - y0, cy = (y0 + y1) / 2;
      b.box(s, h, 0.05, k, x, cy, z + s / 2); b.box(s, h, 0.05, k, x, cy, z - s / 2); b.box(0.05, h, s, k, x, cy, z);
    }
    function railing(b, pts, y, h = 1) {
      for (let i = 0; i < pts.length - 1; i++) {
        const [x1, z1] = pts[i], [x2, z2] = pts[i + 1];
        beam(b, 'yellow', [x1, y + h, z1], [x2, y + h, z2], 0.06);
        beam(b, 'yellow', [x1, y + h * 0.5, z1], [x2, y + h * 0.5, z2], 0.045);
        const n = Math.max(1, Math.round(Math.hypot(x2 - x1, z2 - z1) / 1.3));
        for (let k = 0; k <= n; k++) { const u = k / n; b.box(0.06, h, 0.06, 'yellow', x1 + (x2 - x1) * u, y + h / 2, z1 + (z2 - z1) * u); }
      }
    }
    function jumboBag(b, k, x, z, s = 1, y = 0) {
      b.add(new THREE.CylinderGeometry(0.5 * s, 0.56 * s, 1.0 * s, 8), k, x, y + 0.5 * s, z, 0, PI / 8);
      b.add(new THREE.ConeGeometry(0.5 * s, 0.22 * s, 8), k, x, y + 1.1 * s, z, 0, PI / 8);
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([a, c]) => b.torus(0.08 * s, 0.02 * s, k, x + a * 0.3 * s, y + 1.12 * s, z + c * 0.3 * s, 0, PI / 4 * a * c, 0, PI, 8));
    }
    function ingotBundle(b, x, z, layers = 5, y0 = 0, k = 'al') {
      for (let l = 0; l < layers; l++) for (let i = 0; i < 4; i++) {
        const y = y0 + 0.09 + l * 0.17, o = -0.33 + i * 0.22;
        if (l % 2) b.box(0.2, 0.15, 0.82, k, x + o, y, z); else b.box(0.82, 0.15, 0.2, k, x, y, z + o);
      }
      b.box(0.86, 0.03, 0.06, 'black', x, y0 + layers * 0.17 + 0.01, z - 0.2); b.box(0.86, 0.03, 0.06, 'black', x, y0 + layers * 0.17 + 0.01, z + 0.2);
    }
    // 무더기: 조각을 원뿔 부피 안에 흩뿌린다
    function heap(parent, o) {
      const R = rng(o.seed), n = o.n;
      const im = new THREE.InstancedMesh(o.geo, new THREE.MeshStandardMaterial(Object.assign({ color: 0xffffff, roughness: 0.75, metalness: 0.45, envMapIntensity: 0.45 }, o.mat || {})), n);
      const c = new THREE.Color();
      for (let i = 0; i < n; i++) {
        const a = R() * PI * 2, d = Math.sqrt(R()) * o.r, hm = o.h * Math.pow(1 - d / o.r, 1.1);
        _o.position.set(o.x + Math.cos(a) * d * (o.sx || 1), (o.y0 || 0) + hm * (0.5 + 0.5 * R()), o.z + Math.sin(a) * d);
        _o.rotation.set(R() * PI, R() * PI, R() * PI);
        const s = o.size(R); _o.scale.set(s[0], s[1], s[2]); _o.updateMatrix();
        im.setMatrixAt(i, _o.matrix);
        c.set(o.colors[Math.floor(R() * o.colors.length)]).multiplyScalar(0.8 + R() * 0.4); im.setColorAt(i, c);
      }
      im.castShadow = true; im.receiveShadow = true; parent.add(im);
      if (o.core !== false) {
        const core = new THREE.Mesh(new THREE.ConeGeometry(o.r * 0.92, o.h * 0.88, 14), new THREE.MeshStandardMaterial({ color: o.core || 0x3b3632, roughness: 1 }));
        core.scale.x = o.sx || 1; core.position.set(o.x, (o.y0 || 0) + o.h * 0.44, o.z); core.receiveShadow = true; parent.add(core);
      }
      return im;
    }
    const box1 = new THREE.BoxGeometry(1, 1, 1);
    const scrapSize = R => R() < 0.62 ? [0.3 + R() * 0.7, 0.05 + R() * 0.07, 0.2 + R() * 0.45] : [0.6 + R() * 1.0, 0.1 + R() * 0.07, 0.1 + R() * 0.07];
    const scrapCols = [0x6B3A24, 0x55463B, 0x767D84, 0x4A3326, 0x8A8F95, 0x7A3E22, 0x3E3A37];

    const S = Batch(scene); // 전역 정적

    // ── 바닥
    S.box(82, 0.6, 19, 'concrete', 4, -0.3, -5);
    S.box(52, 0.6, 12, 'concrete', -1.5, -0.3, 14.6);
    S.box(80, 0.02, 0.16, 'lane', 4, 0.01, 3.0); S.box(50, 0.02, 0.16, 'lane', -1.5, 0.01, 19.9);
    [-0.55, 0.55].forEach(z => S.box(20, 0.1, 0.12, 'steelLt', -5.6, 0.05, z));

    // ═════════ 원료 야적장 (스크랩 · 가탄제)
    S.box(12.5, 1.4, 0.4, 'concreteDk', -28, 0.7, -9.6);
    S.box(0.4, 1.4, 5, 'concreteDk', -27.6, 0.7, -7.3);
    S.box(0.4, 1.4, 5, 'concreteDk', -34.2, 0.7, -7.3);
    heap(scene, { x: -31, z: -5.6, r: 3.0, h: 2.6, n: 620, geo: box1, colors: scrapCols, size: scrapSize, seed: 11, sx: 1.05 });
    heap(scene, { x: -24.6, z: -6.8, r: 2.3, h: 1.9, n: 360, geo: box1, colors: scrapCols, size: scrapSize, seed: 23 });
    heap(scene, { x: -24.3, z: -1.2, r: 1.5, h: 0.95, n: 240, geo: new THREE.DodecahedronGeometry(0.11), colors: [0x1B1C1F, 0x26272A, 0x313236], size: R => { const s = 0.8 + R() * 0.9; return [s, s, s]; }, seed: 31, core: 0x161719, mat: { roughness: 0.55, metalness: 0.2 } });
    jumboBag(S, 'bagDk', -27.4, -1.3); jumboBag(S, 'bagDk', -28.6, -1.3); jumboBag(S, 'bagDk', -28.0, -0.2, 0.95);
    // 천장 크레인 주행로
    // 앞쪽 주행로는 빼서 줌 화면을 가리지 않게 — 브리지는 뒤 주행로에서 내민 형태
    [-34, -26, -18, -8.4].forEach(x => hcol(S, 'steel', x, -8.6, 0, 13.2, 0.42));
    S.box(26.4, 0.7, 0.36, 'yellow', -21.2, 13.4, -8.6);
    const crane = new THREE.Group(); scene.add(crane);
    const cb = Batch(crane);
    cb.box(1.0, 0.9, 8.4, 'yellow', -0.6, 14.2, -5.0); cb.box(1.0, 0.9, 8.4, 'yellow', 0.6, 14.2, -5.0);
    cb.box(2.4, 0.6, 0.8, 'steelDk', 0, 13.95, -8.6); cb.box(2.6, 1.2, 0.6, 'steelDk', 0, 14.2, -0.9);
    cb.flush();
    const trolley = new THREE.Group(); crane.add(trolley);
    const tb = Batch(trolley); tb.box(2.0, 0.8, 1.6, 'steelDk', 0, 15.0, 0); tb.box(1.0, 0.6, 0.9, 'panel', 0.3, 15.7, 0.2); tb.flush();
    const hoistM = getMat('black');
    const hoists = [-0.35, 0.35].map(x => { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 5), hoistM); h.userData.dx = x; scene.add(h); return h; });
    // 장입 버킷
    const bucket = new THREE.Group(); scene.add(bucket);
    const bkb = Batch(bucket);
    bkb.cyl(1.0, 0.82, 1.4, 'steelDk', 0, 0.7, 0, 0, 0, 0, 22);
    bkb.torus(1.0, 0.06, 'steel', 0, 1.38, 0, PI / 2); bkb.torus(0.92, 0.06, 'steel', 0, 0.75, 0, PI / 2); bkb.torus(0.85, 0.06, 'steel', 0, 0.2, 0, PI / 2);
    bkb.torus(1.0, 0.07, 'steelLt', 0, 1.4, 0, 0, 0, 0, PI);
    bkb.flush();
    const bucketLoad = new THREE.Group(); bucket.add(bucketLoad);
    heap(bucketLoad, { x: 0, z: 0, y0: 1.25, r: 0.9, h: 0.55, n: 70, geo: box1, colors: scrapCols, size: R => scrapSize(R).map(v => v * 0.7), seed: 41, core: false });

    // ═════════ 전기로 (EAF)
    const eafRoot = new THREE.Group(); eafRoot.position.set(-14, 0, -4); scene.add(eafRoot);
    const E = Batch(eafRoot);
    E.box(7.6, 3, 6.6, 'concreteDk', 0, 1.5, -0.7);
    E.box(2.6, 0.18, 6.2, 'steel', 5.0, 3.0, -0.4);
    railing(E, [[6.25, -3.4], [6.25, 2.6]], 3.09);
    hcol(E, 'steel', 6.1, -3.3, 0, 2.9); hcol(E, 'steel', 6.1, 2.5, 0, 2.9); hcol(E, 'steel', 4.0, 2.5, 0, 2.9);
    // 변압기실
    E.box(6.4, 9.4, 2.6, 'house', 0, 4.7, -7.4);
    for (let i = 0; i < 6; i++) E.box(5.6, 0.06, 0.08, 'steelDk', 0, 5.8 + i * 0.35, -6.08);
    E.box(1.2, 2.2, 0.06, 'steelDk', 2.2, 1.1, -6.08);
    E.box(6.8, 0.25, 3.0, 'steelDk', 0, 9.5, -7.4);
    // 분탄 취입 장치
    E.cyl(0.55, 0.55, 1.6, 'steelLt', 5.2, 4.2, 1.7, 0, 0, 0, 16); E.add(new THREE.SphereGeometry(0.55, 16, 8, 0, PI * 2, 0, PI / 2), 'steelLt', 5.2, 5.0, 1.7);
    E.add(new THREE.ConeGeometry(0.55, 0.6, 16), 'steelLt', 5.2, 3.1, 1.7, PI);
    rod(E, 'black', [5.2, 3.3, 1.4], [4.6, 4.3, 0.6], 0.07);
    hcol(E, 'steel', 4.6, 0.6, 3.0, 5.0, 0.26);
    rod(E, 'pipe', [4.6, 4.6, 0.6], [2.95, 3.85, 0.15], 0.09);

    const tilt = new THREE.Group(); tilt.position.set(0, 3, 0); eafRoot.add(tilt);
    const T = Batch(tilt);
    [-1.7, 1.7].forEach(x => { const g = new THREE.TorusGeometry(3, 0.26, 6, 20, 0.9); g.rotateZ(-PI / 2 - 0.45); g.rotateY(PI / 2); T.add(g, 'steelDk', x, 3, 0); });
    T.box(4.2, 0.4, 3.8, 'steelDk', 0, 0.3, 0);
    T.cyl(2.55, 2.1, 1.35, 'steelDk', 0, 0.85, 0, 0, 0, 0, 32);
    T.torus(2.57, 0.08, 'steel', 0, 1.52, 0, PI / 2);
    T.cyl(2.72, 2.72, 1.9, 'panel', 0, 2.47, 0, 0, 0, 0, 36);
    for (let i = 0; i < 64; i++) { const a = i / 64 * PI * 2; if (a < 0.25 || a > PI * 2 - 0.25) continue; T.cyl(0.055, 0.055, 1.75, 'pipe', Math.cos(a) * 2.78, 2.47, Math.sin(a) * 2.78, 0, 0, 0, 6); }
    [1.58, 2.47, 3.36].forEach(y => T.torus(2.82, 0.09, 'steel', 0, y, 0, PI / 2, 0, 0, PI * 2, 40));
    T.torus(2.93, 0.07, 'pipe', 0, 3.52, 0, PI / 2, 0, 0, PI * 2, 40);
    // 지붕
    T.add(new THREE.SphereGeometry(3.0, 36, 10, 0, PI * 2, 0, 1.25), 'panel', 0, 3.12, 0, 0, 0, 0, 1, 0.35, 1);
    T.torus(2.86, 0.15, 'pipe', 0, 3.46, 0, PI / 2, 0, 0, PI * 2, 40);
    T.torus(1.95, 0.08, 'pipe', 0, 3.9, 0, PI / 2, 0, 0, PI * 2, 32);
    for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; beam(T, 'pipe', [Math.cos(a) * 1.15, 4.08, Math.sin(a) * 1.15], [Math.cos(a) * 2.8, 3.5, Math.sin(a) * 2.8], 0.08); }
    T.cyl(0.95, 1.05, 0.45, 'refrLt', 0, 4.2, 0, 0, 0, 0, 24);
    // 출강구 (EBT) — 레일 쪽
    T.box(1.5, 1.2, 1.1, 'steelDk', 0.7, 0.75, 2.75);
    T.cyl(0.18, 0.22, 0.4, 'refr', 0.7, 0.05, 3.05);
    // 슬래그 도어
    T.box(0.35, 1.3, 1.6, 'steelDk', 2.78, 1.8, 0);
    // 배연 엘보
    T.tube([[-1.5, 3.9, -1.2], [-1.6, 4.9, -1.6], [-1.5, 5.6, -2.2]], 0.48, 'pipe', 20, 12);
    // 전극 마스트
    const mastX = [-1.15, 0, 1.15];
    mastX.forEach(x => { T.box(0.5, 7.2, 0.5, 'steelDk', x, 4.2, -3.5); T.box(0.8, 0.5, 0.8, 'steel', x, 0.7, -3.5); });
    T.box(3.4, 0.5, 0.9, 'steel', 0, 0.9, -3.5);
    T.flush();
    const eafGlow = glowMat(2.4);
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.62, 0.95), eafGlow); door.position.set(2.97, 1.65, 0); tilt.add(door);
    const roofGap = new THREE.Mesh(new THREE.TorusGeometry(0.97, 0.05, 6, 24), eafGlow); roofGap.rotation.x = PI / 2; roofGap.position.y = 3.98; tilt.add(roofGap);
    const eafLight = new THREE.PointLight(0xFF7A2A, 7, 10, 2); eafLight.position.set(2.5, 3, 1.5); tilt.add(eafLight);
    // 전극 + 암
    const elecAng = [PI / 2 + 0.2, PI / 2 + 0.2 + PI * 2 / 3, PI / 2 + 0.2 + PI * 4 / 3];
    const elecs = elecAng.map((a, i) => {
      const g = new THREE.Group(); tilt.add(g);
      const b = Batch(g), ex = Math.cos(a) * 0.6, ez = Math.sin(a) * 0.6, ya = 7.0 + i * 0.25;
      b.cyl(0.26, 0.26, 5.2, 'graphite', ex, 6.4, ez, 0, 0, 0, 16);
      [5.0, 6.6].forEach(y => b.torus(0.27, 0.03, 'steelDk', ex, y, ez, PI / 2, 0, 0, PI * 2, 16));
      b.torus(0.34, 0.12, 'copper', ex, ya, ez, PI / 2, 0, 0, PI * 2, 16);
      beam(b, 'copper', [ex, ya, ez], [mastX[i], ya, -3.5], 0.42, 0.55);
      b.box(0.9, 1.1, 0.9, 'steel', mastX[i], ya, -3.5);
      b.flush();
      return g;
    });
    // 케이블: 암 뒤 → 변압기실 벽
    mastX.forEach((x, i) => [-0.16, 0.16].forEach(o => E.tube([[x + o, 3 + 7.0 + i * 0.25, -3.95], [x * 1.2 + o, 3 + 5.2 + i * 0.25, -5.0], [x * 1.4 + o, 3 + 6.4 + i * 0.2, -6.05]], 0.1, 'black', 16, 6)));
    E.flush();

    // 출강 합금철 투입 호퍼
    S.box(1.6, 1.4, 1.6, 'steelLt', -17.4, 7.4, 1.4);
    S.add(new THREE.ConeGeometry(1.12, 1.1, 4), 'steelLt', -17.4, 6.15, 1.4, PI, PI / 4);
    [[-18.1, 0.7], [-16.7, 0.7], [-18.1, 2.1], [-16.7, 2.1]].forEach(([x, z]) => hcol(S, 'steel', x, z, 0, 6.7, 0.22));
    S.box(1.9, 0.12, 1.9, 'steel', -17.4, 6.7, 1.4);
    S.tube([[-17.4, 5.6, 1.4], [-16.2, 4.4, 0.9], [-14.6, 3.2, 0.3]], 0.13, 'pipe', 16, 8);

    // ═════════ 레이들 + 운반차
    function makeLadle(parent, withMelt) {
      const g = new THREE.Group(); parent.add(g);
      const b = Batch(g);
      b.cyl(1.05, 0.88, 1.9, 'steelDk', 0, 0.95, 0, 0, 0, 0, 24);
      [0.45, 1.0, 1.5].forEach(y => b.torus(1.0 - (1.5 - y) * 0.07 + 0.04, 0.05, 'steel', 0, y, 0, PI / 2, 0, 0, PI * 2, 28));
      b.torus(1.06, 0.08, 'steel', 0, 1.9, 0, PI / 2, 0, 0, PI * 2, 28);
      b.torus(0.93, 0.07, 'refr', 0, 1.9, 0, PI / 2, 0, 0, PI * 2, 28);
      [-1, 1].forEach(s => { b.cyl(0.17, 0.17, 0.42, 'steelLt', s * 1.18, 1.45, 0, 0, 0, PI / 2, 12); b.box(0.12, 0.6, 0.5, 'steel', s * 1.02, 1.45, 0); });
      b.flush();
      let melt = null;
      if (withMelt) { melt = new THREE.Mesh(new THREE.CylinderGeometry(0.93, 0.93, 0.04, 24), glowMat(2.2)); melt.position.y = 1.86; g.add(melt); }
      return { g, melt };
    }
    const ladle = makeLadle(scene, true);
    const ladleLight = new THREE.PointLight(0xFF7A2A, 3, 6, 2); ladleLight.position.y = 3; ladle.g.add(ladleLight);
    const car = new THREE.Group(); scene.add(car);
    const carB = Batch(car);
    carB.box(2.6, 0.35, 1.7, 'yellow', 0, 0.35, 0); carB.box(2.0, 0.2, 0.3, 'steelDk', 0, 0.62, 0);
    [-0.85, 0.85].forEach(x => [-0.55, 0.55].forEach(z => carB.cyl(0.2, 0.2, 0.12, 'black', x, 0.2, z, PI / 2, 0, 0, 12)));
    carB.flush();
    const tapStream = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.05, -0.4, 0.35), new THREE.Vector3(0.1, -1.0, 0.55)]), 12, 0.13, 8), glowMat(3));
    scene.add(tapStream);

    // ═════════ 집진 (EAF Dust)
    const ductPts = [[-15.5, 9.0, -6.4], [-15.5, 10.8, -7.6], [-14.2, 11.6, -8.8], [-10.2, 11.6, -9.8], [-8.6, 10.4, -10.4], [-8.6, 8.2, -10.5]];
    S.tube(ductPts, 0.55, 'pipe', 48, 12);
    S.box(2.6, 7.8, 2.6, 'steel', -8.6, 3.9, -10.5);
    S.add(new THREE.ConeGeometry(1.84, 1.0, 4), 'steel', -8.6, 8.3, -10.5, 0, PI / 4);
    S.tube([[-7.3, 5.6, -10.5], [-6.4, 5.6, -10.5], [-5.6, 5.2, -10.6]], 0.45, 'pipe', 12, 10);
    for (let i = 0; i < 4; i++) {
      const x = -4.4 + i * 2.05;
      S.box(1.9, 3.8, 3.2, 'blue', x, 4.9, -10.6);
      S.add(new THREE.ConeGeometry(1.34, 1.5, 4), 'blue', x, 2.25, -10.6, PI, PI / 4, 0, 1, 1, 1.68);
      S.box(1.7, 0.6, 3.0, 'steelLt', x, 7.1, -10.6);
      [[-0.85, -1.5], [0.85, -1.5], [-0.85, 1.5], [0.85, 1.5]].forEach(([a, c]) => hcol(S, 'steel', x + a, -10.6 + c, 0, 3.0, 0.2));
    }
    S.box(8.4, 0.12, 0.8, 'steel', -1.3, 7.45, -8.6); railing(S, [[-5.5, -8.25], [2.9, -8.25]], 7.5);
    S.cyl(0.18, 0.18, 9.2, 'pipe', -1.3, 1.0, -10.6, 0, 0, PI / 2, 10);
    S.tube([[2.9, 6.0, -10.6], [4.2, 6.0, -10.6], [4.8, 2.6, -10.6]], 0.45, 'pipe', 14, 10);
    S.cyl(1.1, 1.1, 0.9, 'blue', 5.2, 1.3, -10.6, PI / 2, 0, 0, 24); S.box(0.9, 0.8, 1.0, 'panel', 5.2, 0.6, -11.8);
    S.cyl(0.55, 0.72, 17, 'steelLt', 7.0, 8.5, -10.6, 0, 0, 0, 20);
    [5, 9, 13, 16.6].forEach(y => S.torus(0.66 - y * 0.008, 0.06, 'steel', 7.0, y, -10.6, PI / 2, 0, 0, PI * 2, 24));
    S.tube([[5.9, 1.3, -10.6], [6.6, 1.3, -10.6], [7.0, 1.6, -10.6]], 0.4, 'pipe', 10, 10);
    for (let i = 0; i < 4; i++) jumboBag(S, 'bag', 2.6 + (i % 2) * 1.15, -7.6 + Math.floor(i / 2) * 1.15, 0.95);
    S.tube([[3.2, 1.0, -10.6], [3.2, 1.8, -9.4], [3.2, 1.6, -8.4]], 0.14, 'pipe', 12, 8);

    // ═════════ LF 정련
    hcol(S, 'steel', -4.4, -2.3, 0, 10.6, 0.42); hcol(S, 'steel', 0.4, -2.3, 0, 10.6, 0.42);
    hcol(S, 'steel', -4.4, -4.2, 0, 10.6, 0.42); hcol(S, 'steel', 0.4, -4.2, 0, 10.6, 0.42);
    S.box(5.4, 0.25, 2.6, 'steel', -2, 9.2, -3.25);
    for (let i = 0; i < 3; i++) {
      const x = -3.4 + i * 1.4;
      S.box(1.1, 1.6, 1.1, 'steelLt', x, 10.4, -3.25);
      S.add(new THREE.ConeGeometry(0.78, 0.7, 4), 'steelLt', x, 9.25, -3.25, PI, PI / 4);
      S.cyl(0.1, 0.1, 0.4, 'steelDk', x, 8.7, -3.25, 0, 0, 0, 8);
    }
    S.box(4.4, 0.12, 0.6, 'black', -2.2, 8.4, -3.25);
    S.add(new THREE.ConeGeometry(0.5, 0.7, 12), 'steelLt', -0.2, 7.9, -3.0, PI);
    S.tube([[-0.2, 7.5, -3.0], [-0.6, 6.4, -2.0], [-1.3, 5.2, -0.8]], 0.12, 'pipe', 14, 8);
    S.box(4.8, 4.6, 2.0, 'house', -2, 2.3, -6.0);
    S.box(2.3, 0.16, 4.2, 'steel', 1.2, 3.0, 0); railing(S, [[2.3, -2.0], [2.3, 2.0]], 3.08);
    hcol(S, 'steel', 2.2, 1.9, 0, 2.95, 0.24); hcol(S, 'steel', 0.2, 1.9, 0, 2.95, 0.24);
    [-2.7, -2, -1.3].forEach((x, i) => S.tube([[x, 6.9 + i * 0.1, -2.6], [x, 5.4, -4.0], [x, 4.4, -4.95]], 0.09, 'black', 14, 6));
    const lfTop = new THREE.Group(); lfTop.position.set(-2, 2.9, 0); scene.add(lfTop);
    const LB = Batch(lfTop);
    LB.cyl(1.5, 1.62, 0.5, 'panel', 0, 0.25, 0, 0, 0, 0, 28);
    LB.torus(1.62, 0.1, 'pipe', 0, 0.05, 0, PI / 2, 0, 0, PI * 2, 28);
    LB.cyl(0.6, 0.7, 0.4, 'refrLt', 0, 0.65, 0, 0, 0, 0, 20);
    LB.box(3.0, 0.5, 0.6, 'steel', 0, 3.9, -2.35);
    [0, 1, 2].forEach(i => {
      const a = PI / 2 + i * PI * 2 / 3, ex = Math.cos(a) * 0.38, ez = Math.sin(a) * 0.38;
      LB.cyl(0.18, 0.18, 4.6, 'graphite', ex, 2.5, ez, 0, 0, 0, 14);
      LB.torus(0.24, 0.08, 'copper', ex, 3.9, ez, PI / 2, 0, 0, PI * 2, 14);
      beam(LB, 'copper', [ex, 3.9, ez], [-0.7 + i * 0.7, 3.9, -2.35], 0.3, 0.4);
    });
    LB.flush();
    const lfLight = new THREE.PointLight(0xFF7A2A, 0, 6, 2); lfLight.position.set(-0.4, 2.6, 1.6); scene.add(lfLight);

    // ═════════ 연속주조
    [1.0, 11.2].forEach(x => hcol(S, 'steel', x, -3.8, 0, 12.4, 0.4));
    S.box(10.6, 0.6, 0.36, 'yellow', 6.1, 12.6, -3.8);
    const ccCrane = new THREE.Group(); scene.add(ccCrane);
    const ccb = Batch(ccCrane);
    ccb.box(0.8, 0.8, 5.4, 'yellow', -0.5, 13.3, -1.4); ccb.box(0.8, 0.8, 5.4, 'yellow', 0.5, 13.3, -1.4); ccb.box(2.0, 1.0, 0.5, 'steelDk', 0, 13.3, 1.2);
    ccb.box(1.9, 0.8, 1.6, 'steelDk', 0, 14.0, 0); ccb.flush();
    const ccHoists = [-0.5, 0.5].map(x => { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 5), hoistM); h.position.x = x; ccCrane.add(h); return h; });
    // 주조 바닥
    S.box(6.6, 0.3, 6.2, 'steel', 11.3, 4.6, 0);
    [[8.2, -2.9], [14.4, -2.9], [8.2, 2.9], [14.4, 2.9], [11.3, 2.9], [11.3, -2.9]].forEach(([x, z]) => hcol(S, 'steel', x, z, 0, 4.45, 0.34));
    railing(S, [[8.1, 3.05], [14.55, 3.05], [14.55, -3.05]], 4.75);
    // 턴렛
    S.cyl(0.7, 0.95, 6.3, 'steel', 7, 3.15, -2.6, 0, 0, 0, 20);
    S.box(1.7, 0.7, 1.7, 'steelDk', 7, 6.6, -2.6);
    [0, -5.2].forEach(z => { beam(S, 'yellow', [7, 6.65, -2.6], [7, 6.65, z], 0.5, 0.45); S.box(2.6, 0.3, 0.5, 'yellow', 7, 6.8, z); });
    const ladle2 = makeLadle(scene, false); ladle2.g.position.set(7, 6.9, -5.2);
    // 턴디시 · 몰드
    S.box(3.4, 0.85, 1.2, 'steelDk', 8.7, 5.25, 0); S.box(3.1, 0.06, 0.9, 'refr', 8.7, 5.66, 0);
    S.box(0.7, 0.9, 0.7, 'copper', 9.4, 4.1, 0);
    const shroud = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.2, 8), glowMat(2.6)); shroud.position.set(7, 6.3, 0); scene.add(shroud);
    const tunGlow = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.04, 0.75), glowMat(1.6)); tunGlow.position.set(8.7, 5.7, 0); scene.add(tunGlow);
    // 스트랜드
    const strandCurve = new THREE.CatmullRomCurve3([[9.4, 3.7, 0], [9.5, 2.6, 0], [10.1, 1.5, 0], [11.4, 0.85, 0], [13.4, 0.7, 0], [16.6, 0.7, 0]].map(p => new THREE.Vector3(...p)));
    const strandMat = glowMat(2.0);
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(strandCurve, 60, 0.2, 8), strandMat));
    {
      const N = 30, im = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.13, 0.13, 0.8, 10), getMat('steelLt'), N * 2);
      const p = new THREE.Vector3(), q = new THREE.Vector3(), tg = new THREE.Vector3();
      for (let i = 0; i < N; i++) {
        const u = 0.03 + i / N * 0.62; strandCurve.getPointAt(u, p); strandCurve.getTangentAt(u, tg);
        const nx = -tg.y, ny = tg.x;
        [-1, 1].forEach((s, k) => { _o.position.set(p.x + nx * 0.34 * s, p.y + ny * 0.34 * s, 0); _o.rotation.set(PI / 2, 0, 0); _o.scale.set(1, 1, 1); _o.updateMatrix(); im.setMatrixAt(i * 2 + k, _o.matrix); });
        if (i % 4 === 0) { strandCurve.getPointAt(Math.min(u + 0.08, 0.99), q); [-0.48, 0.48].forEach(z => beam(S, 'steelDk', [p.x, p.y, z], [q.x, q.y, z], 0.14, 0.9)); }
      }
      im.castShadow = true; scene.add(im);
    }
    S.box(1.2, 1.6, 1.8, 'steelDk', 16.8, 1.3, 0); S.box(0.5, 0.4, 0.5, 'panel', 16.8, 2.3, 0);
    // 빌릿 이송 롤러 · 가열로 · 압연 · 냉각대 · 제품
    for (let x = 17.4; x < 34; x += 0.7) if (x < 20.3 || x > 24.7) S.cyl(0.11, 0.11, 0.8, 'pipe', x, 0.45, 0, PI / 2, 0, 0, 8);
    S.box(4.2, 2.6, 3.0, 'refr', 22.5, 1.3, 0); S.box(4.4, 0.3, 3.2, 'steelDk', 22.5, 2.75, 0);
    for (let i = 0; i < 5; i++) { hcol(S, 'steelDk', 20.6 + i * 0.95, 1.55, 0, 2.6, 0.22); hcol(S, 'steelDk', 20.6 + i * 0.95, -1.55, 0, 2.6, 0.22); }
    for (let i = 0; i < 4; i++) S.cyl(0.14, 0.14, 0.5, 'pipe', 21 + i * 1.0, 2.15, 1.65, PI / 2, 0, 0, 8);
    S.cyl(0.35, 0.45, 7, 'steelLt', 21.2, 6.1, -1.0, 0, 0, 0, 14);
    const reheatGlow = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 0.9), glowMat(2.2)); reheatGlow.position.set(24.63, 0.7, 0); scene.add(reheatGlow);
    for (let i = 0; i < 6; i++) {
      const x = 26 + i * 1.35;
      [-0.75, 0.75].forEach(z => S.box(0.5, 2.6, 0.42, 'steelDk', x, 1.3, z));
      S.box(0.6, 0.4, 2.0, 'steelDk', x, 2.75, 0);
      S.cyl(0.32, 0.32, 1.2, 'steelLt', x, 1.15, 0, PI / 2, 0, 0, 16); S.cyl(0.32, 0.32, 1.2, 'steelLt', x, 0.1, 0, PI / 2, 0, 0, 16);
      rod(S, 'steel', [x, 1.0, -0.9], [x, 1.0, -2.4], 0.1);
      S.box(0.9, 1.0, 1.2, 'blue', x, 0.9, -3.0); S.cyl(0.4, 0.4, 0.9, 'panel', x, 0.9, -4.0, PI / 2, 0, 0, 14);
    }
    S.box(5.0, 0.2, 4.8, 'steelDk', 36.4, 0.35, 0.2);
    for (let i = 0; i < 18; i++) S.box(0.08, 0.14, 4.6, 'steel', 34.1 + i * 0.27, 0.52, 0.2);
    for (let i = 0; i < 9; i++) S.box(4.6, 0.09, 0.09, i < 2 ? 'glow' : 'steel', 36.4, 0.64, -1.6 + i * 0.42);
    // 제품: 형강 · 철근 · 후판
    for (let r = 0; r < 3; r++) for (let k = 0; k < 4 - r; k++) {
      const z = -2.6 + k * 0.62 + r * 0.31, y = 0.04 + r * 0.42;
      S.box(4.0, 0.06, 0.5, 'steel', 41, y + 0.03, z); S.box(4.0, 0.06, 0.5, 'steel', 41, y + 0.37, z); S.box(4.0, 0.3, 0.05, 'steel', 41, y + 0.2, z);
    }
    for (let k = 0; k < 6; k++) {
      const z = 0.2 + (k % 3) * 0.5, y = 0.2 + Math.floor(k / 3) * 0.4;
      for (let j = 0; j < 7; j++) { const a = j / 6 * PI * 2, r = j ? 0.12 : 0; S.cyl(0.06, 0.06, 4.0, 'copper', 41, y + Math.sin(a) * r, z + Math.cos(a) * r, 0, 0, PI / 2, 6); }
      [-1.2, 0, 1.2].forEach(dx => S.torus(0.2, 0.025, 'yellow', 41 + dx, y, z, 0, PI / 2, 0, PI * 2, 12));
    }
    for (let k = 0; k < 6; k++) S.box(3.4, 0.12, 1.6, 'steelLt', 41, 0.08 + k * 0.13, 2.6);

    // 빌릿 (뜨거운 주황 → 가열로 → 압연하며 늘어나고 식는다)
    const NB = 16, billets = new THREE.InstancedMesh(new THREE.BoxGeometry(1.5, 0.34, 0.34), heatMat(), NB);
    billets.castShadow = true; scene.add(billets);
    const hot = new THREE.Color(0xFF7A2A), warm = new THREE.Color(0xC86A3A), cold = new THREE.Color(0x6E7883), tmpC = new THREE.Color(), tmpM = new THREE.Matrix4();

    // ═════════ 알루미늄 합금 라인 (z ≈ 14)
    const AZ = 14.2;
    {
      const ubcB = Batch(scene);
      for (let i = 0; i < 12; i++) { const x = -24.6 + (i % 3) * 1.3, z = 10.6 + Math.floor(i / 3 % 2) * 1.05, y = Math.floor(i / 6) * 0.95; ubcB.box(1.2, 0.9, 1.0, 'ubc', x, y + 0.45, z, 0, (hash(i) - 0.5) * 0.12); }
      ubcB.flush();
    }
    heap(scene, { x: -19.8, z: 11.2, r: 1.7, h: 1.0, n: 300, geo: box1, colors: [0xC9CED3, 0xB4BAC0, 0xDDE0E3, 0x9EA5AC], size: R => [0.12 + R() * 0.16, 0.02, 0.06 + R() * 0.08], seed: 51, core: 0x8E959C, mat: { metalness: 0.8, roughness: 0.35 } });
    heap(scene, { x: -23.6, z: 16.6, r: 1.4, h: 0.8, n: 150, geo: new THREE.CylinderGeometry(0.18, 0.18, 0.12, 10), colors: [0x9EA5AC, 0x8A9097, 0xB4BAC0], size: R => { const s = 0.8 + R() * 0.4; return [s, s, s]; }, seed: 61, core: 0x7C838A, mat: { metalness: 0.8, roughness: 0.4 } });
    ingotBundle(S, -20.4, 16.2, 6); ingotBundle(S, -19.3, 16.2, 6); ingotBundle(S, -20.4, 17.3, 5); ingotBundle(S, -20.4, 16.2, 4, 1.03);
    // 장입기
    const chg = new THREE.Group(); scene.add(chg);
    const CB = Batch(chg);
    CB.box(1.9, 0.6, 2.3, 'yellow', 0, 0.75, 0.3); CB.box(1.7, 0.4, 1.0, 'steelDk', 0, 1.25, 1.0);
    CB.box(0.95, 0.95, 0.95, 'yellow', 0.45, 1.55, 0.95); CB.box(0.8, 0.5, 0.02, 'glass', 0.45, 1.7, 0.47);
    [-0.95, 0.95].forEach(x => [-0.4, 1.0].forEach(z => CB.cyl(0.36, 0.36, 0.3, 'black', x, 0.36, z, 0, 0, PI / 2, 14)));
    CB.box(0.4, 0.34, 2.6, 'yellow', -0.3, 1.0, -1.6); CB.box(1.3, 0.12, 1.0, 'steelDk', -0.3, 0.9, -3.2); CB.box(1.3, 0.5, 0.1, 'steelDk', -0.3, 1.1, -3.7);
    CB.flush();
    const chgLoad = new THREE.Group(); chg.add(chgLoad);
    heap(chgLoad, { x: -0.3, z: -3.2, y0: 0.9, r: 0.6, h: 0.4, n: 40, geo: box1, colors: [0xC9CED3, 0xB4BAC0, 0x9b2d2d, 0x2c4f98], size: R => [0.15 + R() * 0.2, 0.05, 0.1 + R() * 0.15], seed: 71, core: false, mat: { metalness: 0.7, roughness: 0.4 } });
    // 반사로
    S.box(9.8, 0.4, 5.0, 'concreteDk', -5.5, 0.2, AZ);
    S.box(9.0, 2.7, 4.4, 'steel', -5.5, 1.75, AZ);
    S.box(9.05, 0.5, 4.45, 'refr', -5.5, 0.65, AZ);
    { const g = new THREE.CylinderGeometry(6, 6, 9.2, 28, 1, false, -0.375, 0.75); g.rotateX(-PI / 2); g.rotateY(PI / 2); S.add(g, 'panel', -5.5, -2.28, AZ); }
    const doorsX = [-7.4, -3.8];
    for (let x = -9.6; x <= -1.3; x += 1.04) {
      if (!doorsX.some(d => Math.abs(d - x) < 1.25)) hcol(S, 'steelDk', x, AZ + 2.32, 0.4, 3.6, 0.26);
      hcol(S, 'steelDk', x, AZ - 2.32, 0.4, 3.6, 0.26); rod(S, 'steelDk', [x, 3.86, AZ - 2.32], [x, 3.86, AZ + 2.32], 0.05, 6);
    }
    // 장입 도어 (장입기 진입 쪽)
    doorsX.forEach(x => { hcol(S, 'steel', x - 1.15, AZ + 2.55, 0.4, 5.6, 0.28); hcol(S, 'steel', x + 1.15, AZ + 2.55, 0.4, 5.6, 0.28); S.box(2.6, 0.35, 0.4, 'steel', x, 5.7, AZ + 2.55); S.cyl(0.22, 0.22, 0.3, 'steelDk', x, 6.0, AZ + 2.55, PI / 2, 0, 0, 12); });
    const alGlow = glowMat(2.2);
    const alDoors = doorsX.map(x => {
      const opening = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.5, 0.05), alGlow); opening.position.set(x, 1.55, AZ + 2.22); scene.add(opening);
      const d = new THREE.Group(); d.position.set(x, 0, AZ + 2.45); scene.add(d);
      const db = Batch(d); db.box(2.1, 1.8, 0.22, 'steelLt', 0, 1.55, 0); db.box(1.7, 1.4, 0.06, 'refr', 0, 1.55, 0.12); db.box(2.2, 0.12, 0.3, 'steelDk', 0, 2.5, 0); db.flush();
      return d;
    });
    // 버너 (뒤쪽) · 가스 배관
    [-8.2, -5.5, -2.8].forEach(x => { S.cyl(0.25, 0.3, 0.9, 'steelLt', x, 2.2, AZ - 2.65, PI / 2, 0, 0, 12); rod(S, 'pipe', [x, 2.2, AZ - 3.1], [x, 3.1, AZ - 3.1], 0.06); });
    rod(S, 'yellow', [-9.2, 3.1, AZ - 3.1], [-1.8, 3.1, AZ - 3.1], 0.09);
    S.tube([[-9.6, 4.2, AZ - 0.8], [-6, 4.25, AZ - 0.8], [-2, 4.2, AZ - 0.8]], 0.08, 'yellow', 12, 6);
    // 배기 굴뚝
    S.box(1.4, 1.6, 1.6, 'steel', -10.5, 2.7, AZ - 0.8);
    S.cyl(0.5, 0.62, 6.4, 'steelLt', -11.3, 3.3, AZ - 0.8, 0, 0, 0, 18);
    [3.6, 6.1].forEach(y => S.torus(0.6, 0.05, 'steel', -11.3, y, AZ - 0.8, PI / 2, 0, 0, PI * 2, 20));
    // 측면 웰 (+x)
    [[-0.1, AZ, 0.25, 3.4], [2.1, AZ, 0.25, 3.4], [1.0, AZ + 1.6, 2.4, 0.25], [1.0, AZ - 1.6, 2.4, 0.25]].forEach(([x, z, w, d]) => S.box(w, 1.6, d, 'refr', x, 0.8, z));
    S.box(1.95, 1.2, 2.95, 'refr', 1.0, 0.6, AZ);
    const wellGlow = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.05, 2.95), alGlow); wellGlow.position.set(1.0, 1.42, AZ); scene.add(wellGlow);
    S.box(0.8, 0.6, 0.8, 'blue', 1.6, 2.1, AZ + 1.0); S.cyl(0.12, 0.12, 1.2, 'steelDk', 1.6, 1.6, AZ + 1.0, 0, 0, 0, 8);
    // 홈통: 반사로 → 보온로
    S.box(1.8, 0.4, 0.6, 'refr', 3.0, 1.2, AZ); const launder1 = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.04, 0.32), alGlow); launder1.position.set(3.0, 1.41, AZ); scene.add(launder1);
    hcol(S, 'steel', 3.0, AZ, 0, 1.0, 0.2);
    // 보온로 (기울어짐)
    const hold = new THREE.Group(); hold.position.set(7.0, 0.5, AZ); scene.add(hold);
    const HB = Batch(hold);
    HB.box(3.2, 1.9, 3.0, 'steel', -1.6, 0.95, 0); HB.box(3.25, 0.4, 3.05, 'refr', -1.6, 0.2, 0);
    { const g = new THREE.CylinderGeometry(3.5, 3.5, 3.2, 20, 1, false, -0.44, 0.88); g.rotateX(-PI / 2); g.rotateY(PI / 2); HB.add(g, 'panel', -1.6, 1.9 - 3.5 * Math.cos(0.44), 0); }
    HB.box(0.7, 0.3, 0.4, 'refr', 0.25, 1.5, 0);
    HB.cyl(0.35, 0.35, 0.15, 'steelDk', -1.6, 2.35, 0.7, 0, 0, 0, 14);
    for (let i = 0; i < 4; i++) { hcol(HB, 'steelDk', -3.0 + i * 0.92, 1.55, 0, 1.9, 0.2); hcol(HB, 'steelDk', -3.0 + i * 0.92, -1.55, 0, 1.9, 0.2); }
    HB.flush();
    S.box(3.6, 0.5, 3.2, 'concreteDk', 5.4, 0.25, AZ);
    [-1, 1].forEach(z => S.cyl(0.12, 0.12, 0.6, 'pipe', 4.2, 0.6, AZ + z, 0, 0, 0, 8));
    // 메탈실리콘 투입: 지브 크레인 + 톤백
    S.cyl(0.2, 0.26, 5.6, 'yellow', 3.6, 2.8, AZ + 2.3, 0, 0, 0, 12);
    beam(S, 'yellow', [3.6, 5.5, AZ + 2.3], [5.6, 5.5, AZ + 0.7], 0.28, 0.36);
    rod(S, 'black', [5.4, 5.4, AZ + 0.7], [5.4, 4.25, AZ + 0.7], 0.025, 5);
    jumboBag(S, 'bag', 5.4, AZ + 0.7, 0.85, 3.2);
    for (let i = 0; i < 3; i++) jumboBag(S, 'bag', 2.6 + i * 1.1, AZ + 4.4, 0.9);
    ingotBundle(S, 6.4, AZ + 4.4, 5); ingotBundle(S, 7.4, AZ + 4.4, 4);
    // 홈통: 보온로 → 탈가스 → 주조기
    S.box(1.4, 0.38, 0.55, 'refr', 8.25, 1.95, AZ); const launder2 = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.04, 0.3), alGlow); launder2.position.set(8.25, 2.15, AZ); scene.add(launder2);
    S.box(1.5, 1.3, 1.5, 'steelLt', 9.6, 1.65, AZ); S.box(1.2, 0.05, 1.2, 'refr', 9.6, 2.33, AZ);
    hcol(S, 'steel', 9.6, AZ + 0.6, 0, 1.0, 0.2); hcol(S, 'steel', 9.6, AZ - 0.6, 0, 1.0, 0.2);
    const degasGlow = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 1.1), alGlow); degasGlow.position.set(9.6, 2.33, AZ); scene.add(degasGlow);
    hcol(S, 'blue', 8.9, AZ - 1.0, 0, 4.6, 0.26); beam(S, 'blue', [8.9, 4.4, AZ - 1.0], [9.6, 4.4, AZ], 0.3, 0.4);
    S.box(0.6, 0.8, 0.6, 'blue', 9.6, 4.1, AZ); S.cyl(0.05, 0.05, 1.8, 'graphite', 9.6, 2.9, AZ, 0, 0, 0, 8);
    S.box(1.2, 0.36, 0.5, 'refr', 10.9, 1.55, AZ); const launder3 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.28), alGlow); launder3.position.set(10.9, 1.74, AZ); scene.add(launder3);
    // 드로스 박스
    S.box(1.1, 0.6, 0.9, 'steelDk', 9.4, 0.3, AZ + 2.0);
    heap(scene, { x: 9.4, z: AZ + 2.0, y0: 0.5, r: 0.45, h: 0.25, n: 30, geo: new THREE.DodecahedronGeometry(0.1), colors: [0x3E4045, 0x55585E], size: () => [1, 0.8, 1], seed: 81, core: false });
    // 잉곳 주조기 (경사진 연속 주형 체인)
    const casA = new THREE.Vector3(11.6, 1.25, AZ), casB = new THREE.Vector3(20.2, 2.0, AZ), casL = casA.distanceTo(casB), casAng = Math.atan2(casB.y - casA.y, casB.x - casA.x);
    [-0.62, 0.62].forEach(z => { beam(S, 'steelDk', [casA.x, casA.y - 0.15, AZ + z], [casB.x, casB.y - 0.15, AZ + z], 0.12, 0.42); beam(S, 'steelDk', [casA.x, casA.y - 0.75, AZ + z], [casB.x, casB.y - 0.75, AZ + z], 0.1, 0.2); });
    for (let i = 0; i <= 6; i++) { const u = i / 6, x = casA.x + (casB.x - casA.x) * u, y = casA.y + (casB.y - casA.y) * u; hcol(S, 'steel', x, AZ - 0.62, 0, y - 0.3, 0.2); hcol(S, 'steel', x, AZ + 0.62, 0, y - 0.3, 0.2); }
    S.cyl(0.38, 0.38, 1.3, 'steel', casA.x, casA.y - 0.45, AZ, PI / 2, 0, 0, 16); S.cyl(0.38, 0.38, 1.3, 'steel', casB.x, casB.y - 0.45, AZ, PI / 2, 0, 0, 16);
    S.box(0.6, 0.8, 0.8, 'blue', casB.x + 0.2, casB.y - 0.4, AZ - 1.2);
    rod(S, 'pipe', [14, 2.6, AZ - 0.7], [17.5, 2.9, AZ - 0.7], 0.06); rod(S, 'pipe', [14, 2.6, AZ + 0.7], [17.5, 2.9, AZ + 0.7], 0.06);
    // 적재 · 출하
    hcol(S, 'yellow', 21.0, AZ - 1.4, 0, 3.6, 0.26); hcol(S, 'yellow', 21.0, AZ + 1.4, 0, 3.6, 0.26); S.box(0.4, 0.4, 3.2, 'yellow', 21.0, 3.7, AZ);
    for (let i = 0; i < 3; i++) ingotBundle(S, 22.2 + (i % 2) * 1.0, AZ - 0.6 + Math.floor(i / 2) * 1.2, 6);
    ingotBundle(S, 23.2, AZ + 0.6, 6); ingotBundle(S, 22.2, AZ - 0.6, 5, 1.03);

    const NM = 34, casLoop = casL * 2 + PI * 0.4;
    const molds = new THREE.InstancedMesh(new THREE.BoxGeometry(0.48, 0.2, 1.0), getMat('steelDk'), NM); molds.castShadow = true; scene.add(molds);
    const alIngots = new THREE.InstancedMesh(new THREE.BoxGeometry(0.4, 0.08, 0.86), heatMat({ metalness: 0.85, roughness: 0.3 }), NM); scene.add(alIngots);
    const alHot = new THREE.Color(0xFF7A2A), alCold = new THREE.Color(0xC4CAD0);

    S.flush();

    // ── 입자 (원료 투입 · 집진 · 불꽃 · 연기)
    const pointMats = [];
    function stream(n, color, size, extra) {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      const m = new THREE.PointsMaterial(Object.assign({ color, size, sizeAttenuation: false }, extra || {})); m.userData.base = size; pointMats.push(m);
      const p = new THREE.Points(g, m); p.frustumCulled = false; scene.add(p); return p;
    }
    const smokeTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
    const sparks = stream(70, 0xFFB46A, 2.6);
    const tapSparks = stream(40, 0xFFC27A, 2.4);
    const injStream = stream(36, 0x111111, 3);
    const tapAlloy = stream(30, 0xC9CDD2, 3.2);
    const dustCurve = new THREE.CatmullRomCurve3(ductPts.map(p => new THREE.Vector3(...p)).concat([new THREE.Vector3(-8.6, 6, -10.5), new THREE.Vector3(-6.4, 5.6, -10.5), new THREE.Vector3(-5.2, 5.2, -10.6)]));
    const dustStream = stream(70, 0xB7BEC6, 3);
    const lfStreams = [0, 1, 2].map(i => stream(16, [0xE8ECEF, 0x9AA3AD, 0x151515][i], 3.2));
    const lfChute = new THREE.CatmullRomCurve3([[-0.2, 7.5, -3.0], [-0.6, 6.4, -2.0], [-1.3, 5.2, -0.8], [-1.6, 3.4, -0.4]].map(p => new THREE.Vector3(...p)));
    const smokeStack = stream(26, 0xC9CED4, 26, { map: smokeTex, transparent: true, opacity: 0.22, depthWrite: false });
    const smokeAl = stream(20, 0xC9CED4, 22, { map: smokeTex, transparent: true, opacity: 0.18, depthWrite: false });
    const cutSparks = stream(30, 0xFFC27A, 2.4);
    const mist = stream(50, 0xE6EEF4, 2.2, { transparent: true, opacity: 0.6 });
    const siStream = stream(26, 0x7F8BA0, 3);
    const bubbles = stream(24, 0xFFD6A8, 2.4);
    const chgDust = stream(24, 0xFFB46A, 2.4);

    // ── 라벨
    const L = [
      { k: 'st', text: '원료 야적', p: [-31, 3.6, -5.6], step: 1 },
      { k: 'st', text: '전기로', p: [-14, 14.6, -5.5], step: 1 },
      { k: 'in', text: '가탄제 · 소괴탄', p: [-25.6, 2.2, -0.6], step: 1 },
      { k: 'in', text: '가탄제 · 분탄 취입', p: [-8.8, 6.2, -2.3], step: 1 },
      { k: 'st', text: '출강', p: [-15.4, 3.0, 0.8], step: 2 },
      { k: 'in', text: '탈산제 · 페로실리콘', p: [-17.4, 8.4, 1.4], step: 2 },
      { k: 'st', text: '집진기', p: [2.6, 8.6, -10.6], step: 3 },
      { k: 'out', text: 'EAF Dust 자원화', p: [3.2, 1.5, -6.6], step: 3 },
      { k: 'st', text: 'LF 정련', p: [-2, 7.6, 1.2], step: 4 },
      { k: 'in', text: 'LF 가탄제 · 페로실리콘 · 탈산제', p: [-2, 11.6, -3.25], step: 4 },
      { k: 'st', text: '연속주조', p: [12.5, 5.4, 3.0], step: 5 },
      { k: 'st', text: '압연', p: [29.4, 3.4, 0], step: 5 },
      { k: 'out', text: '형강 · 철근 · 후판', p: [41, 1.6, 0.2], step: 5 },
      { k: 'in', text: '알루미늄 스크랩 · 잉곳', p: [-22.2, 2.4, 13.8], step: 6 },
      { k: 'st', text: '반사로 용해', p: [-5.5, 6.4, AZ], step: 6 },
      { k: 'in', text: '메탈실리콘 · 잉곳(희석)', p: [3.6, 5.9, AZ + 2.3], step: 6 },
      { k: 'st', text: '보온로 · 성분 조정', p: [6.2, 0.6, AZ + 1.6], step: 6, dy: 40 },
      { k: 'st', text: '탈가스 정련', p: [9.6, 5.0, AZ], step: 7 },
      { k: 'st', text: '잉곳 주조', p: [16, 3.4, AZ], step: 7 },
      { k: 'out', text: 'ADC12 합금 잉곳', p: [22.7, 1.6, AZ + 1.4], step: 7 }
    ].map(l => {
      const el = document.createElement('div');
      el.className = 'sl-label sl-' + l.k; el.textContent = l.text;
      labelLayer.appendChild(el);
      return Object.assign(l, { el, v: new THREE.Vector3(...l.p) });
    });

    // 단계별 카메라: 0 전체 · 1 전기로 · 2 출강 · 3 집진 · 4 LF · 5 연주·압연 · 6 알루미늄 용해 · 7 알루미늄 주조
    const steps = [
      { t: [8, 0, 5], size: 60, fx: 0.63, fy: 0.58 },
      { t: [-21, 4, -4], size: 21 },
      { t: [-13, 3, -1], size: 12 },
      { t: [-1, 5, -9], size: 18 },
      { t: [-2, 4.5, -1], size: 13 },
      { t: [21, 3, 0], size: 28 },
      { t: [-8, 2, AZ], size: 20 },
      { t: [14, 1.5, AZ], size: 15 }
    ];
    const v = new THREE.Vector3(), v2 = new THREE.Vector3(), clock = new THREE.Clock(), reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const phase = { bucket: 0, ladle: 0, chg: 0 };
    const cur = { tx: steps[0].t[0], ty: steps[0].t[1], tz: steps[0].t[2], size: steps[0].size, fx: 0.62, fy: 0.5 };
    let activeStep = 0;
    function focus(i) {
      activeStep = i; const s = steps[i], m = innerWidth < 760;
      gsap.to(cur, { tx: s.t[0], ty: s.t[1], tz: s.t[2], size: s.size * (m ? (i ? 1.6 : 2.0) : 1), fx: m ? 0.5 : (s.fx || 0.64), fy: m ? 0.32 : (s.fy || 0.5), duration: 1.4, ease: 'power3.inOut' });
      L.forEach(l => l.el.classList.toggle('dim', i > 0 && l.step !== i));
      const cue = { 1: ['bucket', 14, 0.08], 2: ['ladle', 22, 0.035], 4: ['ladle', 22, 0.265], 5: ['ladle', 22, 0.47], 6: ['chg', 16, 0.15] }[i];
      if (cue && !reduce) { const [k, T, want] = cue, now = ((clock.getElapsedTime() + phase[k]) % T) / T; phase[k] += ((want - now + 1) % 1) * T; }
    }

    function resize() {
      const w = container.clientWidth, h = container.clientHeight;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = w + 'px'; renderer.domElement.style.height = h + 'px';
    }
    addEventListener('resize', resize); resize();

    // 레이들 순환 (22초): 출강 → LF → 크레인으로 턴렛 → 주입 → 복귀
    const ladleKeys = [[0, -14, 0.55], [0.17, -14, 0.55], [0.24, -2, 0.55], [0.42, -2, 0.55], [0.47, 3, 0.55], [0.53, 3, 9.6], [0.58, 7, 9.6], [0.61, 7, 6.9], [0.76, 7, 6.9], [0.8, 7, 9.6], [0.84, 3, 9.6], [0.87, 3, 0.55], [0.97, -14, 0.55], [1, -14, 0.55]];
    const carKeys = [[0, -14], [0.17, -14], [0.24, -2], [0.42, -2], [0.47, 3], [0.87, 3], [0.97, -14], [1, -14]];
    const fillKeys = [[0, 0], [0.04, 0], [0.17, 1], [0.61, 1], [0.76, 0.12], [0.86, 0.12], [0.9, 0], [1, 0]];
    const tiltKeys = [[0, 0], [0.03, 0], [0.07, 0.11], [0.15, 0.11], [0.19, 0], [1, 0]];
    const lfKeys = [[0, 1], [0.25, 1], [0.28, 0], [0.39, 0], [0.42, 1], [1, 1]];
    // 장입기 (16초): 야적장 → 도어 앞 → 도어 열림 → 전진 · 투입 → 후진 → 복귀
    const chgKeys = [[0, -19, 19.2, 1, 0], [0.1, -19, 19.2, 1, 0], [0.3, -3.5, 19.2, 1, 0], [0.36, -3.5, 19.2, 1, 1], [0.44, -3.5, 17.3, 1, 1], [0.5, -3.5, 17.3, 0, 1], [0.58, -3.5, 19.2, 0, 1], [0.63, -3.5, 19.2, 0, 0], [0.85, -19, 19.2, 0, 0], [0.95, -19, 19.2, 1, 0], [1, -19, 19.2, 1, 0]];
    const bucketKeys = [[0, -30, 3.2, -5.4, 1], [0.12, -30, 3.2, -5.4, 1], [0.24, -30, 10.5, -5.4, 1], [0.42, -14, 10.5, -4, 1], [0.48, -14, 8.6, -4, 1], [0.54, -14, 8.6, -4, 0], [0.6, -14, 10.5, -4, 0], [0.8, -30, 10.5, -5.4, 0], [0.9, -30, 3.2, -5.4, 0], [1, -30, 3.2, -5.4, 1]];
    const holdKeys = [[0, 0], [0.3, 0], [0.4, 0.05], [0.8, 0.05], [0.9, 0], [1, 0]];

        let visible = true;
    new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(container);
    const tapLocal = new THREE.Vector3(0.7, -0.15, 3.1);
    function setPts(pts, fn) { const a = pts.geometry.attributes.position; for (let i = 0; i < a.count; i++) { fn(i, v); a.setXYZ(i, v.x, v.y, v.z); } a.needsUpdate = true; }
    const hideAll = pts => setPts(pts, (i, o) => o.set(0, -50, 0));

    (function loop() {
      requestAnimationFrame(loop);
      if (!visible) return;
      const t = reduce ? 4 : clock.getElapsedTime();

      // 카메라
      const w = container.clientWidth, h = container.clientHeight, asp = w / h;
      const W = cur.size * asp; cam.left = -cur.fx * W; cam.right = (1 - cur.fx) * W; cam.top = cur.fy * cur.size; cam.bottom = -(1 - cur.fy) * cur.size;
      cam.updateProjectionMatrix();
      target.set(cur.tx, cur.ty, cur.tz);
      cam.position.copy(target).addScaledVector(camDir, 90); cam.lookAt(target);
      const zoomK = Math.min(2.2, Math.max(0.7, 22 / cur.size));
      pointMats.forEach(m => { m.size = m.userData.base * zoomK; });

      const flick = 0.75 + Math.sin(t * 23) * 0.12 + Math.sin(t * 37) * 0.1;

      // 장입 버킷 (14초)
      const bt = ((t + phase.bucket) % 14) / 14, bk = track(bucketKeys, bt);
      bucket.position.set(bk[0], bk[1], bk[2]); bucketLoad.visible = bk[3] > 0.5;
      crane.position.x = bk[0]; trolley.position.z = bk[2];
      hoists.forEach(hh => { const top = 14.6, bot = bk[1] + 1.45; hh.scale.y = top - bot; hh.position.set(bk[0] + hh.userData.dx, (top + bot) / 2, bk[2]); });
      const dumping = bt > 0.5 && bt < 0.56;

      // 전기로
      const lt = ((t + phase.ladle) % 22) / 22;
      tilt.rotation.x = track(tiltKeys, lt)[0];
      eafLight.intensity = 7 * flick; eafGlow.emissiveIntensity = 2.4 * flick;
      elecs.forEach((e, i) => e.position.y = Math.sin(t * 1.3 + i * 2) * 0.08);
      setPts(sparks, (i, o) => {
        const u = ((t * 1.5 + hash(i)) % 1), a = hash(i * 7) * PI * 2, r = u * (dumping ? 2.4 : 1.4);
        if (i < 40) o.set(-11 + u * 1.4, 4.8 + u * 1.8 - u * u * 2.8, -4 + (hash(i * 3) - 0.5) * 0.8);
        else o.set(-14 + Math.cos(a) * r * 0.6, 7.3 + u * 2.6 - u * u * 2.2, -4 + Math.sin(a) * r * 0.6);
      });
      setPts(injStream, (i, o) => { const u = ((t * 1.3 + i / 36) % 1); o.set(-9.4 - u * 1.65, 4.6 - u * 0.75, -3.4 - u * 0.45); });
      setPts(smokeStack, (i, o) => { const u = ((t * 0.08 + i / 26) % 1); o.set(7.0 + Math.sin(i * 3.1 + t * 0.3) * u * 1.4, 17.2 + u * 6, -10.6 + Math.cos(i * 1.7) * u * 1.2); });

      // 출강
      v2.copy(tapLocal); tilt.localToWorld(v2);
      const tapping = lt > 0.045 && lt < 0.17;
      tapStream.visible = tapping; tapStream.position.copy(v2);
      if (tapping) {
        setPts(tapSparks, (i, o) => { const u = ((t * 2 + hash(i)) % 1), a = hash(i * 5) * PI * 2; o.set(-14 + Math.cos(a) * u * 1.2, 2.5 + u * 1.2 - u * u * 1.6, Math.sin(a) * u * 1.2); });
        setPts(tapAlloy, (i, o) => { const u = ((t * 0.9 + i / 30) % 1); o.set(-17.4 + 2.8 * u + (hash(i) - 0.5) * 0.1, 5.6 - u * 2.9, 1.4 - u * 1.2); });
      } else { hideAll(tapSparks); hideAll(tapAlloy); }

      // 레이들 · 운반차 · CC 크레인
      const lk = track(ladleKeys, lt), ck = track(carKeys, lt), fill = track(fillKeys, lt)[0];
      ladle.g.position.set(lk[0], lk[1], 0); car.position.set(ck[0], 0, 0);
      ladle.melt.visible = fill > 0.03; ladle.melt.position.y = 0.4 + 1.46 * fill; ladleLight.intensity = 3 * fill;
      ccCrane.position.x = Math.min(7, Math.max(3, lk[0]));
      const hooked = lt > 0.46 && lt < 0.88;
      ccHoists.forEach(hh => { const top = 13.6, bot = hooked ? lk[1] + 1.9 : 11.5; hh.scale.y = top - bot; hh.position.y = (top + bot) / 2; });
      shroud.visible = lt > 0.61 && lt < 0.76;
      strandMat.emissiveIntensity = 1.9 + Math.sin(t * 2) * 0.15;
      setPts(cutSparks, (i, o) => { const u = ((t * 2.2 + hash(i)) % 1), a = hash(i * 9) * PI; o.set(16.8 + (hash(i * 2) - 0.5) * 0.3, 0.8 - u * 0.6, Math.cos(a) * u * 0.9); });

      // LF
      const lfUp = track(lfKeys, lt)[0], lfOn = lfUp < 0.05 && lt > 0.25 && lt < 0.42;
      lfTop.position.y = 2.75 + lfUp * 1.2;
      lfLight.intensity = lfOn ? 5 * flick : 0;
      lfStreams.forEach((s, si) => {
        if (lt > 0.29 && lt < 0.39) setPts(s, (i, o) => {
          const u = ((t * 0.8 + i / 16 + si * 0.33) % 1), bx = -3.4 + si * 1.4;
          if (u < 0.3) { const k = u / 0.3; o.set(bx + (-0.2 - bx) * k, 8.5, -3.25 + (hash(i) - 0.5) * 0.2); }
          else { lfChute.getPoint((u - 0.3) / 0.7, o); o.x += (hash(i + si) - 0.5) * 0.15; }
        }); else hideAll(s);
      });

      // 집진
      setPts(dustStream, (i, o) => { const u = ((t * 0.3 + i / 70) % 1); dustCurve.getPoint(u, o); o.x += (hash(i) - 0.5) * 0.4; o.y += (hash(i + 9) - 0.5) * 0.4; });

      // 빌릿: 절단 → 가열로(안 보임) → 압연하며 늘어남 → 냉각대
      for (let i = 0; i < NB; i++) {
        const u = ((t * 0.045 + i / NB) % 1), x = 17.4 + u * 17.4, show = !(x > 20.2 && x < 24.8);
        let sx = 1;
        if (x < 20.2) tmpC.copy(hot).lerp(warm, (x - 17.4) / 2.8);
        else { const k = Math.min(1, Math.max(0, (x - 25.5) / 8)); sx = 1 + k * 1.2; tmpC.copy(hot).lerp(warm, k * 0.8).lerp(cold, Math.max(0, k - 0.6) * 1.2); }
        const sc = show ? 1 : 0.0001;
        tmpM.makeScale(sx * sc, sc / Math.sqrt(sx), sc / Math.sqrt(sx)).setPosition(x, 0.72, 0);
        billets.setMatrixAt(i, tmpM); billets.setColorAt(i, tmpC);
      }
      billets.instanceMatrix.needsUpdate = true; billets.instanceColor.needsUpdate = true;

      // 알루미늄: 장입기 · 도어
      const ct = ((t + phase.chg) % 16) / 16, ch = track(chgKeys, ct);
      chg.position.set(ch[0], 0, ch[1]); chgLoad.visible = ch[2] > 0.5;
      alDoors[1].position.y = ch[3] * 2.3;
      alGlow.emissiveIntensity = 2.1 + Math.sin(t * 9) * 0.12 + Math.sin(t * 17) * 0.08;
      if (ct > 0.43 && ct < 0.52) setPts(chgDust, (i, o) => { const u = ((t * 2 + hash(i)) % 1), a = hash(i * 3) * PI; o.set(-3.8 + Math.cos(a) * u * 1.2, 1.4 + u * 1.4 - u * u * 1.6, AZ + 2.4 + Math.sin(a) * u * 0.8); });
      else hideAll(chgDust);
      setPts(smokeAl, (i, o) => { const u = ((t * 0.07 + i / 20) % 1); o.set(-11.3 + Math.sin(i * 2.3 + t * 0.2) * u * 1.2, 6.8 + u * 4, AZ - 0.8 + Math.cos(i * 1.3) * u); });
      hold.rotation.z = -track(holdKeys, (t % 8) / 8)[0];
      setPts(siStream, (i, o) => { const u = ((t * 0.7 + i / 26) % 1); o.set(5.4 + (hash(i) - 0.5) * 0.25, 3.15 - u * 0.9, AZ + 0.7 + (hash(i + 3) - 0.5) * 0.25); });
      setPts(bubbles, (i, o) => { const u = ((t * 1.2 + hash(i)) % 1), a = hash(i * 4) * PI * 2; o.set(9.6 + Math.cos(a) * 0.45, 2.33 + u * 0.35, AZ + Math.sin(a) * 0.45); });
      setPts(mist, (i, o) => { const u = ((t * 0.25 + hash(i)) % 1); o.set(14 + hash(i * 2) * 3.6, 2.0 + u * 1.4, AZ + (hash(i * 5) - 0.5) * 1.4); });

      // 주형 체인 + 잉곳
      for (let i = 0; i < NM; i++) {
        const s = ((t * 0.32 + i * casLoop / NM) % casLoop);
        let x, y, rz, top = false;
        if (s < casL) { const u = s / casL; x = casA.x + (casB.x - casA.x) * u; y = casA.y + (casB.y - casA.y) * u; rz = casAng; top = true; }
        else if (s < casL + PI * 0.2) { const a = (s - casL) / 0.2; x = casB.x + Math.sin(a) * 0.2; y = casB.y - 0.45 + Math.cos(a) * 0.45; rz = casAng - a; }
        else if (s < casL * 2 + PI * 0.2) { const u = (s - casL - PI * 0.2) / casL; x = casB.x + (casA.x - casB.x) * u; y = casB.y - 0.9 + (casA.y - casB.y) * u; rz = casAng + PI; }
        else { const a = (s - casL * 2 - PI * 0.2) / 0.2; x = casA.x - Math.sin(a) * 0.2; y = casA.y - 0.9 + (1 - Math.cos(a)) * 0.45; rz = casAng + PI + a; }
        _o.position.set(x, y, AZ); _o.rotation.set(0, 0, rz); _o.scale.set(1, 1, 1); _o.updateMatrix(); molds.setMatrixAt(i, _o.matrix);
        if (top) { _o.position.y += 0.1; _o.updateMatrix(); alIngots.setMatrixAt(i, _o.matrix); const k = (x - casA.x) / (casB.x - casA.x); tmpC.copy(alHot).lerp(alCold, Math.min(1, k * 1.6)); alIngots.setColorAt(i, tmpC); }
        else { tmpM.makeScale(0.0001, 0.0001, 0.0001); alIngots.setMatrixAt(i, tmpM); alIngots.setColorAt(i, alCold); }
      }
      molds.instanceMatrix.needsUpdate = true; alIngots.instanceMatrix.needsUpdate = true; alIngots.instanceColor.needsUpdate = true;

      renderer.render(scene, cam);

      // 라벨 투영
      const mob = w < 760;
      L.forEach(l => {
        v.copy(l.v).project(cam);
        if (!l.half) l.half = l.el.offsetWidth / 2;
        const x = Math.min(w - l.half - 8, Math.max(l.half + 8, (v.x * 0.5 + 0.5) * w)), y = (-v.y * 0.5 + 0.5) * h + (l.dy || 0);
        // 왼쪽(모바일은 아래쪽) 설명 문구 영역에 들어간 라벨은 숨긴다
        l.el.style.opacity = (mob ? y > h * 0.56 : x - l.half < w * 0.36) ? '0' : '';
        l.el.style.transform = `translate(${x}px,${y}px) translate(-50%,-100%)`;
        l.el.style.visibility = (v.x < -1.1 || v.x > 1.1 || v.y < -1.1 || v.y > 1.1) ? 'hidden' : 'visible';
      });
    })();

    focus(0);
    return { focus, steps: steps.length, get active() { return activeStep; } };
  }

  window.SteelLine = { mount };
})();
