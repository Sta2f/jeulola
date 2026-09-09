export const TRACE_WIDTH = 600;
export const TRACE_HEIGHT = 320;
const WIDTH = 150;
const HEIGHT = 80;

export type TraceResult = { percent: number; coverage: number; precision: number; verdict: 'start' | 'good' | 'almost' | 'again' | 'outside' };
export const EMPTY_TRACE: TraceResult = { percent: 0, coverage: 0, precision: 100, verdict: 'start' };

function dilate(mask: Uint8Array, radius: number) {
  const expanded = new Uint8Array(mask.length);
  for (let y = 0; y < HEIGHT; y++) for (let x = 0; x < WIDTH; x++) {
    if (!mask[y * WIDTH + x]) continue;
    for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > radius * radius) continue;
      if (x + dx >= 0 && x + dx < WIDTH && y + dy >= 0 && y + dy < HEIGHT) expanded[(y + dy) * WIDTH + x + dx] = 1;
    }
  }
  return expanded;
}

/** A small cached raster: assessment runs on pen-up, never on every touch move. */
export function createTraceAssessment(letter: string) {
  const model = document.createElement('canvas');
  model.width = WIDTH; model.height = HEIGHT;
  const ctx = model.getContext('2d', { willReadFrequently: true })!;
  ctx.font = '700 60px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(letter, 75, 61.25);
  const data = ctx.getImageData(0, 0, WIDTH, HEIGHT).data;
  const target = Uint8Array.from({ length: WIDTH * HEIGHT }, (_, i) => data[i * 4 + 3] > 80 ? 1 : 0);
  const allowed = dilate(target, 3);
  const ink = document.createElement('canvas'); ink.width = WIDTH; ink.height = HEIGHT;
  const inkCtx = ink.getContext('2d', { willReadFrequently: true })!;
  return (drawing: HTMLCanvasElement): TraceResult => {
    inkCtx.clearRect(0, 0, WIDTH, HEIGHT);
    inkCtx.drawImage(drawing, 0, 0, WIDTH, HEIGHT);
    const pixels = inkCtx.getImageData(0, 0, WIDTH, HEIGHT).data;
    const stroke = Uint8Array.from({ length: target.length }, (_, i) => pixels[i * 4 + 3] > 30 ? 1 : 0);
    // A finger follows the centre of a thick glyph; it needn't paint it solid.
    const reached = dilate(stroke, 4);
    let targets = 0, covered = 0, marks = 0, correct = 0;
    for (let i = 0; i < target.length; i++) {
      if (target[i]) { targets++; if (reached[i]) covered++; }
      if (stroke[i]) { marks++; if (allowed[i]) correct++; }
    }
    if (!marks) return EMPTY_TRACE;
    const coverage = Math.round(covered / Math.max(targets, 1) * 100);
    const precision = Math.round(correct / marks * 100);
    const percent = Math.min(coverage, precision);
    const verdict = precision < 65 ? 'outside' : percent >= 80 ? 'good' : percent >= 50 ? 'almost' : 'again';
    return { percent, coverage, precision, verdict };
  };
}
