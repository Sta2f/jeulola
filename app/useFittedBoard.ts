import { useLayoutEffect, useRef } from 'react';

/** Fits the board into the stage after reserving its actual controls and text. */
export function useFittedBoard(level: number, expanded: boolean) {
  const stageRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const board = stage?.querySelector<HTMLElement>('.maze-board');
    if (!stage || !board) return;
    let frame = 0;
    let disposed = false;
    const fit = () => {
      const otherHeight = [...stage.children].filter(el => el !== board).reduce((total, el) => {
        const css = getComputedStyle(el);
        return css.display === 'none' ? total : total + el.getBoundingClientRect().height + (parseFloat(css.marginTop) || 0) + (parseFloat(css.marginBottom) || 0);
      }, 0);
      const cols = Number(board.style.getPropertyValue('--cols'));
      const rows = Number(board.style.getPropertyValue('--rows'));
      const width = Math.floor(Math.max(0, Math.min(stage.clientWidth, (stage.clientHeight - otherHeight - 8) * cols / rows)));
      if (board.style.width !== `${width}px`) board.style.width = `${width}px`;
    };
    const schedule = () => { if (disposed) return; cancelAnimationFrame(frame); frame = requestAnimationFrame(fit); };
    const observer = new ResizeObserver(schedule);
    observer.observe(stage);
    [...stage.children].filter(el => el !== board).forEach(el => observer.observe(el));
    void document.fonts.ready.then(schedule);
    fit();
    return () => { disposed = true; observer.disconnect(); cancelAnimationFrame(frame); };
  }, [level, expanded]);
  return stageRef;
}
