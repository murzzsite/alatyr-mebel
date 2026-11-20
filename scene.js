/* 3D-сцена «кухня по стене»: прогресс скролла (window.ALT.S.p, 0..1) ведёт замер, корпуса, фасады и столешницу */
const A = window.ALT = window.ALT || { S: { p: 0 }, fin: '#c9a574' };
const canvas = document.getElementById('c3d');
const fail = () => document.documentElement.classList.add('no3d');

(async () => {
  try {
    if (!canvas) throw 0;
    const probe = document.createElement('canvas');
    if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) throw 0;
    const THREE = await import('three');
    init(THREE);
  } catch (e) { console.warn('3D off', e); fail(); }
})();

function init(THREE) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const stage = canvas.parentElement;
  const small = innerWidth < 900;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 60);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb9c4c2, 2.0));
  const sun = new THREE.DirectionalLight(0xffffff, 2.3);
  sun.position.set(2.5, 5.5, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -2, near: 0.5, far: 20 });
  sun.shadow.bias = -0.0006; sun.shadow.radius = 4;
  scene.add(sun);

  const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.82, metalness: 0, ...o });
  const box = (w, h, d, m) => { const x = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); x.castShadow = true; x.receiveShadow = true; return x; };
  const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const seg = (p, a, b) => cl((p - a) / (b - a));
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  const frontMat = mat(A.fin, { roughness: 0.7 });
  const bodyMat = mat(0xe9e6dc), topMat = mat(0x3d484e, { roughness: 0.5 }), handleMat = mat(0xe29a14, { roughness: 0.35, metalness: 0.25 });
  const plinthMat = mat(0x1a2327);
  const target = new THREE.Color(A.fin);

  /* стена и пол */
  const L = 3.0, N = 6, mw = L / N;
  const wall = box(9, 3.2, 0.04, mat(0xf4f5f1)); wall.position.set(0, 1.5, -0.02); scene.add(wall);
  const floor = box(9, 0.04, 4, mat(0xc4ccca)); floor.position.set(0, -0.02, 1.8); scene.add(floor);

  /* камень на стене */
  const stone = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.02, 48), mat(0xe29a14, { roughness: 0.6 }));
  stone.rotation.x = Math.PI / 2; stone.position.set(0, 1.78, 0.01); stone.castShadow = false; scene.add(stone);

  /* размерная линия замера */
  const dimMat = new THREE.MeshBasicMaterial({ color: 0xe29a14 });
  const dim = new THREE.Group(); scene.add(dim);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(L, 0.018, 0.018), dimMat); bar.position.set(0, 2.42, 0.05); dim.add(bar);
  [-L / 2, L / 2].forEach(x => { const t = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.2, 0.018), dimMat); t.position.set(x, 2.42, 0.05); dim.add(t); });
  const vbar = new THREE.Mesh(new THREE.BoxGeometry(0.018, 2.2, 0.018), dimMat); vbar.position.set(-L / 2 - 0.16, 1.1, 0.05); dim.add(vbar);

  /* детали: home, смещение, окно сборки */
  const parts = [];
  const add = (mesh, home, from, a, b, shadow = true) => {
    mesh.position.copy(home); mesh.castShadow = shadow; scene.add(mesh);
    parts.push({ m: mesh, home: home.clone(), from, a, b });
  };
  const rnd = (i, k) => Math.sin(i * 12.9898 + k * 78.233) * 0.5;
  const wallMods = [0, 1, 4, 5];
  let n = 0;
  /* корпуса */
  const cx = k => -L / 2 + mw * (k + 0.5);
  for (let k = 0; k < N; k++) add(box(mw - 0.012, 0.72, 0.56, bodyMat), V(cx(k), 0.1 + 0.36, 0.28), V(rnd(k, 1) * 3, 1.2 + rnd(k, 2), 2.4), .20 + k * .018, .34 + k * .018);
  add(box(L - 0.02, 0.1, 0.5, plinthMat), V(0, 0.05, 0.27), V(0, -.4, 2), .2, .3);
  wallMods.forEach((k, j) => add(box(mw - 0.012, 0.7, 0.33, bodyMat), V(cx(k), 1.85, 0.165), V(rnd(k, 3) * 3, 1.4, 2.2), .24 + j * .02, .38 + j * .02));
  /* фасады */
  for (let k = 0; k < N; k++) {
    if (k === 2) {
      [0, 1, 2].forEach(j => {
        add(box(mw - 0.02, 0.22, 0.02, frontMat), V(cx(k), 0.1 + 0.115 + j * 0.24, 0.57), V(0, rnd(k, j) * 1.5, 3.2), .46 + j * .02 + k * .012, .60 + j * .02 + k * .012);
        add(box(0.16, 0.014, 0.02, handleMat), V(cx(k), 0.1 + 0.16 + j * 0.24, 0.595), V(0, 0, 1), .80 + j * .015, .90 + j * .015, false);
      });
    } else {
      add(box(mw - 0.02, 0.7, 0.02, frontMat), V(cx(k), 0.1 + 0.36, 0.57), V(rnd(k, 5) * 2, rnd(k, 6), 3.2), .46 + k * .02, .62 + k * .02);
      add(box(0.014, 0.18, 0.02, handleMat), V(cx(k) + (k % 2 ? -0.18 : 0.18), 0.72, 0.595), V(0, 0, 1), .80 + k * .012, .90 + k * .012, false);
    }
  }
  wallMods.forEach((k, j) => {
    add(box(mw - 0.02, 0.68, 0.02, frontMat), V(cx(k), 1.85, 0.345), V(rnd(k, 8) * 2, 1, 3), .52 + j * .02, .68 + j * .02);
    add(box(0.014, 0.16, 0.02, handleMat), V(cx(k) + (k < 2 ? 0.18 : -0.18), 1.62, 0.37), V(0, 0, 1), .82 + j * .012, .92 + j * .012, false);
  });
  /* столешница */
  add(box(L + 0.04, 0.04, 0.64, topMat), V(0, 0.84, 0.31), V(0, 2.4, 0.4), .70, .86);

  /* камера: вписываем стену в кадр */
  const fit = () => {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const t = Math.tan(camera.fov * Math.PI / 360);
    const asp = w / h;
    const dH = (small ? 4.3 : 4.5) / 2 / t;
    const dW = 4.6 / 2 / (t * asp);
    cam.d = Math.max(dH, dW);
    camera.updateProjectionMatrix();
    dirty = true;
  };
  const cam = { d: 6, x: 0, y: 0 };
  let dirty = true;
  new ResizeObserver(fit).observe(stage); fit();

  let tx = 0, ty = 0;
  if (fine && !reduce) addEventListener('pointermove', e => { tx = (e.clientX / innerWidth - .5); ty = (e.clientY / innerHeight - .5); });

  let visible = true;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold: 0 }).observe(stage);

  const draw = () => {
    const p = reduce ? 1 : A.S.p;
    /* замер */
    const m = easeOut(seg(p, .01, .14)), mOut = 1 - seg(p, .44, .52);
    dim.scale.set(Math.max(m, 0.001), 1, 1); dim.visible = mOut > 0 && m > 0.01;
    stone.scale.setScalar(Math.max(easeOut(seg(p, 0, .1)), .001));
    stone.position.y = 1.78 + (1 - easeOut(seg(p, 0, .1))) * 0.2;
    /* детали */
    parts.forEach(o => {
      const t = ease(seg(p, o.a, o.b));
      o.m.visible = t > 0.001;
      o.m.position.set(o.home.x + o.from.x * (1 - t), o.home.y + o.from.y * (1 - t), o.home.z + o.from.z * (1 - t));
    });
    /* цвет фасадов */
    target.set(A.fin); frontMat.color.lerp(target, reduce ? 1 : .14);
    /* камера */
    const yaw = reduce ? 0 : (-0.22 + p * .3) + tx * .22, pitch = 1.38 + ty * -.18 + (reduce ? 0 : (1 - p) * .1);
    camera.position.set(Math.sin(yaw) * cam.d, pitch + 0.1, Math.cos(yaw) * cam.d);
    camera.lookAt(0, 1.5, 0.2);
    renderer.render(scene, camera);
  };
  const loop = () => {
    requestAnimationFrame(loop);
    if (document.hidden || !visible) return;
    if (reduce) { if (!dirty && !A.dirty) return; dirty = false; A.dirty = false; }
    draw();
  };
  loop();
}
