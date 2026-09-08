import { useLayoutEffect, useRef } from 'react';

export function useFittedColoring() {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const panel = ref.current;
    const art = panel?.querySelector<HTMLElement>('.magic-canvas');
    const main = panel?.closest('main');
    if (!panel || !art || !main) return;
    let frame = 0;
    const fit = () => {
      const palette = panel.querySelector<HTMLElement>('.palette-board');
      const top = art.getBoundingClientRect().top + main.scrollTop;
      const bottom = main.getBoundingClientRect().bottom;
      const sidePalette = window.matchMedia('(min-width:1000px) and (min-height:650px)').matches;
      const height = Math.max(160, bottom - top - (sidePalette ? 0 : palette?.getBoundingClientRect().height ?? 240) - 55);
      const availableWidth = panel.clientWidth - (sidePalette ? 196 : 0);
      const width = Math.floor(Math.min(availableWidth, height * 800 / 576));
      if (art.style.width !== `${width}px`) art.style.width = `${width}px`;
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(fit); };
    const observer = new ResizeObserver(schedule);
    observer.observe(main); observer.observe(panel);
    panel.querySelectorAll('.palette-board,.canvas-heading').forEach(el => observer.observe(el));
    fit();
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, []);
  return ref;
}
