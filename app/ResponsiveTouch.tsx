import { useEffect } from 'react';

/** One completed finger tap = one button activation, without a hover-first click. */
export function ResponsiveTouch() {
  useEffect(() => {
    let press: { button: HTMLButtonElement; id: number; x: number; y: number } | null = null;
    let lastTapTime: number | null = null;
    const buttonAt = (target: EventTarget | null) => target instanceof Element ? target.closest<HTMLButtonElement>('#root button') : null;
    const enabled = (button: HTMLButtonElement) => !button.disabled && button.getAttribute('aria-disabled') !== 'true';
    const down = (event: PointerEvent) => {
      if (!event.isPrimary) { press = null; return; }
      if (event.pointerType !== 'touch' && event.pointerType !== 'pen') {
        // A real mouse press starts a new interaction on a hybrid device.
        lastTapTime = null;
        return;
      }
      const button = buttonAt(event.target);
      press = button && enabled(button) && !button.hasAttribute('data-press-on-down')
        ? { button, id: event.pointerId, x: event.clientX, y: event.clientY } : null;
    };
    const move = (event: PointerEvent) => {
      if (press && event.pointerId === press.id && Math.hypot(event.clientX - press.x, event.clientY - press.y) > 12) press = null;
    };
    const cancel = () => { press = null; };
    const up = (event: PointerEvent) => {
      const tap = press;
      press = null;
      if (!tap || tap.id !== event.pointerId || !tap.button.isConnected || !enabled(tap.button)) return;
      if (Math.hypot(event.clientX - tap.x, event.clientY - tap.y) > 12) return;
      // Pointer capture / a finger sliding off a control must not activate it.
      if (buttonAt(document.elementFromPoint(event.clientX, event.clientY)) !== tap.button) return;
      event.preventDefault();
      lastTapTime = performance.now();
      tap.button.focus({ preventScroll: true });
      tap.button.click();
    };
    const click = (event: MouseEvent) => {
      // Some browsers still emit a compatibility click after pointerup.
      // Leave keyboard, assistive and programmatic activations untouched.
      if (!event.isTrusted || event.detail === 0 || lastTapTime === null) return;
      // WebKit can retarget that click to a different button after navigation,
      // including shifting its coordinates: suppress the duplicate, not a region.
      if (performance.now() - lastTapTime < 700) {
        lastTapTime = null;
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    document.addEventListener('pointerdown', down, true);
    document.addEventListener('pointermove', move, true);
    document.addEventListener('pointerup', up, { capture: true, passive: false });
    document.addEventListener('pointercancel', cancel, true);
    document.addEventListener('click', click, true);
    window.addEventListener('blur', cancel);
    return () => {
      document.removeEventListener('pointerdown', down, true);
      document.removeEventListener('pointermove', move, true);
      document.removeEventListener('pointerup', up, true);
      document.removeEventListener('pointercancel', cancel, true);
      document.removeEventListener('click', click, true);
      window.removeEventListener('blur', cancel);
    };
  }, []);
  return null;
}
