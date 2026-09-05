import * as T from 'three';
export type Snapshot = {
  suns: number;
  houses: number;
  message: string;
  won: boolean;
};
export type World = {
  lane: (d: number) => void;
  bell: () => void;
  pause: (p: boolean) => void;
  dispose: () => void;
};
type Token = { group: T.Group; kind: 'sun' | 'mail' | 'bush'; used: boolean };
export function createWorld(
  canvas: HTMLCanvasElement,
  chapter: number,
  update: (s: Snapshot) => void,
  sound: (s: 'paint' | 'sparkle' | 'win' | 'hint' | 'wrong') => void,
): World {
  const renderer = new T.WebGLRenderer({
    canvas,
    antialias: false,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  const scene = new T.Scene(),
    sky = ['#c2e7e9', '#f6d8c7', '#d0e6d3', '#c8d4ef', '#f3d7df'][chapter % 5];
  scene.background = new T.Color(sky);
  scene.fog = new T.Fog(sky, 35, 100);
  const camera = new T.PerspectiveCamera(43, 1, 0.1, 150);
  scene.add(new T.HemisphereLight('#fff9db', '#658982', 2.6));
  const light = new T.DirectionalLight('#fff2cf', 3);
  light.position.set(-8, 18, 10);
  scene.add(light);
  const mats = new Map<string, T.MeshStandardMaterial>();
  const geometries: T.BufferGeometry[] = [];
  const boxGeo = new T.BoxGeometry(1, 1, 1),
    ballGeo = new T.SphereGeometry(1, 10, 7),
    coneGeo = new T.ConeGeometry(1, 1, 6);
  geometries.push(boxGeo, ballGeo, coneGeo);
  function mat(color: string) {
    if (!mats.has(color))
      mats.set(color, new T.MeshStandardMaterial({ color, roughness: 0.85 }));
    return mats.get(color)!;
  }
  function mesh(
    p: T.Object3D,
    g: T.BufferGeometry,
    c: string,
    pos: number[],
    s: number[],
  ) {
    const m = new T.Mesh(g, mat(c));
    m.position.set(pos[0], pos[1], pos[2]);
    m.scale.set(s[0], s[1], s[2]);
    p.add(m);
    return m;
  }
  const box = (p: T.Object3D, c: string, pos: number[], s: number[]) =>
    mesh(p, boxGeo, c, pos, s);
  const ball = (p: T.Object3D, c: string, pos: number[], s: number[]) =>
    mesh(p, ballGeo, c, pos, s);
  function rod(p: T.Object3D, a: number[], b: number[], c: string, r = 0.045) {
    const from = new T.Vector3(...a),
      to = new T.Vector3(...b),
      d = to.clone().sub(from);
    const g = new T.CylinderGeometry(r, r, d.length(), 6);
    geometries.push(g);
    const m = mesh(
      p,
      g,
      c,
      from.clone().add(to).multiplyScalar(0.5).toArray(),
      [1, 1, 1],
    );
    m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize());
  }
  box(scene, '#8ebca0', [0, -0.25, -36], [200, 0.4, 200]);
  box(scene, '#ecdbc0', [0, -0.015, -35], [9, 0.12, 130]);
  for (const x of [-4.65, 4.65])
    box(scene, '#fff0d0', [x, 0.02, -35], [0.16, 0.12, 130]);
  for (let i = 0; i < 8; i++) {
    ball(
      scene,
      ['#8aafa0', '#99c0a6', '#b7cbae'][i % 3],
      [(i - 4) * 15, 1, -68 - (i % 3) * 8],
      [14, 8 + (i % 3) * 3, 10],
    );
    for (let j = 0; j < 3; j++)
      ball(
        scene,
        '#fff8ec',
        [
          (i - 4) * 14 + j * 2,
          15 + (i % 3) * 3 + Math.sin(j) * 0.6,
          -45 - (i % 2) * 15,
        ],
        [2.8, 1.1, 1.3],
      );
  }
  ball(scene, '#ffde91', [-19, 17, -60], [3, 3, 3]);
  const decor: T.Group[] = [],
    windows: T.Mesh[] = [];
  for (let i = 0; i < 24; i++) {
    const g = new T.Group();
    g.position.set((i % 2 ? 1 : -1) * (6.5 + (i % 4) * 1.6), 0, 12 - i * 4);
    scene.add(g);
    decor.push(g);
    if (i % 4 === 0) {
      box(g, '#f7e8cf', [0, 1.1, 0], [2.4, 2.2, 2.4]);
      const roof = mesh(
        g,
        coneGeo,
        ['#bf7f92', '#7b9baa', '#cf9b78'][i % 3],
        [0, 3, 0],
        [2.2, 1.7, 2.2],
      );
      roof.rotation.y = Math.PI / 6;
      box(g, '#a08579', [0, 0.6, 1.23], [0.6, 1.2, 0.07]);
      for (const x of [-0.7, 0.7])
        windows.push(box(g, '#667c83', [x, 1.5, 1.23], [0.55, 0.6, 0.08]));
      box(g, '#eadcc0', [0.7, 3, 0], [0.35, 1.7, 0.35]);
    } else {
      rod(g, [0, 0, 0], [0, 2.6, 0], '#a1846e', 0.17);
      ball(
        g,
        ['#739e87', '#ecb4c5', '#b6c793'][i % 3],
        [0, 3, 0],
        [1.45, 1.9, 1.4],
      );
      ball(
        g,
        ['#8db195', '#f2c5d1', '#c5d6a0'][i % 3],
        [0.7, 3.4, 0],
        [0.9, 1.2, 1],
      );
    }
    for (let j = 0; j < 3; j++)
      ball(
        g,
        ['#f6cc76', '#f3b9c6', '#eee0f6'][j],
        [j * 0.4 - 1, 0.16, 1.8],
        [0.17, 0.16, 0.17],
      );
  }
  const rider = new T.Group();
  rider.position.set(0, 0, 5);
  scene.add(rider);
  ball(rider, '#b6bb98', [0, .08, 0], [.65, .012, 1.4]);
  const wheels: T.Group[] = [],
    legs: T.Group[] = [];
  const tireGeo = new T.TorusGeometry(0.48, 0.055, 6, 18);
  geometries.push(tireGeo);
  for (const z of [-0.72, 0.72]) {
    const w = new T.Group();
    rider.add(w);
    w.position.set(0, 0.5, z);
    wheels.push(w);
    mesh(w, tireGeo, '#3e5159', [0, 0, 0], [1, 1, 1]).rotation.y = Math.PI / 2;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      rod(
        w,
        [0, 0, 0],
        [0, Math.sin(a) * 0.44, Math.cos(a) * 0.44],
        '#d9e3de',
        0.012,
      );
    }
  }
  const back = [0, 0.5, 0.72],
    crank = [0, 0.48, 0],
    seat = [0, 1.14, 0.48],
    front = [0, 0.5, -0.72],
    fork = [0, 1.2, -0.5];
  for (const [a, b] of [
    [back, crank],
    [crank, seat],
    [seat, back],
    [seat, fork],
    [fork, crank],
    [fork, front],
  ])
    rod(rider, a, b, '#e83e48', 0.055);
  rod(rider, seat, [0, 1.35, 0.5], '#e83e48');
  box(rider, '#775965', [0, 1.37, 0.5], [0.35, 0.1, 0.38]);
  rod(rider, fork, [0, 1.53, -0.57], '#cad8d4');
  rod(rider, [-0.38, 1.53, -0.57], [0.38, 1.53, -0.57], '#56636a');
  box(rider, '#d6a77a', [0, 1.18, -1], [0.55, 0.43, 0.42]);
  for (let i = 0; i < 4; i++)
    box(rider, '#efd2a0', [-0.23 + i * 0.15, 1.18, -1.22], [0.04, 0.35, 0.03]);
  ball(rider, '#efbd99', [0, 2.2, 0.17], [0.28, 0.33, 0.28]);
  ball(rider, '#aa7b52', [0, 2.23, 0.3], [0.3, 0.34, 0.25]);
  ball(rider, '#b38a59', [0, 1.99, 0.5], [0.22, 0.36, 0.2]);
  ball(rider, '#e95864', [0, 2.45, 0.17], [0.34, 0.17, 0.34]);
  mesh(
    rider,
    coneGeo,
    '#d69fb9',
    [0, 1.73, 0.35],
    [0.36, 0.62, 0.4],
  ).rotation.x = -0.16;
  for (const x of [-0.2, 0.2]) {
    rod(rider, [x, 1.94, 0.23], [x * 1.8, 1.54, -0.54], '#efbd99', 0.065);
    const leg = new T.Group();
    leg.position.set(x, 1.42, 0.42);
    rider.add(leg);
    legs.push(leg);
    rod(leg, [0, 0, 0], [0, -0.35, -0.33], '#efbd99', 0.085);
    rod(leg, [0, -0.35, -0.33], [0, -0.7, -0.16], '#efbd99', 0.07);
    box(leg, '#fff2dc', [0, -0.71, -0.25], [0.18, 0.12, 0.32]);
  }
  const ringGeo = new T.TorusGeometry(1, 0.035, 5, 40);
  geometries.push(ringGeo);
  const ringMat = new T.MeshBasicMaterial({
    color: '#fff0a8',
    transparent: true,
  });
  const ring = new T.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.visible = false;
  scene.add(ring);
  const tokens: Token[] = [];
  let paused = true,
    disposed = false,
    frame = 0,
    last = 0,
    time = 0,
    distance = 0,
    lane = 1,
    suns = 0,
    houses = 0,
    slow = 0,
    bellTime = 0,
    cooldown = 0,
    won = false,
    nextWave = 0,
    needsRender = true;
  let message = 'Trois soleils pour réveiller une maison.';
  const report = () => {
    needsRender = true;
    update({ suns, houses, message, won });
  };
  function spawn(kind: Token['kind'], l: number, z: number) {
    const g = new T.Group();
    g.position.set((l - 1) * 2.6, 0, z);
    scene.add(g);
    if (kind === 'sun') {
      ball(g, '#ffd36b', [0, 1.15, 0], [0.35, 0.35, 0.16]);
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        box(
          g,
          '#ffe8a0',
          [Math.sin(a) * 0.48, 1.15 + Math.cos(a) * 0.48, 0],
          [0.075, 0.19, 0.08],
        ).rotation.z = -a;
      }
    } else if (kind === 'mail') {
      box(g, '#aa8a73', [0, 0.6, 0], [0.15, 1.2, 0.15]);
      box(g, '#b87895', [0, 1.35, 0], [1, 0.7, 0.65]);
      box(g, '#fff1d0', [0, 1.37, 0.34], [0.7, 0.4, 0.04]);
      for (const x of [-0.85, 0.85])
        box(g, '#e5c89a', [x, 1.25, 0], [0.09, 2.5, 0.09]);
      box(g, '#e5c89a', [0, 2.5, 0], [1.8, 0.09, 0.09]);
      ball(g, '#ffcf69', [0, 2.5, 0], [0.2, 0.2, 0.2]);
    } else
      for (let i = 0; i < 3; i++)
        ball(
          g,
          ['#759b7d', '#8ead7d', '#b0bb7c'][i],
          [(i - 1) * 0.35, 0.35, 0],
          [0.45, 0.4, 0.4],
        );
    tokens.push({ group: g, kind, used: false });
  }
  function wave() {
    const base = -(nextWave * 95 + 20 - distance),
      l = (nextWave + chapter) % 3;
    for (let i = 0; i < 6; i++)
      spawn('sun', i < 3 ? l : (l + 1) % 3, base - i * 9);
    spawn('bush', (l + 1) % 3, base - 59);
    spawn('mail', (l + 1) % 3, base - 74);
    nextWave++;
  }
  wave();
  function resize() {
    const w = canvas.clientWidth,
      h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.set(w < h ? 5 : 8, w < h ? 10 : 8, w < h ? 22 : 18);
    camera.lookAt(0, 1, -9);
    camera.updateProjectionMatrix();
    needsRender = true;
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  function animate(now: number) {
    if (disposed) return;
    frame = requestAnimationFrame(animate);
    const dt = Math.min((now - last) / 1000 || 0, 0.04);
    last = now;
    if (!paused && !won) {
      time += dt;
      cooldown = Math.max(0, cooldown - dt);
      slow = Math.max(0, slow - dt);
      bellTime = Math.max(0, bellTime - dt);
      const speed = (slow > 0 ? 3 : 7 + chapter * 0.25) * dt;
      distance += speed;
      rider.position.x = T.MathUtils.damp(
        rider.position.x,
        (lane - 1) * 2.6,
        8,
        dt,
      );
      rider.rotation.z = T.MathUtils.damp(
        rider.rotation.z,
        ((lane - 1) * 2.6 - rider.position.x) * -0.13,
        8,
        dt,
      );
      rider.position.y = Math.sin(time * 8) * 0.015;
      wheels.forEach((w) => (w.rotation.x -= speed * 2));
      legs.forEach(
        (l, i) => (l.rotation.x = Math.sin(time * 8 + i * Math.PI) * 0.33),
      );
      decor.forEach((g) => {
        g.position.z += speed;
        if (g.position.z > 20) g.position.z -= 100;
      });
      if (nextWave * 95 - distance < 95) wave();
      tokens.forEach((t) => {
        t.group.position.z += speed;
        if (t.kind === 'sun') {
          t.group.rotation.y = time * 1.7;
          t.group.position.y = Math.sin(time * 2 + t.group.position.z) * 0.08;
        }
        if (
          !t.used &&
          Math.abs(t.group.position.z - 5) < 0.8 &&
          Math.abs(t.group.position.x - rider.position.x) < 1.05
        ) {
          t.used = true;
          t.group.visible = false;
          if (t.kind === 'sun') {
            suns++;
            sound('paint');
            message = 'Un petit morceau de soleil dans ton panier.';
          }
          if (t.kind === 'bush') {
            slow = 1.6;
            sound('wrong');
            message = 'Des feuilles ! Sonne pour dégager le chemin.';
          }
          if (t.kind === 'mail') {
            if (suns >= 3) {
              suns -= 3;
              houses++;
              sound('sparkle');
              message = 'Une maison réveillée ! Le village te dit merci.';
              windows
                .slice(0, houses * 4)
                .forEach((w) => (w.material = mat('#ffdb79')));
              light.intensity = 3 + houses * 0.3;
            } else
              message = 'Encore quelques soleils… une autre boîte arrive !';
            if (houses === 3) {
              won = true;
              message = 'Grâce à Lola, le village retrouve son soleil.';
              sound('win');
            }
          }
          report();
        }
      });
      for (let i = tokens.length - 1; i >= 0; i--)
        if (tokens[i].group.position.z > 22) {
          scene.remove(tokens[i].group);
          tokens.splice(i, 1);
        }
      ring.visible = bellTime > 0;
      ring.position.set(rider.position.x, 0.25, 5);
      ring.scale.setScalar(1 + (1 - bellTime) * 10);
      ringMat.opacity = bellTime;
    }
    if ((!paused && !won) || needsRender) {
      renderer.render(scene, camera);
      needsRender = false;
    }
  }
  frame = requestAnimationFrame(animate);
  return {
    lane(d) {
      if (!paused && !won) lane = Math.max(0, Math.min(2, lane + d));
    },
    bell() {
      if (paused || won || cooldown > 0) return;
      cooldown = 1.5;
      bellTime = 1;
      sound('hint');
      message = 'Driiing ! La voie est libre.';
      tokens.forEach((t) => {
        if (
          t.kind === 'bush' &&
          t.group.position.z > -13 &&
          t.group.position.z < 9
        ) {
          t.used = true;
          t.group.visible = false;
        }
      });
      report();
    },
    pause(p) {
      paused = p;
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      geometries.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      ringMat.dispose();
      renderer.dispose();
    },
  };
}
