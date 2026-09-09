import { useCallback, useEffect, useRef } from 'react';
import { getAudioSettings, useAudioSettings } from './preferences';

const files = new Map<string, Promise<ArrayBuffer>>();
let stopActiveRecording: (() => void) | null = null;
export function preloadRecording(src: string) {
  if (!files.has(src)) files.set(src, fetch(src).then(response => {
    if (!response.ok) throw new Error('Audio unavailable');
    return response.arrayBuffer();
  }).catch(error => { files.delete(src); throw error; }));
  return files.get(src)!;
}

/** Local, prepared audio: same French voice on Safari and PC, with real iOS gain. */
export function useRecordedAudio() {
  const settings = useAudioSettings();
  const context = useRef<AudioContext | null>(null);
  const gain = useRef<GainNode | null>(null);
  const source = useRef<AudioBufferSourceNode | null>(null);
  const fallback = useRef<HTMLAudioElement | null>(null);
  const generation = useRef(0);
  const stop = useCallback(() => {
    generation.current += 1;
    source.current?.stop();
    source.current = null;
    if (fallback.current) { fallback.current.pause(); fallback.current.currentTime = 0; }
  }, []);
  const play = useCallback(async (src: string) => {
    stopActiveRecording?.();
    stop();
    stopActiveRecording = stop;
    if (!getAudioSettings().enabled) return;
    const token = generation.current;
    const Context = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Context) {
      fallback.current ??= new Audio();
      fallback.current.src = src;
      fallback.current.volume = getAudioSettings().volume * .65;
      void fallback.current.play().catch(() => undefined);
      return;
    }
    context.current ??= new Context();
    const ctx = context.current;
    if (!gain.current) { gain.current = ctx.createGain(); gain.current.connect(ctx.destination); }
    gain.current.gain.value = getAudioSettings().volume * .65;
    try {
      await ctx.resume();
      const bytes = await preloadRecording(src);
      if (generation.current !== token || ctx.state === 'closed') return;
      const buffer = await ctx.decodeAudioData(bytes.slice(0));
      if (generation.current !== token || !getAudioSettings().enabled || document.hidden) return;
      const node = ctx.createBufferSource();
      node.buffer = buffer;
      node.connect(gain.current);
      source.current = node;
      node.onended = () => { node.disconnect(); if (source.current === node) source.current = null; };
      node.start();
    } catch {
      // A missing recording must not block the game or restart robotic browser speech.
    }
  }, [stop]);
  useEffect(() => {
    if (gain.current && context.current) gain.current.gain.setTargetAtTime(settings.enabled ? settings.volume * .65 : 0, context.current.currentTime, .015);
    if (fallback.current) fallback.current.volume = settings.enabled ? settings.volume * .65 : 0;
    if (!settings.enabled) stop();
  }, [settings.enabled, settings.volume, stop]);
  useEffect(() => {
    const hide = () => { if (document.hidden) stop(); };
    document.addEventListener('visibilitychange', hide);
    return () => { document.removeEventListener('visibilitychange', hide); stop(); if (stopActiveRecording === stop) stopActiveRecording = null; void context.current?.close().catch(() => undefined); context.current = null; gain.current = null; };
  }, [stop]);
  return { playRecording: play, stopRecording: stop };
}
