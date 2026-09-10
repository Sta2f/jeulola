import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeProgress, recordLevelResult } from './progress.ts';

void test('migrates single-level stars and sanitizes invalid saved progress', () => {
  assert.deepEqual(normalizeProgress(null, 2), { stars: [2, 0, 0, 0, 0, 0, 0, 0, 0, 0], selectedLevel: 1 });
  assert.deepEqual(normalizeProgress({ stars: [Infinity, -2, 8, 1.9, '3'], selectedLevel: 90 }).stars.slice(0, 5), [0, 0, 3, 1, 0]);
  assert.equal(normalizeProgress({ selectedLevel: NaN }).selectedLevel, 1);
  assert.equal(normalizeProgress({ selectedLevel: 90 }).selectedLevel, 10);
  assert.equal(normalizeProgress({ stars: [1] }, 3).stars[0], 3);
});

void test('stores a record per level without lowering old records or changing input', () => {
  const original = normalizeProgress(null, 3);
  const won = recordLevelResult(original, 10, 2);
  assert.equal(won.stars[0], 3);
  assert.equal(won.stars[9], 2);
  assert.equal(won.selectedLevel, 10);
  assert.equal(recordLevelResult(won, 10, 1).stars[9], 2);
  assert.equal(recordLevelResult(won, 10, 3).stars[9], 3);
  assert.equal(original.stars[9], 0);
});
