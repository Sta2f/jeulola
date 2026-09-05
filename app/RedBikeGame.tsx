import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Bike,
  ChevronLeft,
  House,
  Pause,
  Play,
  RotateCcw,
  Sun,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { createWorld, type Snapshot, type World } from './bikeWorld';
import { useGameAudio } from './useGameAudio';
import { readSaved, saveValue } from './preferences';
const CHAPTERS = [
  'Le village des rêves',
  'La prairie des papillons',
  'Les jardins de menthe',
  'Le lac des étoiles',
  'La colline des bonbons',
  'Les moulins endormis',
  'Le verger des souhaits',
  'La vallée des lanternes',
  'Le chemin de la lune',
  'Le grand matin de Lola',
];
const EMPTY: Snapshot = {
  suns: 0,
  houses: 0,
  message: 'Trois soleils pour réveiller une maison.',
  won: false,
};
export default function RedBikeGame({ onBack }: { onBack: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null),
    world = useRef<World | null>(null);
  const { soundOn, startAudio, stopAudio, playSfx, toggleSound } =
    useGameAudio('home');
  const sound = useRef(playSfx);
  useEffect(() => {
    sound.current = playSfx;
  }, [playSfx]);
  const [chapter, setChapter] = useState(0),
    [attempt, setAttempt] = useState(0),
    [started, setStarted] = useState(false),
    [paused, setPaused] = useState(false),
    [error, setError] = useState('');
  const [snapshot, setSnapshot] = useState(EMPTY),
    [completed, setCompleted] = useState<number[]>(() =>
      readSaved('bike-wins', []),
    );
  const receive = useCallback(
    (next: Snapshot) => {
      setSnapshot(next);
      if (next.won)
        setCompleted((previous) => {
          const value = [...new Set([...previous, chapter])];
          saveValue('bike-wins', value);
          return value;
        });
    },
    [chapter],
  );
  useEffect(() => {
    let timer: number | undefined;
    try {
      world.current = createWorld(canvas.current!, chapter, receive, (e) =>
        sound.current(e),
      );
    } catch {
      timer = window.setTimeout(
        () =>
          setError(
            'La 3D n’a pas pu démarrer. Réessaie avec un navigateur à jour.',
          ),
        0,
      );
    }
    return () => {
      clearTimeout(timer);
      world.current?.dispose();
      world.current = null;
    };
  }, [chapter, attempt, receive]);
  useEffect(() => {
    world.current?.pause(!started || paused);
  }, [started, paused, chapter, attempt]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement ||
        (e.key === ' ' && e.target instanceof HTMLButtonElement)
      )
        return;
      if (['ArrowLeft', 'ArrowRight', ' ', 'p', 'P'].includes(e.key))
        e.preventDefault();
      if (e.key === 'ArrowLeft') world.current?.lane(-1);
      if (e.key === 'ArrowRight') world.current?.lane(1);
      if (e.key === ' ') world.current?.bell();
      if ((e.key === 'p' || e.key === 'P') && started) setPaused((p) => !p);
    };
    const hidden = () => {
      if (document.hidden && started) setPaused(true);
    };
    window.addEventListener('keydown', key);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      window.removeEventListener('keydown', key);
      document.removeEventListener('visibilitychange', hidden);
    };
  }, [started]);
  const restart = (next = chapter) => {
    setChapter(next);
    setAttempt((n) => n + 1);
    setSnapshot(EMPTY);
    setPaused(false);
    setStarted(false);
    setError('');
  };
  const begin = () => {
    setStarted(true);
    setPaused(false);
    startAudio();
    canvas.current?.focus();
  };
  return (
    <main className="bike-page">
      <header className="bike-header">
        <button
          onClick={() => {
            stopAudio();
            onBack();
          }}
          aria-label="Les jeux"
        >
          <ChevronLeft />
          <span>Les jeux</span>
        </button>
        <div>
          <span>UNE BALADE QUI CHANGE LE MONDE</span>
          <h1>La factrice du soleil</h1>
        </div>
        <button
          onClick={toggleSound}
          aria-label={soundOn ? 'Couper le son' : 'Activer le son'}
        >
          {soundOn ? <Volume2 /> : <VolumeX />}
        </button>
      </header>
      <section className="bike-stage" aria-label="Le village de Lola en 3D">
        <canvas
          ref={canvas}
          tabIndex={0}
          aria-label="Lola sur son vélo rouge. Flèches gauche et droite pour tourner, espace pour sonner."
          onPointerDown={(e) => {
            if (!started || paused) return;
            e.currentTarget.focus();
            const b = e.currentTarget.getBoundingClientRect();
            world.current?.lane(e.clientX - b.left < b.width / 2 ? -1 : 1);
          }}
        />
        <div className="bike-hud">
          <div>
            <Sun />
            <strong>{snapshot.suns}</strong>
            <span>dans le panier</span>
          </div>
          <div>
            <House />
            <strong>{snapshot.houses}/3</strong>
            <span>maisons réveillées</span>
          </div>
          <button
            onClick={() => setPaused((p) => !p)}
            disabled={!started || snapshot.won}
            aria-label={paused ? 'Reprendre la balade' : 'Mettre en pause'}
          >
            {paused ? <Play /> : <Pause />}
          </button>
        </div>
        <div className="bike-chapter">
          <span>Balade {chapter + 1} / 10</span>
          <strong>{CHAPTERS[chapter]}</strong>
        </div>
        {!started && !error && (
          <div className="bike-intro bike-card">
            <span className="bike-eyebrow">
              <Bike /> LE VÉLO ROUGE DE LOLA
            </span>
            <h2>
              Et si le soleil
              <br />
              se livrait à vélo ?
            </h2>
            <p>
              Le village dort encore. Remplis ton panier de lumière et réveille
              ses petites maisons.
            </p>
            <ol>
              <li>
                <Sun />
                <span>Attrape les soleils dorés.</span>
              </li>
              <li>
                <House />
                <span>
                  Apporte <b>3 soleils</b> aux boîtes aux lettres.
                </span>
              </li>
              <li>
                <Bell />
                <span>Sonne pour envoler les feuilles !</span>
              </li>
            </ol>
            <button className="bike-primary" onClick={begin}>
              <Play /> C’est parti, Lola !
            </button>
            <small>
              ← → pour tourner · Espace pour sonner
              <br />
              Sur tablette : touche un côté du décor.
            </small>
          </div>
        )}
        {paused && started && !snapshot.won && (
          <div className="bike-shade">
            <div className="bike-card">
              <span className="bike-eyebrow">UNE PETITE PAUSE</span>
              <h2>Le soleil t’attend.</h2>
              <button className="bike-primary" onClick={begin}>
                <Play /> Continuer la balade
              </button>
            </div>
          </div>
        )}
        {snapshot.won && (
          <div className="bike-shade">
            <div className="bike-card bike-victory">
              <span className="bike-victory-sun">☀</span>
              <span className="bike-eyebrow">LIVRAISON DE BONHEUR RÉUSSIE</span>
              <h2>Bonjour, petit village !</h2>
              <p>
                Trois maisons, trois sourires.
                <br />
                Lola a remis du soleil dans la journée.
              </p>
              <button
                className="bike-primary"
                onClick={() => restart((chapter + 1) % 10)}
              >
                <Bike />
                {chapter === 9 ? 'Une nouvelle tournée' : 'La prochaine balade'}
              </button>
              <button className="bike-text-button" onClick={() => restart()}>
                Rejouer cette balade
              </button>
            </div>
          </div>
        )}
        {error && (
          <div className="bike-shade">
            <div className="bike-card">
              <h2>Un petit contretemps</h2>
              <p>{error}</p>
              <button className="bike-primary" onClick={() => restart()}>
                Réessayer
              </button>
              <button className="bike-text-button" onClick={onBack}>
                Retour aux jeux
              </button>
            </div>
          </div>
        )}
        {started && !snapshot.won && !paused && (
          <output className="bike-message">{snapshot.message}</output>
        )}
      </section>
      <footer className="bike-controls">
        <div className="bike-selector">
          <label htmlFor="bike-chapter">Ta prochaine balade</label>
          <select
            id="bike-chapter"
            value={chapter}
            onChange={(e) => restart(Number(e.target.value))}
          >
            {CHAPTERS.map((name, i) => (
              <option key={name} value={i}>
                {completed.includes(i) ? '✦ ' : ''}
                {i + 1}. {name}
              </option>
            ))}
          </select>
        </div>
        <div className="bike-pad">
          <button
            aria-label="Tourner à gauche"
            disabled={!started || paused || snapshot.won}
            onClick={() => world.current?.lane(-1)}
          >
            <ArrowLeft />
          </button>
          <button
            className="bike-bell"
            aria-label="Sonner la sonnette magique"
            disabled={!started || paused || snapshot.won}
            onClick={() => world.current?.bell()}
          >
            <Bell />
            <span>Driiing !</span>
          </button>
          <button
            aria-label="Tourner à droite"
            disabled={!started || paused || snapshot.won}
            onClick={() => world.current?.lane(1)}
          >
            <ArrowRight />
          </button>
        </div>
        <button onClick={() => restart()} aria-label="Recommencer la balade">
          <RotateCcw />
        </button>
      </footer>
    </main>
  );
}
