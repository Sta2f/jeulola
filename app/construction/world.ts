import { BY_ID } from './catalog.ts';
export const SIZE = 14;
export type Placed = {
  uid: string;
  id: string;
  x: number;
  z: number;
  y: number;
  r: number;
};
export type World = Placed[];
export const emptyWorld = (): World => [];
export function footprint(p: Pick<Placed, 'id' | 'x' | 'z' | 'r'>) {
  const piece = BY_ID[p.id],
    w = p.r % 2 ? piece.d : piece.w,
    d = p.r % 2 ? piece.w : piece.d;
  return Array.from({ length: w * d }, (_, i) => ({
    x: p.x + (i % w),
    z: p.z + Math.floor(i / w),
  }));
}
export function dimensions(id: string, r: number) {
  const p = BY_ID[id];
  return r % 2 ? [p.d, p.w] : [p.w, p.d];
}
export function occupies(p: Placed, x: number, z: number) {
  const [w, d] = dimensions(p.id, p.r);
  return x >= p.x && x < p.x + w && z >= p.z && z < p.z + d;
}
export function topAt(world: World, x: number, z: number) {
  return world
    .filter((p) => occupies(p, x, z))
    .sort((a, b) => b.y - a.y || BY_ID[b.id].height - BY_ID[a.id].height)[0];
}
export function candidate(
  world: World,
  id: string,
  x: number,
  z: number,
  r = 0,
): Placed | null {
  if (!Object.hasOwn(BY_ID, id) || ![x, z, r].every(Number.isInteger))
    return null;
  const proposed: Placed = { uid: 'preview', id, x, z, y: 0, r };
  const cells = footprint(proposed);
  if (cells.some((c) => c.x < 0 || c.z < 0 || c.x >= SIZE || c.z >= SIZE))
    return null;
  const tops = cells.map((c) => topAt(world, c.x, c.z));
  if (tops.some((p) => p && BY_ID[p.id].height === 0)) return null;
  const heights = tops.map((p) => (p ? p.y + BY_ID[p.id].height : 0));
  const y = Math.max(...heights);
  const bridge = BY_ID[id].kind === 'bridge';
  if (bridge) {
    const [w, d] = dimensions(id, r);
    if (
      cells.some(
        (c, i) =>
          (r % 2
            ? c.x === x || c.x === x + w - 1
            : c.z === z || c.z === z + d - 1) && heights[i] !== y,
      )
    )
      return null;
  } else if (heights.some((h) => h !== y)) return null;
  if (y + Math.max(1, BY_ID[id].height) > 8) return null;
  return { ...proposed, y };
}
export function placePiece(
  world: World,
  id: string,
  x: number,
  z: number,
  r = 0,
): World | null {
  const p = candidate(world, id, x, z, r);
  return p ? [...world, { ...p, uid: crypto.randomUUID() }] : null;
}
export function supportedGroup(world: World, uid: string): World {
  const group = world.filter((p) => p.uid === uid);
  let added = true;
  while (added) {
    added = false;
    for (const p of world)
      if (
        !group.includes(p) &&
        group.some(
          (b) =>
            p.y >= b.y + Math.max(1, BY_ID[b.id].height) &&
            footprint(p).some((c) => occupies(b, c.x, c.z)),
        )
      ) {
        group.push(p);
        added = true;
      }
  }
  return group;
}
export function movePiece(
  world: World,
  uid: string,
  x: number,
  z: number,
): World | null {
  const group = supportedGroup(world, uid),
    base = group[0];
  if (!base) return null;
  const remaining = world.filter((p) => !group.includes(p));
  const dest = candidate(remaining, base.id, x, z, base.r);
  if (!dest) return null;
  let next = remaining;
  for (const p of [...group].sort((a, b) => a.y - b.y)) {
    const moved = {
      ...p,
      x: p.x + x - base.x,
      z: p.z + z - base.z,
      y: p.y + dest.y - base.y,
    };
    const check = candidate(next, p.id, moved.x, moved.z, p.r);
    if (!check || check.y !== moved.y) return null;
    next = [...next, moved];
  }
  return next;
}
export function removePiece(world: World, uid: string): World | null {
  if (supportedGroup(world, uid).length !== 1) return null;
  return world.filter((p) => p.uid !== uid);
}
export function validWorld(value: unknown): value is World {
  if (!Array.isArray(value) || value.length > SIZE * SIZE * 8) return false;
  const ids = new Set<string>();
  const checked: World = [];
  for (const p of [...value].sort((a, b) => (a?.y ?? 0) - (b?.y ?? 0))) {
    if (
      !p ||
      typeof p.uid !== 'string' ||
      ids.has(p.uid) ||
      typeof p.id !== 'string' ||
      !Object.hasOwn(BY_ID, p.id) ||
      ![p.x, p.z, p.y, p.r].every(Number.isInteger) ||
      p.r < 0 ||
      p.r > 3
    )
      return false;
    const dest = candidate(checked, p.id, p.x, p.z, p.r);
    if (!dest || dest.y !== p.y) return false;
    ids.add(p.uid);
    checked.push(p);
  }
  return true;
}
export function starterWorld(island = false): World {
  const world: World = [];
  let serial = 0;
  const put = (id: string, x: number, z: number, r = 0) => {
    const p = candidate(world, id, x, z, r);
    if (p) world.push({ ...p, uid: `garden-${serial++}` });
  };
  for (let z = 1; z < 10; z++)
    for (let x = 1; x < 13; x++) {
      if (z > 7 && x > 7) continue;
      const water = island
        ? x < 3 || x > 10 || z === 1 || z === 9
        : x === 5 || x === 6;
      put(water ? 'water' : x < 4 && z > 5 ? 'sand' : 'grass', x, z);
      if (!water && z < 4 && x > 7) put('grass', x, z);
    }
  put('house', 9, 2);
  put('pine', 8, 1);
  put('tree', 11, 1);
  put('tree', 2, 2);
  put('birch', 3, 1);
  put('pine', 1, 4);
  put('flowers', 4, 2);
  put('lavender', 4, 5);
  put('tree', 7, 4);
  put('daisy', 9, 5);
  put('fence', 10, 4);
  put('fence', 11, 4);
  put('mushroom', 2, 7);
  put('duck', 5, 7);
  put('lily', 6, 3);
  put('bridge', 4, 6, 1);
  put('flowerbush', 8, 6);
  put('rock', 3, 7);
  put('bunny', 3, 3);
  put('lamp', 8, 4);
  return world;
}
