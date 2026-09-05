import { useEffect } from 'react';
import { readSaved, saveValue } from './preferences';

export function useAchievements(game: string, level: number, won: boolean) {
  const saved = readSaved<number[]>(`wins:${game}`, []);
  const completed = Array.isArray(saved) ? saved.filter(Number.isInteger) : [];
  if (won && !completed.includes(level)) completed.push(level);
  useEffect(() => {
    if (won) {
      const previous = readSaved<number[]>(`wins:${game}`, []);
      saveValue(`wins:${game}`, [...new Set([...(Array.isArray(previous) ? previous : []), level])]);
    }
  }, [game, level, won]);
  return completed;
}
