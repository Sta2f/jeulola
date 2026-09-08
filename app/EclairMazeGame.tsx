import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAchievements } from './useAchievements';
import { readSaved, saveValue } from './preferences';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Bone, ChevronLeft, Footprints, Heart, Lightbulb, RotateCcw, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useGameAudio } from './useGameAudio';
import { MazeZoom } from './MazeZoom';
import { useFittedBoard } from './useFittedBoard';

type Direction = 'up' | 'down' | 'left' | 'right';
type Position = { row: number; col: number };
type EclairLevel = { seed: number; name: string; rows: number; cols: number; rank: string };

const LEVELS: EclairLevel[] = [
  { seed: 1126, name: 'La clairière', rows: 19, cols: 27, rank: 'Expert' },
  { seed: 1254, name: 'Les fougères', rows: 19, cols: 27, rank: 'Expert' },
  { seed: 1290, name: 'Le bois secret', rows: 19, cols: 27, rank: 'Expert' },
  { seed: 1241, name: 'Les vieux chênes', rows: 19, cols: 27, rank: 'Expert' },
  { seed: 1237, name: 'Le sentier brumeux', rows: 19, cols: 27, rank: 'Expert' },
  { seed: 1013, name: 'La forêt profonde', rows: 19, cols: 27, rank: 'Expert' },
  { seed: 1007, name: 'Les ronces magiques', rows: 19, cols: 27, rank: 'Expert' },
  { seed: 1218, name: 'Le vallon sauvage', rows: 19, cols: 27, rank: 'Expert' },
  { seed: 1244, name: 'La piste oubliée', rows: 19, cols: 27, rank: 'Expert' },
  { seed: 1055, name: 'Le cœur de la forêt', rows: 19, cols: 27, rank: 'Expert' },
  { seed: 4487, name: 'Le dédale des hiboux', rows: 21, cols: 29, rank: 'Maître' },
  { seed: 4303, name: 'Les tunnels de mousse', rows: 21, cols: 29, rank: 'Maître' },
  { seed: 4291, name: 'La forêt sans lune', rows: 21, cols: 29, rank: 'Maître' },
  { seed: 3526, name: 'Le royaume des ronces', rows: 23, cols: 31, rank: 'Prodige' },
  { seed: 2357, name: 'Le bois aux mille détours', rows: 23, cols: 31, rank: 'Prodige' },
  { seed: 2672, name: 'La vallée des ombres', rows: 23, cols: 33, rank: 'Prodige' },
  { seed: 6228, name: 'Le labyrinthe des étoiles', rows: 23, cols: 33, rank: 'Légende' },
  { seed: 4188, name: 'La forêt interdite', rows: 25, cols: 35, rank: 'Légende' },
  { seed: 3364, name: 'Les racines infinies', rows: 25, cols: 35, rank: 'Légende' },
  { seed: 28913, name: 'Le grand dédale de Lola', rows: 25, cols: 35, rank: 'Ultime' },
];

function levelStart(level: EclairLevel): Position {
  return { row: level.rows - 2, col: 1 };
}

function levelGoal(level: EclairLevel): Position {
  return { row: 1, col: level.cols - 2 };
}

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

function createHardMaze(level: EclairLevel) {
  const { rows, cols, seed } = level;
  const start = levelStart(level);
  const random = makeRandom(seed);
  const grid = Array.from({ length: rows }, () => Array(cols).fill(1));
  const stack = [start];
  grid[start.row][start.col] = 0;

  if (level.rank !== 'Expert') {
    const active = [start];
    while (active.length) {
      const activeIndex = random() < .55 ? active.length - 1 : Math.floor(random() * active.length);
      const current = active[activeIndex];
      const directions = [[-2, 0], [2, 0], [0, -2], [0, 2]];
      for (let index = directions.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(random() * (index + 1));
        [directions[index], directions[swapIndex]] = [directions[swapIndex], directions[index]];
      }
      const direction = directions.find(([rowDelta, colDelta]) => {
        const row = current.row + rowDelta;
        const col = current.col + colDelta;
        return row > 0 && row < rows - 1 && col > 0 && col < cols - 1 && grid[row][col] === 1;
      });
      if (!direction) {
        active.splice(activeIndex, 1);
        continue;
      }
      const [rowDelta, colDelta] = direction;
      const next = { row: current.row + rowDelta, col: current.col + colDelta };
      grid[current.row + rowDelta / 2][current.col + colDelta / 2] = 0;
      grid[next.row][next.col] = 0;
      active.push(next);
    }
    return grid;
  }

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
      return row > 0 && row < rows - 1 && col > 0 && col < cols - 1 && grid[row][col] === 1;
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
  const [level, setLevel] = useState(() => Math.max(0, Math.min(19, Math.floor(Number(readSaved('eclair-level', 0)) || 0))));
  useEffect(() => saveValue('eclair-level', level), [level]);
  const levelSettings = LEVELS[level];
  const start = useMemo(() => levelStart(levelSettings), [levelSettings]);
  const goal = useMemo(() => levelGoal(levelSettings), [levelSettings]);
  const [position, setPosition] = useState(() => levelStart(LEVELS[level]));
  const [moves, setMoves] = useState(0);
  const [visited, setVisited] = useState(() => new Set([cellKey(levelStart(LEVELS[level]))]));
  const [bones, setBones] = useState(() => new Set<string>());
  const hintCounts = useRef<number[] | null>(null);
  if (hintCounts.current === null) {
    hintCounts.current = LEVELS.map((_, index) => Math.max(0, Math.min(5, Math.floor(Number(readSaved(`eclair-hints-${index}`, 0)) || 0))));
  }
  const [hintsUsed, setHintsUsed] = useState(() => Math.max(0, Math.min(5, Math.floor(Number(readSaved(`eclair-hints-${level}`, 0)) || 0))));
  const hintsRemaining = Math.max(0, 5 - hintsUsed);
  const [boneFound, setBoneFound] = useState('');
  const [showBoneCelebration, setShowBoneCelebration] = useState(false);
  const [boneAnimationReady, setBoneAnimationReady] = useState(false);
  const [won, setWon] = useState(false);
  const [focusBoard, setFocusBoard] = useState(() => window.matchMedia('(max-width: 650px), (max-width: 1000px) and (orientation: portrait)').matches);
  const fittedStage = useFittedBoard(level, focusBoard);
  const completed = useAchievements('eclair', level, won);
  const [showWinCard, setShowWinCard] = useState(false);
  const [walking, setWalking] = useState(false);
  const [walkDuration, setWalkDuration] = useState(170);
  const walkTimer = useRef<number | null>(null);
  const boneCelebrationTimer = useRef<number | null>(null);
  useEffect(() => {
    const image = new Image();
    image.src = '/assets/eclair-lick-transparent.png';
    void image.decode().catch(() => undefined);
  }, []);
  const dogStepCounter = useRef(0);
  const maze = useMemo(() => createHardMaze(levelSettings), [levelSettings]);
  const gridCells = useMemo(() => maze.flatMap((row, rowIndex) => row.map((cell, colIndex) => (
    <span key={`${rowIndex}-${colIndex}`} className={`eclair-cell ${cell ? 'hedge' : 'trail'}`} />
  ))), [maze]);

  const fullPathLength = useMemo(() => findPath(maze, start, goal).length, [goal, maze, start]);
  const progress = Math.min(100, Math.round((visited.size / fullPathLength) * 100));

  useEffect(() => {
    if (!won) return;
    const timer = window.setTimeout(() => setShowWinCard(true), 2400);
    return () => window.clearTimeout(timer);
  }, [won]);

  const celebrateBone = useCallback((key: string) => {
    setBoneFound(key);
    setBoneAnimationReady(false);
    setShowBoneCelebration(true);
    if (boneCelebrationTimer.current !== null) window.clearTimeout(boneCelebrationTimer.current);
    boneCelebrationTimer.current = null;
  }, []);

  const move = useCallback((direction: Direction) => {
    if (won || walking) return;
    const delta = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] }[direction];
    setPosition((current) => {
      const next = { row: current.row + delta[0], col: current.col + delta[1] };
      if (maze[next.row]?.[next.col] !== 0) return current;
      setWalkDuration(170);
      dogStepCounter.current += 1;
      playSfx('step');
      if (dogStepCounter.current % 5 === 0) playSfx('sniff');
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
      if (next.row === goal.row && next.col === goal.col) {
        setShowBoneCelebration(false);
        playSfx('bark');
        playSfx('win');
        setWon(true);
      }
      return next;
    });
  }, [celebrateBone, goal, maze, playSfx, walking, won]);

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
      if (next.row === goal.row && next.col === goal.col) break;
    }
    if (!path.length) return;

    const destination = path[path.length - 1];
    const duration = Math.min(760, Math.max(180, path.length * 58));
    const reachesGoal = destination.row === goal.row && destination.col === goal.col;
    const crossedBone = path.map(cellKey).find((key) => bones.has(key));
    setWalkDuration(duration);
    setWalking(true);
    setPosition(destination);
    setMoves((count) => count + path.length);
    setVisited((cells) => {
      const nextCells = new Set(cells);
      path.forEach((step) => nextCells.add(cellKey(step)));
      return nextCells;
    });
    if (crossedBone) setBones((currentBones) => {
      const remaining = new Set(currentBones);
      path.forEach((step) => remaining.delete(cellKey(step)));
      return remaining;
    });
    playSfx('sniff');
    playSfx('step');
    walkTimer.current = window.setTimeout(() => {
      if (reachesGoal) {
        setShowBoneCelebration(false);
        playSfx('bark');
        playSfx('win');
        setWon(true);
      } else if (crossedBone) {
        celebrateBone(crossedBone);
      } else {
        playSfx('step');
      }
      walkTimer.current = null;
      setWalking(false);
    }, duration);
  }, [bones, celebrateBone, goal, maze, playSfx, position, walking, won]);

  const onBoardPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    const targetCol = Math.min(levelSettings.cols - 1, Math.max(0, Math.floor((event.clientX - bounds.left) / bounds.width * levelSettings.cols)));
    const targetRow = Math.min(levelSettings.rows - 1, Math.max(0, Math.floor((event.clientY - bounds.top) / bounds.height * levelSettings.rows)));
    walkStraight(targetRow, targetCol);
  };

  const stopWalking = useCallback(() => {
    if (walkTimer.current !== null) window.clearTimeout(walkTimer.current);
    walkTimer.current = null;
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
    if (won || walking || hintCounts.current![level] >= 5) return;
    const path = findPath(maze, position, goal);
    if (path.length < 2) return;
    const existing = new Set(bones);
    const candidates = path.slice(1).filter((step) => !existing.has(cellKey(step)));
    if (!candidates.length) return;
    const target = candidates[Math.min(5 + hintsUsed * 3, candidates.length - 1)];
    setBones((items) => new Set(items).add(cellKey(target)));
    const used = hintCounts.current![level] + 1;
    hintCounts.current![level] = used;
    saveValue(`eclair-hints-${level}`, used);
    setHintsUsed(used);
    playSfx('sniff');
  };

  const resetLevel = () => {
    stopWalking();
    if (boneCelebrationTimer.current !== null) window.clearTimeout(boneCelebrationTimer.current);
    boneCelebrationTimer.current = null;
    dogStepCounter.current = 0;
    setPosition(start);
    setWalkDuration(170);
    setMoves(0);
    setVisited(new Set([cellKey(start)]));
    setBones(new Set());
    setWon(false);
    setShowWinCard(false);
    setBoneFound('');
    setShowBoneCelebration(false);
  };

  const loadLevel = (nextLevel: number) => {
    if (window.matchMedia('(max-width: 650px), (max-width: 1000px) and (orientation: portrait)').matches) setFocusBoard(true);
    const nextStart = levelStart(LEVELS[nextLevel]);
    setLevel(nextLevel);
    stopWalking();
    if (boneCelebrationTimer.current !== null) window.clearTimeout(boneCelebrationTimer.current);
    boneCelebrationTimer.current = null;
    dogStepCounter.current = 0;
    setPosition(nextStart);
    setWalkDuration(170);
    setMoves(0);
    setVisited(new Set([cellKey(nextStart)]));
    setBones(new Set());
    setHintsUsed(hintCounts.current![nextLevel]);
    setWon(false);
    setShowWinCard(false);
    setBoneFound('');
    setShowBoneCelebration(false);
    playSfx('select');
  };

  const advanceLevel = () => {
    loadLevel(level === LEVELS.length - 1 ? 0 : level + 1);
  };

  return (
    <main className={`eclair-page ${focusBoard ? 'focus-board' : ''}`} onPointerDownCapture={startAudio}>
      <header className="eclair-header">
        <button className="back-button" aria-label="Les jeux" onClick={onBack}><ChevronLeft /><span>Les jeux</span></button>
        <div className="eclair-title"><p>NIVEAU {level + 1} SUR {LEVELS.length}</p><h1>Éclair cherche Lola</h1></div>
        <div className="eclair-header-actions"><div className="eclair-steps"><Footprints /><strong>{moves}</strong><span>pas</span></div><button className="game-sound-toggle" onClick={toggleSound} aria-label={soundOn ? 'Couper la musique et les bruitages' : 'Activer la musique et les bruitages'}>{soundOn ? <Volume2 /> : <VolumeX />}</button></div>
      </header>

      <section className="eclair-layout">
        <aside className="eclair-story">
          <span className="expert-mark">Niveau {level + 1} · {levelSettings.rank} · {levelSettings.name}</span>
          <div className="eclair-level-track" aria-label="Choisir directement un des 20 niveaux">
            <span className="achievement-count">✦ {completed.length}/20 réussis</span>
            {LEVELS.map((item, index) => <button type="button" key={item.seed} className={index === level ? 'current' : ''} onClick={() => loadLevel(index)} aria-label={`Jouer directement au niveau ${index + 1}`} aria-current={index === level ? 'step' : undefined}>{index + 1}</button>)}
          </div>
          <div className="eclair-meter"><span style={{ transform: `scaleX(${progress / 100})` }} /><div><small>Exploration</small><strong>{progress}%</strong></div></div>
          <Button className="hint-button" onClick={addHint} disabled={hintsRemaining === 0 || won || walking}><Lightbulb /> {hintsRemaining > 0 ? `Indice : pose un os (${hintsRemaining}/5)` : 'Plus d’indices pour ce niveau'}</Button>
          <Button variant="outline" className="eclair-reset" onClick={resetLevel}><RotateCcw /> Recommencer</Button>
        </aside>

        <div className="eclair-stage" ref={fittedStage}>
          <div className="board-focus-actions"><button className="board-focus-toggle" aria-pressed={focusBoard} onClick={() => setFocusBoard(v => !v)}>{focusBoard ? 'Afficher les niveaux' : 'Grand plateau'}</button>{focusBoard && <button className="board-focus-toggle" onClick={addHint} disabled={hintsRemaining === 0 || won || walking}><Bone /> {hintsRemaining > 0 ? `Poser un os (${hintsRemaining}/5)` : 'Plus d’indices'}</button>}</div>
          <MazeZoom row={position.row} col={position.col}>
          <div className={`eclair-board ${walking ? 'is-walking' : ''}`} onPointerDown={onBoardPointerDown} style={{ '--cols': levelSettings.cols, '--rows': levelSettings.rows, '--move-duration': `${walkDuration}ms`, aspectRatio: `${levelSettings.cols} / ${levelSettings.rows}` } as React.CSSProperties} aria-label={`Labyrinthe d’Éclair, niveau ${level + 1} sur ${LEVELS.length}`}>
            {/* oxlint-disable-next-line next/no-img-element -- Project-local generated game artwork. */}
            <img className="eclair-backdrop" src="/assets/eclair-forest.webp" alt="" aria-hidden="true" />
            <div className="eclair-grid">{gridCells}</div>
            {[...bones].map((key) => {
              const [row, col] = key.split('-').map(Number);
              return <span key={key} className="hint-bone" style={{ '--row': row, '--col': col } as React.CSSProperties} aria-label="Os indice"><Bone /></span>;
            })}
            {boneFound && <span className="bone-happy" aria-hidden="true"><Bone /> Miam !</span>}
            <div className="lola-goal" style={{ '--row': goal.row, '--col': goal.col } as React.CSSProperties}>
              {/* oxlint-disable-next-line next/no-img-element -- Existing project-local Lola character artwork. */}
              <img src="/assets/princess-lantern.webp" alt="Lola attend Éclair" /><span>LOLA</span>
            </div>
            <div className="eclair-player" style={{ '--row': position.row, '--col': position.col } as React.CSSProperties}>
              {/* oxlint-disable-next-line next/no-img-element -- Project-local generated Chihuahua artwork. */}
              <img src="/assets/eclair-chihuahua-cutout.webp" alt="Éclair, le petit chihuahua chocolat" />
            </div>
          </div>

          </MazeZoom>
          <p className="tap-to-walk eclair-tap-help">Touche le chemin ou utilise les flèches.</p>
          <div className="eclair-controls" aria-label="Commandes directionnelles">
            <button className="touch-up" onClick={() => move('up')} aria-label="Aller vers le haut"><ArrowUp /></button>
            <button className="touch-left" onClick={() => move('left')} aria-label="Aller à gauche"><ArrowLeft /></button>
            <button className="touch-down" onClick={() => move('down')} aria-label="Aller vers le bas"><ArrowDown /></button>
            <button className="touch-right" onClick={() => move('right')} aria-label="Aller à droite"><ArrowRight /></button>
          </div>
        </div>
      </section>

      {showBoneCelebration && !won && <div className={`lick-screen bone-celebration ${boneAnimationReady ? 'is-ready' : 'is-preparing'}`} aria-label="Éclair est heureux d’avoir trouvé un os">
        {/* oxlint-disable-next-line next/no-img-element -- Project-local generated celebration artwork. */}
        <img key={boneFound} src="/assets/eclair-lick-transparent.png" alt="Éclair fête son os" onLoad={event => {
          const image = event.currentTarget;
          void image.decode().then(() => {
            if (!image.isConnected) return;
            setBoneAnimationReady(true);
            playSfx('bone');
            if (boneCelebrationTimer.current !== null) window.clearTimeout(boneCelebrationTimer.current);
            boneCelebrationTimer.current = window.setTimeout(() => {
              setBoneFound(''); setShowBoneCelebration(false); boneCelebrationTimer.current = null;
            }, 1250);
          }).catch(() => { if (image.isConnected) setShowBoneCelebration(false); });
        }} onError={() => setShowBoneCelebration(false)} />
        <div><Bone /> MIAM ! ÉCLAIR A TROUVÉ UN OS ! <Bone /></div>
      </div>}

      {won && !showWinCard && <div className="lick-screen" aria-label="Éclair est très heureux de retrouver Lola">
        {/* oxlint-disable-next-line next/no-img-element -- Project-local generated victory artwork. */}
        <img src="/assets/eclair-lick-transparent.png" alt="Éclair lèche joyeusement l’écran" />
        <span className="lick-smear" aria-hidden="true" />
        <div><Heart /> ÉCLAIR A RETROUVÉ LOLA ! <Heart /></div>
      </div>}

      {showWinCard && <dialog open className="eclair-win" aria-labelledby="eclair-win-title"><div>
        <span className="victory-paws">🐾 🐾 🐾</span>
        <p><Sparkles /> {level === LEVELS.length - 1 ? 'Aventure terminée' : `Niveau ${level + 1} réussi`}</p>
        <h2 id="eclair-win-title">{level === LEVELS.length - 1 ? 'Éclair a traversé les 20 forêts !' : 'Éclair est fou de joie !'}</h2>
        <p>Il a retrouvé Lola après <strong>{moves} pas</strong> et {hintsUsed} indice{hintsUsed > 1 ? 's' : ''}.</p>
        <section><Button size="lg" onClick={advanceLevel}>{level === LEVELS.length - 1 ? <><RotateCcw /> Rejouer l’aventure</> : <>Niveau {level + 2} <ArrowRight /></>}</Button><Button size="lg" variant="outline" onClick={onBack}>Choisir un autre jeu</Button></section>
      </div></dialog>}
    </main>
  );
}
