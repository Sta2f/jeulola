import { useLayoutEffect, useRef } from 'react';

/** Pixel sizing also works in Safari 15, which has no container query units. */
export function useDrawingSize(pair: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const node = ref.current!;
    const fit = () => {
      const { width, height } = node.getBoundingClientRect();
      const stacked = getComputedStyle(node).flexDirection === 'column';
      const size = pair
        ? stacked
          ? Math.min(width, (height - 8) / 2)
          : Math.min((width - 8) / 2, height)
        : Math.min(width, height);
      node.style.setProperty(
        '--drawing-size',
        `${Math.max(0, Math.floor(size))}px`,
      );
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(node);
    window.addEventListener('resize', fit);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, [pair]);
  return ref;
}
