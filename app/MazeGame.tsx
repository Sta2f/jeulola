import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ChevronLeft, Crown, Footprints, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';

const MAZE = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
  [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1],
  [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
  [0, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1],
] as const;

const START = { row: 8, col: 0 };
const GOAL = { row: 0, col: 10 };

type Direction = 'up' | 'down' | 'left' | 'right';

export function MazeGame({ onBack }: { onBack: () => void }) {
  const [position, setPosition] = useState(START);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [visited, setVisited] = useState(() => new Set([`${START.row}-${START.col}`]));

  const move = useCallback((direction: Direction) => {
    if (won) return;
    const delta = {
      up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1],
    }[direction];

    setPosition((current) => {
      const next = { row: current.row + delta[0], col: current.col + delta[1] };
      if (next.row < 0 || next.row >= MAZE.length || next.col < 0 || next.col >= MAZE[0].length || MAZE[next.row][next.col] === 1) return current;
      setMoves((count) => count + 1);
      setVisited((cells) => new Set(cells).add(`${next.row}-${next.col}`));
      if (next.row === GOAL.row && next.col === GOAL.col) setWon(true);
      return next;
    });
  }, [won]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const direction = {
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      }[event.key] as Direction | undefined;
      if (!direction) return;
      event.preventDefault();
      move(direction);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [move]);

  const reset = () => {
    setPosition(START);
    setMoves(0);
    setWon(false);
    setVisited(new Set([`${START.row}-${START.col}`]));
  };

  return (
    <main className="maze-page">
      <header className="maze-header">
        <button className="back-button forest-back" onClick={onBack}><ChevronLeft /><span>Les jeux</span></button>
        <div className="maze-title"><p>AVENTURE ENCHANTÉE</p><h1>La princesse perdue</h1></div>
        <div className="move-count"><Footprints /><span><strong>{moves}</strong> pas</span></div>
      </header>

      <section className="maze-layout">
        <aside className="maze-story">
          <span className="chapter-mark">Chapitre 1</span>
          <h2>Retrouve le chemin du château</h2>
          <p>La nuit tombe sur la forêt. Guide Lola entre les vieux arbres jusqu’à la porte dorée.</p>
          <div className="key-hint"><span>↑ ↓ ← →</span><p>Utilise les flèches<br />de ton clavier</p></div>
          <Button variant="outline" className="maze-reset" onClick={reset}><RotateCcw /> Recommencer</Button>
        </aside>

        <div className="maze-stage">
          <div className="maze-board" aria-label="Labyrinthe de la forêt enchantée">
            {/* oxlint-disable-next-line next/no-img-element -- Vite app with a project-local generated game asset. */}
            <img className="maze-backdrop" src="/assets/enchanted-forest.webp" alt="" aria-hidden="true" />
            <div className="maze-shade" aria-hidden="true" />
            <div className="maze-grid">
              {MAZE.flatMap((row, rowIndex) => row.map((cell, colIndex) => {
                const key = `${rowIndex}-${colIndex}`;
                return <span key={key} className={`maze-cell ${cell ? 'wall' : 'path'} ${visited.has(key) ? 'visited' : ''}`} />;
              }))}
            </div>

            <div className="castle-goal" style={{ '--row': GOAL.row, '--col': GOAL.col } as React.CSSProperties} aria-label="Arrivée au château"><Crown /><span>CHÂTEAU</span></div>
            <div className="princess-player" style={{ '--row': position.row, '--col': position.col } as React.CSSProperties} aria-label={`Lola, ligne ${position.row + 1}, colonne ${position.col + 1}`}>
              {/* oxlint-disable-next-line next/no-img-element -- Vite app with a project-local generated game sprite. */}
              <img src="/assets/princess-lantern.webp" alt="Lola, la princesse avec sa lanterne" />
            </div>
          </div>

          <div className="touch-controls" aria-label="Commandes directionnelles">
            <button className="touch-up" onClick={() => move('up')} aria-label="Aller vers le haut"><ArrowUp /></button>
            <button className="touch-left" onClick={() => move('left')} aria-label="Aller à gauche"><ArrowLeft /></button>
            <button className="touch-down" onClick={() => move('down')} aria-label="Aller vers le bas"><ArrowDown /></button>
            <button className="touch-right" onClick={() => move('right')} aria-label="Aller à droite"><ArrowRight /></button>
          </div>
        </div>
      </section>

      {won && <dialog open className="win-screen" aria-labelledby="win-title"><div className="win-card">
        <div className="win-crown"><Crown /></div><p><Sparkles /> Mission accomplie</p>
        <h2 id="win-title">Lola a retrouvé le château</h2>
        <p>Tu as traversé la forêt en <strong>{moves} pas</strong>.</p>
        <div><Button size="lg" onClick={reset}><RotateCcw /> Rejouer</Button><Button size="lg" variant="outline" onClick={onBack}>Choisir un autre jeu</Button></div>
      </div></dialog>}
    </main>
  );
}
