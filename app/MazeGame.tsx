import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAchievements } from './useAchievements';
import { readSaved, saveValue } from './preferences';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ChevronLeft, Crown, Footprints, RotateCcw, Sparkles, Volume2, VolumeX } from 'lucide-react';
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
  { rows: 15, cols: 19, seed: 701, name: 'Le jardin des fausses pistes', difficulty: 'Maître', branching: true },
  { rows: 15, cols: 19, seed: 827, name: 'La forêt aux vingt détours', difficulty: 'Maître', branching: true },
  { rows: 15, cols: 21, seed: 919, name: 'Le bois des chemins trompeurs', difficulty: 'Maître', branching: true },
  { rows: 17, cols: 21, seed: 1033, name: 'Le royaume des impasses', difficulty: 'Prodige', branching: true },
  { rows: 17, cols: 23, seed: 1171, name: 'Les ronces du vieux palais', difficulty: 'Prodige', branching: true },
  { rows: 19, cols: 23, seed: 1307, name: 'La vallée aux mille branches', difficulty: 'Prodige', branching: true },
  { rows: 19, cols: 25, seed: 1459, name: 'Le labyrinthe des étoiles', difficulty: 'Légendaire', branching: true },
  { rows: 21, cols: 25, seed: 1601, name: 'La forêt sans fin', difficulty: 'Légendaire', branching: true },
  { rows: 21, cols: 27, seed: 1777, name: 'Le grand dédale enchanté', difficulty: 'Légendaire', branching: true },
  { rows: 23, cols: 29, seed: 1951, name: 'La couronne des chemins perdus', difficulty: 'Ultime', branching: true },
] as const;

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function generateMaze(rows: number, cols: number, seed: number, branching = false) {
  const random = seededRandom(seed);
  const grid = Array.from({ length: rows }, () => Array(cols).fill(1));
  const start = { row: rows - 2, col: 1 };
  const goal = { row: 1, col: cols - 2 };
  const stack = [start];
  grid[start.row][start.col] = 0;

  if (branching) {
    const active = [start];
    while (active.length) {
      const activeIndex = random() < .52 ? active.length - 1 : Math.floor(random() * active.length);
      const current = active[activeIndex];
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
        active.splice(activeIndex, 1);
        continue;
      }
      const [rowDelta, colDelta] = nextDirection;
      const next = { row: current.row + rowDelta, col: current.col + colDelta };
      grid[current.row + rowDelta / 2][current.col + colDelta / 2] = 0;
      grid[next.row][next.col] = 0;
      active.push(next);
    }
    return { grid, start, goal };
  }

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
  ...generateMaze(settings.rows, settings.cols, settings.seed, 'branching' in settings && settings.branching),
}));

export function MazeGame({ onBack }: { onBack: () => void }) {
  const { soundOn, startAudio, playSfx, toggleSound } = useGameAudio('forest');
  const [levelIndex, setLevelIndex] = useState(() => Math.max(0, Math.min(19, Math.floor(Number(readSaved('princess-level', 0)) || 0))));
  useEffect(() => saveValue('princess-level', levelIndex), [levelIndex]);
  const level = LEVELS[levelIndex];
  const [position, setPosition] = useState(level.start);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [focusBoard, setFocusBoard] = useState(() => window.matchMedia('(max-width: 650px), (max-width: 1000px) and (orientation: portrait)').matches);
  const completed = useAchievements('princess', levelIndex, won);
  const [walking, setWalking] = useState(false);
  const [walkDuration, setWalkDuration] = useState(170);
  const walkTimer = useRef<number | null>(null);
  const gridCells = useMemo(() => level.grid.flatMap((row, rowIndex) => row.map((cell, colIndex) => (
    <span key={`${rowIndex}-${colIndex}`} className={`maze-cell ${cell ? 'wall' : 'path'}`} />
  ))), [level]);

  const stopWalking = useCallback(() => {
    if (walkTimer.current !== null) window.clearTimeout(walkTimer.current);
    walkTimer.current = null;
    setWalking(false);
  }, []);

  const loadLevel = useCallback((nextLevelIndex: number) => {
    if (window.matchMedia('(max-width: 650px), (max-width: 1000px) and (orientation: portrait)').matches) setFocusBoard(true);
    stopWalking();
    const nextLevel = LEVELS[nextLevelIndex];
    setLevelIndex(nextLevelIndex);
    setPosition(nextLevel.start);
    setMoves(0);
    setWon(false);
    setWalkDuration(170);
    playSfx('select');
  }, [playSfx, stopWalking]);

  const move = useCallback((direction: Direction) => {
    if (won || walking) return;
    const delta = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] }[direction];
    setPosition((current) => {
      const next = { row: current.row + delta[0], col: current.col + delta[1] };
      if (next.row < 0 || next.row >= level.grid.length || next.col < 0 || next.col >= level.grid[0].length || level.grid[next.row][next.col] === 1) return current;
      setWalkDuration(170);
      playSfx('step');
      setMoves((count) => count + 1);
      if (next.row === level.goal.row && next.col === level.goal.col) {
        setWon(true);
        playSfx('win');
      }
      return next;
    });
  }, [level, playSfx, walking, won]);

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

    const destination = path[path.length - 1];
    const duration = Math.min(720, Math.max(190, path.length * 72));
    const reachesGoal = destination.row === level.goal.row && destination.col === level.goal.col;
    setWalkDuration(duration);
    setWalking(true);
    setPosition(destination);
    setMoves((count) => count + path.length);
    playSfx('step');
    walkTimer.current = window.setTimeout(() => {
      playSfx('step');
      if (reachesGoal) {
        setWon(true);
        playSfx('win');
      }
      walkTimer.current = null;
      setWalking(false);
    }, duration);
  }, [level, playSfx, position, walking, won]);

  const onBoardPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
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
    <main className={`maze-page ${focusBoard ? 'focus-board' : ''}`} onPointerDownCapture={startAudio}>
      <header className="maze-header">
        <button className="back-button forest-back" aria-label="Les jeux" onClick={onBack}><ChevronLeft /><span>Les jeux</span></button>
        <div className="maze-title"><p>AVENTURE ENCHANTÉE</p><h1>La princesse perdue</h1></div>
        <div className="maze-header-actions"><div className="move-count"><Footprints /><span><strong>{moves}</strong> pas</span></div><button className="game-sound-toggle" onClick={toggleSound} aria-label={soundOn ? 'Couper la musique et les bruitages' : 'Activer la musique et les bruitages'}>{soundOn ? <Volume2 /> : <VolumeX />}</button></div>
      </header>

      <nav className="level-trail" aria-label="Les 20 niveaux du labyrinthe">
        <span className="achievement-count">✦ {completed.length}/20 réussis</span>
        {LEVELS.map((item, index) => (
          <button key={item.name} className={index === levelIndex ? 'current' : ''} onClick={() => loadLevel(index)} aria-label={`Jouer directement au niveau ${index + 1}`} aria-current={index === levelIndex ? 'step' : undefined}>
            {index + 1}
          </button>
        ))}
      </nav>

      <section className="maze-layout">
        <aside className="maze-story">
          <span className="chapter-mark">Niveau {levelIndex + 1} sur {LEVELS.length}</span>
          <h2>{level.name}</h2>
          <p>Guide Lola entre les vieux arbres jusqu’à la couronne dorée. Chaque forêt devient un peu plus mystérieuse.</p>
          <span className="difficulty-badge">Difficulté · {level.difficulty}</span>
          <div className="key-hint"><span>↑ ↓ ← →</span><p>Utilise les flèches<br />de ton clavier</p></div>
          <Button variant="outline" className="maze-reset" onClick={reset}><RotateCcw /> Recommencer</Button>
        </aside>

        <div className="maze-stage">
          <button className="board-focus-toggle" aria-pressed={focusBoard} onClick={() => setFocusBoard(v => !v)}>{focusBoard ? 'Afficher les niveaux' : 'Grand plateau'}</button>
          <div className={`maze-board ${walking ? 'is-walking' : ''}`} onPointerDown={onBoardPointerDown} aria-label={`Labyrinthe de la forêt enchantée, niveau ${levelIndex + 1}`} style={{ '--cols': level.grid[0].length, '--rows': level.grid.length, '--move-duration': `${walkDuration}ms`, aspectRatio: `${level.grid[0].length} / ${level.grid.length}` } as React.CSSProperties}>
            {/* oxlint-disable-next-line next/no-img-element -- Vite app with a project-local generated game asset. */}
            <img className="maze-backdrop" src="/assets/enchanted-forest.webp" alt="" aria-hidden="true" />
            <div className="maze-shade" aria-hidden="true" />
            <div className="maze-grid">{gridCells}</div>
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
        <h2 id="win-title">{isFinalLevel ? 'Lola a traversé les 20 forêts !' : `Le niveau ${levelIndex + 1} est terminé`}</h2>
        <p>Tu as trouvé la sortie en <strong>{moves} pas</strong>.</p>
        <div>
          <Button size="lg" onClick={() => loadLevel(isFinalLevel ? 0 : levelIndex + 1)}>{isFinalLevel ? <RotateCcw /> : <Sparkles />} {isFinalLevel ? 'Recommencer l’aventure' : 'Niveau suivant'}</Button>
          <Button size="lg" variant="outline" onClick={onBack}>Choisir un autre jeu</Button>
        </div>
      </div></dialog>}
    </main>
  );
}
