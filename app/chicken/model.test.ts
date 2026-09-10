/// <reference types="node" />
import assert from "node:assert/strict";
import test from "node:test";
import { createWorld, startWorld, stepWorld, PEN, OBSTACLES } from "./model.ts";
import type { WorldState, Vec2 } from "./model.ts";
import { LEVELS, getLevel } from "./levels.ts";

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

void test("ten levels add one hen each, increase speed gently and keep every spawn clear", () => {
  assert.equal(LEVELS.length, 10);
  for (const [index, level] of LEVELS.entries()) {
    const world = createWorld(level.id);
    assert.equal(world.level, level);
    assert.equal(world.chickens.length, index + 3);
    assert.equal(level.timeLimit, 90 + index * 5);
    assert.equal(level.speedMultiplier, 1 + index * 0.05);
    for (const hen of world.chickens) {
      assert.ok(hen.x > 35 + 13 && hen.x < PEN.x - 18);
      assert.ok(hen.y > 100 + 13 && hen.y < 630 - 13);
      assert.ok(Math.hypot(hen.x - world.player.x, hen.y - world.player.y) > 29);
      for (const obstacle of OBSTACLES) {
        assert.ok(hen.x <= obstacle.x - 13 || hen.x >= obstacle.x + obstacle.width + 13
          || hen.y <= obstacle.y - 13 || hen.y >= obstacle.y + obstacle.height + 13,
        `level ${level.id}, hen ${hen.id}: clear of scenery`);
      }
      for (const other of world.chickens.slice(hen.id + 1)) {
        assert.ok(Math.hypot(hen.x - other.x, hen.y - other.y) > 26);
      }
    }
  }
});

void test("invalid or stale level numbers select an existing level", () => {
  for (const value of [-40, 0, Number.NaN, Infinity, -Infinity]) {
    assert.equal(createWorld(value).level.id, 1);
  }
  assert.equal(getLevel(2.9).id, 2);
  assert.equal(createWorld(100).level.id, 10);
});

void test("later hens flee faster while even the quickest panicked hen remains slower than Lola", () => {
  let previousSpeed = 0;
  for (const level of LEVELS) {
    const world = startWorld(createWorld(level.id));
    const hen = world.chickens[1];
    hen.x = 500;
    hen.y = 350;
    world.player.x = 460;
    world.player.y = 350;
    stepWorld(world, { x: 0, y: 1 }, 1 / 60);
    assert.equal(hen.state, "panic");
    const speed = Math.hypot(hen.vx, hen.vy);
    assert.ok(speed > previousSpeed);
    assert.ok(speed < Math.hypot(world.player.vx, world.player.vy));
    previousSpeed = speed;
  }
});

void test("all twelve captured hens have distinct resting places inside the pen", () => {
  const places = new Set<string>();
  for (let id = 0; id < 12; id += 1) {
    const world = startWorld(createWorld(10));
    const hen = world.chickens[id];
    hen.x = 725;
    hen.y = 320;
    world.player.x = 640;
    world.player.y = 320;
    advance(world, 1, { x: 0.55, y: 0 });
    assert.equal(hen.state, "captured", `hen ${id} enters the gate`);
    world.player.x = 300;
    world.player.y = 630;
    advance(world, 4);
    assert.ok(hen.x > PEN.x + 18 && hen.x < PEN.x + PEN.width - 18);
    assert.ok(hen.y > 232 && hen.y < PEN.y + PEN.height - 18);
    places.add(`${Math.round(hen.x)},${Math.round(hen.y)}`);
  }
  assert.equal(places.size, 12);
});

void test("every level can be herded from its own spawns through the real gate", () => {
  for (const level of LEVELS) {
    const world = startWorld(createWorld(level.id));
    for (const hen of world.chickens) {
      for (let frame = 0; frame < 1800 && hen.state !== "captured" && world.status === "playing"; frame += 1) {
        const toGate = { x: 805 - hen.x, y: 320 - hen.y };
        const magnitude = Math.hypot(toGate.x, toGate.y);
        world.player.x = hen.x - toGate.x / magnitude * 82;
        world.player.y = hen.y - toGate.y / magnitude * 82;
        stepWorld(world, still, 1 / 60);
      }
      assert.equal(hen.state, "captured", `level ${level.id}, hen ${hen.id} reaches the entrance`);
    }
    assert.equal(world.status, "won");
    assert.equal(world.captured, level.chickenCount);
    assert.ok(world.elapsed < level.timeLimit);
  }
});

void test("each level uses its own deadline and proportional star thresholds", () => {
  for (const level of LEVELS) {
    const timeout = startWorld(createWorld(level.id));
    timeout.elapsed = level.timeLimit - 0.05;
    advance(timeout, 0.1);
    assert.equal(timeout.status, "timeout");
    assert.equal(timeout.elapsed, level.timeLimit);
    for (const [fraction, stars] of [[0.2, 3], [0.7, 2], [0.9, 1]]) {
      const world = startWorld(createWorld(level.id));
      world.elapsed = level.timeLimit * fraction;
      world.captured = world.chickens.length - 1;
      world.chickens.slice(1).forEach((hen) => { hen.state = "captured"; });
      const hen = world.chickens[0];
      hen.x = PEN.x + 16;
      hen.y = 320;
      world.player.x = 690;
      world.player.y = 320;
      advance(world, 0.1);
      assert.equal(world.status, "won");
      assert.equal(world.stars, stars, `level ${level.id}, ${fraction} elapsed`);
    }
  }
});
