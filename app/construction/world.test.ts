import test from 'node:test';
import assert from 'node:assert/strict';
import { PIECES } from './catalog.ts';
import {
  candidate,
  placePiece,
  removePiece,
  movePiece,
  starterWorld,
  validWorld,
  type World,
} from './world.ts';

void test('128 distinct pieces and multi-cell rotation at the board edge', () => {
  assert.equal(PIECES.length, 128);
  assert.equal(new Set(PIECES.map((p) => p.id)).size, 128);
  assert.equal(candidate([], 'house', 13, 13), null);
  assert.ok(candidate([], 'bench', 12, 13, 0));
  assert.equal(candidate([], 'bench', 12, 13, 1), null);
});
void test('a house needs four level supports and blocks every occupied cell', () => {
  let world: World = [];
  world = placePiece(world, 'grass', 2, 2)!;
  assert.equal(candidate(world, 'house', 2, 2), null);
  for (const [x, z] of [
    [3, 2],
    [2, 3],
    [3, 3],
  ])
    world = placePiece(world, 'grass', x, z)!;
  world = placePiece(world, 'house', 2, 2)!;
  assert.equal(world.at(-1)?.y, 1);
  for (const [x, z] of [
    [2, 2],
    [3, 2],
    [2, 3],
    [3, 3],
  ])
    assert.equal(candidate(world, 'grass', x, z), null);
  assert.ok(validWorld(world));
});
void test('bridge endpoints support a span across an empty middle', () => {
  let world: World = [];
  world = placePiece(world, 'grass', 3, 3)!;
  assert.equal(candidate(world, 'bridge', 3, 3), null);
  world = placePiece(world, 'grass', 3, 5)!;
  assert.equal(candidate(world, 'bridge', 3, 3)?.y, 1);
  world = placePiece(world, 'bridge', 3, 3)!;
  assert.ok(validWorld(world));
});
void test('moving a stack preserves all pieces and refuses conflicting destinations', () => {
  let world: World = [];
  world = placePiece(world, 'earth', 2, 2)!;
  world = placePiece(world, 'grass', 2, 2)!;
  world = placePiece(world, 'tree', 2, 2)!;
  const base = world[0].uid;
  assert.equal(removePiece(world, base), null);
  const moved = movePiece(world, base, 5, 5)!;
  assert.equal(moved.length, 3);
  assert.ok(moved.every((p) => p.x === 5 && p.z === 5));
  assert.ok(validWorld(moved));
  const occupied = placePiece(world, 'house', 6, 6)!;
  assert.equal(movePiece(occupied, base, 6, 6), null);
  assert.equal(removePiece(world, world[2].uid)?.length, 2);
});
void test('height limit and malformed saved worlds are rejected', () => {
  let world: World = [];
  for (let i = 0; i < 8; i++) world = placePiece(world, 'grass', 0, 0)!;
  assert.equal(candidate(world, 'grass', 0, 0), null);
  assert.ok(validWorld(world));
  assert.equal(validWorld([null]), false);
  assert.equal(validWorld([{ ...world[0], id: 'toString' }]), false);
  assert.equal(validWorld([world[0], world[0]]), false);
  assert.equal(validWorld([{ ...world[0], x: -1 }]), false);
  assert.equal(validWorld([{ ...world[0], y: 3 }]), false);
});
void test('both starting landscapes round-trip safely', () => {
  for (const island of [false, true]) {
    const world = starterWorld(island);
    assert.ok(world.length > 100);
    assert.ok(validWorld(JSON.parse(JSON.stringify(world))));
  }
});
