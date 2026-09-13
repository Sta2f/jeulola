import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { BY_ID, PIECES } from './catalog';
import {
  candidate,
  dimensions,
  topAt,
  supportedGroup,
  movePiece,
  footprint,
  occupies,
  SIZE,
  type World,
  type Placed,
} from './world';
import {
  box,
  makePiece,
  disposeModelResources,
  setLivingLights,
} from './models';

export type BuildMode = 'build' | 'rotate' | 'erase' | 'move';
export type Stage = 'build' | 'visit' | 'live';
export type Target = { x: number; z: number; uid?: string };
export function createConstructionScene(
  host: HTMLDivElement,
  onDrop: (target: Target, source?: string) => void,
  onReady: (images: Record<string, string>) => void,
  onError: () => void,
) {
  const renderer = new T.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: false,
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  const sourceCanvas = renderer.domElement;
  // WebKit's composited WebGL layer can disappear after the drawer resizes it.
  // Copy its GPU output onto a visible 2D surface there; the scene stays fully 3D.
  const useComposite =
    /AppleWebKit/.test(navigator.userAgent) &&
    !/(Chrome|Chromium|Edg)/.test(navigator.userAgent);
  const canvas = useComposite ? document.createElement('canvas') : sourceCanvas;
  const composite = useComposite ? canvas.getContext('2d') : null;
  canvas.setAttribute('aria-label', 'Plateau de construction 3D');
  canvas.setAttribute('role', 'application');
  canvas.tabIndex = 0;
  host.appendChild(canvas);
  const scene = new T.Scene();
  scene.add(new T.HemisphereLight('#fff8eb', '#cbbba7', 2.15));
  const sun = new T.DirectionalLight('#fff0d7', 3.3);
  sun.position.set(-8, 15, 9);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -12,
    right: 12,
    top: 12,
    bottom: -12,
    near: 0.1,
    far: 45,
  });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.025;
  sun.shadow.radius = 3;
  scene.add(sun);
  const fill = new T.DirectionalLight('#dfd7f1', 0.9);
  fill.position.set(8, 6, -8);
  scene.add(fill);
  const camera = new T.OrthographicCamera(-10, 10, 10, -10, 0.1, 100);
  // A single renderer supplies every thumbnail; these are the same meshes as the play pieces.
  const images: Record<string, string> = {};
  renderer.setPixelRatio(1);
  renderer.setSize(144, 144, false);
  renderer.shadowMap.enabled = false;
  for (const piece of PIECES) {
    const model = makePiece(piece);
    scene.add(model);
    const bounds = new T.Box3().setFromObject(model),
      center = bounds.getCenter(new T.Vector3()),
      size = bounds.getSize(new T.Vector3());
    const extent = Math.max(size.x, size.y, size.z) * 0.88 + 0.12;
    camera.left = -extent;
    camera.right = extent;
    camera.top = extent;
    camera.bottom = -extent;
    camera.position.copy(center).add(new T.Vector3(3, 2.5, 4));
    camera.lookAt(center);
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    images[piece.id] = sourceCanvas.toDataURL();
    scene.remove(model);
  }
  onReady(images);
  renderer.shadowMap.enabled = true;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  const tray = new T.Group();
  scene.add(tray);
  box(tray, '#e3c8a3', 0, -0.36, 0, SIZE + 0.75, 0.7, SIZE + 0.75, 0.25);
  box(tray, '#f2e0c3', 0, -0.035, 0, SIZE + 0.25, 0.08, SIZE + 0.25, 0.1);
  const grid = new T.Group();
  scene.add(grid);
  for (let z = 0; z < SIZE; z++)
    for (let x = 0; x < SIZE; x++) {
      const cell = box(
        grid,
        (x + z) % 2 ? '#f5e6ce' : '#f1dfc4',
        x - (SIZE - 1) / 2,
        0.015,
        z - (SIZE - 1) / 2,
        0.977,
        0.025,
        0.977,
        0.015,
      );
      cell.userData.cell = { x, z };
    }
  const floor = new T.Mesh(
    new T.PlaneGeometry(200, 200),
    new T.ShadowMaterial({ opacity: 0.14 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.72;
  floor.receiveShadow = true;
  scene.add(floor);
  const content = new T.Group();
  scene.add(content);
  const previewGroup = new T.Group();
  scene.add(previewGroup);
  let previewModel: T.Group | undefined;
  const previewMaterials: T.Material[] = [];
  const markerGeometry = new T.BoxGeometry(0.97, 0.04, 0.97),
    green = new T.MeshBasicMaterial({
      color: '#a9dbaf',
      transparent: true,
      opacity: 0.52,
      depthWrite: false,
    }),
    red = new T.MeshBasicMaterial({
      color: '#e6ac9d',
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
  const marks = new T.Group();
  scene.add(marks);
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0.3, 0);
  controls.enablePan = false;
  controls.minPolarAngle = 0.32;
  controls.maxPolarAngle = 1.21;
  controls.minZoom = 0.7;
  controls.maxZoom = 1.9;
  controls.enabled = false;
  camera.position.set(15, 18, 21);
  controls.update();
  let disposed = false,
    initialized = false,
    frame = 0,
    world: World = [],
    mode: BuildMode = 'build',
    stage: Stage = 'build',
    paused = false,
    selected = 'grass',
    rotation = 0;
  let start:
      | { x: number; y: number; pointer: number; source?: string }
      | undefined,
    hover: Target | null = null,
    keyboard = { x: 7, z: 10 };
  const models = new Map<string, { group: T.Group; p: Placed; born: number }>();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let previousTime = 0,
    lifeTime = 0;
  const walkers = new Map<
    string,
    { from: T.Vector3; to: T.Vector3; progress: number; x: number; z: number }
  >();
  function resetPositions() {
    for (const { group, p } of models.values()) {
      const [w, d] = dimensions(p.id, p.r);
      group.position.set(
        p.x + (w - 1) / 2 - (SIZE - 1) / 2,
        p.y * 0.65 + 0.032,
        p.z + (d - 1) / 2 - (SIZE - 1) / 2,
      );
      group.rotation.set(0, (p.r * Math.PI) / 2, 0);
      group.scale.set(1, 1, 1);
    }
    walkers.clear();
  }
  function render(time = performance.now()) {
    frame = 0;
    if (disposed || document.hidden) return;
    const dt = Math.min(0.06, (time - previousTime) / 1000 || 0);
    previousTime = time;
    const alive = stage === 'live' && !paused && !reduced.matches;
    if (alive) lifeTime += dt;
    let popping = false;
    for (const [uid, item] of models) {
      const { group, p, born } = item,
        piece = BY_ID[p.id];
      if (time - born < 340 && !reduced.matches) {
        const t = Math.min(1, (time - born) / 340);
        group.scale.setScalar(1 + Math.sin(t * Math.PI) * 0.075);
        popping = true;
      } else group.scale.setScalar(1);
      if (alive) {
        if (piece.category === 'Plantes')
          group.rotation.z = Math.sin(lifeTime * 1.3 + p.x) * 0.018;
        if (piece.kind === 'water' || piece.kind === 'waterfall') {
          group.position.y =
            p.y * 0.65 + 0.032 + Math.sin(lifeTime * 2 + p.z) * 0.008;
          group.traverse((o) => {
            if (o.userData.flow === 'water')
              o.position.z =
                -0.3 + ((lifeTime * 0.1 + o.position.x + 0.5) % 0.6);
            if (o.userData.flow === 'fall')
              o.position.y =
                0.53 - ((lifeTime * 0.4 + o.position.x + 0.5) % 0.43);
          });
        }
        if (piece.kind === 'floatingrock' || piece.kind === 'cloud')
          group.position.y =
            p.y * 0.65 + 0.032 + Math.sin(lifeTime + p.x) * 0.08;
        if (
          piece.category === 'Animaux' ||
          ['dragon', 'unicorn'].includes(piece.kind)
        ) {
          const flying = ['butterfly', 'bee', 'dragon'].includes(piece.kind),
            aquatic = ['fish', 'duck'].includes(piece.kind);
          if (!flying) {
            let walk = walkers.get(uid);
            if (!walk) {
              walk = {
                from: group.position.clone(),
                to: group.position.clone(),
                progress: 1,
                x: p.x,
                z: p.z,
              };
              walkers.set(uid, walk);
            }
            if (walk.progress >= 1) {
              const dirs = [
                  [0, 1],
                  [1, 0],
                  [0, -1],
                  [-1, 0],
                ],
                offset = Math.floor(lifeTime + p.x + p.z) % 4;
              for (let j = 0; j < 4; j++) {
                const [dx, dz] = dirs[(j + offset) % 4],
                  x = walk.x + dx,
                  z = walk.z + dz;
                if (x < 0 || z < 0 || x >= SIZE || z >= SIZE) continue;
                const proposed = { ...p, x, z };
                const supports = world.filter((b) => b.uid !== uid);
                const safe = footprint(proposed).every((cell) => {
                  if (cell.x >= SIZE || cell.z >= SIZE) return false;
                  const top = topAt(supports, cell.x, cell.z);
                  const water =
                    top &&
                    ['water', 'river', 'riverbend', 'waterfall'].includes(
                      BY_ID[top.id].kind,
                    );
                  return (
                    top &&
                    BY_ID[top.id].height > 0 &&
                    top.y + BY_ID[top.id].height === p.y &&
                    (aquatic ? water : !water) &&
                    ![...walkers.entries()].some(([other, walker]) => {
                      const otherPiece = models.get(other)?.p;
                      return (
                        other !== uid &&
                        otherPiece &&
                        occupies(
                          { ...otherPiece, x: walker.x, z: walker.z },
                          cell.x,
                          cell.z,
                        )
                      );
                    })
                  );
                });
                if (safe) {
                  const [w, d] = dimensions(p.id, p.r);
                  walk.from.copy(group.position);
                  walk.to.set(
                    x + (w - 1) / 2 - (SIZE - 1) / 2,
                    p.y * 0.65 + 0.032,
                    z + (d - 1) / 2 - (SIZE - 1) / 2,
                  );
                  walk.x = x;
                  walk.z = z;
                  walk.progress = 0;
                  if (w === 1 && d === 1) group.rotation.y = Math.atan2(dx, dz);
                  break;
                }
              }
            } else {
              walk.progress = Math.min(1, walk.progress + dt * 0.32);
              group.position.lerpVectors(walk.from, walk.to, walk.progress);
              group.position.y +=
                Math.sin(walk.progress * Math.PI * 12) * 0.012;
            }
          } else
            group.position.y =
              p.y * 0.65 +
              0.032 +
              (flying ? 0.35 : 0) +
              Math.sin(lifeTime * 2 + p.x) * 0.04;
        }
      }
    }
    renderer.render(scene, camera);
    if (composite) {
      composite.clearRect(0, 0, canvas.width, canvas.height);
      composite.drawImage(sourceCanvas, 0, 0);
    }
    if (alive || popping) requestRender();
  }
  function requestRender() {
    if (!disposed && !frame) frame = requestAnimationFrame(render);
  }
  controls.addEventListener('change', requestRender);
  const resize = () => {
    const w = host.clientWidth,
      h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h);
    if (composite) {
      canvas.width = sourceCanvas.width;
      canvas.height = sourceCanvas.height;
    }
    const aspect = w / h,
      extent = Math.max(7.7, 10.2 / aspect);
    camera.left = -extent * aspect;
    camera.right = extent * aspect;
    camera.top = extent;
    camera.bottom = -extent;
    camera.updateProjectionMatrix();
    requestRender();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  const ray = new T.Raycaster(),
    pointer = new T.Vector2(),
    plane = new T.Plane(new T.Vector3(0, 1, 0), 0);
  function pick(x: number, y: number): Target | null {
    const rect = canvas.getBoundingClientRect();
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom)
      return null;
    pointer.set(
      ((x - rect.left) / rect.width) * 2 - 1,
      (-(y - rect.top) / rect.height) * 2 + 1,
    );
    ray.setFromCamera(pointer, camera);
    const hit = ray.intersectObjects(content.children, true)[0];
    if (hit) {
      let node: T.Object3D | null = hit.object;
      while (node && !node.userData.placed) node = node.parent;
      if (node) {
        const p = node.userData.placed as Placed,
          [w, d] = dimensions(p.id, p.r);
        return {
          x: T.MathUtils.clamp(
            Math.floor(hit.point.x + SIZE / 2),
            p.x,
            p.x + w - 1,
          ),
          z: T.MathUtils.clamp(
            Math.floor(hit.point.z + SIZE / 2),
            p.z,
            p.z + d - 1,
          ),
          uid: p.uid,
        };
      }
    }
    const ground = ray.ray.intersectPlane(plane, new T.Vector3());
    if (!ground) return null;
    const cx = Math.floor(ground.x + SIZE / 2),
      cz = Math.floor(ground.z + SIZE / 2);
    return cx >= 0 && cz >= 0 && cx < SIZE && cz < SIZE
      ? { x: cx, z: cz }
      : null;
  }
  function clearPreview() {
    hover = null;
    marks.clear();
    previewGroup.visible = false;
    requestRender();
  }
  function preview(target: Target | null) {
    hover = target;
    marks.clear();
    previewGroup.visible = false;
    if (!target || stage !== 'build' || mode === 'rotate')
      return requestRender();
    const p = candidate(world, selected, target.x, target.z, rotation);
    const [w, d] = dimensions(selected, rotation);
    if (mode === 'build') {
      for (let dz = -1; dz <= 1; dz++)
        for (let dx = -1; dx <= 1; dx++) {
          const neighbor = candidate(
            world,
            selected,
            target.x + dx,
            target.z + dz,
            rotation,
          );
          if (neighbor) {
            const m = new T.Mesh(markerGeometry, green);
            m.position.set(
              neighbor.x - (SIZE - 1) / 2,
              neighbor.y * 0.65 + 0.07,
              neighbor.z - (SIZE - 1) / 2,
            );
            marks.add(m);
          }
        }
      for (let z = 0; z < d; z++)
        for (let x = 0; x < w; x++) {
          const m = new T.Mesh(markerGeometry, p ? green : red);
          const top = topAt(world, target.x + x, target.z + z);
          m.position.set(
            target.x + x - (SIZE - 1) / 2,
            p
              ? p.y * 0.65 + 0.08
              : ((top?.y ?? 0) + (top ? BY_ID[top.id].height : 0)) * 0.65 +
                  0.09,
            target.z + z - (SIZE - 1) / 2,
          );
          marks.add(m);
        }
      if (p && previewModel) {
        previewGroup.visible = true;
        previewGroup.position.set(
          p.x + (w - 1) / 2 - (SIZE - 1) / 2,
          p.y * 0.65 + 0.075,
          p.z + (d - 1) / 2 - (SIZE - 1) / 2,
        );
        previewGroup.rotation.y = (rotation * Math.PI) / 2;
      }
    } else {
      const m = new T.Mesh(markerGeometry, mode === 'erase' ? red : green),
        top = topAt(world, target.x, target.z);
      m.position.set(
        target.x - (SIZE - 1) / 2,
        ((top?.y ?? 0) + (top ? BY_ID[top.id].height : 0)) * 0.65 + 0.08,
        target.z - (SIZE - 1) / 2,
      );
      marks.add(m);
      if (mode === 'move' && start?.source) {
        const moved = movePiece(world, start.source, target.x, target.z),
          base = moved?.find((b) => b.uid === start?.source);
        if (base) {
          previewGroup.visible = true;
          previewGroup.position.set(
            base.x - (SIZE - 1) / 2,
            base.y * 0.65 + 0.075,
            base.z - (SIZE - 1) / 2,
          );
          previewGroup.rotation.y = 0;
        }
      }
    }
    requestRender();
  }
  function selection(id: string, r: number) {
    selected = id;
    rotation = r;
    previewGroup.clear();
    previewMaterials.splice(0).forEach((m) => m.dispose());
    previewModel = makePiece(BY_ID[id]);
    previewModel.traverse((o) => {
      if (o instanceof T.Mesh) {
        const source = Array.isArray(o.material) ? o.material : [o.material];
        const clones = source.map((m) => {
          const clone = m.clone();
          clone.transparent = true;
          clone.opacity = 0.48;
          clone.depthWrite = false;
          previewMaterials.push(clone);
          return clone;
        });
        o.material = clones.length === 1 ? clones[0] : clones;
        o.castShadow = false;
      }
    });
    previewGroup.add(previewModel);
    preview(hover);
  }
  selection(selected, 0);
  const down = (e: PointerEvent) => {
    if (stage !== 'build' || mode === 'rotate' || e.button !== 0) return;
    const hit = pick(e.clientX, e.clientY);
    start = {
      x: e.clientX,
      y: e.clientY,
      pointer: e.pointerId,
      source: mode === 'move' ? hit?.uid : undefined,
    };
    canvas.setPointerCapture(e.pointerId);
    if (start.source) {
      const group = supportedGroup(world, start.source),
        base = group[0];
      previewGroup.clear();
      previewMaterials.splice(0).forEach((m) => m.dispose());
      for (const p of group) {
        const original = models.get(p.uid);
        if (!original) continue;
        const clone = original.group.clone(true);
        clone.position.sub(
          new T.Vector3(
            base.x - (SIZE - 1) / 2,
            base.y * 0.65 + 0.032,
            base.z - (SIZE - 1) / 2,
          ),
        );
        clone.traverse((o) => {
          if (o instanceof T.Mesh) {
            const mat = (o.material as T.Material).clone();
            mat.transparent = true;
            mat.opacity = 0.48;
            mat.depthWrite = false;
            previewMaterials.push(mat);
            o.material = mat;
            o.castShadow = false;
          }
        });
        previewGroup.add(clone);
      }
    }
  };
  const move = (e: PointerEvent) => {
    if (stage === 'build' && mode !== 'rotate')
      preview(pick(e.clientX, e.clientY));
  };
  const up = (e: PointerEvent) => {
    if (!start || start.pointer !== e.pointerId) return;
    const target = pick(e.clientX, e.clientY);
    if (
      target &&
      (mode === 'move' ||
        Math.hypot(e.clientX - start.x, e.clientY - start.y) < 12)
    )
      onDrop(target, start.source);
    start = undefined;
    selection(selected, rotation);
    clearPreview();
  };
  const cancel = () => {
    const moving = Boolean(start?.source);
    start = undefined;
    if (moving) selection(selected, rotation);
    clearPreview();
  };
  const key = (e: KeyboardEvent) => {
    if (stage !== 'build') return;
    const steps: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    if (e.key in steps) {
      e.preventDefault();
      keyboard = {
        x: T.MathUtils.clamp(keyboard.x + steps[e.key][0], 0, SIZE - 1),
        z: T.MathUtils.clamp(keyboard.z + steps[e.key][1], 0, SIZE - 1),
      };
      preview(keyboard);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onDrop({ ...keyboard, uid: topAt(world, keyboard.x, keyboard.z)?.uid });
      preview(keyboard);
    }
  };
  const lost = (e: Event) => {
    e.preventDefault();
    onError();
  };
  const leave = () => {
    if (!start) clearPreview();
  };
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', cancel);
  canvas.addEventListener('pointerleave', leave);
  canvas.addEventListener('keydown', key);
  sourceCanvas.addEventListener('webglcontextlost', lost);
  window.addEventListener('blur', cancel);
  document.addEventListener('visibilitychange', requestRender);
  return {
    setWorld(next: World) {
      const first = !initialized;
      initialized = true;
      world = next;
      for (const [uid, item] of models)
        if (!next.some((p) => p.uid === uid && p.id === item.p.id)) {
          content.remove(item.group);
          models.delete(uid);
        }
      for (const p of next) {
        let item = models.get(p.uid);
        if (!item) {
          const wrapper = new T.Group();
          wrapper.add(makePiece(BY_ID[p.id]));
          wrapper.userData.placed = p;
          item = { group: wrapper, p, born: first ? -1000 : performance.now() };
          models.set(p.uid, item);
          content.add(wrapper);
        }
        item.p = p;
        item.group.userData.placed = p;
      }
      resetPositions();
      requestRender();
    },
    setMode(next: BuildMode, nextStage: Stage, isPaused = false) {
      mode = next;
      stage = nextStage;
      paused = isPaused;
      setLivingLights(stage === 'live');
      controls.enabled = stage !== 'build' || mode === 'rotate';
      grid.visible = stage === 'build';
      canvas.style.cursor = controls.enabled
        ? 'grab'
        : mode === 'move'
          ? 'move'
          : 'crosshair';
      clearPreview();
      if (stage !== 'live') resetPositions();
      requestRender();
    },
    setSelection: selection,
    hover(x: number, y: number) {
      preview(pick(x, y));
    },
    drop(x: number, y: number) {
      const p = pick(x, y);
      clearPreview();
      return p;
    },
    clearPreview,
    rotate(direction: number) {
      const offset = camera.position.clone().sub(controls.target);
      offset.applyAxisAngle(new T.Vector3(0, 1, 0), (direction * Math.PI) / 4);
      camera.position.copy(controls.target).add(offset);
      controls.update();
      requestRender();
    },
    zoom(direction: number) {
      camera.zoom = T.MathUtils.clamp(camera.zoom + direction * 0.15, 0.7, 1.9);
      camera.updateProjectionMatrix();
      requestRender();
    },
    resetView() {
      camera.position.set(15, 18, 21);
      camera.zoom = 1;
      controls.target.set(0, 0.3, 0);
      controls.update();
      camera.updateProjectionMatrix();
      requestRender();
    },
    photo() {
      renderer.render(scene, camera);
      const output = document.createElement('canvas');
      output.width = canvas.width;
      output.height = canvas.height;
      const ctx = output.getContext('2d');
      if (!ctx) return canvas.toDataURL('image/png');
      ctx.fillStyle = '#f4e9d6';
      ctx.fillRect(0, 0, output.width, output.height);
      ctx.drawImage(sourceCanvas, 0, 0);
      return output.toDataURL('image/png');
    },
    thumbnail() {
      renderer.render(scene, camera);
      const small = document.createElement('canvas');
      small.width = 240;
      small.height = 160;
      const ctx = small.getContext('2d');
      if (!ctx) return '';
      ctx.fillStyle = '#f3e5d0';
      ctx.fillRect(0, 0, 240, 160);
      ctx.drawImage(sourceCanvas, 0, 0, 240, 160);
      return small.toDataURL('image/jpeg', 0.7);
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      window.removeEventListener('blur', cancel);
      document.removeEventListener('visibilitychange', requestRender);
      sourceCanvas.removeEventListener('webglcontextlost', lost);
      previewMaterials.forEach((m) => m.dispose());
      markerGeometry.dispose();
      green.dispose();
      red.dispose();
      floor.geometry.dispose();
      floor.material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
      disposeModelResources();
    },
  };
}
export type ConstructionScene = ReturnType<typeof createConstructionScene>;
