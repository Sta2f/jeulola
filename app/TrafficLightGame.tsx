import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useGameAudio } from './useGameAudio';

const PHASES = [
  { name: 'Rouge', instruction: 'ARRÊT', color: '#ff453a', className: 'red' },
  { name: 'Vert', instruction: 'PASSEZ', color: '#32d74b', className: 'green' },
  { name: 'Orange', instruction: 'RALENTISSEZ', color: '#ff9f0a', className: 'amber' },
] as const;

const PHASE_DURATION = 15;

export function TrafficLightGame({ onBack }: { onBack: () => void }) {
  const { soundOn, startAudio, playSfx, toggleSound } = useGameAudio('traffic');
  const [running, setRunning] = useState(true);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [remaining, setRemaining] = useState(PHASE_DURATION);
  const remainingRef = useRef(PHASE_DURATION);
  const [challenge, setChallenge] = useState(false);
  const [stars, setStars] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [feedback, setFeedback] = useState('');
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      remainingRef.current -= 1;
      if (remainingRef.current <= 0) {
        remainingRef.current = PHASE_DURATION;
        setPhaseIndex((phase) => (phase + 1) % PHASES.length);
        setAnswered(false);
        setFeedback('');
        playSfx('traffic');
      }
      setRemaining(remainingRef.current);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [playSfx, running]);

  useEffect(() => { startAudio(); }, [startAudio]);

  useEffect(() => {
    const pauseWhenHidden = () => { if (document.hidden) setRunning(false); };
    document.addEventListener('visibilitychange', pauseWhenHidden);
    return () => document.removeEventListener('visibilitychange', pauseWhenHidden);
  }, []);

  const resetSimulation = () => {
    remainingRef.current = PHASE_DURATION;
    setStars(0); setAnswered(false); setFeedback('');
    setPhaseIndex(0);
    setRemaining(PHASE_DURATION);
    setRunning(true);
    playSfx('select');
  };

  const phase = PHASES[phaseIndex];
  const progress = ((PHASE_DURATION - remaining) / PHASE_DURATION) * 360;
  const answer = (index: number) => {
    if (answered || !running) return;
    if (index === phaseIndex) { setStars(s => s + 1); setAnswered(true); setFeedback('Bravo Lola, tu as le bon réflexe !'); playSfx('sparkle'); }
    else { setFeedback('Regarde la lumière allumée et essaie encore.'); playSfx('wrong'); }
  };

  return (
    <main className={`app-shell phase-${phase.className}`} onPointerDownCapture={startAudio}>
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />
      <header className="topbar">
        <button className="back-button" onClick={onBack} aria-label="Retour aux jeux"><ChevronLeft /> <span>Les jeux</span></button>
        <div><p className="eyebrow">JEU DE FEU ROUGE</p><h1>Le feu de Lola</h1></div>
        <div className={`status-pill ${running ? 'is-live' : ''}`}><span aria-hidden="true" />{running ? 'EN COURS' : 'EN PAUSE'}</div>
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
            <Button size="lg" className="primary-control" onClick={() => { setRunning((value) => !value); playSfx('select'); }}>{running ? <Pause /> : <Play />}{running ? 'Mettre en pause' : 'Reprendre'}</Button>
            <Button size="icon-lg" variant="outline" className="icon-control" onClick={toggleSound} aria-label={soundOn ? 'Couper la musique et les bruitages' : 'Activer la musique et les bruitages'}>{soundOn ? <Volume2 /> : <VolumeX />}</Button>
            <Button size="icon-lg" variant="outline" className="icon-control" onClick={resetSimulation} aria-label="Recommencer la simulation"><RotateCcw /></Button>
          </div>
          <section className="traffic-challenge"><label><input type="checkbox" checked={challenge} onChange={event => setChallenge(event.target.checked)} /> Le défi des bons réflexes <span>★ {stars}</span></label>{challenge && <><p>Que dois-tu faire à cette couleur ?</p><div>{['M’arrêter','Avancer','Ralentir'].map((text,index) => <button key={text} disabled={!running || answered} onClick={() => answer(index)}>{text}</button>)}</div><output>{feedback || 'Choisis une réponse et gagne une étoile.'}</output></>}</section>
        </div>
      </section>

    </main>
  );
}
