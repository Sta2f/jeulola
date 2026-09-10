import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Clock3, Pause, Play, RotateCcw, Star, Volume2, VolumeX } from 'lucide-react';
import { FloatingJoystick } from './chicken/FloatingJoystick';
import type { FarmController, FarmSnapshot } from './chicken/createGame';
import { readSaved, saveValue } from './preferences';
import { useGameAudio } from './useGameAudio';

const DIRECTIONS: Record<string, [number, number]> = { arrowup: [0, -1], z: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1], arrowleft: [-1, 0], q: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0] };
const INITIAL: FarmSnapshot = { status: 'ready', captured: 0, remaining: 90, stars: 0 };

export function ChickenGame({ onBack }: { onBack: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const controller = useRef<FarmController | null>(null);
  const keys = useRef(new Map<string, [number, number]>());
  const stick = useRef({ x: 0, y: 0 });
  const [snapshot, setSnapshot] = useState(INITIAL);
  const status = useRef(snapshot.status);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [best, setBest] = useState(() => Math.max(0, Math.min(3, Number(readSaved('chicken:stars', 0)) || 0)));
  const { soundOn, playSfx, toggleSound } = useGameAudio('traffic');
  const effects = useRef(playSfx);
  useEffect(() => { effects.current = playSfx; }, [playSfx]);
  const sendMovement = useCallback(() => {
    let x = 0, y = 0;
    for (const value of keys.current.values()) { x += value[0]; y += value[1]; }
    const length = Math.hypot(x, y);
    controller.current?.setInput(length ? { x: x / length, y: y / length } : stick.current);
  }, []);
  const clearControls = useCallback(() => {
    keys.current.clear(); stick.current = { x: 0, y: 0 }; controller.current?.setInput(stick.current);
  }, []);
  const moveStick = useCallback((input: { x: number; y: number }) => { stick.current = input; sendMovement(); }, [sendMovement]);
  const endStick = useCallback(() => { stick.current = { x: 0, y: 0 }; sendMovement(); }, [sendMovement]);
  const pause = useCallback(() => { clearControls(); controller.current?.pause(); }, [clearControls]);

  useEffect(() => {
    let cancelled = false;
    void import('./chicken/createGame').then(({ createChickenGame }) => {
      if (cancelled || !host.current) return;
      controller.current = createChickenGame(host.current, next => {
        status.current = next.status;
        setSnapshot(next);
        if (next.status !== 'playing') { keys.current.clear(); stick.current = { x: 0, y: 0 }; }
        if (next.status === 'won') {
          const saved = Math.max(0, Math.min(3, Number(readSaved('chicken:stars', 0)) || 0));
          const high = Math.max(saved, next.stars);
          saveValue('chicken:stars', high); setBest(high); effects.current('win');
        }
      }, () => effects.current('sparkle'), () => setLoaded(true), () => setError(true));
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; controller.current?.destroy(); controller.current = null; };
  }, []);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && event.target.matches('input, textarea, select, [contenteditable="true"]')) return;
      if (event.key === 'Escape') { pause(); return; }
      const direction = DIRECTIONS[event.key.toLowerCase()];
      if (!direction || status.current !== 'playing') return;
      event.preventDefault(); keys.current.set(event.code || event.key, direction); sendMovement();
    };
    const up = (event: KeyboardEvent) => { keys.current.delete(event.code || event.key); sendMovement(); };
    const visibility = () => { if (document.hidden) pause(); };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    window.addEventListener('blur', pause); window.addEventListener('resize', clearControls);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.removeEventListener('keydown', down); window.removeEventListener('keyup', up);
      window.removeEventListener('blur', pause); window.removeEventListener('resize', clearControls);
      document.removeEventListener('visibilitychange', visibility); clearControls();
    };
  }, [clearControls, pause, sendMovement]);
  const start = () => { clearControls(); controller.current?.start(); playSfx('select'); };
  const restart = () => { clearControls(); controller.current?.restart(); playSfx('select'); };
  const ended = snapshot.status === 'won' || snapshot.status === 'timeout';
  const timer = `${String(Math.floor(snapshot.remaining / 60)).padStart(2, '0')}:${String(snapshot.remaining % 60).padStart(2, '0')}`;
  return <main className="chicken-page" data-status={snapshot.status}>
    <section className="chicken-stage" aria-label="La cour du poulailler">
      <div className="chicken-canvas" ref={host} aria-label="Lola dans la cour, trois poules à guider vers la porte ouverte de l’enclos, à droite." data-testid="chicken-world" />
      <header className="chicken-header">
        <div className="chicken-navigation">
          <button onClick={onBack} aria-label="Retour aux jeux"><ArrowLeft /></button>
          <div className="chicken-title"><h1>Lola au poulailler</h1><p>Niveau 1 · La cour</p></div>
        </div>
        <section className="chicken-hud" aria-label="Progression du niveau">
          <div className="chicken-counters"><span aria-label={`${snapshot.stars} étoiles sur 3`}><Star /> <b>{snapshot.stars}/3</b></span><span aria-label={`${snapshot.captured} poules sur 3`}><span className="chicken-counter-hen" aria-hidden="true">🐔</span> <b data-testid="chicken-count">{snapshot.captured}/3</b></span><span aria-label={`${snapshot.remaining} secondes restantes`}><Clock3 /> <b data-testid="chicken-timer">{timer}</b></span></div>
        </section>
        <div className="chicken-tools">
          <button onClick={toggleSound} aria-label={soundOn ? 'Couper les sons' : 'Activer les sons'}>{soundOn ? <Volume2 /> : <VolumeX />}</button>
          <button onClick={snapshot.status === 'paused' ? () => controller.current?.resume() : pause} disabled={snapshot.status !== 'playing' && snapshot.status !== 'paused'} aria-label={snapshot.status === 'paused' ? 'Reprendre la partie' : 'Mettre en pause'}>{snapshot.status === 'paused' ? <Play /> : <Pause />}</button>
        </div>
      </header>
      {snapshot.status === 'playing' && snapshot.remaining > 84 && <aside className="chicken-tip" aria-label="Pour guider les poules">
        Place-toi derrière une poule pour la faire avancer !
      </aside>}
      <FloatingJoystick onMove={moveStick} onEnd={endStick} disabled={!loaded || snapshot.status !== 'playing'} />
      {snapshot.status !== 'playing' && <div className="chicken-overlay">
        <section className="chicken-card" aria-labelledby="chicken-card-title">
          {/* oxlint-disable-next-line next/no-img-element -- Local illustrated game sprite in this Vite application. */}
          {snapshot.status === 'won' ? <img className="chicken-victory-lola" src="/assets/chicken/lola/victory.png" alt="Lola lève les bras et fête ta réussite" /> : <span className="chicken-card-icon" aria-hidden="true">{ended ? '🌻' : '🐔'}</span>}
          <p className="chicken-card-kicker">{snapshot.status === 'paused' ? 'UNE PETITE PAUSE' : ended ? 'LES POULES TE DISENT MERCI' : 'NIVEAU 1 · LA COUR'}</p>
          <h2 id="chicken-card-title">{error ? 'La cour n’a pas pu s’ouvrir' : snapshot.status === 'paused' ? 'On souffle un peu ?' : snapshot.status === 'won' ? 'Bravo, Lola !' : snapshot.status === 'timeout' ? 'Bien joué, Lola !' : 'Tout le monde à la maison !'}</h2>
          <p>{error ? 'Reviens aux jeux puis ouvre le poulailler.' : snapshot.status === 'ready' ? 'Ramène les 3 poules dans l’enclos. Place-toi derrière elles et elles avanceront devant toi !' : snapshot.status === 'paused' ? 'Les poules t’attendent. Reprends quand tu veux.' : snapshot.status === 'won' ? 'Les 3 poules sont bien rentrées. Une belle équipe !' : `Tu as ramené ${snapshot.captured} ${snapshot.captured === 1 ? 'poule' : 'poules'} sur 3. On essaie encore ensemble ?`}</p>
          {ended && <div className="chicken-result-stars" aria-label={`${snapshot.stars} étoiles gagnées`}>{[1, 2, 3].map(star => <Star key={star} className={snapshot.stars >= star ? 'earned' : ''} />)}</div>}
          {snapshot.status === 'ready' && <div className="chicken-how"><span>☝ Glisse le joystick pour avancer</span><span>⌨ Ou utilise les flèches du clavier</span></div>}
          {error ? <button className="chicken-primary" onClick={onBack}>Retour aux jeux</button> : <button className="chicken-primary" disabled={!loaded} onClick={snapshot.status === 'paused' ? () => { clearControls(); controller.current?.resume(); } : ended ? restart : start}>{ended ? <RotateCcw /> : <Play />}{!loaded ? 'La cour se prépare…' : snapshot.status === 'paused' ? 'Continuer' : ended ? 'Rejouer' : 'C’est parti !'}</button>}
          {ended && <button className="chicken-secondary" onClick={onBack}>Retour aux jeux</button>}
          <small>{best > 0 ? `Mon meilleur résultat : ${best}/3 étoiles` : 'Une partie de 1 min 30 · À ton rythme'}</small>
        </section>
      </div>}
    </section>
    <p className="chicken-live" aria-live="polite">{snapshot.captured > 0 ? `${snapshot.captured} ${snapshot.captured === 1 ? 'poule est rentrée' : 'poules sont rentrées'} dans l’enclos !` : 'Les poules rentrent toutes seules quand tu les guides jusqu’à la porte.'}</p>
  </main>;
}
