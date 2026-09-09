import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

/** The same board stays fully visible, including in the enlarged view. */
export function MazeZoom({ children, tools, level }: { children: ReactNode; tools: (close: () => void) => ReactNode; level: number }) {
  const [zoom, setZoom] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setZoom(false); toggle.current?.focus(); } };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, []);
  useLayoutEffect(() => {
    const host = viewport.current;
    const board = host?.querySelector<HTMLElement>('.maze-board,.eclair-board');
    if (!host || !board) return;
    let frame = 0;
    const fit = () => {
      const cols = Number(board.style.getPropertyValue('--cols'));
      const rows = Number(board.style.getPropertyValue('--rows'));
      const width = Math.floor(Math.min(host.clientWidth, host.clientHeight * cols / rows));
      board.style.width = `${width}px`;
      board.style.height = `${Math.floor(width * rows / cols)}px`;
    };
    const observer = new ResizeObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(fit); });
    observer.observe(host);
    fit();
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [zoom, level]);
  return <div className={`maze-zoom-shell ${zoom ? 'is-zoomed' : ''}`} data-zoom={zoom}>
    <div className="maze-side-tools" aria-label="Outils du labyrinthe">
      <button className="maze-zoom-toggle" ref={toggle} aria-pressed={zoom} onClick={() => setZoom(v => !v)}>{zoom ? <Minimize2 /> : <Maximize2 />}<span>{zoom ? 'Réduire' : 'Agrandir le chemin'}</span></button>
      {tools(() => setZoom(false))}
    </div>
    <div className="maze-zoom-scroll" ref={viewport}>{children}</div>
  </div>;
}
