import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, ChevronLeft, Crown, Footprints, LockKeyhole, RotateCcw, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useGameAudio } from './useGameAudio';

type Direction = 'up' | 'down' | 'left' | 'right';
type Position = { row: number; col: number };
type Level = { name: string; difficulty: string; grid: number[][]; start: Position; goal: Position };

const LEVEL_SETTINGS = [
  { rows: 9, cols: 11, seed: 7, name: 'Le sentier des lucioles', difficulty: 'Douce' },
  { rows: 9, cols: 11, seed: 21, name: 'Le bois des murmures', difficulty: 'Douce' },
  { rows: 9, cols: 11, seed: 39, name: 'La clairière secrète', difficulty: 'Curieuse' },
  { rows: 9, cols: 13, seed: 57, name: 'Les racines anciennes', difficulty: 'Curieuse' },
  { rows: 11, cols: 13, seed: 83, name: 'La forêt aux étoiles', difficulty: 'Maligne' },
  { rows: 11, cols: 13, seed: 114, name: 'Le passage des fées', difficulty: 'Maligne' },
  { rows: 11, cols: 15, seed: 146, name: 'Les arbres gardiens', difficulty: 'Courageuse' },
  { rows: 13, cols: 15, seed: 188, name: 'La brume enchantée', difficulty: 'Courageuse' },
  { rows: 13, cols: 15, seed: 233, name: 'Le dédale royal', difficulty: 'Experte' },
  { rows: 13, cols: 17, seed: 301, name: 'La porte du château', difficulty: 'Royale' },
] as const;

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function generateMaze(rows: number, cols: number, seed: number) {
  const random = seededRandom(seed);
  const grid = Array.from({ length: rows }, () => Array(cols).fill(1));
  const start = { row: rows - 2, col: 1 };
  const goal = { row: 1, col: cols - 2 };
  const stack = [start];
  grid[start.row][start.col] = 0;

  while (stack.length) {
    const current = stack[stack.length - 1];
    const directions = [[-2, 0], [2, 0], [0, -2], [0, 2]];
    for (let index = directions.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [directions[index], directions[swapIndex]] = [directions[swapIndex], directions[index]];
    }
    const nextDirection = directions.find(([rowDelta, colDelta]) => {
      const nextRow = current.row + rowDelta;
      const nextCol = current.col + colDelta;
      return nextRow > 0 && nextRow < rows - 1 && nextCol > 0 && nextCol < cols - 1 && grid[nextRow][nextCol] === 1;
    });
    if (!nextDirection) {
      stack.pop();
      continue;
    }
    const [rowDelta, colDelta] = nextDirection;
    const next = { row: current.row + rowDelta, col: current.col + colDelta };
    grid[current.row + rowDelta / 2][current.col + colDelta / 2] = 0;
    grid[next.row][next.col] = 0;
    stack.push(next);
  }
  return { grid, start, goal };
}

const LEVELS: Level[] = LEVEL_SETTINGS.map((settings) => ({
  ...settings,
  ...generateMaze(settings.rows, settings.cols, settings.seed),
}));

export function MazeGame({ onBack }: { onBack: () => void }) {
  const { soundOn, startAudio, playSfx, toggleSound } = useGameAudio('forest');
  const [levelIndex, setLevelIndex] = useState(0);
  const [highestUnlocked, setHighestUnlocked] = useState(0);
  const level = LEVELS[levelIndex];
  const [position, setPosition] = useState(level.start);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [walking, setWalking] = useState(false);
  const [visited, setVisited] = useState(() => new Set([`${level.start.row}-${level.start.col}`]));
  const walkTimers = useRef<number[]>([]);

  const stopWalking = useCallback(() => {
    walkTimers.current.forEach((timer) => window.clearTimeout(timer));
    walkTimers.current = [];
    setWalking(false);
  }, []);

  const loadLevel = useCallback((nextLevelIndex: number) => {
    stopWalking();
    const nextLevel = LEVELS[nextLevelIndex];
    setLevelIndex(nextLevelIndex);
    setPosition(nextLevel.start);
    setMoves(0);
    setWon(false);
    setVisited(new Set([`${nextLevel.start.row}-${nextLevel.start.col}`]));
    playSfx('select');
  }, [playSfx, stopWalking]);

  const move = useCallback((direction: Direction) => {
    if (won || walking) return;
    const delta = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] }[direction];
    setPosition((current) => {
      const next = { row: current.row + delta[0], col: current.col + delta[1] };
      if (next.row < 0 || next.row >= level.grid.length || next.col < 0 || next.col >= level.grid[0].length || level.grid[next.row][next.col] === 1) return current;
      playSfx('step');
      setMoves((count) => count + 1);
      setVisited((cells) => new Set(cells).add(`${next.row}-${next.col}`));
      if (next.row === level.goal.row && next.col === level.goal.col) {
        setWon(true);
        playSfx('win');
        setHighestUnlocked((current) => Math.max(current, Math.min(LEVELS.length - 1, levelIndex + 1)));
      }
      return next;
    });
  }, [level, levelIndex, playSfx, walking, won]);

  const walkStraight = useCallback((targetRow: number, targetCol: number) => {
    if (won || walking || (targetRow !== position.row && targetCol !== position.col)) return;
    const rowStep = Math.sign(targetRow - position.row);
    const colStep = Math.sign(targetCol - position.col);
    const path: Position[] = [];
    let cursor = position;
    while (cursor.row !== targetRow || cursor.col !== targetCol) {
      const next = { row: cursor.row + rowStep, col: cursor.col + colStep };
      if (level.grid[next.row]?.[next.col] !== 0) break;
      path.push(next);
      cursor = next;
      if (next.row === level.goal.row && next.col === level.goal.col) break;
    }
    if (!path.length) return;

    setWalking(true);
    walkTimers.current = path.map((next, index) => window.setTimeout(() => {
      setPosition(next);
      playSfx('step');
      setMoves((count) => count + 1);
      setVisited((cells) => new Set(cells).add(`${next.row}-${next.col}`));
      if (next.row === level.goal.row && next.col === level.goal.col) {
        setWon(true);
        playSfx('win');
        setHighestUnlocked((current) => Math.max(current, Math.min(LEVELS.length - 1, levelIndex + 1)));
      }
      if (index === path.length - 1) {
        walkTimers.current = [];
        setWalking(false);
      }
    }, (index + 1) * 115));
  }, [level, levelIndex, playSfx, position, walking, won]);

  const onBoardPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') return;
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    const targetCol = Math.min(level.grid[0].length - 1, Math.max(0, Math.floor((event.clientX - bounds.left) / bounds.width * level.grid[0].length)));
    const targetRow = Math.min(level.grid.length - 1, Math.max(0, Math.floor((event.clientY - bounds.top) / bounds.height * level.grid.length)));
    walkStraight(targetRow, targetCol);
  };

  useEffect(() => stopWalking, [stopWalking]);

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

  const reset = () => loadLevel(levelIndex);
  const isFinalLevel = levelIndex === LEVELS.length - 1;

  return (
    <main className="maze-page" onPointerDownCapture={startAudio}>
      <header className="maze-header">
        <button className="back-button forest-back" onClick={onBack}><ChevronLeft /><span>Les jeux</span></button>
        <div className="maze-title"><p>AVENTURE ENCHANTÉE</p><h1>La princesse perdue</h1></div>
        <div className="maze-header-actions"><div className="move-count"><Footprints /><span><strong>{moves}</strong> pas</span></div><button className="game-sound-toggle" onClick={toggleSound} aria-label={soundOn ? 'Couper la musique et les bruitages' : 'Activer la musique et les bruitages'}>{soundOn ? <Volume2 /> : <VolumeX />}</button></div>
      </header>

      <nav className="level-trail" aria-label="Les 10 niveaux du labyrinthe">
        {LEVELS.map((item, index) => {
          const unlocked = index <= highestUnlocked;
          const complete = index < highestUnlocked;
          return (
            <button key={item.name} className={`${index === levelIndex ? 'current' : ''} ${complete ? 'complete' : ''}`} disabled={!unlocked} onClick={() => loadLevel(index)} aria-label={`Niveau ${index + 1}${unlocked ? '' : ' verrouillé'}`} aria-current={index === levelIndex ? 'step' : undefined}>
              {complete ? <Check /> : unlocked ? index + 1 : <LockKeyhole />}
            </button>
          );
        })}
      </nav>

      <section className="maze-layout">
        <aside className="maze-story">
          <span className="chapter-mark">Niveau {levelIndex + 1} sur 10</span>
          <h2>{level.name}</h2>
          <p>Guide Lola entre les vieux arbres jusqu’à la couronne dorée. Chaque forêt devient un peu plus mystérieuse.</p>
          <span className="difficulty-badge">Difficulté · {level.difficulty}</span>
          <div className="key-hint"><span>↑ ↓ ← →</span><p>Utilise les flèches<br />de ton clavier</p></div>
          <Button variant="outline" className="maze-reset" onClick={reset}><RotateCcw /> Recommencer</Button>
        </aside>

        <div className="maze-stage">
          <div className={`maze-board ${walking ? 'is-walking' : ''}`} onPointerDown={onBoardPointerDown} aria-label={`Labyrinthe de la forêt enchantée, niveau ${levelIndex + 1}`} style={{ '--cols': level.grid[0].length, '--rows': level.grid.length, aspectRatio: `${level.grid[0].length} / ${level.grid.length}` } as React.CSSProperties}>
            {/* oxlint-disable-next-line next/no-img-element -- Vite app with a project-local generated game asset. */}
            <img className="maze-backdrop" src="/assets/enchanted-forest.webp" alt="" aria-hidden="true" />
            <div className="maze-shade" aria-hidden="true" />
            <div className="maze-grid">
              {level.grid.flatMap((row, rowIndex) => row.map((cell, colIndex) => {
                const key = `${rowIndex}-${colIndex}`;
                return <span key={key} className={`maze-cell ${cell ? 'wall' : 'path'} ${visited.has(key) ? 'visited' : ''}`} />;
              }))}
            </div>
            <div className="castle-goal" style={{ '--row': level.goal.row, '--col': level.goal.col } as React.CSSProperties} aria-label="Arrivée au château"><Crown /><span>CHÂTEAU</span></div>
            <div className="princess-player" style={{ '--row': position.row, '--col': position.col } as React.CSSProperties} aria-label={`Lola, ligne ${position.row + 1}, colonne ${position.col + 1}`}>
              {/* oxlint-disable-next-line next/no-img-element -- Vite app with a project-local generated game sprite. */}
              <img src="/assets/princess-lantern.webp" alt="Lola, la princesse avec sa lanterne" />
            </div>
          </div>
          <p className="tap-to-walk">Touche une case dans la même ligne ou colonne : Lola avancera jusqu’au mur.</p>
          <div className="touch-controls" aria-label="Commandes directionnelles">
            <button className="touch-up" onClick={() => move('up')} aria-label="Aller vers le haut"><ArrowUp /></button>
            <button className="touch-left" onClick={() => move('left')} aria-label="Aller à gauche"><ArrowLeft /></button>
            <button className="touch-down" onClick={() => move('down')} aria-label="Aller vers le bas"><ArrowDown /></button>
            <button className="touch-right" onClick={() => move('right')} aria-label="Aller à droite"><ArrowRight /></button>
          </div>
        </div>
      </section>

      {won && <dialog open className="win-screen" aria-labelledby="win-title"><div className="win-card">
        <div className="win-crown"><Crown /></div><p><Sparkles /> {isFinalLevel ? 'Aventure terminée' : 'Niveau réussi'}</p>
        <h2 id="win-title">{isFinalLevel ? 'Lola a traversé les 10 forêts !' : `Le niveau ${levelIndex + 1} est terminé`}</h2>
        <p>Tu as trouvé la sortie en <strong>{moves} pas</strong>.</p>
        <div>
          <Button size="lg" onClick={() => loadLevel(isFinalLevel ? 0 : levelIndex + 1)}>{isFinalLevel ? <RotateCcw /> : <Sparkles />} {isFinalLevel ? 'Recommencer l’aventure' : 'Niveau suivant'}</Button>
          <Button size="lg" variant="outline" onClick={onBack}>Choisir un autre jeu</Button>
        </div>
      </div></dialog>}
    </main>
  );
}
