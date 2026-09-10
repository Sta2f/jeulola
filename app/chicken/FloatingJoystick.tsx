import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';

type MovementInput = { x: number; y: number };

type JoystickProps = {
  onMove: (input: MovementInput) => void;
  onEnd: () => void;
  disabled: boolean;
};

type JoystickState = {
  active: boolean;
  centerX: number;
  centerY: number;
  stickX: number;
  stickY: number;
  input: MovementInput;
};

const restingState: JoystickState = {
  active: false,
  centerX: 0,
  centerY: 0,
  stickX: 0,
  stickY: 0,
  input: { x: 0, y: 0 },
};

const DEAD_ZONE = 0.12;

export function FloatingJoystick({ onMove, onEnd, disabled }: JoystickProps) {
  const zoneRef = useRef<HTMLFieldSetElement>(null);
  const baseRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<number | null>(null);
  const originRef = useRef({ x: 0, y: 0, scaleX: 1, scaleY: 1, travel: 40 });
  const callbacksRef = useRef({ onMove, onEnd });
  const [state, setState] = useState<JoystickState>(restingState);

  useLayoutEffect(() => {
    callbacksRef.current = { onMove, onEnd };
  }, [onMove, onEnd]);

  const stop = useCallback(() => {
    const pointerId = pointerRef.current;
    if (pointerId === null) return;
    pointerRef.current = null;
    setState(restingState);
    callbacksRef.current.onMove({ x: 0, y: 0 });
    callbacksRef.current.onEnd();

    // Clear ownership before releasing capture: lostpointercapture can fire immediately.
    const zone = zoneRef.current;
    if (zone?.hasPointerCapture(pointerId)) zone.releasePointerCapture(pointerId);
  }, []);

  useLayoutEffect(() => {
    if (disabled) stop();
  }, [disabled, stop]);

  useEffect(() => {
    const stopWhenHidden = () => {
      if (document.hidden) stop();
    };
    const finishPointer = (event: PointerEvent) => {
      if (event.pointerId === pointerRef.current) stop();
    };

    window.addEventListener('blur', stop);
    window.addEventListener('resize', stop);
    window.addEventListener('pointerup', finishPointer);
    window.addEventListener('pointercancel', finishPointer);
    document.addEventListener('visibilitychange', stopWhenHidden);

    // A game panel can resize without the window resizing, for example when going fullscreen.
    const observer = new ResizeObserver(stop);
    if (zoneRef.current) observer.observe(zoneRef.current);

    return () => {
      window.removeEventListener('blur', stop);
      window.removeEventListener('resize', stop);
      window.removeEventListener('pointerup', finishPointer);
      window.removeEventListener('pointercancel', finishPointer);
      document.removeEventListener('visibilitychange', stopWhenHidden);
      observer.disconnect();
      stop();
    };
  }, [stop]);

  const start = (event: ReactPointerEvent<HTMLFieldSetElement>) => {
    if (disabled || pointerRef.current !== null || event.button !== 0) return;
    event.preventDefault();
    const zone = event.currentTarget;
    const bounds = zone.getBoundingClientRect();
    const scaleX = bounds.width / (zone.offsetWidth || bounds.width);
    const scaleY = bounds.height / (zone.offsetHeight || bounds.height);
    const centerX = (event.clientX - bounds.left) / scaleX;
    const centerY = (event.clientY - bounds.top) / scaleY;
    const diameter = baseRef.current?.offsetWidth || 136;

    pointerRef.current = event.pointerId;
    originRef.current = { x: event.clientX, y: event.clientY, scaleX, scaleY, travel: diameter * 0.28 };
    zone.setPointerCapture(event.pointerId);
    setState({ ...restingState, active: true, centerX, centerY });
    callbacksRef.current.onMove({ x: 0, y: 0 });
  };

  const move = (event: ReactPointerEvent<HTMLFieldSetElement>) => {
    if (disabled || event.pointerId !== pointerRef.current) return;
    event.preventDefault();
    const origin = originRef.current;
    const dx = (event.clientX - origin.x) / origin.scaleX;
    const dy = (event.clientY - origin.y) / origin.scaleY;
    const distance = Math.hypot(dx, dy);
    const amount = Math.min(distance / origin.travel, 1);
    const directionX = distance > 0 ? dx / distance : 0;
    const directionY = distance > 0 ? dy / distance : 0;
    const speed = amount <= DEAD_ZONE ? 0 : 0.6 + 0.4 * ((amount - DEAD_ZONE) / (1 - DEAD_ZONE));
    const input = { x: directionX * speed, y: directionY * speed };

    setState(previous => ({
      ...previous,
      stickX: directionX * amount * origin.travel,
      stickY: directionY * amount * origin.travel,
      input,
    }));
    callbacksRef.current.onMove(input);
  };

  const finish = (event: ReactPointerEvent<HTMLFieldSetElement>) => {
    if (event.pointerId !== pointerRef.current) return;
    event.preventDefault();
    stop();
  };

  const baseStyle: CSSProperties = state.active
    ? { left: state.centerX, top: state.centerY, bottom: 'auto', transform: 'translate(-50%, -50%)' }
    : {};

  return <fieldset
    ref={zoneRef}
    className="chicken-joystick-zone"
    aria-label="Joystick tactile : glisse pour déplacer Lola"
    aria-disabled={disabled}
    data-testid="floating-joystick"
    data-active={state.active}
    data-center-x={Number(state.centerX.toFixed(2))}
    data-center-y={Number(state.centerY.toFixed(2))}
    data-vector-x={Number(state.input.x.toFixed(4))}
    data-vector-y={Number(state.input.y.toFixed(4))}
    onPointerDown={start}
    onPointerMove={move}
    onPointerUp={finish}
    onPointerCancel={finish}
    onLostPointerCapture={finish}
  >
    <div ref={baseRef} className="chicken-joystick-base" data-testid="joystick-base" style={baseStyle} aria-hidden="true">
      <span className="chicken-joystick-mark chicken-joystick-mark-up" />
      <span className="chicken-joystick-mark chicken-joystick-mark-right" />
      <span className="chicken-joystick-mark chicken-joystick-mark-down" />
      <span className="chicken-joystick-mark chicken-joystick-mark-left" />
      <span className="chicken-joystick-stick" data-testid="joystick-stick" style={{ transform: `translate(${state.stickX}px, ${state.stickY}px)` }} />
    </div>
    <span className="chicken-joystick-hint" aria-hidden="true">Glisse pour avancer</span>
  </fieldset>;
}
