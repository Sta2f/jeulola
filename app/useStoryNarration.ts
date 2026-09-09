import { useCallback, useEffect, useRef, useState } from 'react';
import { getAudioSettings, useAudioSettings } from './preferences';
import { alignStoryWords, storyAsset, type SpokenToken, type Story, type WordTiming } from './storyLibrary';
import { playStoryEffect, preloadStoryEffects, type StoryEffect } from './storySoundEffects';

export function useStoryNarration(story: Story) {
  const settings = useAudioSettings();
  const [page, setPage] = useState(0);
  const [tokens, setTokens] = useState<SpokenToken[]>([]);
  const [activeWord, setActiveWord] = useState(-1);
  const [status, setStatus] = useState<'loading' | 'ready' | 'playing' | 'paused' | 'ended' | 'error'>('loading');
  const [error, setError] = useState('');
  const audio = useRef<HTMLAudioElement | null>(null);
  const ctx = useRef<AudioContext | null>(null);
  const gain = useRef<GainNode | null>(null);
  const index = useRef(0);
  const generation = useRef(0);
  const advancing = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const ready = useRef(false);
  const clock = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const endHandler = useRef<() => void>(() => undefined);
  const effects = useRef(new Set<StoryEffect>());
  const cleanupEffects = useRef<(() => void)[]>([]);
  const fxEnabled = useRef(true);
  const stopEffects = useCallback(() => { cleanupEffects.current.forEach(stop => stop()); cleanupEffects.current = []; }, []);
  const playEffect = useCallback((effect: StoryEffect) => {
    if (!fxEnabled.current || !ctx.current || ctx.current.state !== 'running' || !gain.current || effects.current.has(effect)) return;
    effects.current.add(effect);
    cleanupEffects.current.push(playStoryEffect(ctx.current, gain.current, effect));
  }, []);
  const setEffectsEnabled = useCallback((enabled: boolean) => { fxEnabled.current = enabled; if (!enabled) stopEffects(); }, [stopEffects]);
  const pause = useCallback(() => {
    clearTimeout(advancing.current);
    stopEffects();
    audio.current?.pause();
    setStatus(previous => ['playing', 'ended'].includes(previous) ? 'paused' : previous);
  }, [stopEffects]);
  const play = useCallback(() => {
    if (!audio.current || !ready.current) return;
    if (!getAudioSettings().enabled || getAudioSettings().volume === 0) {
      setError('Le son est coupé. Active-le avec le réglage Volume.'); return;
    }
    const element = audio.current;
    const current = generation.current;
    const Context = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Context) {
      ctx.current ??= new Context();
      void preloadStoryEffects(ctx.current);
      if (!gain.current) {
        gain.current = ctx.current.createGain();
        ctx.current.createMediaElementSource(element).connect(gain.current).connect(ctx.current.destination);
      }
      gain.current.gain.value = getAudioSettings().volume * .75;
      element.volume = 1;
      // Both calls happen in the tap, not after the first await/network response.
      void ctx.current.resume().catch(() => {
        if (generation.current === current) { element.pause(); setStatus('paused'); setError('Touche Écouter pour reprendre la voix.'); }
      });
    } else element.volume = getAudioSettings().volume * .75;
    setError('');
    void element.play().then(() => {
      if (generation.current === current) setStatus('playing');
    }).catch(() => {
      if (generation.current === current) { setStatus('paused'); setError('Touche Écouter pour reprendre la voix.'); }
    });
  }, []);
  const selectPage = useCallback(async (next: number, autoplay = false) => {
    if (next < 0 || next >= story.pages.length) return;
    const element = audio.current;
    if (!element) return;
    pause();
    const current = ++generation.current;
    ready.current = false;
    effects.current.clear();
    index.current = next; setPage(next); setStatus('loading'); setActiveWord(-1); setTokens([]); setError('');
    element.src = storyAsset(story, `${story.narrationPrefix}-${next + 1}.mp3`);
    element.load();
    try {
      const response = await fetch(storyAsset(story, `${story.narrationPrefix}-${next + 1}.json`));
      if (!response.ok) throw new Error('Timing unavailable');
      const timing = await response.json() as WordTiming[];
      const words = alignStoryWords(story.pages[next].text, timing);
      if (current !== generation.current) return;
      setTokens(words); ready.current = true; setStatus('ready');
      if (autoplay && !document.hidden) play();
    } catch {
      if (current !== generation.current) return;
      setStatus('error'); setError('La page n’a pas pu charger. Réessaie dans un instant.');
    }
  }, [pause, play, story]);
  useEffect(() => {
    endHandler.current = () => {
      setStatus('ended'); setActiveWord(-1);
      if (index.current < story.pages.length - 1) advancing.current = setTimeout(() => { void selectPage(index.current + 1, true); }, 1200);
    };
  }, [selectPage, story.pages.length]);
  useEffect(() => {
    const element = new Audio(); element.preload = 'auto'; element.setAttribute('playsinline', ''); audio.current = element;
    const ended = () => endHandler.current();
    const failed = () => { setStatus('error'); setError('La voix n’a pas pu charger. Touche Réessayer.'); };
    const paused = () => setStatus(value => value === 'playing' ? 'paused' : value);
    const visibility = () => {
      if (document.hidden) {
        pause();
        if (ctx.current?.state === 'running') void ctx.current.suspend().catch(() => undefined);
      }
    };
    element.addEventListener('ended', ended); element.addEventListener('error', failed); element.addEventListener('pause', paused);
    document.addEventListener('visibilitychange', visibility);
    // oxlint-disable-next-line react/react-compiler -- Initialize an external media element and its asynchronous timing request, once per book.
    void selectPage(0);
    return () => {
      // oxlint-disable-next-line react-hooks/exhaustive-deps -- This is a cancellation counter, not a mounted DOM ref.
      generation.current++; clearInterval(clock.current); clearTimeout(advancing.current);
      element.removeEventListener('ended', ended); element.removeEventListener('error', failed); element.removeEventListener('pause', paused);
      document.removeEventListener('visibilitychange', visibility);
      element.pause(); element.removeAttribute('src'); element.load(); audio.current = null;
      stopEffects();
      void ctx.current?.close().catch(() => undefined); ctx.current = null; gain.current = null;
    };
  }, [pause, selectPage, stopEffects]);
  useEffect(() => {
    if (status !== 'playing') return;
    const tick = () => {
      const time = audio.current?.currentTime ?? 0;
      const wordIndex = tokens.findIndex(token => token.start !== undefined && token.end !== undefined && time >= token.start && time < token.end);
      setActiveWord(wordIndex);
      const word = tokens[wordIndex]?.text.toLocaleLowerCase('fr') ?? '';
      if (word.includes('couverture')) playEffect('blanket');
      if (word.includes('soupir')) playEffect('sigh');
    };
    clock.current = setInterval(tick, 50);
    return () => clearInterval(clock.current);
  }, [status, tokens, playEffect]);
  useEffect(() => {
    const volume = settings.enabled ? settings.volume * .75 : 0;
    if (gain.current && ctx.current) gain.current.gain.setTargetAtTime(volume, ctx.current.currentTime, .015);
    else if (audio.current) audio.current.volume = volume;
    // oxlint-disable-next-line react/react-compiler -- Global mute must stop the external player and reflect the resulting pause.
    if (!settings.enabled || settings.volume === 0) pause();
  }, [settings.enabled, settings.volume, pause]);
  return { page, tokens, activeWord, status, error, play, pause, selectPage, setEffectsEnabled };
}
