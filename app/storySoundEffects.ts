export type StoryEffect = 'page' | 'star' | 'blanket' | 'sigh';

/** Quiet, original bedside foley. Uses the narration's already-unlocked context. */
export function playStoryEffect(context: AudioContext, output: AudioNode, effect: StoryEffect) {
  if (context.state !== 'running') return () => undefined;
  const nodes: AudioScheduledSourceNode[] = [];
  const start = context.currentTime;
  const envelope = context.createGain();
  envelope.connect(output);
  if (effect === 'star') {
    // A soft glass-like shimmer, without a sharp attack or loud game jingle.
    [784, 1175, 1568].forEach((frequency, i) => {
      const oscillator = context.createOscillator(); oscillator.frequency.value = frequency;
      const volume = context.createGain(); const at = start + i * .13;
      volume.gain.setValueAtTime(0, at); volume.gain.linearRampToValueAtTime(.018 / (i + 1), at + .06); volume.gain.exponentialRampToValueAtTime(.0001, at + 1.3);
      oscillator.connect(volume).connect(envelope); oscillator.start(at); oscillator.stop(at + 1.4); nodes.push(oscillator);
      oscillator.onended = () => { oscillator.disconnect(); volume.disconnect(); };
    });
  } else {
    const duration = effect === 'page' ? .32 : effect === 'blanket' ? .7 : 1.15;
    const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
    const samples = buffer.getChannelData(0);
    let previous = 0;
    for (let i = 0; i < samples.length; i++) {
      const progress = i / samples.length;
      previous = previous * .82 + (Math.random() * 2 - 1) * .18;
      const swell = Math.sin(progress * Math.PI) ** 1.5;
      samples[i] = previous * swell * (effect === 'page' ? .32 : effect === 'blanket' ? .22 : .28);
    }
    const source = context.createBufferSource(); source.buffer = buffer;
    const filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = effect === 'page' ? 2200 : effect === 'blanket' ? 1400 : 650;
    source.connect(filter).connect(envelope); source.start(); nodes.push(source);
    source.onended = () => { source.disconnect(); filter.disconnect(); envelope.disconnect(); };
  }
  return () => { for (const node of nodes) { try { node.stop(); } catch { /* Already ended. */ } } envelope.disconnect(); };
}
