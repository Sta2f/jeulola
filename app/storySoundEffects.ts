export type StoryEffect = 'blanket' | 'sigh';

// Recorded bedside foley, not oscillators or generated white noise. Credits ship with the book.
const files: Record<StoryEffect, string> = {
  blanket: '/assets/stories/eclair-dodo/fx-blanket-v2.mp3',
  sigh: '/assets/stories/eclair-dodo/fx-sigh-v2.mp3',
};
const decoded = new WeakMap<AudioContext, Map<StoryEffect, AudioBuffer>>();
const pending = new WeakMap<AudioContext, Promise<void>>();

export function preloadStoryEffects(context: AudioContext) {
  let job = pending.get(context);
  if (!job) {
    const buffers = new Map<StoryEffect, AudioBuffer>();
    decoded.set(context, buffers);
    job = Promise.all(Object.entries(files).map(async ([effect, path]) => {
      try {
        const response = await fetch(path);
        if (!response.ok) return;
        const buffer = await context.decodeAudioData(await response.arrayBuffer());
        if (context.state !== 'closed') buffers.set(effect as StoryEffect, buffer);
      } catch { /* Optional foley must never interrupt the story. */ }
    })).then(() => undefined);
    pending.set(context, job);
  }
  return job;
}

/** A missed cue is skipped, never played late over another sentence. */
export function playStoryEffect(context: AudioContext, output: AudioNode, effect: StoryEffect) {
  const buffer = decoded.get(context)?.get(effect);
  if (context.state !== 'running' || !buffer) return () => undefined;
  const source = context.createBufferSource();
  const level = context.createGain();
  source.buffer = buffer;
  level.gain.value = .55;
  source.connect(level).connect(output);
  let stopped = false;
  const disconnect = () => { source.disconnect(); level.disconnect(); };
  source.onended = disconnect;
  source.start();
  return () => {
    if (stopped) return;
    stopped = true;
    try { source.stop(); } catch { /* Already ended. */ }
    disconnect();
  };
}
