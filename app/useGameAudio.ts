import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { getAudioSettings, setAudioSettings, useAudioSettings } from './preferences';
import { preloadRecording, useRecordedAudio } from './useRecordedAudio';

export type SoundEffect = 'step' | 'sniff' | 'bark' | 'bone' | 'sparkle' | 'paint' | 'erase' | 'select' | 'traffic' | 'win' | 'wrong' | 'hint' | 'letter-wrong' | 'letter-lost' | 'lost' | 'dog-win';
const RECORDED_EFFECTS: Partial<Record<SoundEffect, string>> = {
  'letter-wrong': '/assets/audio/effects/wrong-letter.mp3',
  'letter-lost': '/assets/audio/effects/letters-lost.mp3',
  'lost': '/assets/audio/effects/lost.mp3',
  'dog-win': '/assets/audio/effects/eclair-win.mp3',
};
type MusicTheme = 'forest' | 'dog' | 'coloring' | 'traffic' | 'hide' | 'home' | 'letters' | 'math' | 'story' | 'differences';
export type FileMusicTheme = Exclude<MusicTheme, 'traffic'>;

const MUSIC_NOTES: Record<MusicTheme, number[]> = {
  forest: [261.63, 329.63, 392, 523.25, 392, 329.63],
  dog: [196, 246.94, 293.66, 369.99, 293.66, 246.94],
  coloring: [329.63, 392, 493.88, 659.25, 523.25, 392],
  traffic: [220, 277.18, 329.63, 277.18],
  hide: [293.66, 369.99, 440, 587.33, 493.88, 369.99],
  home: [261.63, 329.63, 392, 523.25],
  letters: [261.63, 329.63, 392, 523.25],
  math: [261.63, 329.63, 392, 523.25],
  story: [261.63, 329.63, 392, 523.25],
  differences: [261.63, 329.63, 392, 523.25],
};
const FILE_MUSIC: Partial<Record<MusicTheme, { src: string; volume: number }>> = {
  forest: { src: '/assets/audio/glowing-maze-path.mp3', volume: .1 },
  dog: { src: '/assets/audio/the-lost-path-found.mp3', volume: .1 },
  coloring: { src: '/assets/audio/colorful-quiet-time.mp3', volume: .09 },
  hide: { src: '/assets/audio/tiptoe-through-the-corners.mp3', volume: .1 },
  home: { src: '/assets/audio/miniature-wonderland.mp3', volume: .09 },
  letters: { src: '/assets/audio/word-hunt-time.mp3', volume: .06 },
  math: { src: '/assets/audio/focus-flow.mp3', volume: .06 },
  story: { src: '/assets/stories/eclair-dodo/stars-in-the-lullaby.mp3', volume: .075 },
  differences: { src: '/assets/differences/hidden-clues.mp3', volume: .07 },
};
// Reuse the element unlocked by the entry tap. Safari grants autoplay per element.
let musicElement: HTMLAudioElement | null = null;
let loadedTheme: FileMusicTheme | null = null;
let desiredTheme: FileMusicTheme | null = null;
let musicGeneration = 0;
let playPending = false;
let musicStatus: 'idle' | 'playing' | 'blocked' = 'idle';
const musicListeners = new Set<() => void>();
const subscribeMusic = (listener: () => void) => { musicListeners.add(listener); return () => { musicListeners.delete(listener); }; };
export const useMusicPlaybackStatus = () => useSyncExternalStore(subscribeMusic, () => musicStatus);
function setMusicStatus(status: typeof musicStatus) {
  if (musicStatus === status) return;
  musicStatus = status;
  musicListeners.forEach(listener => listener());
}
const noiseBuffers = new WeakMap<AudioContext, AudioBuffer>();
// iOS ignores HTMLMediaElement.volume. Route music through Web Audio instead.
let musicContext: AudioContext | null = null;
let musicGain: GainNode | null = null;
const effectGains = new Map<AudioContext, GainNode>();

function level() { const settings = getAudioSettings(); return settings.enabled ? settings.volume : 0; }

function updateVolumes() {
  const volume = loadedTheme ? FILE_MUSIC[loadedTheme]!.volume * level() : 0;
  if (musicGain) {
    musicGain.gain.cancelScheduledValues(musicGain.context.currentTime);
    musicGain.gain.setTargetAtTime(volume, musicGain.context.currentTime, .015);
  } else if (musicElement) musicElement.volume = volume;
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

function connectMusic(audio: HTMLAudioElement) {
  const Context = audioContextClass();
  if (!Context) { updateVolumes(); return; }
  musicContext ??= new Context();
  if (!musicGain) {
    musicGain = musicContext.createGain();
    musicGain.gain.value = loadedTheme ? FILE_MUSIC[loadedTheme]!.volume * level() : 0;
    musicContext.createMediaElementSource(audio).connect(musicGain).connect(musicContext.destination);
    musicContext.addEventListener('statechange', () => {
      if (musicContext?.state === 'running') retryFileMusic();
      else if (desiredTheme && !document.hidden) setMusicStatus('blocked');
    });
  }
  audio.volume = 1;
  updateVolumes();
}

function getMusicElement() {
  if (musicElement) return musicElement;
  const audio = new Audio();
  audio.loop = true;
  audio.preload = 'auto';
  audio.setAttribute('playsinline', '');
  musicElement = audio;
  audio.addEventListener('canplay', retryFileMusic);
  // Some WebKit media backends seek to zero at a native loop boundary but pause.
  // Recover only that boundary, never a deliberate pause, mute or navigation.
  let loopBoundary = false;
  const markLoopBoundary = () => {
    if (Number.isFinite(audio.duration) && audio.currentTime >= audio.duration - 1.5) loopBoundary = true;
    else if (audio.currentTime > .25) loopBoundary = false;
  };
  audio.addEventListener('timeupdate', markLoopBoundary);
  audio.addEventListener('seeking', markLoopBoundary);
  audio.addEventListener('emptied', () => { loopBoundary = false; });
  audio.addEventListener('seeked', () => {
    if (!loopBoundary || audio.currentTime > .25) return;
    loopBoundary = false;
    if (audio.loop && audio.paused && level() > 0) retryFileMusic();
  });
  audio.addEventListener('error', () => { if (desiredTheme) setMusicStatus('blocked'); });
  // Retry on the trusted gesture itself, not only inside a delayed React effect.
  for (const event of ['pointerdown', 'pointerup', 'touchend', 'keydown']) document.addEventListener(event, retryFileMusic, { capture: true, passive: true });
  for (const event of ['pageshow', 'focus', 'online']) window.addEventListener(event, retryFileMusic);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      audio.pause();
      if (musicContext?.state === 'running') void musicContext.suspend().catch(() => undefined).finally(() => {
        // A quick app switch can return before suspend() settles.
        if (!document.hidden) retryFileMusic();
      });
    } else retryFileMusic();
  });
  return audio;
}

export function preloadFileMusic() {
  const audio = getMusicElement();
  if (!loadedTheme) { loadedTheme = 'home'; audio.src = FILE_MUSIC.home!.src; }
}

export function retryFileMusic() {
  if (!desiredTheme || document.hidden || !getAudioSettings().enabled) return;
  const audio = getMusicElement();
  const generation = musicGeneration;
  if (audio.error) audio.load();
  connectMusic(audio);
  if (musicContext && musicContext.state !== 'running') {
    void musicContext.resume().then(() => {
      if (generation === musicGeneration && desiredTheme && musicContext?.state === 'running' && !audio.paused) setMusicStatus('playing');
    }).catch(() => { if (generation === musicGeneration && desiredTheme) setMusicStatus('blocked'); });
  }
  if (!audio.paused || playPending) return;
  // play() and resume() must both be invoked synchronously during the gesture.
  playPending = true;
  void audio.play().then(() => {
    if (generation === musicGeneration && desiredTheme) setMusicStatus(!musicContext || musicContext.state === 'running' ? 'playing' : 'blocked');
  }).catch(() => {
    if (generation === musicGeneration && desiredTheme && !document.hidden) setMusicStatus('blocked');
  }).finally(() => { if (generation === musicGeneration) playPending = false; });
}

export function startFileMusic(theme: FileMusicTheme) {
  const audio = getMusicElement();
  desiredTheme = theme;
  if (loadedTheme !== theme) {
    musicGeneration += 1;
    playPending = false;
    audio.pause();
    loadedTheme = theme;
    audio.src = FILE_MUSIC[theme]!.src;
  }
  updateVolumes();
  retryFileMusic();
  return audio;
}

export function stopAllFileMusic(rewind = true) {
  desiredTheme = null;
  musicGeneration += 1;
  playPending = false;
  musicElement?.pause();
  if (rewind && musicElement) musicElement.currentTime = 0;
  setMusicStatus('idle');
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
  const { playRecording, stopRecording } = useRecordedAudio();
  useEffect(() => {
    const effects = theme === 'dog' ? ['dog-win'] : theme === 'hide' || theme === 'math' ? ['lost'] : theme === 'letters' ? ['letter-wrong', 'letter-lost'] : [];
    effects.forEach(effect => { void preloadRecording(RECORDED_EFFECTS[effect as SoundEffect]!).catch(() => undefined); });
  }, [theme]);
  const { enabled: soundOn, volume } = useAudioSettings();
  const activeRef = useRef(false);
  const inheritedMusicIntent = useRef(musicEnabled && desiredTheme === theme);
  const contextRef = useRef<AudioContext | null>(null);
  const musicTimer = useRef<number | null>(null);
  const noteIndex = useRef(0);

  const ensureContext = useCallback(() => {
    const AudioContextClass = audioContextClass();
    if (!AudioContextClass) return null;
    contextRef.current ??= new AudioContextClass();
    return contextRef.current;
  }, []);

  const stopMusic = useCallback(() => {
    stopRecording();
    activeRef.current = false;
    if (musicTimer.current !== null) window.clearInterval(musicTimer.current);
    musicTimer.current = null;
    if (desiredTheme === theme) stopAllFileMusic(false);
  }, [stopRecording, theme]);

  const beginMusic = useCallback(() => {
    if (!musicEnabled) return;
    activeRef.current = true;
    const fileMusic = FILE_MUSIC[theme];
    if (fileMusic) {
      startFileMusic(theme as FileMusicTheme);
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
    if (RECORDED_EFFECTS[effect]) { void playRecording(RECORDED_EFFECTS[effect]!); return; }
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
  }, [ensureContext, soundOn, playRecording]);

  const toggleSound = useCallback(() => {
    const enabled = !getAudioSettings().enabled;
    setAudioSettings({ enabled });
    updateVolumes();
    if (enabled) beginMusic();
    else { stopAllFileMusic(false); stopMusic(); }
  }, [beginMusic, stopMusic]);

  useEffect(() => {
    // Navigation starts music inside the trusted tap, before mounting the game.
    // Preserve that ownership through React's development setup/cleanup replay.
    if (inheritedMusicIntent.current && getAudioSettings().enabled) beginMusic();
    return () => {
      stopMusic();
      const context = contextRef.current;
      contextRef.current = null;
      if (context) { effectGains.get(context)?.disconnect(); effectGains.delete(context); }
      if (context && context.state !== 'closed') void context.close().catch(() => undefined);
    };
  }, [stopMusic, beginMusic]);

  useEffect(() => {
    updateVolumes();
    if (!FILE_MUSIC[theme]) return;
    if (!soundOn && desiredTheme === theme) musicElement?.pause();
  }, [soundOn, theme, volume]);

  useEffect(() => {
    let resume = false;
    const visibility = () => {
      // The singleton owns file-music recovery. Clearing its intent here lost the
      // track on iPad when navigation had started it before the game mounted.
      if (FILE_MUSIC[theme]) {
        if (document.hidden) stopRecording();
        return;
      }
      if (document.hidden) {
        resume = activeRef.current;
        stopMusic();
        if (contextRef.current?.state === 'running') void contextRef.current.suspend();
      } else if (resume && getAudioSettings().enabled) beginMusic();
    };
    document.addEventListener('visibilitychange', visibility);
    return () => document.removeEventListener('visibilitychange', visibility);
  }, [beginMusic, stopMusic, stopRecording, theme]);

  return { soundOn, startAudio: startMusic, stopAudio: stopMusic, playSfx, toggleSound };
}
