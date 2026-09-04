import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Eraser, Palette, RotateCcw, Sparkles, Undo2, Volume2, VolumeX } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useGameAudio } from './useGameAudio';

type Drawing = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
};

type PaintEffect = 'solid' | 'glitter' | 'rainbow' | 'watercolor';
type Paint = { id: string; name: string; effect: PaintEffect; colors: readonly string[] };

const COLORS: Paint[] = [
  { id: 'pink', name: 'Rose bonbon', effect: 'solid', colors: ['#ff6fae'] },
  { id: 'raspberry', name: 'Framboise', effect: 'solid', colors: ['#e83e73'] },
  { id: 'coral', name: 'Corail', effect: 'solid', colors: ['#ff7b67'] },
  { id: 'orange', name: 'Orange', effect: 'solid', colors: ['#ffad42'] },
  { id: 'sun', name: 'Soleil', effect: 'solid', colors: ['#ffd84d'] },
  { id: 'mint', name: 'Menthe', effect: 'solid', colors: ['#70db9b'] },
  { id: 'turquoise', name: 'Turquoise', effect: 'solid', colors: ['#50d8dc'] },
  { id: 'sky', name: 'Ciel', effect: 'solid', colors: ['#69bfff'] },
  { id: 'lavender', name: 'Lavande', effect: 'solid', colors: ['#ad83f4'] },
  { id: 'purple', name: 'Violet', effect: 'solid', colors: ['#7b52d8'] },
  { id: 'chocolate', name: 'Chocolat', effect: 'solid', colors: ['#9b6246'] },
  { id: 'pearl', name: 'Blanc nacré', effect: 'solid', colors: ['#fffaf0'] },
];

const MAGIC_PAINTS: Paint[] = [
  { id: 'rose-gold-glitter', name: 'Paillettes rose et or', effect: 'glitter', colors: ['#ff67b5', '#ffd66d', '#fff5fb'] },
  { id: 'unicorn-glitter', name: 'Paillettes licorne', effect: 'glitter', colors: ['#8d73ff', '#ff70c7', '#75e8ff'] },
  { id: 'magic-rainbow', name: 'Arc-en-ciel magique', effect: 'rainbow', colors: ['#ff5c8a', '#ffca4b', '#55db91', '#61bfff', '#ae76f4'] },
  { id: 'sunset-watercolor', name: 'Aquarelle coucher de soleil', effect: 'watercolor', colors: ['#ff739d', '#ffac67', '#ffe175'] },
  { id: 'ocean-watercolor', name: 'Aquarelle océan', effect: 'watercolor', colors: ['#55d9cf', '#58aee8', '#8c79db'] },
];

const PAINTS = [...COLORS, ...MAGIC_PAINTS];

const DRAWINGS: Drawing[] = [
  { id: 'winged-bunny', title: 'Le lapin ailé', subtitle: 'Une aventure dans la jungle', image: '/assets/coloring/01-lapin-aile.webp' },
  { id: 'puppy', title: 'Le petit chiot', subtitle: 'Son goûter plein de cœurs', image: '/assets/coloring/02-chiot.webp' },
  { id: 'turtle', title: 'La tortue rigolote', subtitle: 'Deux amis au jardin', image: '/assets/coloring/03-tortue.webp' },
  { id: 'frog', title: 'La grenouille', subtitle: 'Sous les champignons', image: '/assets/coloring/04-grenouille.webp' },
  { id: 'unicorn', title: 'La licorne magique', subtitle: 'Des étoiles plein le ciel', image: '/assets/coloring/05-licorne.webp' },
  { id: 'rainbow-cat', title: 'Le chat arc-en-ciel', subtitle: 'Fleurs et nuages enchantés', image: '/assets/coloring/06-chat-arc-en-ciel.webp' },
  { id: 'sunflowers', title: 'Les tournesols', subtitle: 'Un jardin qui sourit', image: '/assets/coloring/07-tournesols.webp' },
  { id: 'space', title: 'Le voyage spatial', subtitle: 'Fusées, planètes et étoiles', image: '/assets/coloring/08-espace.webp' },
  { id: 'dragon', title: 'Le bébé dragon', subtitle: 'Un gardien très mignon', image: '/assets/coloring/09-dragon.webp' },
  { id: 'fawn', title: 'Le petit faon', subtitle: 'Le prince de la forêt', image: '/assets/coloring/10-faon.webp' },
];

function hexToRgb(hex: string) {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255, 255] as const;
}

function mixColors(first: readonly number[], second: readonly number[], amount: number) {
  return first.map((channel, index) => Math.round(channel + (second[index] - channel) * amount)) as number[];
}

function noiseAt(x: number, y: number) {
  const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function paintColor(paint: Paint, x: number, y: number, width: number, height: number) {
  const colors = paint.colors.map(hexToRgb);
  if (paint.effect === 'solid') return colors[0];
  if (paint.effect === 'rainbow') {
    const position = ((x / width) * .72 + (y / height) * .28) * (colors.length - 1);
    const index = Math.min(colors.length - 2, Math.floor(position));
    return mixColors(colors[index], colors[index + 1], position - index);
  }
  if (paint.effect === 'glitter') {
    const grain = noiseAt(x, y);
    if (grain > .975 || (x + y * 3) % 67 === 0) return [255, 255, 255, 255];
    if (grain > .91) return colors[1];
    return mixColors(colors[0], colors[2], grain * .28);
  }
  const wave = (Math.sin(x / 29) + Math.cos(y / 37) + Math.sin((x + y) / 53) + 3) / 6;
  const wash = Math.min(.999, Math.max(0, wave * .82 + noiseAt(Math.floor(x / 5), Math.floor(y / 5)) * .18));
  const position = wash * (colors.length - 1);
  const index = Math.min(colors.length - 2, Math.floor(position));
  return mixColors(colors[index], colors[index + 1], position - index).map((channel, channelIndex) => channelIndex === 3 ? 255 : Math.round(channel * .88 + 255 * .12));
}

function floodFill(imageData: ImageData, startX: number, startY: number, paint: Paint) {
  const { data, width, height } = imageData;
  const startPixel = startY * width + startX;
  const startIndex = startPixel * 4;
  const target = [data[startIndex], data[startIndex + 1], data[startIndex + 2], data[startIndex + 3]];
  const brightness = (target[0] + target[1] + target[2]) / 3;
  if (brightness < 90) return false;

  const tolerance = 22;
  const seen = new Uint8Array(width * height);
  const stack: number[] = [];
  const matchesTarget = (pixel: number) => {
    const index = pixel * 4;
    return Math.abs(data[index] - target[0]) <= tolerance
      && Math.abs(data[index + 1] - target[1]) <= tolerance
      && Math.abs(data[index + 2] - target[2]) <= tolerance
      && Math.abs(data[index + 3] - target[3]) <= tolerance;
  };
  const addPixel = (pixel: number) => {
    if (pixel < 0 || pixel >= width * height || seen[pixel] || !matchesTarget(pixel)) return;
    seen[pixel] = 1;
    stack.push(pixel);
  };

  addPixel(startPixel);
  let paintedPixels = 0;
  while (stack.length) {
    const pixel = stack.pop()!;
    const index = pixel * 4;
    const x = pixel % width;
    const color = paintColor(paint, x, Math.floor(pixel / width), width, height);
    data[index] = color[0];
    data[index + 1] = color[1];
    data[index + 2] = color[2];
    data[index + 3] = color[3];
    paintedPixels += 1;
    if (x > 0) addPixel(pixel - 1);
    if (x < width - 1) addPixel(pixel + 1);
    addPixel(pixel - width);
    addPixel(pixel + width);
  }
  return paintedPixels > 4;
}

export function ColoringGame({ onBack }: { onBack: () => void }) {
  const { soundOn, startAudio, playSfx, toggleSound } = useGameAudio('coloring');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const savedDrawings = useRef<Record<string, ImageData>>({});
  const histories = useRef<Record<string, ImageData[]>>({});
  const [drawingIndex, setDrawingIndex] = useState(0);
  const [selectedPaint, setSelectedPaint] = useState(COLORS[0].id);
  const [eraserMode, setEraserMode] = useState(false);
  const [sparkle, setSparkle] = useState(0);
  const [paintActions, setPaintActions] = useState<Record<string, number>>({});
  const [canUndo, setCanUndo] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const drawing = DRAWINGS[drawingIndex];
  const paint = PAINTS.find((item) => item.id === selectedPaint) ?? COLORS[0];

  const sparkleDots = useMemo(() => Array.from({ length: 14 }, (_, index) => ({
    angle: (index / 14) * Math.PI * 2,
    distance: 42 + (index % 3) * 13,
  })), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return;
    const saved = savedDrawings.current[drawing.id];
    if (saved) {
      context.putImageData(saved, 0, 0);
      setCanUndo(Boolean(histories.current[drawing.id]?.length));
      return;
    }

    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (cancelled) return;
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      savedDrawings.current[drawing.id] = context.getImageData(0, 0, canvas.width, canvas.height);
      histories.current[drawing.id] = [];
      setCanUndo(false);
    };
    image.src = drawing.image;
    return () => {
      cancelled = true;
    };
  }, [drawing, reloadKey]);

  const selectColor = (paintId: string) => {
    setSelectedPaint(paintId);
    setEraserMode(false);
    setSparkle((value) => value + 1);
    playSfx('select');
  };

  const paintAt = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    event.preventDefault();
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return;
    const bounds = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(canvas.width - 1, Math.floor((event.clientX - bounds.left) * canvas.width / bounds.width)));
    const y = Math.max(0, Math.min(canvas.height - 1, Math.floor((event.clientY - bounds.top) * canvas.height / bounds.height)));
    const before = context.getImageData(0, 0, canvas.width, canvas.height);
    const after = new ImageData(new Uint8ClampedArray(before.data), before.width, before.height);
    const changed = floodFill(after, x, y, eraserMode ? { id: 'eraser', name: 'Gomme', effect: 'solid', colors: ['#ffffff'] } : paint);
    if (!changed) return;

    const history = histories.current[drawing.id] ?? [];
    histories.current[drawing.id] = [...history.slice(-19), before];
    context.putImageData(after, 0, 0);
    savedDrawings.current[drawing.id] = after;
    setCanUndo(true);
    setPaintActions((items) => ({ ...items, [drawing.id]: Math.max(0, (items[drawing.id] ?? 0) + (eraserMode ? -1 : 1)) }));
    setSparkle((value) => value + 1);
    playSfx(eraserMode ? 'erase' : paint.effect === 'solid' ? 'paint' : 'sparkle');
  };

  const undo = () => {
    const canvas = canvasRef.current;
    const history = histories.current[drawing.id] ?? [];
    const previous = history[history.length - 1];
    if (!canvas || !previous) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.putImageData(previous, 0, 0);
    savedDrawings.current[drawing.id] = previous;
    histories.current[drawing.id] = history.slice(0, -1);
    setCanUndo(history.length > 1);
    setPaintActions((items) => ({ ...items, [drawing.id]: Math.max(0, (items[drawing.id] ?? 0) - 1) }));
    playSfx('erase');
  };

  const resetDrawing = () => {
    delete savedDrawings.current[drawing.id];
    histories.current[drawing.id] = [];
    setPaintActions((items) => ({ ...items, [drawing.id]: 0 }));
    setCanUndo(false);
    setReloadKey((value) => value + 1);
    playSfx('erase');
  };

  const chooseDrawing = (index: number) => {
    setDrawingIndex(index);
    setEraserMode(false);
    setCanUndo(Boolean(histories.current[DRAWINGS[index].id]?.length));
    playSfx('select');
  };

  return (
    <main className="coloring-page" onPointerDownCapture={startAudio}>
      <header className="coloring-header">
        <button className="back-button coloring-back" onClick={onBack}><ChevronLeft /><span>Les jeux</span></button>
        <div><p>L’ATELIER ENCHANTÉ</p><h1>Les coloriages de Lola</h1></div>
        <div className="coloring-header-actions"><span className="coloring-progress"><Sparkles /><strong>{paintActions[drawing.id] ?? 0}</strong></span><button className="game-sound-toggle light" onClick={toggleSound} aria-label={soundOn ? 'Couper la musique et les bruitages' : 'Activer la musique et les bruitages'}>{soundOn ? <Volume2 /> : <VolumeX />}</button></div>
      </header>

      <section className="coloring-workshop">
        <aside className="drawing-picker" aria-label="Choisir un dessin">
          <div className="picker-heading"><Palette /><span>10 nouveaux dessins</span></div>
          <div className="drawing-list">
            {DRAWINGS.map((item, index) => (
              <button key={item.id} className={index === drawingIndex ? 'selected' : ''} onClick={() => chooseDrawing(index)} aria-pressed={index === drawingIndex} aria-label={`Choisir le dessin ${item.title}`}>
                {/* oxlint-disable-next-line next/no-img-element -- Optimized project-local coloring thumbnail in a Vite app. */}
                <span><img src={item.image} alt="" /></span>
                <span><strong>{index + 1}. {item.title}</strong><small>{item.subtitle}</small></span>
              </button>
            ))}
          </div>
        </aside>

        <section className="coloring-canvas-panel">
          <div className="canvas-heading">
            <div><span>Dessin {drawingIndex + 1} sur 10</span><h2>{drawing.title}</h2></div>
            <div className="canvas-actions">
              <Button variant="outline" onClick={undo} disabled={!canUndo}><Undo2 /> Annuler</Button>
              <Button variant="outline" onClick={resetDrawing}><RotateCcw /> Effacer</Button>
            </div>
          </div>

          <div className="magic-canvas">
            <canvas ref={canvasRef} width="1000" height="720" onPointerDown={paintAt} aria-label={`Coloriage interactif : ${drawing.title}`} />
            <div className="sparkle-burst" key={sparkle} aria-hidden="true">
              {sparkleDots.map((dot, index) => <i key={index} style={{ '--x': `${Math.cos(dot.angle) * dot.distance}px`, '--y': `${Math.sin(dot.angle) * dot.distance}px`, '--delay': `${index * 12}ms` } as React.CSSProperties}>✦</i>)}
            </div>
          </div>

          <div className="palette-board" aria-label="Palette de couleurs">
            <div className="palette-label"><Palette /><span>Choisis une couleur</span></div>
            <div className="color-swatches">
              {COLORS.map((color) => (
                <button key={color.id} className={selectedPaint === color.id && !eraserMode ? 'selected' : ''} style={{ '--swatch': color.colors[0] } as React.CSSProperties} onClick={() => selectColor(color.id)} aria-label={color.name} aria-pressed={selectedPaint === color.id && !eraserMode}>
                  <span />
                </button>
              ))}
            </div>
            <div className="magic-swatches" aria-label="Couleurs magiques">
              {MAGIC_PAINTS.map((special) => (
                <button key={special.id} className={`magic-swatch ${special.effect} ${selectedPaint === special.id && !eraserMode ? 'selected' : ''}`} style={{ '--magic-1': special.colors[0], '--magic-2': special.colors[1], '--magic-3': special.colors[2] } as React.CSSProperties} onClick={() => selectColor(special.id)} aria-label={special.name} aria-pressed={selectedPaint === special.id && !eraserMode} title={special.name}>
                  <span /><small>{special.effect === 'glitter' ? '✦' : special.effect === 'rainbow' ? '🌈' : '◌'}</small>
                </button>
              ))}
            </div>
            <button className={`eraser-hint ${eraserMode ? 'selected' : ''}`} onClick={() => setEraserMode((active) => !active)} aria-pressed={eraserMode}><Eraser /> Gomme</button>
          </div>
          <p className="coloring-help">{eraserMode ? 'Gomme activée : touche une zone pour retirer sa couleur.' : `${paint.name} sélectionné · touche une zone fermée, la couleur reste dans les contours.`}</p>
        </section>
      </section>
    </main>
  );
}
