import { useCallback, useEffect, useRef } from 'react';
import { getAudioSettings, setAudioSettings, useAudioSettings } from './preferences';

export type SoundEffect = 'step' | 'sniff' | 'bark' | 'bone' | 'sparkle' | 'paint' | 'erase' | 'select' | 'traffic' | 'win' | 'wrong' | 'hint';
type MusicTheme = 'forest' | 'dog' | 'coloring' | 'traffic' | 'hide' | 'home';
export type FileMusicTheme = 'forest' | 'dog' | 'coloring' | 'hide' | 'home';

const MUSIC_NOTES: Record<MusicTheme, number[]> = {
  forest: [261.63, 329.63, 392, 523.25, 392, 329.63],
  dog: [196, 246.94, 293.66, 369.99, 293.66, 246.94],
  coloring: [329.63, 392, 493.88, 659.25, 523.25, 392],
  traffic: [220, 277.18, 329.63, 277.18],
  hide: [293.66, 369.99, 440, 587.33, 493.88, 369.99],
  home: [261.63, 329.63, 392, 523.25],
};
const FILE_MUSIC: Partial<Record<MusicTheme, { src: string; volume: number }>> = {
  forest: { src: '/assets/audio/glowing-maze-path.mp3', volume: .1 },
  dog: { src: '/assets/audio/the-lost-path-found.mp3', volume: .1 },
  coloring: { src: '/assets/audio/colorful-quiet-time.mp3', volume: .09 },
  hide: { src: '/assets/audio/tiptoe-through-the-corners.mp3', volume: .1 },
  home: { src: '/assets/audio/miniature-wonderland.mp3', volume: .09 },
};
const fileMusicCache = new Map<FileMusicTheme, HTMLAudioElement>();
const noiseBuffers = new WeakMap<AudioContext, AudioBuffer>();
// iOS ignores HTMLMediaElement.volume. Route music through Web Audio instead.
let musicContext: AudioContext | null = null;
const musicGains = new Map<FileMusicTheme, GainNode>();
const effectGains = new Map<AudioContext, GainNode>();

function level() { const settings = getAudioSettings(); return settings.enabled ? settings.volume : 0; }

function updateVolumes() {
  musicGains.forEach((gain, theme) => {
    gain.gain.cancelScheduledValues(gain.context.currentTime);
    gain.gain.setTargetAtTime(FILE_MUSIC[theme]!.volume * level(), gain.context.currentTime, .015);
  });
  effectGains.forEach((gain, context) => {
    gain.gain.cancelScheduledValues(context.currentTime);
    gain.gain.setTargetAtTime(level(), context.currentTime, .015);
  });
}

function effectsOutput(context: AudioContext) {
  let gain = effectGains.get(context);
  if (!gain) {
    gain = context.createGain();
    gain.gain.value = level();
    gain.connect(context.destination);
    effectGains.set(context, gain);
  }
  return gain;
}

function connectMusic(theme: FileMusicTheme, audio: HTMLAudioElement) {
  const Context = audioContextClass();
  if (!Context) { audio.volume = FILE_MUSIC[theme]!.volume * level(); return; }
  musicContext ??= new Context();
  if (!musicGains.has(theme)) {
    const gain = musicContext.createGain();
    gain.gain.value = FILE_MUSIC[theme]!.volume * level();
    musicContext.createMediaElementSource(audio).connect(gain).connect(musicContext.destination);
    musicGains.set(theme, gain);
  }
  audio.volume = 1;
  updateVolumes();
  void musicContext.resume().catch(() => undefined);
}

function getFileMusic(theme: FileMusicTheme) {
  let audio = fileMusicCache.get(theme);
  const settings = FILE_MUSIC[theme]!;
  if (audio) {
    return audio;
  }
  audio = new Audio(settings.src);
  audio.loop = true;
  audio.volume = settings.volume * level();
  audio.preload = 'auto';
  fileMusicCache.set(theme, audio);
  return audio;
}

export function preloadFileMusic() {
  getFileMusic('home').load();
  window.setTimeout(() => {
    (['forest', 'dog', 'coloring', 'hide'] as FileMusicTheme[]).forEach((theme) => getFileMusic(theme).load());
  }, 300);
}

export function startFileMusic(theme: FileMusicTheme) {
  const audio = getFileMusic(theme);
  if (!getAudioSettings().enabled) return audio;
  connectMusic(theme, audio);
  fileMusicCache.forEach((otherAudio, otherTheme) => {
    if (otherTheme !== theme) {
      otherAudio.pause();
      otherAudio.currentTime = 0;
    }
  });
  if (audio.paused) void audio.play().catch(() => undefined);
  return audio;
}

export function stopAllFileMusic(rewind = true) {
  fileMusicCache.forEach((audio) => {
    audio.pause();
    if (rewind) audio.currentTime = 0;
  });
}

function audioContextClass() {
  return window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
}

function tone(context: AudioContext, frequency: number, start: number, duration: number, volume = .07, type: OscillatorType = 'sine') {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + .018);
  gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
  oscillator.connect(gain).connect(effectsOutput(context));
  oscillator.start(start);
  oscillator.stop(start + duration + .02);
}

function noise(context: AudioContext, start: number, duration: number, frequency: number, volume: number) {
  let buffer = noiseBuffers.get(context);
  if (!buffer) {
    buffer = context.createBuffer(1, Math.ceil(context.sampleRate * .45), context.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let index = 0; index < channel.length; index += 1) channel[index] = Math.random() * 2 - 1;
    noiseBuffers.set(context, buffer);
  }
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  source.buffer = buffer;
  filter.type = 'bandpass';
  filter.frequency.value = frequency;
  filter.Q.value = 2.2;
  gain.gain.setValueAtTime(.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + .012);
  gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
  source.connect(filter).connect(gain).connect(effectsOutput(context));
  source.start(start, 0, duration);
}

export function useGameAudio(theme: MusicTheme, musicEnabled = true) {
  const { enabled: soundOn, volume } = useAudioSettings();
  const activeRef = useRef(false);
  const contextRef = useRef<AudioContext | null>(null);
  const fileMusicRef = useRef<HTMLAudioElement | null>(null);
  const musicTimer = useRef<number | null>(null);
  const noteIndex = useRef(0);

  const ensureContext = useCallback(() => {
    const AudioContextClass = audioContextClass();
    if (!AudioContextClass) return null;
    contextRef.current ??= new AudioContextClass();
    return contextRef.current;
  }, []);

  const stopMusic = useCallback(() => {
    activeRef.current = false;
    if (musicTimer.current !== null) window.clearInterval(musicTimer.current);
    musicTimer.current = null;
    fileMusicRef.current?.pause();
  }, []);

  const beginMusic = useCallback(() => {
    if (!musicEnabled) return;
    activeRef.current = true;
    const fileMusic = FILE_MUSIC[theme];
    if (fileMusic) {
      fileMusicRef.current = startFileMusic(theme as FileMusicTheme);
      return;
    }
    if (musicTimer.current !== null) return;
    const context = ensureContext();
    if (!context) return;
    void context.resume();
    const playNote = () => {
      if (context.state !== 'running') return;
      const notes = MUSIC_NOTES[theme];
      const frequency = notes[noteIndex.current % notes.length];
      tone(context, frequency, context.currentTime, .52, theme === 'dog' ? .018 : .024, 'sine');
      tone(context, frequency / 2, context.currentTime, .58, .009, 'triangle');
      noteIndex.current += 1;
    };
    playNote();
    musicTimer.current = window.setInterval(playNote, theme === 'traffic' ? 760 : 620);
  }, [ensureContext, theme, musicEnabled]);

  const startMusic = useCallback(() => {
    if (soundOn) beginMusic();
  }, [beginMusic, soundOn]);

  const playSfx = useCallback((effect: SoundEffect) => {
    if (!soundOn) return;
    const context = ensureContext();
    if (!context) return;
    void context.resume();
    const now = context.currentTime;
    if (effect === 'step') tone(context, 170, now, .08, .025, 'triangle');
    if (effect === 'sniff') {
      noise(context, now, .1, 1250, .075);
      noise(context, now + .14, .13, 1050, .09);
    }
    if (effect === 'bark' || effect === 'bone') {
      [0, .2].forEach((delay, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(index ? 430 : 520, now + delay);
        oscillator.frequency.exponentialRampToValueAtTime(index ? 180 : 220, now + delay + .13);
        gain.gain.setValueAtTime(.0001, now + delay);
        gain.gain.exponentialRampToValueAtTime(.11, now + delay + .018);
        gain.gain.exponentialRampToValueAtTime(.0001, now + delay + .16);
        oscillator.connect(gain).connect(effectsOutput(context));
        oscillator.start(now + delay);
        oscillator.stop(now + delay + .18);
      });
    }
    if (effect === 'sparkle' || effect === 'select' || effect === 'paint') {
      const notes = effect === 'paint' ? [660, 880] : [523.25, 659.25, 783.99];
      notes.forEach((frequency, index) => tone(context, frequency, now + index * .055, .16, effect === 'paint' ? .045 : .065, 'sine'));
    }
    if (effect === 'erase') noise(context, now, .18, 620, .045);
    if (effect === 'wrong') {
      tone(context, 240, now, .16, .055, 'triangle');
      tone(context, 190, now + .11, .2, .045, 'triangle');
    }
    if (effect === 'hint') [392, 523.25, 659.25].forEach((frequency, index) => tone(context, frequency, now + index * .09, .28, .05, 'sine'));
    if (effect === 'traffic') [660, 880].forEach((frequency, index) => tone(context, frequency, now + index * .13, .12, .16));
    if (effect === 'win') [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => tone(context, frequency, now + index * .11, .5, .075, 'triangle'));
  }, [ensureContext, soundOn]);

  const toggleSound = useCallback(() => {
    const enabled = !getAudioSettings().enabled;
    setAudioSettings({ enabled });
    updateVolumes();
    if (enabled) beginMusic();
    else { stopAllFileMusic(false); stopMusic(); }
  }, [beginMusic, stopMusic]);

  useEffect(() => () => {
    stopMusic();
    if (fileMusicRef.current) fileMusicRef.current.currentTime = 0;
    const context = contextRef.current;
    contextRef.current = null;
    if (context) { effectGains.get(context)?.disconnect(); effectGains.delete(context); }
    if (context && context.state !== 'closed') void context.close().catch(() => undefined);
  }, [stopMusic]);

  useEffect(() => {
    updateVolumes();
    if (!FILE_MUSIC[theme]) return;
    const audio = getFileMusic(theme as FileMusicTheme);
    fileMusicRef.current = audio;
    if (!musicGains.has(theme as FileMusicTheme)) audio.volume = FILE_MUSIC[theme]!.volume * level();
    if (!soundOn) audio.pause();
  }, [soundOn, theme, volume]);

  useEffect(() => {
    let resume = false;
    const visibility = () => {
      if (document.hidden) {
        resume = activeRef.current;
        stopMusic();
        if (contextRef.current?.state === 'running') void contextRef.current.suspend();
      } else if (resume && getAudioSettings().enabled) beginMusic();
    };
    document.addEventListener('visibilitychange', visibility);
    return () => document.removeEventListener('visibilitychange', visibility);
  }, [beginMusic, stopMusic]);

  return { soundOn, startAudio: startMusic, stopAudio: stopMusic, playSfx, toggleSound };
}
