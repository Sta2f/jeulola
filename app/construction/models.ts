import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { type Piece } from './catalog';

// All pieces share geometries and materials, including their drawer thumbnails.
const geometries = new Map<string, T.BufferGeometry>();
const materials = new Map<string, T.MeshStandardMaterial>();
const prototypes = new Map<string, T.Group>();
function geometry(key: string, create: () => T.BufferGeometry) {
  if (!geometries.has(key)) geometries.set(key, create());
  return geometries.get(key)!;
}
function material(color: string) {
  if (!materials.has(color))
    materials.set(
      color,
      new T.MeshStandardMaterial({ color, roughness: 0.66, metalness: 0 }),
    );
  return materials.get(color)!;
}
function mesh(
  g: T.Group,
  shape: T.BufferGeometry,
  color: string,
  x: number,
  y: number,
  z: number,
  sx = 1,
  sy = 1,
  sz = 1,
) {
  const m = new T.Mesh(shape, material(color));
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.castShadow = true;
  m.receiveShadow = true;
  g.add(m);
  return m;
}
const ball = () => geometry('ball', () => new T.SphereGeometry(1, 18, 12));
export function sphere(
  g: T.Group,
  c: string,
  x: number,
  y: number,
  z: number,
  sx: number,
  sy = sx,
  sz = sx,
) {
  return mesh(g, ball(), c, x, y, z, sx, sy, sz);
}
export function box(
  g: T.Group,
  c: string,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  r = 0.055,
) {
  return mesh(
    g,
    geometry(
      `box:${w}:${h}:${d}:${r}`,
      () =>
        new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 3, h / 3, d / 3)),
    ),
    c,
    x,
    y,
    z,
  );
}
function cone(
  g: T.Group,
  c: string,
  x: number,
  y: number,
  z: number,
  r: number,
  h: number,
) {
  return mesh(
    g,
    geometry(`cone:${r}:${h}`, () => new T.ConeGeometry(r, h, 12)),
    c,
    x,
    y,
    z,
  );
}
function stem(
  g: T.Group,
  c: string,
  x: number,
  y: number,
  z: number,
  r: number,
  h: number,
) {
  return mesh(
    g,
    geometry(`stem:${r}:${h}`, () => new T.CylinderGeometry(r, r, h, 10)),
    c,
    x,
    y,
    z,
  );
}
function flower(
  g: T.Group,
  x: number,
  y: number,
  z: number,
  c: string,
  s = 0.09,
) {
  for (let n = 0; n < 5; n++) {
    const a = (n * Math.PI * 2) / 5;
    sphere(
      g,
      c,
      x + Math.cos(a) * s,
      y,
      z + Math.sin(a) * s,
      s * 0.7,
      s * 0.4,
      s * 0.7,
    );
  }
  sphere(g, '#efd27c', x, y + 0.018, z, s * 0.48);
}
function eyes(g: T.Group, y: number, z: number, spacing = 0.12) {
  for (const x of [-spacing, spacing]) sphere(g, '#424750', x, y, z, 0.027);
}
function unitPiece(piece: Piece): T.Group {
  const g = new T.Group();
  const c = piece.color;
  const kind = piece.kind;
  if (
    [
      'cube',
      'grass',
      'flowers',
      'stone',
      'water',
      'glass',
      'river',
      'riverbend',
      'waterfall',
      'cliff',
      'long',
      'half',
      'terrace',
      'wall',
      'window',
      'door',
    ].includes(kind)
  ) {
    const b = box(
      g,
      kind === 'grass' || kind === 'flowers' ? '#bd9470' : c,
      0,
      0.325,
      0,
      0.96,
      0.65,
      0.96,
      0.085,
    );
    if (kind === 'water' || kind === 'glass') {
      const key = `water-material-${c}`;
      if (!materials.has(key))
        materials.set(
          key,
          new T.MeshStandardMaterial({
            color: c,
            transparent: true,
            opacity: 0.72,
            roughness: 0.16,
            metalness: 0.15,
            depthWrite: false,
          }),
        );
      b.material = materials.get(key)!;
      box(
        g,
        '#c4f3ed',
        -0.18,
        0.655,
        0.18,
        0.4,
        0.012,
        0.025,
        0.004,
      ).userData.flow = 'water';
      box(
        g,
        '#c4f3ed',
        0.17,
        0.655,
        -0.13,
        0.23,
        0.012,
        0.025,
        0.004,
      ).userData.flow = 'water';
    }
    if (kind === 'grass' || kind === 'flowers') {
      box(g, c, 0, 0.603, 0, 0.97, 0.13, 0.97, 0.05);
      for (let i = 0; i < 5; i++) {
        const x = Math.sin(i * 8.3) * 0.34,
          z = Math.cos(i * 5.2) * 0.34;
        sphere(g, c, x, 0.552, z, 0.075, 0.11, 0.09);
      }
      for (let i = 0; i < 4; i++) {
        const x = Math.sin(i * 4.1) * 0.3,
          z = Math.cos(i * 4.7) * 0.3;
        sphere(g, '#adc975', x, 0.676, z, 0.035, 0.04, 0.055);
      }
      if (kind === 'flowers')
        for (let i = 0; i < 7; i++)
          flower(
            g,
            Math.sin(i * 2.4) * 0.31,
            0.706,
            Math.cos(i * 2.4) * 0.3,
            i % 2 ? '#fff7e7' : '#edb1cb',
          );
    }
    if (kind === 'stone')
      for (let i = 0; i < 3; i++)
        box(
          g,
          '#c2bac5',
          i * 0.26 - 0.26,
          0.657,
          i * 0.17 - 0.17,
          0.19,
          0.018,
          0.18,
          0.02,
        );
    if (kind === 'river' || kind === 'riverbend') {
      b.material = material('#95b875');
      box(g, c, 0, 0.652, 0, 0.45, 0.018, 0.97);
      if (kind === 'riverbend')
        box(g, '#95b875', 0, 0.655, -0.28, 0.5, 0.02, 0.4);
      if (kind === 'riverbend') box(g, c, 0.23, 0.66, 0, 0.5, 0.025, 0.45);
    }
    if (kind === 'waterfall') {
      b.material = material('#b4ada8');
      box(g, c, 0, 0.34, 0.49, 0.63, 0.64, 0.06);
      box(g, c, 0, 0.66, 0, 0.64, 0.03, 0.96);
      for (let i = 0; i < 3; i++)
        box(
          g,
          '#c4eff0',
          i * 0.16 - 0.16,
          0.32,
          0.529,
          0.035,
          0.16,
          0.018,
        ).userData.flow = 'fall';
    }
    if (kind === 'cliff')
      for (let i = 0; i < 3; i++)
        box(g, '#c4baaa', i * 0.26 - 0.25, 0.34, 0.487, 0.04, 0.5, 0.03);
    if (kind === 'wall')
      for (let i = 0; i < 3; i++)
        box(g, '#ead8c4', 0, 0.16 + i * 0.18, 0.489, 0.94, 0.014, 0.012);
    if (kind === 'window') {
      box(g, '#f4dfb3', 0, 0.35, 0.49, 0.51, 0.43, 0.025);
      box(g, c, 0, 0.35, 0.51, 0.035, 0.43, 0.04);
      box(g, c, 0, 0.35, 0.51, 0.51, 0.035, 0.04);
    }
    if (kind === 'door') {
      box(g, '#a08377', 0, 0.3, 0.49, 0.45, 0.58, 0.03);
      sphere(g, '#efd8a1', 0.12, 0.29, 0.525, 0.035);
    }
    if (kind === 'terrace')
      for (let i = 0; i < 5; i++)
        box(g, '#b89b7e', i * 0.18 - 0.36, 0.656, 0, 0.014, 0.01, 0.9, 0.002);
    if (kind === 'half') g.scale.y = 0.5;
  } else if (
    ['tree', 'bush', 'flowerbush', 'apple', 'birch', 'willow'].includes(kind)
  ) {
    const large = !['bush', 'flowerbush'].includes(kind);
    const h = large ? 1.02 : 0.23;
    stem(g, '#ae8568', 0, h / 2, 0, 0.105, h);
    const clusters = large
      ? [
          [0, 1.23, 0, 0.44],
          [-0.24, 1.04, 0.07, 0.32],
          [0.23, 1.12, 0.02, 0.34],
          [0, 1.05, -0.23, 0.33],
          [0.07, 1.52, 0, 0.25],
        ]
      : [
          [0, 0.28, 0, 0.32],
          [-0.23, 0.22, 0.05, 0.23],
          [0.23, 0.25, 0, 0.25],
        ];
    for (const [x, y, z, r] of clusters) sphere(g, c, x, y, z, r, r * 0.91, r);
    if (large)
      for (let i = 0; i < 16; i++) {
        const a = i * 2.399,
          r = 0.32 + Math.sin(i * 7) * 0.045;
        const leafColor =
          i % 3 === 0 ? new T.Color(c).multiplyScalar(0.92).getStyle() : c;
        sphere(
          g,
          leafColor,
          Math.sin(a) * r,
          1.2 + Math.sin(i * 1.7) * 0.28,
          Math.cos(a) * r,
          0.13,
          0.12,
          0.13,
        );
      }
    for (let i = 0; i < 8; i++) {
      const a = i * 2.4;
      flower(
        g,
        Math.sin(a) * 0.3,
        h + 0.3 + Math.cos(a) * 0.15,
        Math.cos(a) * 0.3,
        i % 2 ? '#fff5d9' : '#eec1d2',
        0.047,
      );
    }
    if (kind === 'apple')
      for (let i = 0; i < 6; i++)
        sphere(
          g,
          '#d78e7e',
          Math.sin(i * 2.4) * 0.33,
          1.12 + (i % 2) * 0.2,
          Math.cos(i * 2.4) * 0.32,
          0.07,
        );
    if (kind === 'birch') {
      stem(g, '#eee9d9', 0, 0.51, 0, 0.075, 1.02);
      for (let i = 0; i < 4; i++)
        box(g, '#9c968a', 0.02, 0.18 + i * 0.19, 0.075, 0.07, 0.025, 0.012);
      g.scale.set(0.7, 1.3, 0.7);
    }
    if (kind === 'willow')
      for (let i = 0; i < 10; i++) {
        const a = i * 0.628;
        sphere(
          g,
          c,
          Math.sin(a) * 0.34,
          0.91,
          Math.cos(a) * 0.34,
          0.065,
          0.45,
          0.065,
        );
      }
  } else if (kind === 'pine') {
    stem(g, '#a4846b', 0, 0.28, 0, 0.09, 0.56);
    for (let i = 0; i < 4; i++)
      cone(g, c, 0, 0.54 + i * 0.26, 0, 0.42 - i * 0.075, 0.63 - i * 0.045);
  } else if (kind === 'mushroom') {
    stem(g, '#f8e5bd', 0, 0.21, 0, 0.11, 0.42);
    sphere(g, c, 0, 0.43, 0, 0.32, 0.2, 0.32);
    for (let i = 0; i < 5; i++) {
      const a = i * 2.4;
      sphere(
        g,
        '#fff6e4',
        Math.sin(a) * 0.19,
        0.59,
        Math.cos(a) * 0.17,
        0.048,
        0.022,
        0.048,
      );
    }
  } else if (kind === 'lily') {
    sphere(g, c, 0, 0.045, 0, 0.37, 0.04, 0.35);
    flower(g, 0.06, 0.16, 0, '#eeb0d1', 0.16);
  } else if (kind === 'crystal') {
    for (let i = 0; i < 3; i++) {
      const m = mesh(
        g,
        geometry('crystal', () => new T.CylinderGeometry(0, 0.16, 0.7, 5)),
        c,
        (i - 1) * 0.18,
        0.36,
        0,
      );
      m.rotation.z = (i - 1) * -0.26;
    }
  } else if (
    ['lavender', 'sunflower', 'bouquet', 'roses', 'tulips', 'reeds'].includes(
      kind,
    )
  ) {
    for (let i = 0; i < 7; i++) {
      const x = Math.sin(i * 2.4) * 0.28,
        z = Math.cos(i * 2.4) * 0.25,
        h = 0.4 + (i % 3) * 0.1;
      stem(g, '#789b58', x, h / 2, z, 0.018, h);
      if (kind === 'lavender') sphere(g, c, x, h, z, 0.055, 0.17, 0.055);
      else flower(g, x, h, z, c, 0.11);
    }
    if (kind === 'reeds')
      for (let i = 0; i < 5; i++)
        sphere(
          g,
          '#977961',
          Math.sin(i * 2.4) * 0.25,
          0.68,
          Math.cos(i * 2.4) * 0.25,
          0.035,
          0.13,
          0.035,
        );
    if (kind === 'tulips' || kind === 'roses')
      for (let i = 0; i < 5; i++)
        sphere(
          g,
          c,
          Math.sin(i * 2.4) * 0.25,
          0.58,
          Math.cos(i * 2.4) * 0.25,
          0.085,
          kind === 'tulips' ? 0.12 : 0.065,
          0.085,
        );
  } else if (kind === 'palm') {
    const trunk = stem(g, '#c2a080', 0, 0.55, 0, 0.085, 1.1);
    trunk.rotation.z = -0.08;
    for (let i = 0; i < 7; i++) {
      const a = (i * Math.PI * 2) / 7;
      const leaf = sphere(
        g,
        c,
        Math.sin(a) * 0.26,
        1.15,
        Math.cos(a) * 0.26,
        0.09,
        0.05,
        0.4,
      );
      leaf.rotation.y = a;
    }
  } else if (kind === 'hedge') {
    box(g, c, 0, 0.3, 0, 0.93, 0.6, 0.46, 0.14);
  } else if (kind === 'cactus') {
    sphere(g, c, 0, 0.39, 0, 0.13, 0.38, 0.13);
    for (const side of [-1, 1]) {
      sphere(g, c, side * 0.2, 0.3, 0, 0.15, 0.06, 0.07);
      sphere(g, c, side * 0.28, 0.43, 0, 0.075, 0.18, 0.075);
    }
    flower(g, 0, 0.77, 0, '#ecc1cf', 0.07);
  } else if (kind === 'fern' || kind === 'ivy') {
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4;
      const leaf = sphere(
        g,
        c,
        Math.sin(a) * 0.17,
        0.15 + i * 0.025,
        Math.cos(a) * 0.17,
        0.07,
        0.035,
        0.29,
      );
      leaf.rotation.y = a;
      leaf.rotation.x = 0.4;
    }
  } else if (kind === 'pebbles') {
    for (let i = 0; i < 7; i++)
      sphere(
        g,
        i % 2 ? c : '#d8cbbb',
        Math.sin(i * 2.4) * 0.3,
        0.08,
        Math.cos(i * 2.4) * 0.3,
        0.14,
        0.08,
        0.12,
      );
  } else if (kind === 'rock' || kind === 'floatingrock') {
    sphere(g, c, 0, 0.22, 0, 0.33, 0.3, 0.28);
    sphere(g, '#c8c3c2', 0.22, 0.12, 0.17, 0.17, 0.15, 0.15);
    if (kind === 'floatingrock') g.position.y = 0.5;
  } else if (kind === 'path') {
    box(g, c, 0, 0.065, 0, 0.96, 0.13, 0.96);
    for (let i = 0; i < 4; i++)
      box(
        g,
        '#d9cdc0',
        (i % 2) * 0.44 - 0.22,
        0.15,
        Math.floor(i / 2) * 0.44 - 0.22,
        0.4,
        0.06,
        0.4,
        0.04,
      );
  } else if (
    kind === 'house' ||
    kind === 'fairyhouse' ||
    kind === 'mill' ||
    kind === 'greenhouse'
  ) {
    box(g, c, 0, 0.42, 0, 0.78, 0.84, 0.76);
    const roof = unitPiece({
      ...piece,
      kind: kind === 'fairyhouse' ? 'mushroom' : 'roof',
      color: '#b49bd5',
    });
    roof.position.y = 0.82;
    g.add(roof);
    box(g, '#947a94', 0, 0.23, 0.395, 0.19, 0.43, 0.035, 0.04);
    sphere(g, '#f7dfad', 0.045, 0.23, 0.423, 0.021);
    for (const x of [-0.245, 0.245]) {
      box(g, '#fff0d1', x, 0.53, 0.394, 0.19, 0.23, 0.04, 0.025);
      box(g, '#edcf8d', x, 0.53, 0.421, 0.135, 0.17, 0.02, 0.01);
    }
    box(g, '#d59f93', 0.23, 1.19, -0.15, 0.14, 0.36, 0.16);
    for (const x of [-0.29, 0.29]) flower(g, x, 0.06, 0.44, '#f5e0ea', 0.065);
    if (kind === 'mill')
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2 + Math.PI / 4;
        const blade = box(
          g,
          '#f1e3c8',
          Math.sin(a) * 0.22,
          0.66 + Math.cos(a) * 0.22,
          0.47,
          0.08,
          0.52,
          0.04,
        );
        blade.rotation.z = -a;
      }
    if (kind === 'greenhouse')
      for (const x of [-0.26, 0, 0.26]) {
        box(g, '#c2e5dd', x, 0.45, 0.42, 0.21, 0.62, 0.025);
        box(g, '#f6ecda', x, 0.45, 0.44, 0.02, 0.66, 0.035);
      }
  } else if (kind === 'roof') {
    for (const side of [-1, 1]) {
      const m = box(g, c, side * 0.235, 0.16, 0, 0.62, 0.12, 1.0, 0.035);
      m.rotation.z = (-side * Math.PI) / 5;
      for (let i = 0; i < 4; i++) {
        const tile = box(
          g,
          c,
          side * 0.24,
          0.21,
          i * 0.22 - 0.33,
          0.6,
          0.08,
          0.19,
          0.045,
        );
        tile.rotation.z = (-side * Math.PI) / 5;
      }
    }
  } else if (kind === 'roundroof') {
    const roof = sphere(g, c, 0, 0.04, 0, 0.5, 0.42, 0.48);
    roof.scale.y = 0.7;
  } else if (kind === 'stairs' || kind === 'ramp') {
    for (let i = 0; i < 5; i++)
      box(
        g,
        c,
        0,
        0.06 + i * 0.06,
        i * 0.18 - 0.36,
        0.94,
        0.12 + i * 0.12,
        0.18,
        0.018,
      );
  } else if (kind === 'column') {
    stem(g, c, 0, 0.325, 0, 0.28, 0.65);
    box(g, c, 0, 0.04, 0, 0.65, 0.08, 0.65);
    box(g, c, 0, 0.61, 0, 0.65, 0.08, 0.65);
  } else if (kind === 'tower') {
    box(g, c, 0, 0.4, 0, 0.75, 0.8, 0.75);
    for (const x of [-0.28, 0.28])
      for (const z of [-0.28, 0.28])
        box(g, c, x, 0.85, z, 0.2, 0.2, 0.2, 0.025);
    box(g, '#927fa8', 0, 0.49, 0.382, 0.13, 0.24, 0.02);
  } else if (kind === 'bridge') {
    for (let i = 0; i < 7; i++)
      box(
        g,
        c,
        0,
        0.11 + Math.sin((i / 6) * Math.PI) * 0.13,
        i * 0.14 - 0.42,
        0.86,
        0.1,
        0.125,
        0.02,
      );
    for (const x of [-0.37, 0.37]) {
      for (const z of [-0.38, 0, 0.38]) stem(g, c, x, 0.29, z, 0.035, 0.52);
      box(g, c, x, 0.48, 0, 0.065, 0.07, 0.98, 0.02);
    }
  } else if (kind === 'fence' || kind === 'gate' || kind === 'flowerfence') {
    for (const x of [-0.36, 0.36])
      box(g, c, x, 0.3, 0, 0.095, 0.6, 0.095, 0.02);
    if (kind === 'gate') {
      box(g, c, 0, 0.76, 0, 0.88, 0.13, 0.22);
      for (const x of [-0.36, 0.36]) box(g, c, x, 0.5, 0, 0.095, 1, 0.095);
    } else
      for (const y of [0.2, 0.44]) box(g, c, 0, y, 0, 0.95, 0.085, 0.07, 0.02);
    if (kind === 'flowerfence')
      for (let i = 0; i < 4; i++)
        flower(g, i * 0.2 - 0.3, 0.47, 0.07, '#e9b4ce', 0.08);
  } else if (kind === 'bench') {
    box(g, c, 0, 0.27, 0, 0.85, 0.09, 0.36);
    box(g, c, 0, 0.5, -0.15, 0.85, 0.28, 0.06);
    for (const x of [-0.3, 0.3]) box(g, '#9c877b', x, 0.12, 0, 0.07, 0.24, 0.3);
  } else if (kind === 'table') {
    box(g, c, 0, 0.4, 0, 0.85, 0.08, 0.75);
    for (const x of [-0.3, 0.3])
      for (const z of [-0.25, 0.25]) box(g, c, x, 0.19, z, 0.07, 0.38, 0.07);
  } else if (kind === 'lamp') {
    stem(g, '#aa9381', 0, 0.4, 0, 0.045, 0.8);
    box(g, c, 0, 0.83, 0, 0.23, 0.3, 0.23);
    cone(g, '#8e9b9f', 0, 1.04, 0, 0.21, 0.15);
  } else if (kind === 'well') {
    stem(g, c, 0, 0.2, 0, 0.33, 0.4);
    stem(g, '#71bdcb', 0, 0.407, 0, 0.23, 0.012);
    for (const x of [-0.29, 0.29])
      box(g, '#b38b73', x, 0.55, 0, 0.055, 0.8, 0.06);
    const roof = unitPiece({ ...piece, kind: 'roof', color: '#b7a0d8' });
    roof.position.y = 0.85;
    roof.scale.setScalar(0.8);
    g.add(roof);
  } else if (kind === 'fountain') {
    stem(g, c, 0, 0.13, 0, 0.43, 0.26);
    stem(g, '#8bcbd2', 0, 0.27, 0, 0.34, 0.018);
    stem(g, c, 0, 0.42, 0, 0.065, 0.7);
    sphere(g, '#b6e4e1', 0, 0.75, 0, 0.1);
  } else if (kind === 'castle') {
    box(g, c, 0, 0.28, 0, 0.8, 0.56, 0.7);
    for (const x of [-0.32, 0.32])
      for (const z of [-0.28, 0.28]) {
        stem(g, c, x, 0.46, z, 0.14, 0.92);
        cone(g, '#b7a0d0', x, 1.03, z, 0.19, 0.32);
      }
    box(g, '#ac94b1', 0, 0.2, 0.36, 0.18, 0.4, 0.03);
  } else if (kind === 'cloud') {
    for (let i = 0; i < 5; i++)
      sphere(g, c, (i - 2) * 0.15, 0.2 + (i % 2) * 0.1, 0, 0.22, 0.19, 0.19);
  } else if (kind === 'rainbow' || kind === 'portal') {
    const hues =
      kind === 'portal'
        ? [c, '#d7c9ed']
        : ['#e7abb8', '#edd39b', '#b6d5b5', '#b1cddd', '#c8b5dc'];
    hues.forEach((h, i) => {
      const arc = mesh(
        g,
        geometry(
          `arc:${i}`,
          () => new T.TorusGeometry(0.42 - i * 0.045, 0.024, 6, 24, Math.PI),
        ),
        h,
        0,
        0.1,
        0,
      );
      arc.scale.y = kind === 'portal' ? 2 : 1;
    });
    if (kind === 'portal')
      for (const x of [-0.42, 0.42]) box(g, c, x, 0.08, 0, 0.13, 0.16, 0.3);
  } else if (kind === 'star' || kind === 'stardust') {
    const shape = new T.Shape();
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5 + Math.PI / 2,
        r = i % 2 ? 0.16 : 0.35;
      const x = Math.cos(a) * r,
        y = Math.sin(a) * r;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    const star = mesh(
      g,
      geometry(
        'star',
        () =>
          new T.ExtrudeGeometry(shape, {
            depth: 0.1,
            bevelEnabled: true,
            bevelSegments: 2,
            steps: 1,
            bevelSize: 0.02,
            bevelThickness: 0.02,
          }),
      ),
      c,
      0,
      0.4,
      0,
    );
    if (kind === 'stardust') {
      star.scale.setScalar(0.5);
      for (let i = 0; i < 5; i++)
        sphere(
          g,
          c,
          Math.sin(i * 2.4) * 0.3,
          0.15 + i * 0.1,
          Math.cos(i * 2.4) * 0.2,
          0.035,
        );
    }
  } else if (kind === 'moon') {
    const arc = mesh(
      g,
      geometry(
        'moon',
        () => new T.TorusGeometry(0.27, 0.08, 10, 24, Math.PI * 1.5),
      ),
      c,
      0,
      0.4,
      0,
    );
    arc.rotation.z = -Math.PI * 0.75;
  } else if (kind === 'egg') {
    sphere(g, c, 0, 0.28, 0, 0.22, 0.29, 0.22);
    for (let i = 0; i < 5; i++)
      sphere(
        g,
        '#d9c8e6',
        Math.sin(i * 2.4) * 0.16,
        0.24 + i * 0.04,
        Math.cos(i * 2.4) * 0.16,
        0.04,
      );
  } else if (kind === 'chest') {
    box(g, c, 0, 0.18, 0, 0.67, 0.36, 0.48);
    box(g, '#e5ce98', 0, 0.23, 0.25, 0.1, 0.16, 0.035);
    for (const x of [-0.22, 0.22])
      box(g, '#e5ce98', x, 0.37, 0, 0.055, 0.03, 0.48);
  } else {
    // Small sculpted animals, with eyes facing the front of their square.
    sphere(g, c, 0, 0.22, 0, 0.27, 0.22, 0.32);
    sphere(g, c, 0, 0.42, 0.18, 0.19);
    if (kind === 'duck' || kind === 'chicken' || kind === 'chick') {
      sphere(g, '#ecc06f', 0, 0.38, 0.36, 0.105, 0.045, 0.09);
      for (const x of [-0.24, 0.24])
        sphere(g, c, x, 0.23, -0.03, 0.085, 0.13, 0.18);
      if (kind === 'chicken')
        for (let i = 0; i < 3; i++)
          sphere(g, '#d77f7c', 0, 0.59 + i * 0.015, 0.1 + i * 0.06, 0.06);
    } else if (kind === 'bunny') {
      for (const x of [-0.09, 0.09]) {
        sphere(g, c, x, 0.7, 0.18, 0.065, 0.22, 0.07);
        sphere(g, '#e9bcc7', x, 0.71, 0.237, 0.028, 0.14, 0.015);
      }
    } else if (kind === 'cat' || kind === 'fox') {
      for (const x of [-0.12, 0.12]) cone(g, c, x, 0.61, 0.18, 0.095, 0.2);
      const tail = sphere(g, c, 0.24, 0.36, -0.23, 0.065, 0.23, 0.065);
      tail.rotation.z = -0.5;
      if (kind === 'fox') {
        sphere(g, '#f3e7d9', 0, 0.37, 0.3, 0.12, 0.08, 0.1);
        sphere(g, '#f3e7d9', 0.29, 0.55, -0.23, 0.07);
      }
    } else if (kind === 'dog') {
      for (const x of [-0.16, 0.16])
        sphere(g, '#90796c', x, 0.4, 0.17, 0.06, 0.17, 0.08);
      sphere(g, '#f0e1cf', 0, 0.36, 0.32, 0.11, 0.075, 0.06);
      sphere(g, '#575253', 0, 0.39, 0.38, 0.035);
    } else if (kind === 'horse' || kind === 'unicorn') {
      for (const x of [-0.15, 0.15])
        for (const z of [-0.17, 0.17]) stem(g, c, x, 0.13, z, 0.045, 0.26);
      sphere(g, c, 0, 0.56, 0.19, 0.13, 0.22, 0.14);
      sphere(g, '#927d81', 0, 0.51, 0.08, 0.065, 0.24, 0.1);
      for (const x of [-0.07, 0.07]) cone(g, c, x, 0.81, 0.19, 0.055, 0.15);
      if (kind === 'unicorn') cone(g, '#e6cc92', 0, 0.85, 0.28, 0.045, 0.22);
    } else if (kind === 'dragon') {
      for (const x of [-0.25, 0.25]) {
        const wing = sphere(g, '#c7b5d8', x, 0.36, 0, 0.19, 0.025, 0.23);
        wing.rotation.z = x > 0 ? 0.7 : -0.7;
      }
      for (let i = 0; i < 4; i++)
        cone(g, '#d5bcd9', 0, 0.43 - i * 0.07, -0.08 - i * 0.075, 0.04, 0.1);
    } else if (kind === 'frog') {
      for (const x of [-0.14, 0.14]) {
        sphere(g, c, x, 0.51, 0.2, 0.095);
        sphere(g, '#f3edcc', x, 0.53, 0.27, 0.05);
        sphere(g, '#424750', x, 0.53, 0.31, 0.022);
        sphere(g, c, x * 1.5, 0.08, 0.12, 0.13, 0.07, 0.16);
      }
    } else if (kind === 'butterfly' || kind === 'bee') {
      for (const side of [-1, 1]) {
        sphere(
          g,
          kind === 'bee' ? '#e9e5f0' : c,
          side * 0.22,
          0.42,
          0,
          0.2,
          0.035,
          0.23,
        );
        if (kind === 'butterfly')
          sphere(g, '#edced9', side * 0.24, 0.43, 0.12, 0.13, 0.03, 0.13);
      }
      if (kind === 'bee')
        for (let i = 0; i < 3; i++)
          box(g, '#998772', 0, 0.405, i * 0.09 - 0.09, 0.18, 0.025, 0.03);
    } else if (kind === 'fish') {
      const tail = cone(g, c, 0, 0.2, -0.33, 0.15, 0.23);
      tail.rotation.x = -Math.PI / 2;
      sphere(g, '#f1dcc4', 0.22, 0.23, 0, 0.08, 0.06, 0.13);
    } else if (kind === 'hedgehog') {
      for (let i = 0; i < 14; i++) {
        const a = i * 2.4;
        cone(
          g,
          '#8f7a6a',
          Math.sin(a) * 0.2,
          0.36,
          Math.cos(a) * 0.2,
          0.05,
          0.15,
        );
      }
    } else if (kind === 'sheep') {
      for (let i = 0; i < 9; i++)
        sphere(
          g,
          c,
          Math.sin(i * 2.4) * 0.2,
          0.27 + (i % 2) * 0.11,
          Math.cos(i * 2.4) * 0.2,
          0.13,
        );
    } else if (kind === 'pig') {
      sphere(g, '#d996a7', 0, 0.39, 0.35, 0.11, 0.075, 0.045);
      for (const x of [-0.14, 0.14]) cone(g, c, x, 0.57, 0.16, 0.085, 0.16);
    } else if (kind === 'turtle') {
      sphere(g, '#64896a', 0, 0.28, -0.05, 0.29, 0.2, 0.31);
      for (const x of [-0.23, 0.23])
        for (const z of [-0.17, 0.17])
          sphere(g, c, x, 0.07, z, 0.09, 0.05, 0.11);
    } else if (kind === 'ladybug') {
      sphere(g, '#515658', 0, 0.23, 0.24, 0.16);
      for (let i = 0; i < 6; i++)
        sphere(
          g,
          '#515658',
          Math.sin(i * 2.4) * 0.19,
          0.39,
          Math.cos(i * 2.4) * 0.19,
          0.043,
          0.025,
          0.043,
        );
    }
    eyes(
      g,
      kind === 'ladybug' ? 0.25 : 0.46,
      kind === 'ladybug' ? 0.37 : 0.344,
      0.08,
    );
  }
  return g;
}
export function makePiece(piece: Piece): T.Group {
  const cached = prototypes.get(piece.id);
  if (cached) return cached.clone(true);
  const root = new T.Group(),
    model = unitPiece(piece);
  // Consolidate static surfaces by material once per piece. Trees and flower
  // bouquets then cost a handful of draws instead of dozens on every frame.
  model.updateMatrixWorld(true);
  const batches = new Map<T.Material, T.BufferGeometry[]>();
  model.traverse((object) => {
    if (!(object instanceof T.Mesh)) return;
    if (object.userData.flow) {
      const flow = object.clone();
      flow.applyMatrix4(model.matrixWorld);
      root.add(flow);
      return;
    }
    const source = object.geometry as T.BufferGeometry;
    const shape = (
      source.index ? source.toNonIndexed() : source.clone()
    ).applyMatrix4(object.matrixWorld);
    const mat = object.material as T.Material;
    const batch = batches.get(mat) ?? [];
    batch.push(shape);
    batches.set(mat, batch);
  });
  let index = 0;
  batches.forEach((shapes, mat) => {
    const merged = mergeGeometries(shapes);
    shapes.forEach((shape) => shape.dispose());
    if (merged) {
      geometries.set(`merged:${piece.id}:${index++}`, merged);
      const surface = new T.Mesh(merged, mat);
      surface.castShadow = true;
      surface.receiveShadow = true;
      root.add(surface);
    }
  });
  const yScale =
    piece.height > 0
      ? piece.height
      : piece.w > 1 || piece.d > 1
        ? Math.min(2, Math.max(piece.w, piece.d) * 0.72)
        : 1;
  root.scale.set(piece.w, yScale, piece.d);
  if (piece.kind === 'path') root.scale.y *= 0.65 / 0.18;
  if (piece.kind === 'tower') root.scale.y *= 0.65 / 0.95;
  prototypes.set(piece.id, root);
  return root.clone(true);
}
export function disposeModelResources() {
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
  geometries.clear();
  materials.clear();
  prototypes.clear();
}
export function setLivingLights(live: boolean) {
  for (const color of [
    '#edcf8d',
    '#f1d796',
    '#c6b5e6',
    '#d1d9a1',
    '#bcd9b3',
    '#f4dfb3',
  ]) {
    const m = materials.get(color);
    if (m) {
      m.emissive.set(live ? '#e5c07a' : '#000000');
      m.emissiveIntensity = live ? 0.45 : 0;
    }
  }
}
