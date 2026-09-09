import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Download, Eraser, Palette, RotateCcw, Sparkles, Undo2, Volume2, VolumeX } from 'lucide-react';
import { readSaved, saveValue } from './preferences';
import { Button } from '../components/ui/button';
import { useGameAudio } from './useGameAudio';
import { buildRegions } from './coloringRegions';
import { useFittedColoring } from './useFittedColoring';

type Drawing = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
};

type PaintEffect = 'solid' | 'glitter' | 'rainbow' | 'watercolor';
type Paint = { id: string; name: string; effect: PaintEffect; colors: readonly string[] };

const COLORS: Paint[] = [
  { id: 'pink', name: 'Rose dragée', effect: 'solid', colors: ['#ff8fc7'] },
  { id: 'raspberry', name: 'Cerise brillante', effect: 'solid', colors: ['#e62f6f'] },
  { id: 'red', name: 'Rouge coquelicot', effect: 'solid', colors: ['#f04452'] },
  { id: 'peach', name: 'Pêche douce', effect: 'solid', colors: ['#ff9d82'] },
  { id: 'orange', name: 'Mandarine', effect: 'solid', colors: ['#ff922f'] },
  { id: 'gold', name: 'Or solaire', effect: 'solid', colors: ['#f5b82e'] },
  { id: 'sun', name: 'Jaune citron', effect: 'solid', colors: ['#ffe45e'] },
  { id: 'grass', name: 'Vert prairie', effect: 'solid', colors: ['#72c957'] },
  { id: 'emerald', name: 'Émeraude', effect: 'solid', colors: ['#28a97d'] },
  { id: 'turquoise', name: 'Lagon', effect: 'solid', colors: ['#34c9c6'] },
  { id: 'sky', name: 'Bleu ciel', effect: 'solid', colors: ['#63b9f5'] },
  { id: 'night', name: 'Bleu nuit', effect: 'solid', colors: ['#3454a5'] },
  { id: 'lavender', name: 'Lilas', effect: 'solid', colors: ['#b68bea'] },
  { id: 'purple', name: 'Violet royal', effect: 'solid', colors: ['#7744bd'] },
  { id: 'chocolate', name: 'Chocolat', effect: 'solid', colors: ['#87543f'] },
  { id: 'pearl', name: 'Crème nacrée', effect: 'solid', colors: ['#fff2d5'] },
  { id: 'charcoal', name: 'Gris velours', effect: 'solid', colors: ['#53606d'] },
];

const MAGIC_PAINTS: Paint[] = [
  { id: 'fairy-glitter', name: 'Poussière de fée rose et or', effect: 'glitter', colors: ['#f65ca8', '#ffd85f', '#ffe8f5'] },
  { id: 'mermaid-glitter', name: 'Écailles de sirène', effect: 'glitter', colors: ['#28c9c4', '#9d7bf4', '#d9fff8'] },
  { id: 'magic-rainbow', name: 'Aurore arc-en-ciel', effect: 'rainbow', colors: ['#f65586', '#ffb644', '#f4e858', '#47c98a', '#4ba7ec', '#9b62df'] },
  { id: 'berry-watercolor', name: 'Aquarelle fruits rouges', effect: 'watercolor', colors: ['#e83c75', '#ff8ea8', '#f1a1d8'] },
  { id: 'lagoon-watercolor', name: 'Aquarelle lagon', effect: 'watercolor', colors: ['#23b6aa', '#52d8c7', '#4b90dd'] },
  { id: 'galaxy-glitter', name: 'Nuit étoilée', effect: 'glitter', colors: ['#3d3f9d', '#d96fc7', '#7988ea'] },
];

const PAINTS = [...COLORS, ...MAGIC_PAINTS];

const DRAWINGS: Drawing[] = [
  { id: 'winged-bunny', title: 'L’oiseau de la jungle', subtitle: 'Une aventure dans la jungle', image: '/assets/coloring/01-lapin-aile.webp' },
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

function paintColor(effect: PaintEffect, colors: readonly (readonly number[])[], x: number, y: number, width: number, height: number) {
  if (effect === 'solid') return colors[0];
  const u = x / Math.max(1, width - 1);
  const v = y / Math.max(1, height - 1);
  if (effect === 'rainbow') {
    const position = (width >= height ? u : v) * (colors.length - 1);
    const index = Math.min(colors.length - 2, Math.floor(position));
    return mixColors(colors[index], colors[index + 1], position - index);
  }
  if (effect === 'glitter') {
    const grain = noiseAt(x, y);
    if (grain > .987) return [255, 255, 255, 255];
    if (grain > .91) return colors[1];
    return mixColors(colors[0], colors[2], (u * .55 + v * .45) * .42);
  }
  const wave = Math.sin(u * Math.PI * 2) * Math.cos(v * Math.PI * 2);
  const wash = Math.min(1, Math.max(0, u * .6 + v * .4 + wave * .12));
  const position = wash * (colors.length - 1);
  const index = Math.min(colors.length - 2, Math.floor(position));
  const paper = .10 + noiseAt(x, y) * .035;
  return mixColors(colors[index], colors[index + 1], position - index).map((channel, channelIndex) => channelIndex === 3 ? 255 : Math.round(channel * (1 - paper) + 255 * paper));
}

function floodFill(imageData: ImageData, startX: number, startY: number, paint: Paint, regions: Uint32Array) {
  const { data, width, height } = imageData;
  const target = regions[startY * width + startX];
  if (!target) return false;
  const colors = paint.colors.map(hexToRgb);
  // The fixed region map preserves outlines even when repainting an old fill.
  // Normalize effects to this object's bounds, never the whole drawing.
  let minX = width, minY = height, maxX = 0, maxY = 0;
  for (let pixel = 0; pixel < regions.length; pixel++) {
    if (regions[pixel] !== target) continue;
    const x = pixel % width, y = Math.floor(pixel / width);
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  let paintedPixels = 0;
  for (let pixel = 0; pixel < regions.length; pixel++) {
    if (regions[pixel] !== target) continue;
    const index = pixel * 4;
    const x = pixel % width;
    const color = paintColor(paint.effect, colors, x - minX, Math.floor(pixel / width) - minY, maxX - minX + 1, maxY - minY + 1);
    data[index] = color[0];
    data[index + 1] = color[1];
    data[index + 2] = color[2];
    data[index + 3] = color[3];
    paintedPixels += 1;
  }
  return paintedPixels > 4;
}

export function ColoringGame({ onBack }: { onBack: () => void }) {
  const [paletteOpen, setPaletteOpen] = useState(true);
  const fittedPanel = useFittedColoring();
  const { soundOn, startAudio, playSfx, toggleSound } = useGameAudio('coloring');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const savedDrawings = useRef<Record<string, ImageData>>({});
  const regionMaps = useRef<Record<string, Uint32Array>>({});
  const histories = useRef<Record<string, ImageData[]>>({});
  const [drawingIndex, setDrawingIndex] = useState(0);
  const [selectedPaint, setSelectedPaint] = useState(COLORS[0].id);
  const [eraserMode, setEraserMode] = useState(false);
  const [sparkle, setSparkle] = useState(0);
  const [sparklePoint, setSparklePoint] = useState({ x: 50, y: 50 });
  const [paintActions, setPaintActions] = useState<Record<string, number>>({});
  const [canUndo, setCanUndo] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [ready, setReady] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
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
      setReady(true);
      return;
    }

    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (cancelled) return;
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const original = context.getImageData(0, 0, canvas.width, canvas.height);
      regionMaps.current[drawing.id] = buildRegions(original.data, canvas.width, canvas.height);
      const finish = () => {
        if (cancelled) return;
        savedDrawings.current[drawing.id] = context.getImageData(0, 0, canvas.width, canvas.height);
        histories.current[drawing.id] = [];
        setCanUndo(false); setReady(true);
      };
      const savedImage = readSaved<string>(`drawing:${drawing.id}`, '');
      if (!savedImage) { finish(); return; }
      const restoration = new Image();
      restoration.onload = () => { if (!cancelled) { context.drawImage(restoration, 0, 0, canvas.width, canvas.height); finish(); } };
      restoration.onerror = finish;
      restoration.src = savedImage;
    };
    image.onerror = () => { if (!cancelled && image.src !== new URL(drawing.image, location.href).href) image.src = drawing.image; };
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
    if (!canvas || !ready) return;
    event.preventDefault();
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return;
    const bounds = canvas.getBoundingClientRect();
    setSparklePoint({ x: (event.clientX - bounds.left) / bounds.width * 100, y: (event.clientY - bounds.top) / bounds.height * 100 });
    const x = Math.max(0, Math.min(canvas.width - 1, Math.floor((event.clientX - bounds.left) * canvas.width / bounds.width)));
    const y = Math.max(0, Math.min(canvas.height - 1, Math.floor((event.clientY - bounds.top) * canvas.height / bounds.height)));
    const before = context.getImageData(0, 0, canvas.width, canvas.height);
    const after = new ImageData(new Uint8ClampedArray(before.data), before.width, before.height);
    const changed = floodFill(after, x, y, eraserMode ? { id: 'eraser', name: 'Gomme', effect: 'solid', colors: ['#ffffff'] } : paint, regionMaps.current[drawing.id]);
    if (!changed) return;

    const history = histories.current[drawing.id] ?? [];
    histories.current[drawing.id] = [...history.slice(-5), before];
    context.putImageData(after, 0, 0);
    savedDrawings.current[drawing.id] = after;
    saveValue(`drawing:${drawing.id}`, canvas.toDataURL('image/png'));
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
    saveValue(`drawing:${drawing.id}`, canvas.toDataURL('image/png'));
    histories.current[drawing.id] = history.slice(0, -1);
    setCanUndo(history.length > 1);
    setPaintActions((items) => ({ ...items, [drawing.id]: Math.max(0, (items[drawing.id] ?? 0) - 1) }));
    playSfx('erase');
  };

  const resetDrawing = () => {
    if (!confirmClear) { setConfirmClear(true); return; }
    setConfirmClear(false);
    setReady(false);
    saveValue(`drawing:${drawing.id}`, '');
    delete savedDrawings.current[drawing.id];
    histories.current[drawing.id] = [];
    setPaintActions((items) => ({ ...items, [drawing.id]: 0 }));
    setCanUndo(false);
    setReloadKey((value) => value + 1);
    playSfx('erase');
  };

  const chooseDrawing = (index: number) => {
    if (index === drawingIndex) return;
    setReady(false);
    histories.current = {};
    setConfirmClear(false);
    setDrawingIndex(index);
    setEraserMode(false);
    setCanUndo(Boolean(histories.current[DRAWINGS[index].id]?.length));
    playSfx('select');
  };

  return (
    <main className={`coloring-page ${paletteOpen ? '' : 'palette-hidden'}`} onPointerDownCapture={startAudio}>
      <header className="coloring-header">
        <button className="back-button coloring-back" aria-label="Les jeux" onClick={onBack}><ChevronLeft /><span>Les jeux</span></button>
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

        <section className="coloring-canvas-panel" ref={fittedPanel}>
          <div className="canvas-heading">
            <div><span>Dessin {drawingIndex + 1} sur 10</span><h2>{drawing.title}</h2></div>
            <div className="canvas-actions">
              <Button variant="outline" className="palette-toggle" aria-expanded={paletteOpen} onClick={() => setPaletteOpen(value => !value)}><Palette /> Couleurs</Button>
              <Button variant="outline" disabled={!ready} onClick={() => { const link = document.createElement('a'); link.download = `Lola-${drawing.id}.png`; link.href = canvasRef.current!.toDataURL('image/png'); link.click(); playSfx('sparkle'); }}><Download /> Garder</Button>
              <Button variant="outline" onClick={undo} disabled={!canUndo}><Undo2 /> Annuler</Button>
              <Button variant="outline" onClick={resetDrawing}><RotateCcw /> {confirmClear ? 'Tout effacer ?' : 'Effacer'}</Button>
              {confirmClear && <Button variant="outline" onClick={() => setConfirmClear(false)}>Non</Button>}
            </div>
          </div>

          <div className="coloring-art-space"><div className="magic-canvas">
            {!ready && <output className="drawing-loading">Ton dessin arrive…</output>}
            <canvas ref={canvasRef} width="800" height="576" onPointerDown={paintAt} aria-label={`Coloriage interactif : ${drawing.title}`} />
            <div className="sparkle-burst" key={sparkle} style={{ left: `${sparklePoint.x}%`, top: `${sparklePoint.y}%` }} aria-hidden="true">
              {sparkleDots.map((dot, index) => <i key={index} style={{ '--x': `${Math.cos(dot.angle) * dot.distance}px`, '--y': `${Math.sin(dot.angle) * dot.distance}px`, '--delay': `${index * 12}ms` } as React.CSSProperties}>✦</i>)}
            </div>
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
