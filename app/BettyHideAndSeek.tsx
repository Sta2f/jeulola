import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Eye, Heart, Lightbulb, Rabbit, RotateCcw, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { useGameAudio } from './useGameAudio';

type Scene = {
  name: string;
  clue: string;
  x: number;
  y: number;
  crop: string;
  atlasX: number;
  atlasY: number;
  difficulty?: string;
  hitRadius?: number;
  rabbitSize?: number;
  hintSize?: number;
  hintDuration?: number;
  hotDistance?: number;
  warmDistance?: number;
};

const SCENES: Scene[] = [
  { name: 'Le jardin géant', clue: 'Regarde près du petit tunnel, sous les fleurs.', x: 19, y: 72, crop: 'inset(0 0 46% 0)', atlasX: 0, atlasY: 0 },
  { name: 'La chambre cabane', clue: 'Betty s’est rapprochée d’un autre animal… observe les petits détails.', x: 84, y: 67, crop: 'inset(0 58% 72% 0)', atlasX: 1, atlasY: 0, difficulty: 'Difficile', hitRadius: 6.2, rabbitSize: 13, hintSize: 18, hintDuration: 2100, hotDistance: 13, warmDistance: 23 },
  { name: 'Le village bonbon', clue: 'Cherche du côté des tonneaux remplis de gourmandises.', x: 82, y: 72, crop: 'inset(0 42% 0 0)', atlasX: 2, atlasY: 0 },
  { name: 'La forêt des lucioles', clue: 'Betty adore les champignons qui brillent.', x: 27, y: 69, crop: 'inset(0 0 50% 0)', atlasX: 3, atlasY: 0 },
  { name: 'La ferme ensoleillée', clue: 'Il y a quelque chose de touffu près des bottes de foin.', x: 62, y: 47, crop: 'inset(0 0 48% 0)', atlasX: 4, atlasY: 0 },
  { name: 'Le palais sous-marin', clue: 'Une lapine se cache près du grand coquillage.', x: 72, y: 80, crop: 'inset(0 48% 0 0)', atlasX: 0, atlasY: 1 },
  { name: 'Le village enneigé', clue: 'Regarde entre les cadeaux et le sapin.', x: 72, y: 76, crop: 'inset(0 0 47% 0)', atlasX: 1, atlasY: 1 },
  { name: 'La bibliothèque du château', clue: 'Betty a choisi un fauteuil bien confortable.', x: 70, y: 65, crop: 'inset(0 0 45% 0)', atlasX: 2, atlasY: 1 },
  { name: 'La fête foraine', clue: 'Cherche près du banc, sous les ballons.', x: 18, y: 78, crop: 'inset(0 0 49% 0)', atlasX: 3, atlasY: 1 },
  { name: 'Le royaume des nuages', clue: 'Une petite tête apparaît près du pavillon fleuri.', x: 76, y: 74, crop: 'inset(0 45% 0 0)', atlasX: 4, atlasY: 1 },
];

type Marker = { x: number; y: number; warmth: 'cold' | 'warm' | 'hot'; id: number };

export function BettyHideAndSeek({ onBack }: { onBack: () => void }) {
  const { soundOn, startAudio, playSfx, toggleSound } = useGameAudio('hide');
  const [started, setStarted] = useState(false);
  const [level, setLevel] = useState(0);
  const [chances, setChances] = useState(10);
  const [found, setFound] = useState(false);
  const [hintActive, setHintActive] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [marker, setMarker] = useState<Marker | null>(null);
  const [lost, setLost] = useState(false);
  const hintTimer = useRef<number | null>(null);
  const scene = SCENES[level];
  const confetti = useMemo(() => Array.from({ length: 22 }, (_, index) => ({
    x: `${8 + (index * 41) % 86}%`, delay: `${(index % 7) * 55}ms`, spin: `${index % 2 ? 210 : -180}deg`, color: ['#ff72b6', '#ffe06c', '#76e0d5', '#a88af5'][index % 4],
  })), []);

  useEffect(() => () => { if (hintTimer.current !== null) window.clearTimeout(hintTimer.current); }, []);

  const begin = () => {
    startAudio();
    setStarted(true);
    playSfx('sparkle');
  };

  const chooseSpot = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (found || lost) return;
    startAudio();
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const distance = Math.hypot(x - scene.x, y - scene.y);
    if (distance <= (scene.hitRadius ?? 10.5)) {
      setFound(true);
      setMarker(null);
      playSfx('win');
      return;
    }
    const nextChances = chances - 1;
    setChances(nextChances);
    setMarker({ x, y, warmth: distance < (scene.hotDistance ?? 19) ? 'hot' : distance < (scene.warmDistance ?? 32) ? 'warm' : 'cold', id: Date.now() });
    playSfx('wrong');
    if (nextChances === 0) setLost(true);
  };

  const showHint = () => {
    if (hintUsed || found || lost) return;
    startAudio();
    setHintUsed(true);
    setHintActive(true);
    playSfx('hint');
    hintTimer.current = window.setTimeout(() => setHintActive(false), scene.hintDuration ?? 3800);
  };

  const resetRound = () => {
    setChances(10);
    setFound(false);
    setLost(false);
    setMarker(null);
    setHintActive(false);
    setHintUsed(false);
  };

  const nextScene = () => {
    if (level === SCENES.length - 1) {
      setStarted(false);
      setLevel(0);
    } else {
      setLevel((current) => current + 1);
    }
    resetRound();
  };

  return <main className="betty-page" onPointerDownCapture={startAudio}>
    <header className="betty-header">
      <button className="back-button betty-back" onClick={onBack}><ChevronLeft /><span>Les jeux</span></button>
      <div><p>LE GRAND CACHE-CACHE</p><h1>Où est Betty ?</h1></div>
      <button className="game-sound-toggle light" onClick={toggleSound} aria-label={soundOn ? 'Couper la musique et les bruitages' : 'Activer la musique et les bruitages'}>{soundOn ? <Volume2 /> : <VolumeX />}</button>
    </header>

    {!started ? <section className="betty-intro">
      <div className="betty-intro-art">
        <span className="betty-sparkle one">✦</span><span className="betty-sparkle two">✧</span>
        {/* oxlint-disable-next-line next/no-img-element -- Optimized project-local generated character in a Vite app. */}
        <img src="/assets/betty-rabbit.webp" alt="Betty, une lapine gris et blanc très touffue" />
      </div>
      <div className="betty-intro-copy">
        <span className="betty-kicker"><Rabbit /> 10 cachettes féeriques</span>
        <h2>Aide Lola à retrouver Betty !</h2>
        <p>Betty la petite lapine touffue s’est cachée dans dix mondes merveilleux. Observe bien chaque détail.</p>
        <div className="betty-rules">
          <div><Heart /><span><strong>10 chances</strong><small>Chaque mauvais endroit retire un cœur.</small></span></div>
          <div><Eye /><span><strong>Chaud ou froid</strong><small>La marque change de couleur selon la distance.</small></span></div>
          <div><Lightbulb /><span><strong>Un indice visuel</strong><small>Une lueur entoure la bonne cachette quelques secondes.</small></span></div>
        </div>
        <button className="betty-play" onClick={begin}><Sparkles /> Commencer à chercher</button>
      </div>
    </section> : <section className="betty-game">
      <aside className="betty-panel">
        <span className="betty-level">Décor {level + 1} sur 10{scene.difficulty ? ` · ${scene.difficulty}` : ''}</span>
        <h2>{scene.name}</h2>
        <p>Regarde partout, puis touche l’endroit où Betty pourrait être cachée.</p>
        <div className="betty-hearts" aria-label={`${chances} chances restantes`}>
          {Array.from({ length: 10 }, (_, index) => <Heart key={index} className={index < chances ? 'alive' : 'gone'} />)}
        </div>
        <button className="betty-hint" onClick={showHint} disabled={hintUsed || found || lost}><Lightbulb /> {hintUsed ? scene.clue : 'Voir un indice'}</button>
        <div className="betty-dots" aria-label={`Niveau ${level + 1} sur 10`}>{SCENES.map((_, index) => <i key={index} className={index < level ? 'done' : index === level ? 'current' : ''} />)}</div>
      </aside>

      <div className="betty-stage-wrap">
        <button
          className={`betty-scene ${marker ? 'made-mistake' : ''}`}
          style={{ '--atlas-x': scene.atlasX, '--atlas-y': scene.atlasY } as React.CSSProperties}
          onPointerDown={chooseSpot}
          aria-label={`Chercher Betty dans ${scene.name}`}
        >
          {/* oxlint-disable-next-line next/no-img-element -- Optimized project-local generated character in a Vite app. */}
          <img className={`hidden-betty ${found ? 'is-found' : ''}`} style={{ left: `${scene.x}%`, top: `${scene.y}%`, width: found ? '18%' : `${scene.rabbitSize ?? 18}%`, clipPath: found ? 'none' : scene.crop }} src="/assets/betty-rabbit.webp" alt="" />
          {hintActive && <span className="betty-hint-ring" style={{ left: `${scene.x}%`, top: `${scene.y}%`, width: `${scene.hintSize ?? 32}%` }}><Lightbulb /></span>}
          {marker && <span key={marker.id} className={`betty-marker ${marker.warmth}`} style={{ left: `${marker.x}%`, top: `${marker.y}%` }}><span>{marker.warmth === 'hot' ? 'Très chaud !' : marker.warmth === 'warm' ? 'Tu chauffes…' : 'C’est froid !'}</span></span>}
        </button>

        {found && <output className="betty-result success">
          <div className="betty-confetti" aria-hidden="true">{confetti.map((piece, index) => <i key={index} style={{ '--x': piece.x, '--delay': piece.delay, '--spin': piece.spin, '--color': piece.color } as React.CSSProperties} />)}</div>
          {/* oxlint-disable-next-line next/no-img-element -- Optimized project-local generated character in a Vite app. */}
          <img src="/assets/betty-rabbit.webp" alt="Betty saute de joie" />
          <div><small>BRAVO LOLA !</small><strong>Tu as trouvé Betty !</strong><p>Elle remue ses oreilles de bonheur.</p><button onClick={nextScene}>{level === 9 ? 'Rejouer les 10 décors' : 'Décor suivant'} <Sparkles /></button></div>
        </output>}
        {lost && <output className="betty-result lost">
          {/* oxlint-disable-next-line next/no-img-element -- Optimized project-local generated character in a Vite app. */}
          <img src="/assets/betty-rabbit.webp" alt="Betty montre sa cachette" />
          <div><small>OH, LA COQUINE !</small><strong>Betty était juste ici.</strong><p>Elle sort doucement de sa cachette pour encourager Lola.</p><button onClick={resetRound}><RotateCcw /> Réessayer avec 10 cœurs</button></div>
        </output>}
      </div>
    </section>}
  </main>;
}
