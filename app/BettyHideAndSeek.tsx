import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Eye, Heart, Lightbulb, Rabbit, RotateCcw, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { useGameAudio } from './useGameAudio';
import { useAchievements } from './useAchievements';
import { BETTY_HIDING_PLACES } from './bettyHidingPlaces';

type Scene = {
  name: string;
  clue: string;
  x: number;
  y: number;
  atlas: string;
  atlasX: number;
  atlasY: number;
  difficulty: string;
  hitRadius: number;
  rabbitSize: number;
  hintSize: number;
  hintDuration: number;
  hotDistance: number;
  warmDistance: number;
};

type SceneSeed = readonly [name: string, clue: string, x: number, y: number];

const SCENE_GROUPS: { atlas: string; scenes: SceneSeed[] }[] = [
  { atlas: '/assets/betty-scenes.webp', scenes: [
    ['Le jardin géant', 'Regarde près du petit tunnel fleuri.', 19, 72], ['La chambre cabane', 'Observe les petits détails près des meubles.', 84, 67], ['Le village bonbon', 'Cherche près des gourmandises colorées.', 82, 72], ['La forêt des lucioles', 'Une silhouette se fond près des champignons.', 27, 69], ['La ferme ensoleillée', 'Regarde autour de la paille et des paniers.', 62, 47],
    ['Le palais sous-marin', 'Cherche près du grand coquillage.', 72, 80], ['Le village enneigé', 'Observe entre les cadeaux et le sapin.', 72, 76], ['La bibliothèque du château', 'Regarde près des fauteuils et des livres.', 70, 65], ['La fête foraine', 'Cherche près du banc sous les ballons.', 18, 78], ['Le royaume des nuages', 'Un petit nuage gris semble bouger.', 76, 74],
  ] },
  { atlas: '/assets/betty-scenes-2.webp', scenes: [
    ['La serre aux roses', 'Betty adore se glisser entre les pots fleuris.', 18, 77], ['La boulangerie des fées', 'Regarde près des paniers et des tabourets.', 78, 75], ['La grotte de cristal', 'Une petite forme grise se cache près des pierres bleues.', 26, 73], ['La gare miniature', 'Cherche près des valises et du banc.', 76, 76], ['La chambre aux jouets', 'Observe les cubes et les petits trains.', 82, 70],
    ['Le village des citrouilles', 'Betty s’est faufilée près d’une maison ronde.', 76, 77], ['Le jardin des cascades', 'Regarde près du pont et des fleurs tropicales.', 22, 72], ['L’atelier des horloges', 'Cherche parmi les rouages et les caisses.', 78, 78], ['Le moulin des lavandes', 'Une touffe grise se confond avec les paniers.', 22, 82], ['L’étang des lucioles', 'Observe le petit pont et les roseaux.', 77, 70],
  ] },
  { atlas: '/assets/betty-scenes-3.webp', scenes: [
    ['La cour du château bonbon', 'Cherche près des fleurs et de la fontaine.', 20, 76], ['La bibliothèque des bois', 'Betty s’est approchée des piles de livres.', 78, 76], ['La crique du phare', 'Regarde près du coffre et des coquillages.', 21, 78], ['La cuisine champignon', 'Observe les petits sièges rouges.', 78, 78], ['Le village dans la boule à neige', 'Cherche près des cadeaux au pied de la boule.', 80, 78],
    ['Le jardin arc-en-ciel', 'Une petite forme se cache près du banc fleuri.', 78, 78], ['La nurserie du dragon', 'Regarde près des cristaux et des coffres.', 22, 77], ['Le jardin de perles', 'Cherche près du grand coquillage lumineux.', 23, 76], ['Le pavillon des cerisiers', 'Observe près des coussins et de la table.', 80, 76], ['Le camp de la jungle', 'Betty se cache près de la tente et des sacs.', 74, 78],
  ] },
  { atlas: '/assets/betty-scenes-4.webp', scenes: [
    ['Le port des montgolfières', 'Cherche parmi les paniers et les cordages.', 20, 76], ['L’atelier des robes de fée', 'Regarde près des tissus et des paniers.', 80, 76], ['Le dédale des tournesols', 'Observe le petit chariot fleuri.', 22, 78], ['L’observatoire de minuit', 'Betty s’est glissée près des livres d’étoiles.', 79, 77], ['La chambre dans l’arbre', 'Cherche près des sacs et des lanternes.', 78, 77],
    ['Le jardin du palais de glace', 'Une silhouette grise se fond dans la neige.', 22, 78], ['La plage au trésor', 'Regarde près du coffre et des tonneaux.', 78, 76], ['La salle de musique magique', 'Cherche entre les instruments et les coussins.', 78, 77], ['Le marché de la rivière', 'Observe les paniers de fruits près du quai.', 77, 77], ['La serre du soleil couchant', 'Betty se repose près du fauteuil fleuri.', 78, 76],
  ] },
  { atlas: '/assets/betty-scenes-5.webp', scenes: [
    ['L’atelier de Noël', 'Cherche près des paquets et du petit traîneau.', 78, 78], ['La serre aux papillons', 'Une petite forme se cache près du fauteuil.', 20, 77], ['La mine aux pierres magiques', 'Observe près du wagon et des cristaux.', 78, 77], ['La fête des douceurs', 'Cherche près des pots colorés et des fleurs.', 79, 77], ['Le grenier secret du château', 'Regarde près des coffres et des livres.', 78, 76],
    ['Le verger enchanté', 'Betty s’est approchée des paniers de pommes.', 21, 78], ['Le jardin de la lune', 'Cherche près du banc et des fleurs bleues.', 78, 77], ['L’atelier des couleurs', 'Observe les pinceaux et les petites tables.', 21, 78], ['Le village des fleurs', 'Une lapine minuscule se fond près des maisonnettes.', 78, 77], ['Le balcon du palais des fées', 'Regarde près du fauteuil et des coussins.', 22, 77],
  ] },
];

const SCENES: Scene[] = SCENE_GROUPS.flatMap((group, groupIndex) => group.scenes.map(([name, clue, x, y], sceneIndex) => {
  const index = groupIndex * 10 + sceneIndex;
  return {
    name, clue, x, y, atlas: group.atlas, atlasX: sceneIndex % 5, atlasY: Math.floor(sceneIndex / 5),
    difficulty: index < 10 ? 'Maligne' : index < 20 ? 'Difficile' : index < 30 ? 'Corsée' : index < 40 ? 'Experte' : 'Championne',
    hitRadius: Math.max(5.3, 8 - index * .055), rabbitSize: Math.max(8.6, 13 - index * .09), hintSize: Math.max(14, 23 - index * .17),
    hintDuration: Math.max(1450, 2700 - index * 25), hotDistance: Math.max(11, 17 - index * .11), warmDistance: Math.max(19, 28 - index * .17),
  };
}));

type Marker = { x: number; y: number; warmth: 'cold' | 'warm' | 'hot'; id: number };

export function BettyHideAndSeek({ onBack }: { onBack: () => void }) {
  const { soundOn, startAudio, playSfx, toggleSound } = useGameAudio('hide');
  const [started, setStarted] = useState(false);
  const [level, setLevel] = useState(0);
  const [chances, setChances] = useState(10);
  const [found, setFound] = useState(false);
  const completed = useAchievements('betty', level, found);
  const [hintActive, setHintActive] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [marker, setMarker] = useState<Marker | null>(null);
  const [lost, setLost] = useState(false);
  const hintTimer = useRef<number | null>(null);
  const hidingPlace = BETTY_HIDING_PLACES[level];
  const scene = { ...SCENES[level], ...hidingPlace };
  const peekWidth = hidingPlace.width;
  const foregroundClip = hidingPlace.clip;
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
    const rabbit = event.currentTarget.querySelector('.betty-peek-window')!.getBoundingClientRect();
    const padding = 4;
    if (event.clientX >= rabbit.left - padding && event.clientX <= rabbit.right + padding && event.clientY >= rabbit.top - padding && event.clientY <= rabbit.bottom + padding) {
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
    if (hintTimer.current !== null) window.clearTimeout(hintTimer.current);
    hintTimer.current = null;
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

  const loadScene = (nextLevel: number) => {
    setLevel(nextLevel);
    resetRound();
    playSfx('select');
  };

  return <main className="betty-page" onPointerDownCapture={startAudio}>
    <header className="betty-header">
      <button className="back-button betty-back" aria-label="Les jeux" onClick={onBack}><ChevronLeft /><span>Les jeux</span></button>
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
        <span className="betty-kicker"><Rabbit /> 50 cachettes féeriques</span>
        <h2>Aide Lola à retrouver Betty !</h2>
        <p>Betty se cache derrière le décor de cinquante mondes merveilleux. Toutes les deux secondes, une oreille et un petit œil curieux dépassent… Ouvre bien les yeux !</p>
        <div className="betty-rules">
          <div><Heart /><span><strong>10 chances</strong><small>Chaque mauvais endroit retire un cœur.</small></span></div>
          <div><Eye /><span><strong>Chaud ou froid</strong><small>La marque change de couleur selon la distance.</small></span></div>
          <div><Lightbulb /><span><strong>Un indice visuel</strong><small>Une lueur entoure la bonne cachette quelques secondes.</small></span></div>
        </div>
        <button className="betty-play" onClick={begin}><Sparkles /> Commencer à chercher</button>
      </div>
    </section> : <section className="betty-game">
      <aside className="betty-panel">
        <span className="betty-level">Décor {level + 1} sur {SCENES.length} · {scene.difficulty}</span>
        <h2>{scene.name}</h2>
        <p>Observe le décor : Betty montre furtivement une oreille et un œil toutes les deux secondes. Touche sa cachette !</p>
        <div className="betty-hearts" aria-label={`${chances} chances restantes`}>
          {Array.from({ length: 10 }, (_, index) => <Heart key={index} className={index < chances ? 'alive' : 'gone'} />)}
        </div>
        <button className="betty-hint" onClick={showHint} disabled={hintUsed || found || lost}><Lightbulb /> {hintUsed ? scene.clue : 'Voir un indice'}</button>
        <p className="betty-completed">✦ {completed.length} cachettes trouvées sur 50</p>
        <label className="betty-scene-label" htmlFor="betty-scene-choice">Changer de décor</label>
        <select id="betty-scene-choice" className="betty-scene-choice" value={level} onChange={event => loadScene(Number(event.target.value))}>{SCENES.map((item,index) => <option key={item.name} value={index}>{completed.includes(index) ? '★ ' : ''}{index+1}. {item.name}</option>)}</select>
        <details className="betty-all-scenes"><summary>Voir mes 50 cachettes</summary><div className="betty-dots" aria-label={`Choisir directement un des ${SCENES.length} décors`}>{SCENES.map((item, index) => <button type="button" key={item.name} className={`${completed.includes(index) ? 'done' : ''} ${index === level ? 'current' : ''}`} onClick={() => loadScene(index)} aria-label={`Ouvrir le décor ${index + 1} : ${item.name}`} aria-current={index === level ? 'step' : undefined}>{index+1}</button>)}</div></details>
      </aside>

      <div className="betty-stage-wrap">
        <button
          className={`betty-scene betty-layered ${marker ? 'made-mistake' : ''} ${found || lost ? 'betty-revealed' : ''} ${hintActive ? 'betty-peek-hint' : ''}`}
          style={{ '--atlas-x': scene.atlasX, '--atlas-y': scene.atlasY, '--scene-atlas': `url("${scene.atlas}")` } as React.CSSProperties}
          onPointerDown={chooseSpot}
          aria-label={`Chercher Betty dans ${scene.name}`}
        >
          <span className="betty-photo-layer betty-background-layer" aria-hidden="true" />
          <span key={level} className={`betty-peek-window ${hidingPlace.sideways ? 'betty-peek-sideways' : ''}`} style={{ left: `${scene.x}%`, top: `${scene.y}%`, width: `${peekWidth}%` }} aria-hidden="true">
            {/* oxlint-disable-next-line next/no-img-element -- Optimized local WebP in this Vite game. */}
            <img className="betty-peek-rabbit" src="/assets/betty-rabbit.webp" alt="" draggable={false} />
          </span>
          <span className="betty-photo-layer betty-foreground-layer" style={{ clipPath: foregroundClip }} aria-hidden="true" />
          {hintActive && <span className="betty-hint-ring" style={{ left: `${scene.x}%`, top: `${scene.y}%`, width: `${scene.hintSize ?? 32}%` }}><Lightbulb /></span>}
          {marker && <span key={marker.id} className={`betty-marker ${marker.warmth}`} style={{ left: `${marker.x}%`, top: `${marker.y}%` }}><span>{marker.warmth === 'hot' ? 'Très chaud !' : marker.warmth === 'warm' ? 'Tu chauffes…' : 'C’est froid !'}</span></span>}
        </button>

        {found && <output className="betty-result success">
          <div className="betty-confetti" aria-hidden="true">{confetti.map((piece, index) => <i key={index} style={{ '--x': piece.x, '--delay': piece.delay, '--spin': piece.spin, '--color': piece.color } as React.CSSProperties} />)}</div>
          {/* oxlint-disable-next-line next/no-img-element -- Optimized project-local generated character in a Vite app. */}
          <img src="/assets/betty-rabbit.webp" alt="Betty saute de joie" />
          <div><small>BRAVO LOLA !</small><strong>Tu as trouvé Betty !</strong><p>Elle remue ses oreilles de bonheur.</p><button onClick={nextScene}>{level === SCENES.length - 1 ? 'Rejouer les 50 décors' : 'Décor suivant'} <Sparkles /></button></div>
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
