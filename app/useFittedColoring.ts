import { useLayoutEffect, useRef } from 'react';

export function useFittedColoring() {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const host = ref.current?.querySelector<HTMLElement>('.coloring-art-space');
    const art = host?.querySelector<HTMLElement>('.magic-canvas');
    if (!host || !art) return;
    let frame = 0;
    const fit = () => {
      const width = Math.floor(Math.min(host.clientWidth, Math.max(0, host.clientHeight - 8) * 800 / 576 + 8));
      if (art.style.width !== `${width}px`) art.style.width = `${width}px`;
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(fit); };
    const observer = new ResizeObserver(schedule);
    observer.observe(host);
    fit();
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, []);
  return ref;
}
