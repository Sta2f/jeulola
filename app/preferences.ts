import { useSyncExternalStore } from 'react';

export function readSaved<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(`lola:${key}`) ?? 'null') ?? fallback; }
  catch { return fallback; }
}

export function saveValue(key: string, value: unknown) {
  try { localStorage.setItem(`lola:${key}`, JSON.stringify(value)); } catch { /* Private browsing may disable storage. */ }
}

let audioSettings = { enabled: readSaved('sound', true) === true, volume: Math.max(0, Math.min(1, Number(readSaved('volume', .55)) || 0)) };
const listeners = new Set<() => void>();
export const getAudioSettings = () => audioSettings;
export function setAudioSettings(update: Partial<typeof audioSettings>) {
  audioSettings = { ...audioSettings, ...update };
  saveValue('sound', audioSettings.enabled);
  saveValue('volume', audioSettings.volume);
  listeners.forEach((listener) => listener());
}
export function useAudioSettings() {
  return useSyncExternalStore((listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; }, getAudioSettings);
}
