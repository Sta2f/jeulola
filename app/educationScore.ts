import { useSyncExternalStore } from 'react';
import { readSaved, saveValue } from './preferences';
import {
  answerScore,
  emptyEducationScore,
  validEducationScore,
  type EducationScore,
} from './educationScoreModel';
const key = 'education:score:v1';
const saved = readSaved<unknown>(key, null);
let score = validEducationScore(saved) ? saved : emptyEducationScore();
let visible = true;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());
function write(next: EducationScore) {
  score = next;
  saveValue(key, next);
  notify();
}
export function recordEducationAnswer(correct: boolean) {
  write(answerScore(score, correct));
}
export function finishEducationCelebration() {
  write({ ...score, celebration: false });
}
export function setEducationVisible(next: boolean) {
  if (visible !== next) {
    visible = next;
    notify();
  }
}
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export function useEducationScore() {
  return useSyncExternalStore(subscribe, () => score);
}
export function useEducationVisible() {
  return useSyncExternalStore(subscribe, () => visible);
}
window.addEventListener('storage', (event) => {
  if (event.key !== `lola:${key}`) return;
  const next = readSaved<unknown>(key, null);
  if (validEducationScore(next)) {
    score = next;
    notify();
  }
});
