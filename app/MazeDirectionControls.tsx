import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import type { MazeDirection } from './mazeInput';

const directions = [
  { direction: 'up', label: 'Aller vers le haut', Icon: ArrowUp },
  { direction: 'left', label: 'Aller à gauche', Icon: ArrowLeft },
  { direction: 'down', label: 'Aller vers le bas', Icon: ArrowDown },
  { direction: 'right', label: 'Aller à droite', Icon: ArrowRight },
] as const;

export function MazeDirectionControls({ className, onMove }: { className: string; onMove: (direction: MazeDirection) => void }) {
  return <div className={className} aria-label="Commandes directionnelles">
    {directions.map(({ direction, label, Icon }) => <button key={direction} type="button" className={`touch-${direction}`} aria-label={label} data-press-on-down
      onPointerDown={event => {
        if (!event.isPrimary || event.button !== 0) return;
        event.preventDefault();
        event.currentTarget.focus({ preventScroll: true });
        onMove(direction);
      }}
      onClick={event => {
        // Keyboard and assistive activation have no preceding pointer press.
        if (event.detail === 0) onMove(direction);
      }}><Icon aria-hidden="true" /></button>)}
  </div>;
}
