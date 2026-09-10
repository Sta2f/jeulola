export type ChickenProgress = { stars: number[]; selectedLevel: number };
const levelId = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(1, Math.min(10, Math.floor(value))) : 1;
const starCount = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(3, Math.floor(value))) : 0;

/** Old single-level results become the first level's record. */
export function normalizeProgress(value: unknown, legacy: unknown = 0): ChickenProgress {
  const saved = value && typeof value === 'object' ? value as Partial<ChickenProgress> : {};
  const stars = Array.from({ length: 10 }, (_, index) => starCount(Array.isArray(saved.stars) ? saved.stars[index] : 0));
  stars[0] = Math.max(stars[0], starCount(legacy));
  return { stars, selectedLevel: levelId(saved.selectedLevel) };
}

export function recordLevelResult(progress: ChickenProgress, level: number, stars: number): ChickenProgress {
  const next = normalizeProgress(progress);
  next.selectedLevel = levelId(level);
  next.stars[next.selectedLevel - 1] = Math.max(next.stars[next.selectedLevel - 1], starCount(stars));
  return next;
}
