import { useCallback, useEffect, useRef } from 'react';

export type MazeDirection = 'up' | 'down' | 'left' | 'right';
export type MazeInput = { direction: MazeDirection } | { row: number; col: number };
type Position = { row: number; col: number };

/** Keep the latest intention during a walk; never skip walls or cut a corner. */
export function useMazeInputQueue({ walking, won, move, walkStraight }: {
  walking: boolean;
  won: boolean;
  move: (direction: MazeDirection) => void;
  walkStraight: (row: number, col: number) => void;
}) {
  const pending = useRef<MazeInput | null>(null);
  const clear = useCallback(() => { pending.current = null; }, []);
  const dispatch = useCallback((input: MazeInput) => {
    if (won) return;
    if (walking) { pending.current = input; return; }
    pending.current = null;
    if ('direction' in input) move(input.direction);
    else walkStraight(input.row, input.col);
  }, [move, walkStraight, walking, won]);
  useEffect(() => {
    if (won) pending.current = null;
    else if (!walking && pending.current) dispatch(pending.current);
  }, [dispatch, walking, won]);
  return { dispatch, clear };
}

/** A finger may miss a thin corridor slightly. Only snap onto a straight axis. */
export function mazePointerTarget(grid: number[][], position: Position, bounds: {
  left: number; top: number; width: number; height: number;
}, x: number, y: number, forgiving: boolean): Position {
  const cellW = bounds.width / grid[0].length, cellH = bounds.height / grid.length;
  const col = Math.max(0, Math.min(grid[0].length - 1, Math.floor((x - bounds.left) / cellW)));
  const row = Math.max(0, Math.min(grid.length - 1, Math.floor((y - bounds.top) / cellH)));
  if (!forgiving || row === position.row || col === position.col) return { row, col };
  const dx = Math.abs(x - (bounds.left + (position.col + .5) * cellW));
  const dy = Math.abs(y - (bounds.top + (position.row + .5) * cellH));
  const candidates: (Position & { distance: number })[] = [];
  if (dy <= Math.min(18, Math.max(8, cellH * .8)) && grid[position.row]?.[position.col + Math.sign(col - position.col)] === 0) {
    candidates.push({ row: position.row, col, distance: dy });
  }
  if (dx <= Math.min(18, Math.max(8, cellW * .8)) && grid[position.row + Math.sign(row - position.row)]?.[position.col] === 0) {
    candidates.push({ row, col: position.col, distance: dx });
  }
  return candidates.sort((a, b) => a.distance - b.distance)[0] ?? { row, col };
}
