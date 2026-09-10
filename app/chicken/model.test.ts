/// <reference types="node" />
import assert from "node:assert/strict";
import test from "node:test";
import { createWorld, startWorld, stepWorld, PEN, OBSTACLES } from "./model.ts";
import type { WorldState, Vec2 } from "./model.ts";

const still = { x: 0, y: 0 };
function advance(world: WorldState, seconds: number, input: Vec2 = still) {
  for (let elapsed = 0; elapsed < seconds - 0.000001; elapsed += 1 / 60) {
    stepWorld(world, input, Math.min(1 / 60, seconds - elapsed));
  }
}
function playing() { return startWorld(createWorld()); }

void test("a new level waits for play and always resets its three chickens", () => {
  const world = createWorld();
  stepWorld(world, { x: 1, y: 0 }, 0.25);
  assert.equal(world.status, "ready");
  assert.equal(world.player.x, 315);
  assert.equal(world.elapsed, 0);
  assert.equal(world.captured, 0);
  assert.deepEqual(world.chickens.map((hen) => hen.color), ["white", "brown", "black"]);
});

void test("Lola stops at the new pond shoreline and can walk around it", () => {
  const world = playing();
  world.player.x = 220;
  world.player.y = 580;
  advance(world, 1, { x: -1, y: 0 });
  assert.ok(world.player.x >= 162, "water cannot be crossed from the path");
  advance(world, 0.3, { x: 0, y: 1 });
  advance(world, 0.6, { x: -1, y: 0 });
  assert.ok(world.player.x < 146, "the southern path around the pond remains open");
});

void test("keyboard diagonals cannot be faster and analogue input changes speed", () => {
  const straight = playing();
  const diagonal = playing();
  const halfStick = playing();
  advance(straight, 0.5, { x: 1, y: 0 });
  advance(diagonal, 0.5, { x: 1, y: 1 });
  advance(halfStick, 0.5, { x: 0.5, y: 0 });
  const travel = (world: WorldState) => Math.hypot(world.player.x - 315, world.player.y - 390);
  assert.ok(Math.abs(travel(straight) - travel(diagonal)) < 0.0001);
  assert.ok(Math.abs(travel(halfStick) * 2 - travel(straight)) < 0.0001);
});

void test("releasing the stick stops Lola immediately, including a zero-duration frame", () => {
  const world = playing();
  advance(world, 0.1, { x: 1, y: 0 });
  const x = world.player.x;
  stepWorld(world, still, 0);
  assert.equal(world.player.vx, 0);
  advance(world, 0.1);
  assert.equal(world.player.x, x);
  assert.equal(world.player.vy, 0);
});

void test("Lola slides along obstacles and cannot cross the pen walls", () => {
  const world = playing();
  world.player.x = 130;
  world.player.y = 170;
  advance(world, 1, { x: 1, y: 0 });
  assert.ok(world.player.x <= OBSTACLES[1].x - 16);

  world.player.x = 700;
  world.player.y = 215;
  advance(world, 1, { x: 1, y: 0 });
  assert.ok(world.player.x <= PEN.x - 5 - 16);

  world.player.x = 700;
  world.player.y = 320;
  advance(world, 1, { x: 1, y: 0 });
  assert.ok(world.player.x > PEN.x + 30, "the actual open gate remains passable");
});

void test("a chicken flees Lola and entering the pen through the gate counts exactly once", () => {
  const world = playing();
  const hen = world.chickens[0];
  hen.x = 725;
  hen.y = 320;
  world.player.x = 640;
  world.player.y = 320;
  stepWorld(world, still, 1 / 60);
  assert.equal(hen.state, "flee");
  assert.ok(hen.x > 725);
  assert.ok(hen.vx > 0);
  advance(world, 1.2, { x: 0.55, y: 0 });
  assert.equal(hen.state, "captured");
  assert.equal(world.captured, 1);
  advance(world, 4);
  assert.equal(world.captured, 1);
  assert.ok(hen.x > PEN.x && hen.x < PEN.x + PEN.width);
  assert.ok(hen.y > PEN.y && hen.y < PEN.y + PEN.height);
});

void test("a chicken cannot be captured by pushing through a closed fence", () => {
  const world = playing();
  const hen = world.chickens[0];
  hen.x = 735;
  hen.y = 195;
  world.player.x = 655;
  world.player.y = 195;
  advance(world, 0.4);
  assert.equal(world.captured, 0);
  assert.ok(hen.x < PEN.x);
});

void test("merely placing a chicken inside the pen cannot trigger a capture", () => {
  const world = playing();
  world.player.x = 300;
  world.player.y = 600;
  const hen = world.chickens[0];
  hen.x = 830;
  hen.y = 300;
  hen.home = { x: hen.x, y: hen.y };
  advance(world, 2);
  assert.equal(world.captured, 0);
  assert.notEqual(hen.state, "captured");
});

void test("wandering through the gate without Lola's influence never captures", () => {
  const world = playing();
  world.player.x = 300;
  world.player.y = 600;
  const hen = world.chickens[0];
  hen.x = PEN.x + 16.9;
  hen.y = 320;
  hen.home = { x: 850, y: 320 };
  hen.wanderClock = 1;
  advance(world, 1);
  assert.equal(world.captured, 0);
  assert.ok(hen.x < PEN.x + 17);
});

void test("all three chickens can be herded from their initial positions by approaching behind them", () => {
  const world = playing();
  // Keep Lola about 80 world units behind a hen, then walk alongside its escape.
  // This asserts playable herding rather than a special capture at the spawn point.
  for (const hen of world.chickens) {
    for (let frame = 0; frame < 1200 && hen.state !== "captured"; frame += 1) {
      const toGate = { x: 805 - hen.x, y: 320 - hen.y };
      const magnitude = Math.hypot(toGate.x, toGate.y);
      world.player.x = hen.x - toGate.x / magnitude * 82;
      world.player.y = hen.y - toGate.y / magnitude * 82;
      stepWorld(world, still, 1 / 60);
    }
    assert.equal(hen.state, "captured", `${hen.color} chicken reaches the open entrance`);
  }
  assert.equal(world.status, "won");
  assert.equal(world.captured, 3);
  assert.equal(world.stars, 3);
});

void test("paused and finished games consume neither movement nor time", () => {
  for (const status of ["paused", "won", "timeout"] as const) {
    const world = playing();
    world.status = status;
    world.player.vx = 50;
    const initial = JSON.stringify(world.chickens.map(({ x, y }) => ({ x, y })));
    advance(world, 1, { x: 1, y: 1 });
    assert.equal(world.elapsed, 0);
    assert.equal(world.player.x, 315);
    assert.equal(world.player.vx, 0);
    assert.equal(JSON.stringify(world.chickens.map(({ x, y }) => ({ x, y }))), initial);
  }
});

void test("ninety seconds ends gently without granting completion stars", () => {
  const world = playing();
  world.elapsed = 89.9;
  advance(world, 0.2);
  assert.equal(world.status, "timeout");
  assert.equal(world.elapsed, 90);
  assert.equal(world.stars, 0);
  assert.equal(world.player.vx, 0);
});

void test("finishing grants stars according to elapsed active playing time", () => {
  for (const [elapsed, stars] of [[20, 3], [60, 2], [80, 1]]) {
    const world = playing();
    world.elapsed = elapsed;
    world.captured = 2;
    world.chickens[1].state = "captured";
    world.chickens[2].state = "captured";
    const hen = world.chickens[0];
    hen.x = PEN.x + 16;
    hen.y = 320;
    world.player.x = 690;
    world.player.y = 320;
    advance(world, 0.1);
    assert.equal(world.status, "won");
    assert.equal(world.stars, stars);
  }
});

void test("invalid input and a resumed background frame cannot corrupt or skip the game", () => {
  const world = playing();
  stepWorld(world, { x: Number.NaN, y: Infinity }, Number.NaN);
  assert.equal(world.player.vx, 0);
  assert.equal(world.player.vy, 0);
  stepWorld(world, { x: 1, y: 0 }, 600);
  assert.ok(world.elapsed <= 0.250001);
  assert.ok(world.player.x <= 315 + 188 * 0.250001);
  assert.equal(world.status, "playing");
});

void test("the simulation is deterministic with the same controls", () => {
  const first = playing();
  const second = playing();
  advance(first, 3, { x: 0.4, y: -0.2 });
  advance(second, 3, { x: 0.4, y: -0.2 });
  assert.deepEqual(first, second);
});
