import test from 'node:test';
import assert from 'node:assert/strict';
import {
  answerScore,
  emptyEducationScore,
  validEducationScore,
} from './educationScoreModel.ts';
void test('correct and wrong totals with a zero floor', () => {
  let s = answerScore(emptyEducationScore(), false);
  assert.equal(s.points, 0);
  assert.equal(s.wrong, 1);
  s = answerScore(answerScore(s, true), true);
  s = answerScore(s, false);
  assert.equal(s.points, 1);
  assert.equal(s.correct, 2);
  assert.equal(s.wrong, 2);
});
void test('50 net points earns a gift, resets immediately and pauses until continued', () => {
  let s = { ...emptyEducationScore(), points: 49, correct: 49 };
  s = answerScore(s, false);
  assert.equal(s.points, 48);
  s = answerScore(answerScore(s, true), true);
  assert.equal(s.points, 0);
  assert.equal(s.gifts, 1);
  assert.equal(s.celebration, true);
  assert.deepEqual(answerScore(s, true), s);
  assert.deepEqual(answerScore(s, false), s);
  s = { ...s, celebration: false };
  for (let i = 0; i < 50; i++) s = answerScore(s, true);
  assert.equal(s.gifts, 2);
  assert.equal(s.points, 0);
});
void test('saved scores round-trip and malformed values are rejected', () => {
  assert.ok(
    validEducationScore(
      JSON.parse(JSON.stringify(answerScore(emptyEducationScore(), true))),
    ),
  );
  for (const bad of [
    null,
    {},
    { ...emptyEducationScore(), points: 50 },
    { ...emptyEducationScore(), correct: -1 },
    { ...emptyEducationScore(), gifts: 1.5 },
  ])
    assert.equal(validEducationScore(bad), false);
});
