import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Clock3, Pause, Play, RotateCcw, Star, Volume2, VolumeX } from 'lucide-react';
import { FloatingJoystick } from './chicken/FloatingJoystick';
import type { FarmController, FarmSnapshot } from './chicken/createGame';
import { LEVELS, getLevel } from './chicken/levels';
import { normalizeProgress, recordLevelResult } from './chicken/progress';
import { createFarmAudio } from './chicken/audio';
import { getAudioSettings, readSaved, saveValue, useAudioSettings } from './preferences';
import { useGameAudio } from './useGameAudio';

const DIRECTIONS: Record<string, [number, number]> = { arrowup: [0, -1], z: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1], arrowleft: [-1, 0], q: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0] };
const readProgress = () => normalizeProgress(readSaved('chicken:progress', null), readSaved('chicken:stars', 0));

export function ChickenGame({ onBack }: { onBack: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const controller = useRef<FarmController | null>(null);
  const audio = useRef<ReturnType<typeof createFarmAudio> | null>(null);
  const keys = useRef(new Map<string, [number, number]>());
  const stick = useRef({ x: 0, y: 0 });
  const [progress, setProgress] = useState(readProgress);
  const initialLevel = useRef(progress.selectedLevel);
  const [snapshot, setSnapshot] = useState<FarmSnapshot>(() => {
    const level = getLevel(progress.selectedLevel);
    return { status: 'ready', captured: 0, remaining: level.timeLimit, stars: 0, level: level.id, total: level.chickenCount };
  });
  const status = useRef(snapshot.status);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const { soundOn, playSfx, toggleSound } = useGameAudio('traffic');
  const settings = useAudioSettings();
  useEffect(() => { audio.current?.setVolume(settings.enabled, settings.volume); }, [settings]);
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
  const pause = useCallback(() => { clearControls(); audio.current?.setPlaying(false); controller.current?.pause(); }, [clearControls]);

  useEffect(() => {
    let cancelled = false;
    let captured = 0;
    const farmAudio = createFarmAudio(); audio.current = farmAudio;
    const savedAudio = getAudioSettings(); farmAudio.setVolume(savedAudio.enabled, savedAudio.volume);
    void import('./chicken/createGame').then(({ createChickenGame }) => {
      if (cancelled || !host.current) return;
      controller.current = createChickenGame(host.current, next => {
        const previous = status.current;
        status.current = next.status; setSnapshot(next);
        farmAudio.setPlaying(next.status === 'playing');
        // Process rewards after stopping gameplay audio, so the final hen's
        // chime and the victory horn can finish on the result screen.
        for (let count = captured; count < next.captured; count++) farmAudio.play('capture');
        captured = next.captured;
        if (next.status !== 'playing') { keys.current.clear(); stick.current = { x: 0, y: 0 }; }
        if (next.status === 'won' && previous !== 'won') {
          const saved = recordLevelResult(readProgress(), next.level, next.stars);
          saveValue('chicken:progress', saved);
          if (next.level === 1) saveValue('chicken:stars', saved.stars[0]);
          setProgress(saved); farmAudio.play('win');
        }
      }, () => {}, () => setLoaded(true), () => setError(true), initialLevel.current, sound => farmAudio.play(sound));
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; farmAudio.destroy(); audio.current = null; controller.current?.destroy(); controller.current = null; };
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
  const rememberLevel = (id: number) => {
    const saved = { ...readProgress(), selectedLevel: getLevel(id).id };
    saveValue('chicken:progress', saved); setProgress(saved);
  };
  const selectLevel = (id: number) => { clearControls(); controller.current?.selectLevel(id); rememberLevel(id); playSfx('select'); };
  const start = () => { clearControls(); audio.current?.unlock(); controller.current?.start(); playSfx('select'); };
  const resume = () => { clearControls(); audio.current?.unlock(); controller.current?.resume(); };
  const restart = (id = snapshot.level) => { clearControls(); audio.current?.unlock(); controller.current?.restart(id); rememberLevel(id); playSfx('select'); };
  const level = getLevel(snapshot.level);
  const ended = snapshot.status === 'won' || snapshot.status === 'timeout';
  const nextLevel = snapshot.status === 'won' && snapshot.level < LEVELS.length;
  const totalStars = progress.stars.reduce((sum, stars) => sum + stars, 0);
  const completed = progress.stars.filter(stars => stars > 0).length;
  const timer = `${String(Math.floor(snapshot.remaining / 60)).padStart(2, '0')}:${String(snapshot.remaining % 60).padStart(2, '0')}`;
  return <main className="chicken-page" data-status={snapshot.status}>
    <section className="chicken-stage" aria-label="La cour du poulailler">
      <div className="chicken-canvas" ref={host} aria-label={`Lola dans la cour, ${snapshot.total} poules à guider vers la porte ouverte de l’enclos, à droite.`} data-testid="chicken-world" />
      <header className="chicken-header">
        <div className="chicken-navigation">
          <button onClick={onBack} aria-label="Retour aux jeux"><ArrowLeft /></button>
          <div className="chicken-title"><h1>Lola au poulailler</h1><p>Niveau {level.id} · {level.name}</p></div>
        </div>
        <section className="chicken-hud" aria-label={`Niveau ${level.id} sur 10 · Progression du niveau`}>
          <div className="chicken-counters"><span aria-label={`${snapshot.stars} étoiles sur 3`}><Star /> <b>{snapshot.stars}/3</b></span><span aria-label={`${snapshot.captured} poules sur ${snapshot.total}`}><span className="chicken-counter-hen" aria-hidden="true">🐔</span> <b data-testid="chicken-count">{snapshot.captured}/{snapshot.total}</b></span><span aria-label={`${snapshot.remaining} secondes restantes`}><Clock3 /> <b data-testid="chicken-timer">{timer}</b></span></div>
          <span className="chicken-level-label">Niv. {level.id}/10</span>
        </section>
        <div className="chicken-tools">
          <button onClick={() => { audio.current?.unlock(); toggleSound(); }} aria-label={soundOn ? 'Couper les sons' : 'Activer les sons'}>{soundOn ? <Volume2 /> : <VolumeX />}</button>
          <button onClick={snapshot.status === 'paused' ? resume : pause} disabled={snapshot.status !== 'playing' && snapshot.status !== 'paused'} aria-label={snapshot.status === 'paused' ? 'Reprendre la partie' : 'Mettre en pause'}>{snapshot.status === 'paused' ? <Play /> : <Pause />}</button>
        </div>
      </header>
      {snapshot.status === 'playing' && snapshot.remaining > level.timeLimit - 6 && <aside className="chicken-tip" aria-label="Pour guider les poules">
        {level.id === 1 ? 'Place-toi derrière une poule pour la faire avancer !' : `Niveau ${level.id} · ${level.chickenCount} poules, encore plus rapides !`}
      </aside>}
      <FloatingJoystick onMove={moveStick} onEnd={endStick} disabled={!loaded || snapshot.status !== 'playing'} />
      {snapshot.status !== 'playing' && <div className="chicken-overlay">
        <section className={`chicken-card${snapshot.status === 'ready' ? ' chicken-level-card' : ''}`} aria-labelledby="chicken-card-title">
          {/* oxlint-disable-next-line next/no-img-element -- Local illustrated game sprite in this Vite application. */}
          {snapshot.status === 'won' ? <img className="chicken-victory-lola" src="/assets/chicken/lola/victory.png" alt="Lola lève les bras et fête ta réussite" /> : <span className="chicken-card-icon" aria-hidden="true">{ended ? '🌻' : '🐔'}</span>}
          <p className="chicken-card-kicker">{snapshot.status === 'paused' ? 'UNE PETITE PAUSE' : `NIVEAU ${level.id} · ${level.name.toLocaleUpperCase('fr')}`}</p>
          <h2 id="chicken-card-title">{error ? 'La cour n’a pas pu s’ouvrir' : snapshot.status === 'paused' ? 'On souffle un peu ?' : snapshot.status === 'won' ? completed === 10 ? 'Toute la ferme te dit bravo !' : 'Bravo, Lola !' : snapshot.status === 'timeout' ? 'Bien joué, Lola !' : 'Choisis ton niveau'}</h2>
          <p>{error ? 'Reviens aux jeux puis ouvre le poulailler.' : snapshot.status === 'ready' ? `Ramène les ${snapshot.total} poules dans l’enclos. Place-toi derrière elles pour les guider !` : snapshot.status === 'paused' ? 'Les poules t’attendent. Reprends quand tu veux.' : snapshot.status === 'won' ? `Les ${snapshot.total} poules sont bien rentrées. Une belle équipe !` : `Tu as ramené ${snapshot.captured} ${snapshot.captured === 1 ? 'poule' : 'poules'} sur ${snapshot.total}. On essaie encore ensemble ?`}</p>
          {snapshot.status === 'ready' && !error && <>
            <fieldset className="chicken-levels" aria-label="Choisir un niveau">
              {LEVELS.map(item => <button key={item.id} className={item.id === level.id ? 'selected' : ''} aria-pressed={item.id === level.id} aria-label={`Niveau ${item.id}, ${item.chickenCount} poules, ${progress.stars[item.id - 1]} étoiles sur 3`} disabled={!loaded} onClick={() => selectLevel(item.id)}>
                <b>{item.id}</b><span aria-hidden="true">{[1, 2, 3].map(star => <Star key={star} className={progress.stars[item.id - 1] >= star ? 'earned' : ''} />)}</span>
              </button>)}
            </fieldset>
            <div className="chicken-level-detail"><strong>{level.name}</strong><span>{level.chickenCount} poules · {Math.floor(level.timeLimit / 60)} min {String(level.timeLimit % 60).padStart(2, '0')}{level.id > 1 ? ` · Vitesse +${Math.round((level.speedMultiplier - 1) * 100)} %` : ''}</span></div>
          </>}
          {ended && <div className="chicken-result-stars" aria-label={`${snapshot.stars} étoiles gagnées`}>{[1, 2, 3].map(star => <Star key={star} className={snapshot.stars >= star ? 'earned' : ''} />)}</div>}
          {snapshot.status === 'ready' && <div className="chicken-how"><span>☝ Joystick · ⌨ Flèches ou ZQSD</span></div>}
          {error ? <button className="chicken-primary" onClick={onBack}>Retour aux jeux</button> : <button className="chicken-primary" disabled={!loaded} onClick={snapshot.status === 'paused' ? resume : nextLevel ? () => restart(snapshot.level + 1) : ended ? () => restart() : start}>{nextLevel ? <ArrowRight /> : ended ? <RotateCcw /> : <Play />}{!loaded ? 'La cour se prépare…' : snapshot.status === 'paused' ? 'Continuer' : nextLevel ? 'Niveau suivant' : ended ? 'Rejouer' : 'C’est parti !'}</button>}
          {nextLevel && <button className="chicken-secondary" onClick={() => restart()}><RotateCcw />Rejouer</button>}
          {(ended || snapshot.status === 'paused') && <button className="chicken-secondary" onClick={() => selectLevel(snapshot.level)}>Choisir un niveau</button>}
          <small><span className="chicken-level-record">{progress.stars[level.id - 1] > 0 ? `Mon meilleur résultat : ${progress.stars[level.id - 1]}/3 étoiles` : 'Chaque poule rentrée est une petite victoire !'}</span><span className="chicken-total-stars">{completed}/10 niveaux réussis · {totalStars}/30 étoiles</span></small>
          <a className="chicken-audio-credits" href="/assets/chicken/audio/credits.html" target="_blank" rel="noopener noreferrer">Crédits des sons</a>
        </section>
      </div>}
    </section>
    <p className="chicken-live" aria-live="polite">{snapshot.captured > 0 ? `${snapshot.captured} ${snapshot.captured === 1 ? 'poule est rentrée' : 'poules sont rentrées'} dans l’enclos !` : 'Les poules rentrent toutes seules quand tu les guides jusqu’à la porte.'}</p>
  </main>;
}
