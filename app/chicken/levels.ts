export type LevelConfig = Readonly<{
  id: number;
  name: string;
  chickenCount: number;
  speedMultiplier: number;
  timeLimit: number;
}>;

const NAMES = [
  "La cour",
  "Les curieuses",
  "La ronde des poules",
  "Les plumes folles",
  "La joyeuse bande",
  "Le grand rassemblement",
  "Les poules pressées",
  "La course aux plumes",
  "La ferme en folie",
  "Le grand poulailler",
] as const;

/** One extra hen and a small speed increase, with time to enjoy each new challenge. */
export const LEVELS: readonly LevelConfig[] = Object.freeze(NAMES.map((name, index) => Object.freeze({
  id: index + 1,
  name,
  chickenCount: index + 3,
  speedMultiplier: 1 + index * 0.05,
  timeLimit: 90 + index * 5,
})));

/** Saved values and navigation can never select a missing level. */
export function getLevel(levelNumber = 1): LevelConfig {
  const index = Number.isFinite(levelNumber)
    ? Math.max(0, Math.min(LEVELS.length - 1, Math.floor(levelNumber) - 1))
    : 0;
  return LEVELS[index];
}
