import eclair from './stories/eclair-dodo.json';

export type Story = typeof eclair;
// Add another story here to make it appear in the library, without a new route.
export const storyLibrary: Story[] = [eclair];
export const storyAsset = (story: Story, file: string) => `/assets/stories/${story.id}/${file}`;

export type WordTiming = { word: string; start: number; end: number };
export type SpokenToken = { text: string; start?: number; end?: number };
const normalize = (text: string) => text.normalize('NFC').toLocaleLowerCase('fr').replace(/[^\p{L}\p{N}]/gu, '');

/** Align real service boundaries to display words, including s'assoit/chuchote-t-elle.
 * Matching letters (not whitespace counts) preserves accents and punctuation.
 */
export function alignStoryWords(text: string, timings: WordTiming[]): SpokenToken[] {
  let audioOffset = 0;
  const positions = timings.map(timing => { const start = audioOffset; audioOffset += normalize(timing.word).length; return { ...timing, from: start, to: audioOffset }; });
  if (normalize(text) !== timings.map(t => normalize(t.word)).join('')) throw new Error('La voix et le texte ne correspondent pas.');
  let cursor = 0;
  return text.split(/(\s+)/u).filter(Boolean).map(token => {
    const start = cursor; cursor += normalize(token).length;
    const matches = positions.filter(p => p.from < cursor && p.to > start);
    return { text: token, start: matches[0]?.start, end: matches.at(-1)?.end };
  });
}
