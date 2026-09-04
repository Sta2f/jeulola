import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Eraser, Palette, RotateCcw, Sparkles, Undo2 } from 'lucide-react';
import { Button } from '../components/ui/button';

type Drawing = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
};

const COLORS = [
  { name: 'Rose bonbon', value: '#ff6fae' },
  { name: 'Framboise', value: '#e83e73' },
  { name: 'Corail', value: '#ff7b67' },
  { name: 'Orange', value: '#ffad42' },
  { name: 'Soleil', value: '#ffd84d' },
  { name: 'Menthe', value: '#70db9b' },
  { name: 'Turquoise', value: '#50d8dc' },
  { name: 'Ciel', value: '#69bfff' },
  { name: 'Lavande', value: '#ad83f4' },
  { name: 'Violet', value: '#7b52d8' },
  { name: 'Chocolat', value: '#9b6246' },
  { name: 'Blanc nacré', value: '#fffaf0' },
] as const;

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

function floodFill(imageData: ImageData, startX: number, startY: number, color: readonly number[]) {
  const { data, width, height } = imageData;
  const startPixel = startY * width + startX;
  const startIndex = startPixel * 4;
  const target = [data[startIndex], data[startIndex + 1], data[startIndex + 2], data[startIndex + 3]];
  const brightness = (target[0] + target[1] + target[2]) / 3;
  if (brightness < 90 || target.every((channel, index) => Math.abs(channel - color[index]) < 8)) return false;

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
    data[index] = color[0];
    data[index + 1] = color[1];
    data[index + 2] = color[2];
    data[index + 3] = color[3];
    paintedPixels += 1;
    const x = pixel % width;
    if (x > 0) addPixel(pixel - 1);
    if (x < width - 1) addPixel(pixel + 1);
    addPixel(pixel - width);
    addPixel(pixel + width);
  }
  return paintedPixels > 4;
}

export function ColoringGame({ onBack }: { onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const savedDrawings = useRef<Record<string, ImageData>>({});
  const histories = useRef<Record<string, ImageData[]>>({});
  const [drawingIndex, setDrawingIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string>(COLORS[0].value);
  const [eraserMode, setEraserMode] = useState(false);
  const [sparkle, setSparkle] = useState(0);
  const [paintActions, setPaintActions] = useState<Record<string, number>>({});
  const [canUndo, setCanUndo] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const drawing = DRAWINGS[drawingIndex];

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

  const selectColor = (color: string) => {
    setSelectedColor(color);
    setEraserMode(false);
    setSparkle((value) => value + 1);
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
    const changed = floodFill(after, x, y, eraserMode ? [255, 255, 255, 255] : hexToRgb(selectedColor));
    if (!changed) return;

    const history = histories.current[drawing.id] ?? [];
    histories.current[drawing.id] = [...history.slice(-19), before];
    context.putImageData(after, 0, 0);
    savedDrawings.current[drawing.id] = after;
    setCanUndo(true);
    setPaintActions((items) => ({ ...items, [drawing.id]: Math.max(0, (items[drawing.id] ?? 0) + (eraserMode ? -1 : 1)) }));
    setSparkle((value) => value + 1);
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
  };

  const resetDrawing = () => {
    delete savedDrawings.current[drawing.id];
    histories.current[drawing.id] = [];
    setPaintActions((items) => ({ ...items, [drawing.id]: 0 }));
    setCanUndo(false);
    setReloadKey((value) => value + 1);
  };

  const chooseDrawing = (index: number) => {
    setDrawingIndex(index);
    setEraserMode(false);
    setCanUndo(Boolean(histories.current[DRAWINGS[index].id]?.length));
  };

  return (
    <main className="coloring-page">
      <header className="coloring-header">
        <button className="back-button coloring-back" onClick={onBack}><ChevronLeft /><span>Les jeux</span></button>
        <div><p>L’ATELIER ENCHANTÉ</p><h1>Les coloriages de Lola</h1></div>
        <span className="coloring-progress"><Sparkles /><strong>{paintActions[drawing.id] ?? 0}</strong></span>
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
                <button key={color.value} className={selectedColor === color.value && !eraserMode ? 'selected' : ''} style={{ '--swatch': color.value } as React.CSSProperties} onClick={() => selectColor(color.value)} aria-label={color.name} aria-pressed={selectedColor === color.value && !eraserMode}>
                  <span />
                </button>
              ))}
            </div>
            <button className={`eraser-hint ${eraserMode ? 'selected' : ''}`} onClick={() => setEraserMode((active) => !active)} aria-pressed={eraserMode}><Eraser /> Gomme</button>
          </div>
          <p className="coloring-help">{eraserMode ? 'Gomme activée : touche une zone pour retirer sa couleur.' : 'Choisis une couleur puis touche une zone fermée. La couleur reste dans les contours.'}</p>
        </section>
      </section>
    </main>
  );
}
