import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Bone, ChevronLeft, Footprints, Heart, Lightbulb, RotateCcw, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useGameAudio } from './useGameAudio';

type Direction = 'up' | 'down' | 'left' | 'right';
type Position = { row: number; col: number };

const ROWS = 19;
const COLS = 27;
const START = { row: ROWS - 2, col: 1 };
const GOAL = { row: 1, col: COLS - 2 };
const LEVELS = [
  { seed: 1126, name: 'La clairière' },
  { seed: 1254, name: 'Les fougères' },
  { seed: 1290, name: 'Le bois secret' },
  { seed: 1241, name: 'Les vieux chênes' },
  { seed: 1237, name: 'Le sentier brumeux' },
  { seed: 1013, name: 'La forêt profonde' },
  { seed: 1007, name: 'Les ronces magiques' },
  { seed: 1218, name: 'Le vallon sauvage' },
  { seed: 1244, name: 'La piste oubliée' },
  { seed: 1055, name: 'Le cœur de la forêt' },
] as const;

function cellKey(position: Position) {
  return `${position.row}-${position.col}`;
}

function makeRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function createHardMaze(seed: number) {
  const random = makeRandom(seed);
  const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(1));
  const stack = [START];
  grid[START.row][START.col] = 0;

  while (stack.length) {
    const current = stack[stack.length - 1];
    const directions = [[-2, 0], [2, 0], [0, -2], [0, 2]];
    for (let index = directions.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [directions[index], directions[swapIndex]] = [directions[swapIndex], directions[index]];
    }
    const direction = directions.find(([rowDelta, colDelta]) => {
      const row = current.row + rowDelta;
      const col = current.col + colDelta;
      return row > 0 && row < ROWS - 1 && col > 0 && col < COLS - 1 && grid[row][col] === 1;
    });
    if (!direction) {
      stack.pop();
      continue;
    }
    const [rowDelta, colDelta] = direction;
    const next = { row: current.row + rowDelta, col: current.col + colDelta };
    grid[current.row + rowDelta / 2][current.col + colDelta / 2] = 0;
    grid[next.row][next.col] = 0;
    stack.push(next);
  }
  return grid;
}

const STEPS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

function findPath(maze: number[][], from: Position, to: Position) {
  const queue = [from];
  const parents = new Map<string, string | null>([[cellKey(from), null]]);
  while (queue.length) {
    const current = queue.shift()!;
    if (current.row === to.row && current.col === to.col) break;
    for (const [rowDelta, colDelta] of STEPS) {
      const next = { row: current.row + rowDelta, col: current.col + colDelta };
      const key = cellKey(next);
      if (maze[next.row]?.[next.col] === 0 && !parents.has(key)) {
        parents.set(key, cellKey(current));
        queue.push(next);
      }
    }
  }
  const path: Position[] = [];
  let cursor: string | null = cellKey(to);
  if (!parents.has(cursor)) return path;
  while (cursor) {
    const [row, col] = cursor.split('-').map(Number);
    path.unshift({ row, col });
    cursor = parents.get(cursor) ?? null;
  }
  return path;
}

export function EclairMazeGame({ onBack }: { onBack: () => void }) {
  const { soundOn, startAudio, playSfx, toggleSound } = useGameAudio('dog');
  const [level, setLevel] = useState(0);
  const [position, setPosition] = useState(START);
  const [moves, setMoves] = useState(0);
  const [visited, setVisited] = useState(() => new Set([cellKey(START)]));
  const [bones, setBones] = useState(() => new Set<string>());
  const [hintsUsed, setHintsUsed] = useState(0);
  const [boneFound, setBoneFound] = useState('');
  const [showBoneCelebration, setShowBoneCelebration] = useState(false);
  const [won, setWon] = useState(false);
  const [showWinCard, setShowWinCard] = useState(false);
  const [walking, setWalking] = useState(false);
  const walkTimers = useRef<number[]>([]);
  const boneCelebrationTimer = useRef<number | null>(null);
  const maze = useMemo(() => createHardMaze(LEVELS[level].seed), [level]);

  const fullPathLength = useMemo(() => findPath(maze, START, GOAL).length, [maze]);
  const progress = Math.min(100, Math.round((visited.size / fullPathLength) * 100));

  useEffect(() => {
    if (!won) return;
    const timer = window.setTimeout(() => setShowWinCard(true), 2400);
    return () => window.clearTimeout(timer);
  }, [won]);

  const celebrateBone = useCallback((key: string) => {
    setBoneFound(key);
    setShowBoneCelebration(true);
    playSfx('bone');
    if (boneCelebrationTimer.current !== null) window.clearTimeout(boneCelebrationTimer.current);
    boneCelebrationTimer.current = window.setTimeout(() => {
      setBoneFound('');
      setShowBoneCelebration(false);
      boneCelebrationTimer.current = null;
    }, 1250);
  }, [playSfx]);

  const move = useCallback((direction: Direction) => {
    if (won || walking) return;
    const delta = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] }[direction];
    setPosition((current) => {
      const next = { row: current.row + delta[0], col: current.col + delta[1] };
      if (maze[next.row]?.[next.col] !== 0) return current;
      playSfx('sniff');
      const key = cellKey(next);
      setMoves((count) => count + 1);
      setVisited((cells) => new Set(cells).add(key));
      setBones((currentBones) => {
        if (!currentBones.has(key)) return currentBones;
        const remaining = new Set(currentBones);
        remaining.delete(key);
        celebrateBone(key);
        return remaining;
      });
      if (next.row === GOAL.row && next.col === GOAL.col) {
        setShowBoneCelebration(false);
        playSfx('bark');
        playSfx('win');
        setWon(true);
      }
      return next;
    });
  }, [celebrateBone, maze, playSfx, walking, won]);

  const walkStraight = useCallback((targetRow: number, targetCol: number) => {
    if (won || walking || (targetRow !== position.row && targetCol !== position.col)) return;
    const rowStep = Math.sign(targetRow - position.row);
    const colStep = Math.sign(targetCol - position.col);
    const path: Position[] = [];
    let cursor = position;
    while (cursor.row !== targetRow || cursor.col !== targetCol) {
      const next = { row: cursor.row + rowStep, col: cursor.col + colStep };
      if (maze[next.row]?.[next.col] !== 0) break;
      path.push(next);
      cursor = next;
      if (next.row === GOAL.row && next.col === GOAL.col) break;
    }
    if (!path.length) return;

    playSfx('sniff');
    setWalking(true);
    walkTimers.current = path.map((next, index) => window.setTimeout(() => {
      const key = cellKey(next);
      setPosition(next);
      playSfx('step');
      setMoves((count) => count + 1);
      setVisited((cells) => new Set(cells).add(key));
      setBones((currentBones) => {
        if (!currentBones.has(key)) return currentBones;
        const remaining = new Set(currentBones);
        remaining.delete(key);
        celebrateBone(key);
        return remaining;
      });
      if (next.row === GOAL.row && next.col === GOAL.col) {
        setShowBoneCelebration(false);
        playSfx('bark');
        playSfx('win');
        setWon(true);
      }
      if (index === path.length - 1) {
        walkTimers.current = [];
        setWalking(false);
      }
    }, (index + 1) * 95));
  }, [celebrateBone, maze, playSfx, position, walking, won]);

  const onBoardPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') return;
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    const targetCol = Math.min(COLS - 1, Math.max(0, Math.floor((event.clientX - bounds.left) / bounds.width * COLS)));
    const targetRow = Math.min(ROWS - 1, Math.max(0, Math.floor((event.clientY - bounds.top) / bounds.height * ROWS)));
    walkStraight(targetRow, targetCol);
  };

  const stopWalking = useCallback(() => {
    walkTimers.current.forEach((timer) => window.clearTimeout(timer));
    walkTimers.current = [];
    setWalking(false);
  }, []);

  useEffect(() => stopWalking, [stopWalking]);

  useEffect(() => () => {
    if (boneCelebrationTimer.current !== null) window.clearTimeout(boneCelebrationTimer.current);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const direction = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[event.key] as Direction | undefined;
      if (!direction) return;
      event.preventDefault();
      startAudio();
      move(direction);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [move, startAudio]);

  const addHint = () => {
    const path = findPath(maze, position, GOAL);
    if (path.length < 2) return;
    const existing = new Set(bones);
    const candidates = path.slice(1).filter((step) => !existing.has(cellKey(step)));
    if (!candidates.length) return;
    const target = candidates[Math.min(5 + hintsUsed * 3, candidates.length - 1)];
    setBones((items) => new Set(items).add(cellKey(target)));
    setHintsUsed((count) => count + 1);
    playSfx('sniff');
  };

  const resetLevel = () => {
    stopWalking();
    setPosition(START);
    setMoves(0);
    setVisited(new Set([cellKey(START)]));
    setBones(new Set());
    setHintsUsed(0);
    setWon(false);
    setShowWinCard(false);
    setShowBoneCelebration(false);
  };

  const advanceLevel = () => {
    if (level === LEVELS.length - 1) setLevel(0);
    else setLevel((current) => current + 1);
    resetLevel();
  };

  return (
    <main className="eclair-page" onPointerDownCapture={startAudio}>
      <header className="eclair-header">
        <button className="back-button" onClick={onBack}><ChevronLeft /><span>Les jeux</span></button>
        <div className="eclair-title"><p>NIVEAU {level + 1} SUR {LEVELS.length}</p><h1>Éclair cherche Lola</h1></div>
        <div className="eclair-header-actions"><div className="eclair-steps"><Footprints /><strong>{moves}</strong><span>pas</span></div><button className="game-sound-toggle" onClick={toggleSound} aria-label={soundOn ? 'Couper la musique et les bruitages' : 'Activer la musique et les bruitages'}>{soundOn ? <Volume2 /> : <VolumeX />}</button></div>
      </header>

      <section className="eclair-layout">
        <aside className="eclair-story">
          <span className="expert-mark">Niveau {level + 1} · {LEVELS[level].name}</span>
          <h2>Aide Éclair à<br />retrouver Lola !</h2>
          <p>Éclair a flairé la trace de Lola dans la forêt. Guide ce petit chihuahua chocolat jusqu’à elle.</p>
          <div className="eclair-level-track" aria-label={`Progression : niveau ${level + 1} sur ${LEVELS.length}`}>
            {LEVELS.map((item, index) => <span key={item.seed} className={index < level ? 'complete' : index === level ? 'current' : ''}>{index + 1}</span>)}
          </div>
          <div className="eclair-meter"><span style={{ width: `${progress}%` }} /><div><small>Exploration</small><strong>{progress}%</strong></div></div>
          <Button className="hint-button" onClick={addHint}><Lightbulb /> Indice : pose un os</Button>
          <p className="hint-copy"><Bone /> Chaque os apparaît sur le bon chemin.</p>
          <Button variant="outline" className="eclair-reset" onClick={resetLevel}><RotateCcw /> Recommencer</Button>
        </aside>

        <div className="eclair-stage">
          <div className={`eclair-board ${walking ? 'is-walking' : ''}`} onPointerDown={onBoardPointerDown} style={{ '--cols': COLS, '--rows': ROWS } as React.CSSProperties} aria-label="Labyrinthe expert d’Éclair">
            {/* oxlint-disable-next-line next/no-img-element -- Project-local generated game artwork. */}
            <img className="eclair-backdrop" src="/assets/eclair-forest.webp" alt="" aria-hidden="true" />
            <div className="eclair-grid">
              {maze.flatMap((row, rowIndex) => row.map((cell, colIndex) => {
                const key = `${rowIndex}-${colIndex}`;
                return <span key={key} className={`eclair-cell ${cell ? 'hedge' : 'trail'} ${visited.has(key) ? 'sniffed' : ''}`} />;
              }))}
            </div>
            {[...bones].map((key) => {
              const [row, col] = key.split('-').map(Number);
              return <span key={key} className="hint-bone" style={{ '--row': row, '--col': col } as React.CSSProperties} aria-label="Os indice"><Bone /></span>;
            })}
            {boneFound && <span className="bone-happy" aria-hidden="true"><Bone /> Miam !</span>}
            <div className="lola-goal" style={{ '--row': GOAL.row, '--col': GOAL.col } as React.CSSProperties}>
              {/* oxlint-disable-next-line next/no-img-element -- Existing project-local Lola character artwork. */}
              <img src="/assets/princess-lantern.webp" alt="Lola attend Éclair" /><span>LOLA</span>
            </div>
            <div className="eclair-player" style={{ '--row': position.row, '--col': position.col } as React.CSSProperties}>
              {/* oxlint-disable-next-line next/no-img-element -- Project-local generated Chihuahua artwork. */}
              <img src="/assets/eclair-chihuahua-cutout.webp" alt="Éclair, le petit chihuahua chocolat" />
            </div>
          </div>

          <p className="tap-to-walk eclair-tap-help">Touche une case en ligne droite : Éclair suit le chemin et s’arrête devant les arbres.</p>
          <div className="eclair-controls" aria-label="Commandes directionnelles">
            <button className="touch-up" onClick={() => move('up')} aria-label="Aller vers le haut"><ArrowUp /></button>
            <button className="touch-left" onClick={() => move('left')} aria-label="Aller à gauche"><ArrowLeft /></button>
            <button className="touch-down" onClick={() => move('down')} aria-label="Aller vers le bas"><ArrowDown /></button>
            <button className="touch-right" onClick={() => move('right')} aria-label="Aller à droite"><ArrowRight /></button>
          </div>
        </div>
      </section>

      {showBoneCelebration && !won && <div className="lick-screen bone-celebration" aria-label="Éclair est heureux d’avoir trouvé un os">
        {/* oxlint-disable-next-line next/no-img-element -- Project-local generated celebration artwork. */}
        <img src="/assets/eclair-lick.webp" alt="Éclair fête son os" />
        <div><Bone /> MIAM ! ÉCLAIR A TROUVÉ UN OS ! <Bone /></div>
      </div>}

      {won && !showWinCard && <div className="lick-screen" aria-label="Éclair est très heureux de retrouver Lola">
        {/* oxlint-disable-next-line next/no-img-element -- Project-local generated victory artwork. */}
        <img src="/assets/eclair-lick.webp" alt="Éclair lèche joyeusement l’écran" />
        <span className="lick-smear" aria-hidden="true" />
        <div><Heart /> ÉCLAIR A RETROUVÉ LOLA ! <Heart /></div>
      </div>}

      {showWinCard && <dialog open className="eclair-win" aria-labelledby="eclair-win-title"><div>
        <span className="victory-paws">🐾 🐾 🐾</span>
        <p><Sparkles /> {level === LEVELS.length - 1 ? 'Aventure terminée' : `Niveau ${level + 1} réussi`}</p>
        <h2 id="eclair-win-title">{level === LEVELS.length - 1 ? 'Éclair a traversé les 10 forêts !' : 'Éclair est fou de joie !'}</h2>
        <p>Il a retrouvé Lola après <strong>{moves} pas</strong> et {hintsUsed} indice{hintsUsed > 1 ? 's' : ''}.</p>
        <section><Button size="lg" onClick={advanceLevel}>{level === LEVELS.length - 1 ? <><RotateCcw /> Rejouer l’aventure</> : <>Niveau {level + 2} <ArrowRight /></>}</Button><Button size="lg" variant="outline" onClick={onBack}>Choisir un autre jeu</Button></section>
      </div></dialog>}
    </main>
  );
}
