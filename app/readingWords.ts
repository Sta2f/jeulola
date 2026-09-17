import { words as letterWords } from './letterWords';

export type ReadingWord = { text: string; enabled: boolean; recording?: string };
export const WORDS_KEY = 'lola:reading-words:v1';
export const initialWords: ReadingWord[] = ['école', 'cartable', 'plumier', 'image'].map(text => ({ text, enabled: true }));
export const normalizeWord = (text: string) => text.normalize('NFC').trim().replace(/\s+/gu, ' ').replace(/’/g, "'").toLocaleLowerCase('fr');
export const validWord = (text: string) => text.length > 0 && text.length <= 40 && /^[\p{L}\p{M}]+(?:[ '-][\p{L}\p{M}]+)*$/u.test(text);
export function validateWords(value: unknown): ReadingWord[] {
  if (!Array.isArray(value) || value.length > 200) throw new Error('La liste doit contenir au maximum 200 mots.');
  const result: ReadingWord[] = [];
  for (const item of value) {
    if (!item || typeof item.text !== 'string' || typeof item.enabled !== 'boolean') throw new Error('Ce fichier ne contient pas une liste de mots valide.');
    const text = normalizeWord(item.text);
    if (!validWord(text)) throw new Error('Chaque mot doit contenir de 1 à 40 lettres, espaces, tirets ou apostrophes.');
    if (item.recording !== undefined && (typeof item.recording !== 'string' || item.recording.length > 700_000 || !/^data:audio\/[a-z0-9.+-]+(?:;codecs=[a-z0-9.,-]+)?;base64,[a-zA-Z0-9+/=]+$/i.test(item.recording))) throw new Error('Un enregistrement est invalide ou trop volumineux.');
    if (!result.some(word => word.text === text)) result.push({ text, enabled: item.enabled, ...(item.recording ? { recording: item.recording } : {}) });
  }
  if (JSON.stringify(result).length > 3_000_000) throw new Error('La sauvegarde audio est trop volumineuse. Retire quelques enregistrements.');
  return result;
}
export function loadWords(): { words: ReadingWord[]; warning: string } {
  try {
    const saved = localStorage.getItem(WORDS_KEY);
    return { words: saved === null ? initialWords : validateWords(JSON.parse(saved)), warning: '' };
  } catch { return { words: initialWords, warning: 'La liste enregistrée est inaccessible. Les quatre mots de départ sont affichés ; exporte ta liste avant de quitter si la sauvegarde échoue.' }; }
}
export function wordAudio(word: ReadingWord) {
  if (word.recording) return word.recording;
  const initial = initialWords.findIndex(item => item.text === word.text);
  if (initial !== -1) return `/assets/audio/reading/word-${initial}.mp3`;
  const index = letterWords.findIndex(item => normalizeWord(item.text) === word.text);
  return index === -1 ? undefined : `/assets/audio/voices/word-${index}.mp3`;
}
export function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
export function makeRound(pool: ReadingWord[], count = 6) {
  if (pool.length < 2) return [];
  const targets: ReadingWord[] = [];
  while (targets.length < count) {
    const batch = shuffle(pool);
    if (batch[0].text === targets.at(-1)?.text) [batch[0], batch[1]] = [batch[1], batch[0]];
    targets.push(...batch);
  }
  return targets.slice(0, count).map(target => ({ target, choices: shuffle([target, ...shuffle(pool.filter(word => word.text !== target.text)).slice(0, 3)]) }));
}
