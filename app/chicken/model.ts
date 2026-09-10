import { getLevel } from "./levels.ts";
import type { LevelConfig } from "./levels.ts";

/** The level uses world coordinates so keyboard and touch share the same physics. */
export type Vec2 = { x: number; y: number };
export type Facing = "up" | "down" | "left" | "right";
export type ChickenState = "idle" | "wander" | "flee" | "panic" | "captured";
export type Rectangle = Vec2 & { width: number; height: number };

export const WORLD = { width: 1000, height: 680 } as const;
export const PEN = {
  x: 760, y: 160, width: 200, height: 250, gateTop: 260, gateBottom: 380,
} as const;
export const OBSTACLES: Rectangle[] = [
  { x: 770, y: 40, width: 180, height: 100 },
  { x: 170, y: 140, width: 90, height: 60 },
  { x: 570, y: 100, width: 50, height: 45 },
  { x: 50, y: 70, width: 70, height: 65 },
  { x: 110, y: 450, width: 80, height: 55 },
  { x: 12, y: 546, width: 134, height: 67 }, // Pond shoreline, not its tall reeds.
  { x: 307, y: 106, width: 22, height: 22 }, // Scarecrow post.
  { x: 639, y: 113, width: 67, height: 30 }, // Crates and bucket.
  { x: 708, y: 110, width: 107, height: 49 }, // Coop ramp.
  { x: 860, y: 201, width: 72, height: 18 }, // Feeder inside the pen.
];

export type Player = Vec2 & { vx: number; vy: number; facing: Facing };
export type Chicken = Player & {
  id: number;
  color: "white" | "brown" | "black";
  state: ChickenState;
  /** A short grace period after actual proximity, never an automatic homing timer. */
  influence: number;
  wanderClock: number;
  phase: number;
  home: Vec2;
  lastFlee: Vec2;
};
export type WorldState = {
  level: LevelConfig;
  player: Player;
  chickens: Chicken[];
  elapsed: number;
  captured: number;
  status: "ready" | "playing" | "paused" | "won" | "timeout";
  stars: number;
};

const PLAYER_RADIUS = 16;
const CHICKEN_RADIUS = 13;
const PLAYER_SPEED = 188;
const BOUNDS = { left: 35, right: 965, top: 100, bottom: 630 };
const GATE_CENTER = (PEN.gateTop + PEN.gateBottom) / 2;
const CAPTURE_X = PEN.x + CHICKEN_RADIUS + 4;
const FENCES: Rectangle[] = [
  { x: PEN.x - 5, y: PEN.y - 5, width: PEN.width + 10, height: 10 },
  { x: PEN.x + PEN.width - 5, y: PEN.y - 5, width: 10, height: PEN.height + 10 },
  { x: PEN.x - 5, y: PEN.y + PEN.height - 5, width: PEN.width + 10, height: 10 },
  { x: PEN.x - 5, y: PEN.y - 5, width: 10, height: PEN.gateTop - PEN.y + 5 },
  { x: PEN.x - 5, y: PEN.gateBottom, width: 10, height: PEN.y + PEN.height - PEN.gateBottom + 5 },
];
const SOLIDS = [...OBSTACLES, ...FENCES];
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const length = (v: Vec2) => Math.hypot(v.x, v.y);

function unit(v: Vec2): Vec2 {
  const magnitude = length(v);
  return magnitude > 0.0001 ? { x: v.x / magnitude, y: v.y / magnitude } : { x: 0, y: 0 };
}

function updateFacing(actor: Player) {
  if (Math.hypot(actor.vx, actor.vy) < 0.5) return;
  actor.facing = Math.abs(actor.vx) > Math.abs(actor.vy)
    ? (actor.vx < 0 ? "left" : "right")
    : (actor.vy < 0 ? "up" : "down");
}

/** Axis sliding and small fixed steps prevent tunnelling through a fence. */
function move(actor: Player, delta: Vec2, radius: number) {
  let x = clamp(actor.x + delta.x, BOUNDS.left, BOUNDS.right);
  for (const rect of SOLIDS) {
    if (actor.y <= rect.y - radius || actor.y >= rect.y + rect.height + radius) continue;
    if (x > rect.x - radius && x < rect.x + rect.width + radius) {
      if (delta.x > 0 && actor.x <= rect.x - radius) x = rect.x - radius;
      else if (delta.x < 0 && actor.x >= rect.x + rect.width + radius) x = rect.x + rect.width + radius;
    }
  }
  actor.x = x;
  let y = clamp(actor.y + delta.y, BOUNDS.top, BOUNDS.bottom);
  for (const rect of SOLIDS) {
    if (actor.x <= rect.x - radius || actor.x >= rect.x + rect.width + radius) continue;
    if (y > rect.y - radius && y < rect.y + rect.height + radius) {
      if (delta.y > 0 && actor.y <= rect.y - radius) y = rect.y - radius;
      else if (delta.y < 0 && actor.y >= rect.y + rect.height + radius) y = rect.y + rect.height + radius;
    }
  }
  actor.y = y;
}

function chicken(id: number, color: Chicken["color"], x: number, y: number): Chicken {
  return {
    id, color, x, y, vx: 0, vy: 0, facing: "right", state: "idle",
    influence: 0, wanderClock: 0, phase: id * 2.17,
    home: { x, y }, lastFlee: { x: 1, y: 0 },
  };
}

const SPAWNS: readonly Vec2[] = [
  { x: 440, y: 260 }, { x: 615, y: 415 }, { x: 455, y: 535 },
  { x: 315, y: 235 }, { x: 535, y: 340 }, { x: 650, y: 235 },
  { x: 280, y: 535 }, { x: 615, y: 560 }, { x: 405, y: 145 },
  { x: 690, y: 490 }, { x: 145, y: 330 }, { x: 435, y: 425 },
];
const COLORS: readonly Chicken["color"][] = ["white", "brown", "black"];

export function createWorld(levelNumber = 1): WorldState {
  const level = getLevel(levelNumber);
  return {
    level,
    player: { x: 315, y: 390, vx: 0, vy: 0, facing: "down" },
    chickens: SPAWNS.slice(0, level.chickenCount).map(({ x, y }, id) => chicken(id, COLORS[id % COLORS.length], x, y)),
    elapsed: 0, captured: 0, status: "ready", stars: 0,
  };
}

export function startWorld(world: WorldState): WorldState {
  if (world.status === "ready" || world.status === "paused") world.status = "playing";
  return world;
}

function stopActors(world: WorldState) {
  world.player.vx = 0;
  world.player.vy = 0;
  for (const hen of world.chickens) {
    hen.vx = 0;
    hen.vy = 0;
  }
}

function keepAwayFromEdges(hen: Chicken, direction: Vec2): Vec2 {
  const margin = 46;
  const adjusted = { ...direction };
  if (hen.x < BOUNDS.left + margin && adjusted.x < 0) {
    adjusted.x *= (hen.x - BOUNDS.left) / margin;
    adjusted.y += hen.y < GATE_CENTER ? 0.7 : -0.7;
  }
  if (hen.x > BOUNDS.right - margin && adjusted.x > 0) {
    adjusted.x *= (BOUNDS.right - hen.x) / margin;
    adjusted.y += hen.y < GATE_CENTER ? 0.7 : -0.7;
  }
  if (hen.y < BOUNDS.top + margin && adjusted.y < 0) {
    adjusted.y *= (hen.y - BOUNDS.top) / margin;
    adjusted.x += 0.65;
  }
  if (hen.y > BOUNDS.bottom - margin && adjusted.y > 0) {
    adjusted.y *= (BOUNDS.bottom - hen.y) / margin;
    adjusted.x += 0.65;
  }
  return unit(adjusted);
}

/** Assist only a push already pointing towards the gate. Lola still drives every chase. */
function fleeingDirection(hen: Chicken, away: Vec2): Vec2 {
  const towardGate = unit({ x: CAPTURE_X + 15 - hen.x, y: GATE_CENTER - hen.y });
  const alignment = away.x * towardGate.x + away.y * towardGate.y;
  const assist = alignment > 0.1 ? (hen.x > 580 ? 0.64 : 0.3) : 0;
  let direction = unit({
    x: away.x * (1 - assist) + towardGate.x * assist,
    y: away.y * (1 - assist) + towardGate.y * assist,
  });

  const ahead = { x: hen.x + direction.x * 30, y: hen.y + direction.y * 30 };
  for (const rect of SOLIDS) {
    const padding = CHICKEN_RADIUS + 3;
    if (ahead.x <= rect.x - padding || ahead.x >= rect.x + rect.width + padding
      || ahead.y <= rect.y - padding || ahead.y >= rect.y + rect.height + padding) continue;
    if (hen.x <= rect.x - CHICKEN_RADIUS || hen.x >= rect.x + rect.width + CHICKEN_RADIUS) {
      const aimY = rect.x >= PEN.x - 5 ? GATE_CENTER
        : (hen.y < rect.y + rect.height / 2 ? rect.y - padding - 8 : rect.y + rect.height + padding + 8);
      direction = unit({ x: direction.x * 0.18, y: Math.sign(aimY - hen.y) || 1 });
    } else {
      const aimX = hen.x < rect.x + rect.width / 2 ? rect.x - padding - 8 : rect.x + rect.width + padding + 8;
      direction = unit({ x: Math.sign(aimX - hen.x) || 1, y: direction.y * 0.18 });
    }
    break;
  }
  return keepAwayFromEdges(hen, direction);
}

function capture(world: WorldState, hen: Chicken) {
  hen.state = "captured";
  hen.influence = 0;
  hen.vx = 0;
  hen.vy = 0;
  world.captured += 1;
}

function tickChicken(world: WorldState, hen: Chicken, dt: number) {
  if (hen.state === "captured") {
    // Walk into a distinct, visible resting place after passing the real entrance.
    // Twelve resting places stay below the feeder and inside every pen wall.
    const resting = world.level.id === 1
      ? { x: 845 + (hen.id % 2) * 48, y: 220 + hen.id * 65 }
      : { x: 817 + (hen.id % 3) * 55, y: 246 + Math.floor(hen.id / 3) * 45 };
    const remaining = { x: resting.x - hen.x, y: resting.y - hen.y };
    const distance = length(remaining);
    const direction = unit(remaining);
    const speed = Math.min(60, distance / dt);
    hen.vx = direction.x * speed;
    hen.vy = direction.y * speed;
    hen.x += hen.vx * dt;
    hen.y += hen.vy * dt;
    updateFacing(hen);
    return;
  }

  hen.wanderClock += dt;
  const fromPlayer = { x: hen.x - world.player.x, y: hen.y - world.player.y };
  const distance = length(fromPlayer);
  const detectionRadius = [132, 122, 138][hen.id % 3];
  let direction: Vec2;
  let speed: number;

  if (distance < detectionRadius) {
    const away = distance < 0.5 ? hen.lastFlee : unit(fromPlayer);
    direction = fleeingDirection(hen, away);
    hen.lastFlee = direction;
    hen.influence = 0.8;
    hen.state = distance < 56 ? "panic" : "flee";
    speed = [102, 112, 96][hen.id % 3] * (hen.state === "panic" ? 1.14 : 1);
    hen.home = { x: hen.x, y: hen.y };
  } else if (hen.influence > 0) {
    hen.influence = Math.max(0, hen.influence - dt);
    hen.state = "flee";
    direction = keepAwayFromEdges(hen, hen.lastFlee);
    speed = 48 * (hen.influence / 0.8);
    hen.home = { x: hen.x, y: hen.y };
  } else {
    const wandering = Math.sin(hen.wanderClock * 0.82 + hen.phase) > 0.25;
    hen.state = wandering ? "wander" : "idle";
    const homeOffset = { x: hen.home.x - hen.x, y: hen.home.y - hen.y };
    direction = unit({
      x: Math.cos(hen.wanderClock * 0.64 + hen.phase) + homeOffset.x * 0.06,
      y: Math.sin(hen.wanderClock * 0.71 + hen.phase) * 0.65 + homeOffset.y * 0.06,
    });
    speed = wandering ? 14 + (hen.id % 3) * 2 : 0;
  }

  speed *= world.level.speedMultiplier;
  hen.vx = direction.x * speed;
  hen.vy = direction.y * speed;
  const previousX = hen.x;
  const previousY = hen.y;
  move(hen, { x: hen.vx * dt, y: hen.vy * dt }, CHICKEN_RADIUS);

  // Capture must cross the open left entrance, never a wall or a mere overlap.
  if (previousX < CAPTURE_X && hen.x >= CAPTURE_X) {
    const crossingFraction = (CAPTURE_X - previousX) / (hen.x - previousX);
    const crossingY = previousY + (hen.y - previousY) * crossingFraction;
    const throughGate = crossingY >= PEN.gateTop + CHICKEN_RADIUS
      && crossingY <= PEN.gateBottom - CHICKEN_RADIUS;
    if (throughGate && hen.influence > 0) capture(world, hen);
    else if (throughGate) hen.x = CAPTURE_X - 0.01;
  }
  updateFacing(hen);
}

/**
 * Input magnitude 0..1 controls speed. Oversized/diagonal vectors are clamped,
 * while release is immediate: movement has no inertia or delayed key repeat.
 */
export function stepWorld(world: WorldState, input: Vec2, dtSeconds: number): WorldState {
  if (world.status !== "playing") {
    stopActors(world);
    return world;
  }
  const safeInput = {
    x: Number.isFinite(input.x) ? input.x : 0,
    y: Number.isFinite(input.y) ? input.y : 0,
  };
  const magnitude = length(safeInput);
  if (magnitude > 1) {
    safeInput.x /= magnitude;
    safeInput.y /= magnitude;
  }
  world.player.vx = safeInput.x * PLAYER_SPEED;
  world.player.vy = safeInput.y * PLAYER_SPEED;
  updateFacing(world.player);
  if (!Number.isFinite(dtSeconds) || dtSeconds <= 0) return world;

  // A background-tab resume must not consume the level or propel Lola across it.
  const timeLimit = world.level.timeLimit;
  let remaining = Math.min(dtSeconds, 0.25, timeLimit - world.elapsed);
  while (remaining > 0.000001 && world.status === "playing") {
    const dt = Math.min(remaining, 1 / 60);
    move(world.player, { x: world.player.vx * dt, y: world.player.vy * dt }, PLAYER_RADIUS);
    world.elapsed = Math.min(timeLimit, world.elapsed + dt);
    for (const hen of world.chickens) tickChicken(world, hen, dt);
    if (world.captured === world.chickens.length) {
      world.status = "won";
      world.stars = world.elapsed <= timeLimit * 50 / 90 ? 3 : world.elapsed <= timeLimit * 75 / 90 ? 2 : 1;
      stopActors(world);
    } else if (world.elapsed >= timeLimit - 0.000001) {
      world.elapsed = timeLimit;
      world.status = "timeout";
      stopActors(world);
    }
    remaining -= dt;
  }
  return world;
}
