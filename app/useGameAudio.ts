import { useCallback, useEffect, useRef, useState } from 'react';

export type SoundEffect = 'step' | 'sniff' | 'bark' | 'bone' | 'sparkle' | 'paint' | 'erase' | 'select' | 'traffic' | 'win' | 'wrong' | 'hint';
type MusicTheme = 'forest' | 'dog' | 'coloring' | 'traffic' | 'hide' | 'home';

const MUSIC_NOTES: Record<MusicTheme, number[]> = {
  forest: [261.63, 329.63, 392, 523.25, 392, 329.63],
  dog: [196, 246.94, 293.66, 369.99, 293.66, 246.94],
  coloring: [329.63, 392, 493.88, 659.25, 523.25, 392],
  traffic: [220, 277.18, 329.63, 277.18],
  hide: [293.66, 369.99, 440, 587.33, 493.88, 369.99],
  home: [261.63, 329.63, 392, 523.25],
};
const FILE_MUSIC: Partial<Record<MusicTheme, { src: string; volume: number }>> = {
  forest: { src: '/assets/audio/glowing-maze-path.mp3', volume: .34 },
  home: { src: '/assets/audio/miniature-wonderland.mp3', volume: .3 },
};
const noiseBuffers = new WeakMap<AudioContext, AudioBuffer>();

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
  oscillator.connect(gain).connect(context.destination);
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
  source.connect(filter).connect(gain).connect(context.destination);
  source.start(start, 0, duration);
}

export function useGameAudio(theme: MusicTheme) {
  const [soundOn, setSoundOn] = useState(true);
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
    if (musicTimer.current !== null) window.clearInterval(musicTimer.current);
    musicTimer.current = null;
    fileMusicRef.current?.pause();
  }, []);

  const beginMusic = useCallback(() => {
    const fileMusic = FILE_MUSIC[theme];
    if (fileMusic) {
      fileMusicRef.current ??= Object.assign(new Audio(fileMusic.src), { loop: true, volume: fileMusic.volume, preload: 'auto' });
      if (fileMusicRef.current.paused) void fileMusicRef.current.play().catch(() => undefined);
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
  }, [ensureContext, theme]);

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
        oscillator.connect(gain).connect(context.destination);
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
    setSoundOn((current) => {
      const context = FILE_MUSIC[theme] ? null : ensureContext();
      if (current) {
        stopMusic();
        if (context) void context.suspend();
      } else if (context) {
        void context.resume().then(beginMusic);
      } else {
        beginMusic();
      }
      return !current;
    });
  }, [beginMusic, ensureContext, stopMusic, theme]);

  useEffect(() => () => {
    stopMusic();
    if (fileMusicRef.current) fileMusicRef.current.currentTime = 0;
    if (contextRef.current) void contextRef.current.close();
  }, [stopMusic]);

  return { soundOn, startAudio: startMusic, stopAudio: stopMusic, playSfx, toggleSound };
}
