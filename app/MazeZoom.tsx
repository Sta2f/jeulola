import { cloneElement, useEffect, useLayoutEffect, useRef, useState, type ReactElement, type PointerEventHandler } from 'react';

/** Keep the same interactive board, enlarged to finger-sized cells. */
export function MazeZoom({ children, row, col }: { children: ReactElement<{ onPointerDown?: PointerEventHandler<HTMLElement>; onPointerUp?: PointerEventHandler<HTMLElement> }>; row: number; col: number }) {
  const [zoom, setZoom] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const [down, setDown] = useState({x:0,y:0});
  const onZoomPointerUp: PointerEventHandler<HTMLElement> = event => {
    if (Math.hypot(event.clientX-down.x,event.clientY-down.y)<8) children.props.onPointerDown?.(event);
  };
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setZoom(false); };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, []);
  useLayoutEffect(() => {
    if (!zoom || !scroller.current) return;
    const el = scroller.current;
    el.scrollLeft = (col + .5) * 44 - el.clientWidth / 2;
    el.scrollTop = (row + .5) * 44 - el.clientHeight / 2;
  }, [zoom, row, col]);
  return <div className={`maze-zoom-shell ${zoom ? 'is-zoomed' : ''}`} data-zoom={zoom}>
    <button className="maze-zoom-toggle" aria-pressed={zoom} onClick={() => setZoom(v => !v)}>{zoom ? '↙ Vue d’ensemble' : '🔎 Agrandir le chemin'}</button>
    {zoom && <p className="maze-zoom-help">Touche le chemin en ligne droite. La vue suit ton personnage. Fais glisser pour explorer.</p>}
    <div className="maze-zoom-scroll" ref={scroller} onPointerDownCapture={event => { if (zoom) setDown({x:event.clientX,y:event.clientY}); }}>{zoom ? cloneElement(children, {
      onPointerDown: undefined,
      onPointerUp: onZoomPointerUp,
    }) : children}</div>
  </div>;
}
