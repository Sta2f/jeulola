import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { Button } from '../components/ui/button';

const PHASES = [
  { name: 'Rouge', instruction: 'ARRÊT', color: '#ff453a', className: 'red' },
  { name: 'Vert', instruction: 'PASSEZ', color: '#32d74b', className: 'green' },
  { name: 'Orange', instruction: 'RALENTISSEZ', color: '#ff9f0a', className: 'amber' },
] as const;

const PHASE_DURATION = 15;

export function TrafficLightGame({ onBack }: { onBack: () => void }) {
  const [started, setStarted] = useState(false);
  const [running, setRunning] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [remaining, setRemaining] = useState(PHASE_DURATION);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playChangeSound = useCallback(() => {
    if (!soundOn) return;
    const AudioContextClass = window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = audioContextRef.current ?? new AudioContextClass();
    audioContextRef.current = context;
    const now = context.currentTime;
    [660, 880].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, now + index * 0.13);
      gain.gain.exponentialRampToValueAtTime(0.2, now + index * 0.13 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.13 + 0.11);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(now + index * 0.13);
      oscillator.stop(now + index * 0.13 + 0.12);
    });
  }, [soundOn]);

  useEffect(() => {
    if (!started || !running) return;
    const timer = window.setInterval(() => {
      setRemaining((current) => {
        if (current > 1) return current - 1;
        setPhaseIndex((phase) => (phase + 1) % PHASES.length);
        playChangeSound();
        return PHASE_DURATION;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [playChangeSound, running, started]);

  const startSimulation = () => {
    setStarted(true);
    setRunning(true);
    const AudioContextClass = window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioContextRef.current ??= new AudioContextClass();
      void audioContextRef.current.resume();
    }
  };

  const resetSimulation = () => {
    setPhaseIndex(0);
    setRemaining(PHASE_DURATION);
    setRunning(true);
  };

  const phase = PHASES[phaseIndex];
  const progress = ((PHASE_DURATION - remaining) / PHASE_DURATION) * 360;

  return (
    <main className={`app-shell phase-${phase.className}`}>
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />
      <header className="topbar">
        <button className="back-button" onClick={onBack} aria-label="Retour aux jeux"><ChevronLeft /> <span>Les jeux</span></button>
        <div><p className="eyebrow">JEU DE FEU ROUGE</p><h1>Le feu de Lola</h1></div>
        <div className={`status-pill ${running && started ? 'is-live' : ''}`}><span aria-hidden="true" />{running && started ? 'EN COURS' : 'EN PAUSE'}</div>
      </header>

      <section className="simulation" aria-label="Simulation de feu tricolore">
        <div className="traffic-scene">
          <div className="traffic-light"><div className="visor" aria-hidden="true" />
            {PHASES.map((light, index) => <div className="light-well" key={light.name}><div className={`light light-${light.className} ${phaseIndex === index ? 'active' : ''}`} aria-label={`${light.name}${phaseIndex === index ? ' allumé' : ' éteint'}`} /></div>)}
          </div>
          <div className="pole" aria-hidden="true" /><div className="pole-base" aria-hidden="true" />
        </div>

        <div className="control-panel">
          <div className="phase-heading"><span className="phase-dot" aria-hidden="true" /><p>FEU {phase.name.toUpperCase()}</p></div>
          <h2>{phase.instruction}</h2>
          <p className="phase-copy">Le prochain feu s’allume automatiquement dans</p>
          <div className="countdown" style={{ '--progress': `${progress}deg` } as React.CSSProperties} aria-label={`${remaining} secondes restantes`}><div><strong>{remaining}</strong><span>SECONDES</span></div></div>
          <div className="timeline" aria-label="Cycle des feux">
            {PHASES.map((item, index) => <div className={index === phaseIndex ? 'current' : ''} key={item.name}><span style={{ backgroundColor: item.color }} /><p>{item.name}</p><small>15 s</small></div>)}
          </div>
          <div className="controls">
            <Button size="lg" className="primary-control" onClick={() => setRunning((value) => !value)} disabled={!started}>{running ? <Pause /> : <Play />}{running ? 'Mettre en pause' : 'Reprendre'}</Button>
            <Button size="icon-lg" variant="outline" className="icon-control" onClick={() => setSoundOn((value) => !value)} aria-label={soundOn ? 'Couper le son' : 'Activer le son'}>{soundOn ? <Volume2 /> : <VolumeX />}</Button>
            <Button size="icon-lg" variant="outline" className="icon-control" onClick={resetSimulation} aria-label="Recommencer la simulation"><RotateCcw /></Button>
          </div>
        </div>
      </section>

      {!started && <dialog open className="start-screen" aria-labelledby="start-title"><div className="start-card">
        <button className="dialog-back" onClick={onBack}><ChevronLeft /> Retour aux jeux</button>
        <div className="mini-light" aria-hidden="true"><span /><span /><span /></div>
        <p className="eyebrow">PRÊT À COMMENCER ?</p><h2 id="start-title">Le feu change toutes les 15 secondes</h2><p>Le son vous préviendra à chaque changement de couleur.</p>
        <Button size="lg" className="start-button" onClick={startSimulation} autoFocus><Play />Démarrer la simulation</Button>
      </div></dialog>}
    </main>
  );
}
