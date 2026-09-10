export type FarmSound = 'step' | 'cluck' | 'flap' | 'capture' | 'win' | 'select';
export type FarmAudioAssets = Partial<Record<FarmSound | 'ambience', string | readonly string[]>>;

const LEVEL: Record<FarmSound, number> = { step: .2, cluck: .46, flap: .3, capture: .55, win: .65, select: .3 };
const COOLDOWN: Record<FarmSound, number> = { step: 175, cluck: 900, flap: 500, capture: 90, win: 1200, select: 100 };
const GAME_SOUNDS = new Set<FarmSound>(['step', 'cluck', 'flap']);

/** Recorded audio only. Missing catalogue assets are deliberately left silent. */
export function createFarmAudio(assets: FarmAudioAssets = {}) {
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let ambience: AudioBufferSourceNode | null = null;
  let ambienceGain: GainNode | null = null;
  let enabled = true;
  let volume = .55;
  let playing = false;
  let unlocked = false;
  let destroyed = false;
  let loading: Promise<void> | null = null;
  const abort = new AbortController();
  const buffers = new Map<keyof FarmAudioAssets, AudioBuffer[]>();
  const missing = new Set<string>();
  const cooldowns = new Map<FarmSound, number>();
  const voices = new Map<AudioBufferSourceNode, GainNode>();

  function stopVoice(source: AudioBufferSourceNode, gain: GainNode) {
    try { source.stop(); } catch { /* It may already have ended. */ }
    source.disconnect();
    gain.disconnect();
    voices.delete(source);
  }

  function stopAmbience() {
    if (ambience) {
      try { ambience.stop(); } catch { /* It may already have ended. */ }
      ambience.disconnect();
      ambience = null;
    }
    ambienceGain?.disconnect();
    ambienceGain = null;
  }

  function stopAll() {
    stopAmbience();
    voices.forEach((gain, source) => stopVoice(source, gain));
  }

  function syncAmbience() {
    if (destroyed || !playing || !enabled || volume <= 0 || document.hidden || !unlocked || context?.state !== 'running') {
      stopAmbience();
      return;
    }
    const buffer = buffers.get('ambience')?.[0];
    if (!buffer || ambience || !master) return;
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    source.loop = true;
    gain.gain.setValueAtTime(0, context.currentTime);
    gain.gain.linearRampToValueAtTime(.36, context.currentTime + .7);
    source.connect(gain).connect(master);
    source.start();
    ambience = source;
    ambienceGain = gain;
  }

  async function load() {
    if (loading || !context) return loading;
    const audioContext = context;
    loading = Promise.all(Object.entries(assets).map(async ([key, value]) => {
      const urls = typeof value === 'string' ? [value] : value;
      const clips = await Promise.all((urls ?? []).map(async (url) => {
        try {
          const response = await fetch(url, { signal: abort.signal, credentials: 'same-origin' });
          if (!response.ok) throw new Error('Audio unavailable');
          const buffer = await audioContext.decodeAudioData(await response.arrayBuffer());
          return buffer;
        } catch {
          if (!destroyed) missing.add(key);
          return null;
        }
      }));
      if (!destroyed) buffers.set(key as keyof FarmAudioAssets, clips.filter((clip): clip is AudioBuffer => clip !== null));
    })).then(() => syncAmbience());
    return loading;
  }

  // Call directly from a trusted pointer/key event, including when sound is muted.
  // This unlocks Web Audio for later effects and iOS volume control.
  function unlock() {
    if (destroyed || Object.keys(assets).length === 0) return;
    const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    context ??= new AudioContextClass();
    if (!master) {
      master = context.createGain();
      master.gain.value = enabled ? volume : 0;
      master.connect(context.destination);
    }
    unlocked = true;
    if (context.state === 'suspended') void context.resume().then(syncAmbience).catch(() => undefined);
    void load();
    syncAmbience();
  }

  function setPlaying(value: boolean) {
    if (destroyed) return;
    playing = value;
    if (!value) {
      stopAll();
      cooldowns.clear();
    } else syncAmbience();
  }

  function setVolume(soundEnabled: boolean, nextVolume: number) {
    if (destroyed) return;
    enabled = soundEnabled;
    volume = Number.isFinite(nextVolume) ? Math.max(0, Math.min(1, nextVolume)) : 0;
    if (master && context) {
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setTargetAtTime(enabled ? volume : 0, context.currentTime, .015);
    }
    if (!enabled || volume <= 0) stopAll();
    syncAmbience();
  }

  function play(effect: FarmSound) {
    if (destroyed || !enabled || volume <= 0 || !unlocked || document.hidden || !context || !master || context.state !== 'running') return;
    if (GAME_SOUNDS.has(effect) && !playing) return;
    const candidates = buffers.get(effect);
    if (!candidates?.length) return;
    const now = context.currentTime;
    if (now - (cooldowns.get(effect) ?? -Infinity) < COOLDOWN[effect] / 1000) return;
    cooldowns.set(effect, now);
    // A dozen hens must never turn into a dozen simultaneous clucks.
    if (voices.size >= 8) {
      const first = voices.entries().next().value;
      if (first) stopVoice(first[0], first[1]);
    }
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = candidates[Math.floor(Math.random() * candidates.length)];
    source.playbackRate.value = GAME_SOUNDS.has(effect) ? .96 + Math.random() * .08 : 1;
    gain.gain.value = LEVEL[effect];
    source.connect(gain).connect(master);
    voices.set(source, gain);
    source.onended = () => { source.disconnect(); gain.disconnect(); voices.delete(source); };
    source.start();
  }

  function onVisibility() {
    if (document.hidden) {
      stopAll();
      if (context?.state === 'running') void context.suspend().catch(() => undefined);
    }
    // A new trusted gesture resumes audio together with the paused game.
  }
  document.addEventListener('visibilitychange', onVisibility);

  return {
    unlock,
    setPlaying,
    setVolume,
    play,
    getStatus: () => ({ unlocked, playing, context: context?.state ?? 'uninitialized', loaded: [...buffers.entries()].filter(([, clips]) => clips.length > 0).map(([key]) => key), missing: [...missing], voices: voices.size, ambience: ambience !== null }),
    destroy() {
      if (destroyed) return;
      destroyed = true;
      playing = false;
      abort.abort();
      document.removeEventListener('visibilitychange', onVisibility);
      stopAll();
      master?.disconnect();
      if (context && context.state !== 'closed') void context.close().catch(() => undefined);
      buffers.clear();
    },
  };
}
