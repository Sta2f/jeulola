import { useMemo, useState } from 'react';
import { ChevronLeft, Eraser, Palette, RotateCcw, Sparkles, Undo2 } from 'lucide-react';
import { Button } from '../components/ui/button';

type Zone = { id: string; label: string; d: string };
type Drawing = {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  sky: string;
  ground: string;
  zones: Zone[];
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
  {
    id: 'castle', title: 'Le château arc-en-ciel', subtitle: 'Tours, fanions et jardin royal', emoji: '🏰', sky: '#c9efff', ground: '#b7e99f',
    zones: [
      { id: 'tower-left', label: 'Tour de gauche', d: 'M116 408V218H226V408Z' },
      { id: 'tower-right', label: 'Tour de droite', d: 'M494 408V218H604V408Z' },
      { id: 'castle-center', label: 'Grand château', d: 'M220 408V170H500V408Z' },
      { id: 'roof-left', label: 'Toit de gauche', d: 'M96 218L171 118L246 218Z' },
      { id: 'roof-center', label: 'Grand toit', d: 'M200 170L360 65L520 170Z' },
      { id: 'roof-right', label: 'Toit de droite', d: 'M474 218L549 118L624 218Z' },
      { id: 'door', label: 'Porte royale', d: 'M316 408V310C316 255 404 255 404 310V408Z' },
      { id: 'windows', label: 'Fenêtres', d: 'M145 270H195V330H145ZM525 270H575V330H525ZM330 205H390V268H330Z' },
    ],
  },
  {
    id: 'unicorn', title: 'La licorne des nuages', subtitle: 'Une amie magique sous les étoiles', emoji: '🦄', sky: '#e6d8ff', ground: '#c8ecdb',
    zones: [
      { id: 'body', label: 'Corps de la licorne', d: 'M205 340C175 275 235 217 340 225C453 232 512 286 478 357C451 414 285 411 205 340Z' },
      { id: 'neck', label: 'Cou et tête', d: 'M400 278C412 205 427 145 492 130C559 114 594 169 557 212C530 244 493 232 476 270Z' },
      { id: 'mane', label: 'Crinière', d: 'M398 281C372 242 383 167 430 130C438 169 466 178 482 208C447 217 444 270 454 300Z' },
      { id: 'tail', label: 'Queue', d: 'M207 281C137 230 91 272 126 312C72 340 109 398 202 357C175 333 179 307 207 281Z' },
      { id: 'wing', label: 'Aile', d: 'M310 252C267 174 359 151 405 225C367 209 348 228 355 276Z' },
      { id: 'horn', label: 'Corne', d: 'M492 132L522 55L539 143Z' },
      { id: 'hooves', label: 'Sabots', d: 'M238 376H278V443H227ZM411 380H451L468 443H421Z' },
    ],
  },
  {
    id: 'mushroom', title: 'La maison champignon', subtitle: 'Une maisonnette au cœur des fleurs', emoji: '🍄', sky: '#c8f2ef', ground: '#9fdb87',
    zones: [
      { id: 'cap', label: 'Chapeau du champignon', d: 'M128 245C137 92 270 52 360 60C469 53 585 116 594 245Z' },
      { id: 'house', label: 'Maison', d: 'M225 236C214 288 209 380 233 440H487C511 376 505 290 495 236Z' },
      { id: 'door', label: 'Porte', d: 'M315 440V342C315 292 405 292 405 342V440Z' },
      { id: 'windows', label: 'Fenêtres', d: 'M250 283C250 244 312 244 312 283V325H250ZM408 283C408 244 470 244 470 283V325H408Z' },
      { id: 'spots', label: 'Pois du chapeau', d: 'M208 172A31 31 0 1 0 209 172ZM328 114A38 38 0 1 0 329 114ZM464 161A34 34 0 1 0 465 161Z' },
      { id: 'flowers', label: 'Fleurs du jardin', d: 'M126 382C88 335 55 394 96 412C58 448 122 477 143 431C177 469 215 413 165 392C185 351 135 344 126 382ZM579 374C544 333 510 385 547 406C511 435 562 474 591 433C620 469 666 421 620 395C643 356 589 342 579 374Z' },
    ],
  },
  {
    id: 'fairy', title: 'La fée des fleurs', subtitle: 'Sa baguette réveille le jardin', emoji: '🧚', sky: '#ffe0f1', ground: '#bce7a0',
    zones: [
      { id: 'dress', label: 'Robe de la fée', d: 'M319 230C315 302 273 367 221 430H499C446 368 405 302 401 230Z' },
      { id: 'hair', label: 'Cheveux', d: 'M294 178C287 82 427 58 438 165C441 212 411 244 376 229C333 250 291 220 294 178Z' },
      { id: 'face', label: 'Visage', d: 'M322 137C332 94 405 94 416 139C425 178 400 209 369 209C336 209 313 176 322 137Z' },
      { id: 'wing-left', label: 'Aile gauche', d: 'M307 236C211 151 144 224 219 294C151 326 213 399 310 307Z' },
      { id: 'wing-right', label: 'Aile droite', d: 'M413 235C506 150 576 223 501 293C573 324 504 399 411 307Z' },
      { id: 'wand-star', label: 'Étoile magique', d: 'M567 100L583 139L625 141L592 168L603 209L567 186L532 209L542 168L509 141L551 139Z' },
      { id: 'flowers', label: 'Fleurs', d: 'M111 386C76 350 46 398 82 418C49 451 101 478 125 438C153 474 198 432 158 405C179 367 124 350 111 386ZM604 382C570 346 540 394 576 414C542 446 595 475 618 434C648 470 690 427 651 401C670 364 618 347 604 382Z' },
    ],
  },
  {
    id: 'mooncat', title: 'Le chaton sur la lune', subtitle: 'Un rêve doux dans le ciel étoilé', emoji: '🐱', sky: '#d9d8ff', ground: '#8e87cf',
    zones: [
      { id: 'moon', label: 'Lune', d: 'M398 52C232 82 180 290 306 395C379 456 488 428 534 353C402 387 286 284 317 158C327 115 355 78 398 52Z' },
      { id: 'cat-body', label: 'Corps du chaton', d: 'M328 270C282 291 275 374 319 405C359 433 440 408 448 349C457 286 386 244 328 270Z' },
      { id: 'cat-head', label: 'Tête du chaton', d: 'M315 278L295 196L350 224C379 208 408 211 431 226L486 197L464 283C451 331 332 332 315 278Z' },
      { id: 'ears', label: 'Oreilles', d: 'M304 205L316 260L351 225ZM479 206L460 260L431 226Z' },
      { id: 'tail', label: 'Queue', d: 'M432 365C500 309 551 359 516 395C491 421 459 395 438 419C411 450 377 419 398 393Z' },
      { id: 'scarf', label: 'Écharpe', d: 'M318 310C356 328 411 327 451 307L458 340C414 359 356 360 311 341Z' },
      { id: 'stars', label: 'Étoiles', d: 'M124 116L137 145L169 148L145 169L151 201L124 184L96 201L103 169L79 148L111 145ZM585 92L596 118L624 120L603 139L608 166L585 151L561 166L567 139L546 120L574 118Z' },
    ],
  },
  {
    id: 'mermaid', title: 'La sirène du lagon', subtitle: 'Coquillages et trésors sous-marins', emoji: '🧜‍♀️', sky: '#a6eaf0', ground: '#65c9c5',
    zones: [
      { id: 'tail', label: 'Queue de sirène', d: 'M340 270C322 337 346 390 407 420C450 442 443 474 414 489C489 493 538 454 505 410C483 379 421 375 421 305Z' },
      { id: 'fin', label: 'Nageoire', d: 'M412 486C362 447 316 470 331 510C371 521 403 509 424 491C449 519 495 523 531 497C527 458 471 452 412 486Z' },
      { id: 'hair', label: 'Cheveux', d: 'M273 171C277 72 424 63 446 157C459 214 422 267 365 251C311 278 256 235 273 171Z' },
      { id: 'face', label: 'Visage', d: 'M306 132C331 95 400 101 415 144C430 189 399 225 363 224C325 223 283 181 306 132Z' },
      { id: 'top', label: 'Haut coquillage', d: 'M302 247C329 221 355 227 363 263C371 227 401 219 429 246L416 302H311Z' },
      { id: 'shell', label: 'Grand coquillage', d: 'M119 365C143 286 241 287 262 365C230 350 215 376 190 365C166 377 146 349 119 365Z' },
      { id: 'fish', label: 'Poissons', d: 'M545 188C585 145 638 168 647 203C630 241 578 249 545 211L502 239V162ZM129 218C95 184 54 201 48 231C60 264 101 269 129 239L164 263V194Z' },
    ],
  },
  {
    id: 'dragon', title: 'Le petit dragon', subtitle: 'Un gardien gentil dans la montagne', emoji: '🐉', sky: '#f8d8bc', ground: '#b5d28e',
    zones: [
      { id: 'body', label: 'Corps du dragon', d: 'M221 322C209 218 334 171 424 215C508 256 522 389 431 429C335 471 234 416 221 322Z' },
      { id: 'head', label: 'Tête du dragon', d: 'M394 205C385 129 449 91 517 116C581 140 591 228 533 260C479 291 402 264 394 205Z' },
      { id: 'belly', label: 'Ventre', d: 'M323 245C375 234 432 276 439 344C445 397 407 432 365 429C321 425 298 371 305 319C309 286 316 264 323 245Z' },
      { id: 'wing', label: 'Aile', d: 'M315 236C222 98 121 151 174 257C118 238 92 286 153 331C218 371 276 314 315 236Z' },
      { id: 'tail', label: 'Queue', d: 'M236 337C173 344 119 376 93 431C141 405 192 407 235 430C285 456 319 419 297 385Z' },
      { id: 'horns', label: 'Cornes', d: 'M424 136L416 65L471 116ZM518 120L560 67L551 151Z' },
      { id: 'egg', label: 'Œuf magique', d: 'M569 425C564 350 641 314 671 389C698 456 642 484 603 470C581 463 570 447 569 425Z' },
    ],
  },
  {
    id: 'carriage', title: 'Le carrosse étoilé', subtitle: 'En route pour le grand bal', emoji: '🎠', sky: '#fbdaf2', ground: '#dec6ed',
    zones: [
      { id: 'carriage', label: 'Carrosse', d: 'M178 218C227 123 491 122 542 218L521 364H198Z' },
      { id: 'roof', label: 'Toit', d: 'M220 212C254 98 466 97 502 212Z' },
      { id: 'door', label: 'Porte', d: 'M306 190C306 148 414 148 414 190V352H306Z' },
      { id: 'curtains', label: 'Rideaux', d: 'M321 187C339 160 360 169 360 218C360 169 385 159 403 187V255C380 235 340 235 321 255Z' },
      { id: 'wheels', label: 'Roues', d: 'M176 379A68 68 0 1 0 312 379A68 68 0 1 0 176 379ZM411 379A68 68 0 1 0 547 379A68 68 0 1 0 411 379Z' },
      { id: 'crown', label: 'Couronne', d: 'M317 114L336 73L361 106L386 73L406 114L397 139H326Z' },
      { id: 'stars', label: 'Étoiles', d: 'M97 114L110 143L142 146L118 167L124 199L97 182L69 199L76 167L52 146L84 143ZM614 106L627 135L659 138L635 159L641 191L614 174L586 191L593 159L569 138L601 135Z' },
    ],
  },
  {
    id: 'butterfly', title: 'Le papillon enchanté', subtitle: 'Des ailes merveilleuses dans les fleurs', emoji: '🦋', sky: '#dff6ce', ground: '#99db83',
    zones: [
      { id: 'wing-top-left', label: 'Aile haute gauche', d: 'M346 247C292 83 101 73 119 207C130 290 235 319 346 282Z' },
      { id: 'wing-top-right', label: 'Aile haute droite', d: 'M374 247C429 83 619 73 601 207C590 290 485 319 374 282Z' },
      { id: 'wing-low-left', label: 'Aile basse gauche', d: 'M345 286C242 281 160 331 188 423C222 494 326 428 354 336Z' },
      { id: 'wing-low-right', label: 'Aile basse droite', d: 'M375 286C478 281 560 331 532 423C498 494 394 428 366 336Z' },
      { id: 'body', label: 'Corps du papillon', d: 'M337 186C337 151 383 151 383 186L376 404C373 441 347 441 344 404Z' },
      { id: 'wing-spots', label: 'Pois des ailes', d: 'M205 180A34 34 0 1 0 206 180ZM514 180A34 34 0 1 0 515 180ZM260 370A28 28 0 1 0 261 370ZM459 370A28 28 0 1 0 460 370Z' },
      { id: 'flowers', label: 'Fleurs du pré', d: 'M85 421C54 390 27 431 58 448C29 476 75 500 96 465C120 496 159 459 125 436C143 404 96 390 85 421ZM630 414C599 383 572 424 603 441C574 469 620 493 641 458C665 489 704 452 670 429C688 397 641 383 630 414Z' },
    ],
  },
  {
    id: 'candy', title: 'Le royaume des bonbons', subtitle: 'Un palais sucré au bout du chemin', emoji: '🍭', sky: '#d9efff', ground: '#ffd4de',
    zones: [
      { id: 'castle', label: 'Palais en sucre', d: 'M190 416V216H530V416Z' },
      { id: 'tower-left', label: 'Tour gauche', d: 'M112 416V248H218V416Z' },
      { id: 'tower-right', label: 'Tour droite', d: 'M502 416V248H608V416Z' },
      { id: 'icing', label: 'Glaçage', d: 'M177 225C205 184 237 223 265 194C293 226 326 186 355 216C382 182 416 226 448 195C476 225 505 190 542 225V266C513 234 484 272 451 239C421 273 389 233 357 263C325 232 291 272 262 239C234 270 202 235 177 266Z' },
      { id: 'roofs', label: 'Toits bonbons', d: 'M91 248L165 151L239 248ZM481 248L555 151L629 248Z' },
      { id: 'door', label: 'Porte chocolat', d: 'M315 416V322C315 269 405 269 405 322V416Z' },
      { id: 'lollipops', label: 'Sucettes', d: 'M70 303A48 48 0 1 0 71 303ZM650 303A48 48 0 1 0 651 303Z' },
      { id: 'windows', label: 'Fenêtres sucre d’orge', d: 'M229 290H291V350H229ZM429 290H491V350H429Z' },
    ],
  },
];

export function ColoringGame({ onBack }: { onBack: () => void }) {
  const [drawingIndex, setDrawingIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string>(COLORS[0].value);
  const [paint, setPaint] = useState<Record<string, Record<string, string>>>({});
  const [history, setHistory] = useState<Array<{ drawingId: string; zoneId: string; previous?: string }>>([]);
  const [sparkle, setSparkle] = useState(0);
  const [paintedZone, setPaintedZone] = useState('');
  const drawing = DRAWINGS[drawingIndex];
  const currentPaint = paint[drawing.id] ?? {};
  const paintedCount = Object.keys(currentPaint).length;
  const progress = Math.round((paintedCount / drawing.zones.length) * 100);

  const sparkleDots = useMemo(() => Array.from({ length: 14 }, (_, index) => ({
    angle: (index / 14) * Math.PI * 2,
    distance: 42 + (index % 3) * 13,
  })), []);

  const selectColor = (color: string) => {
    setSelectedColor(color);
    setSparkle((value) => value + 1);
  };

  const colorZone = (zoneId: string) => {
    const previous = currentPaint[zoneId];
    if (previous === selectedColor) return;
    setHistory((items) => [...items, { drawingId: drawing.id, zoneId, previous }]);
    setPaint((drawings) => ({
      ...drawings,
      [drawing.id]: { ...drawings[drawing.id], [zoneId]: selectedColor },
    }));
    setPaintedZone(zoneId);
    setSparkle((value) => value + 1);
    window.setTimeout(() => setPaintedZone(''), 420);
  };

  const eraseZone = (zoneId: string) => {
    const previous = currentPaint[zoneId];
    if (!previous) return;
    setHistory((items) => [...items, { drawingId: drawing.id, zoneId, previous }]);
    setPaint((drawings) => {
      const nextDrawing = { ...drawings[drawing.id] };
      delete nextDrawing[zoneId];
      return { ...drawings, [drawing.id]: nextDrawing };
    });
  };

  const undo = () => {
    const last = history[history.length - 1];
    if (!last) return;
    setPaint((drawings) => {
      const nextDrawing = { ...drawings[last.drawingId] };
      if (last.previous) nextDrawing[last.zoneId] = last.previous;
      else delete nextDrawing[last.zoneId];
      return { ...drawings, [last.drawingId]: nextDrawing };
    });
    setHistory((items) => items.slice(0, -1));
  };

  const resetDrawing = () => {
    setPaint((drawings) => ({ ...drawings, [drawing.id]: {} }));
    setHistory((items) => items.filter((item) => item.drawingId !== drawing.id));
  };

  return (
    <main className="coloring-page">
      <header className="coloring-header">
        <button className="back-button coloring-back" onClick={onBack}><ChevronLeft /><span>Les jeux</span></button>
        <div><p>L’ATELIER ENCHANTÉ</p><h1>Les coloriages de Lola</h1></div>
        <span className="coloring-progress"><Sparkles /><strong>{progress}%</strong></span>
      </header>

      <section className="coloring-workshop">
        <aside className="drawing-picker" aria-label="Choisir un dessin">
          <div className="picker-heading"><Palette /><span>10 dessins</span></div>
          <div className="drawing-list">
            {DRAWINGS.map((item, index) => (
              <button key={item.id} className={index === drawingIndex ? 'selected' : ''} onClick={() => setDrawingIndex(index)} aria-pressed={index === drawingIndex}>
                <span>{item.emoji}</span><span><strong>{index + 1}. {item.title}</strong><small>{item.subtitle}</small></span>
              </button>
            ))}
          </div>
        </aside>

        <section className="coloring-canvas-panel">
          <div className="canvas-heading">
            <div><span>Dessin {drawingIndex + 1} sur 10</span><h2>{drawing.title}</h2></div>
            <div className="canvas-actions">
              <Button variant="outline" onClick={undo} disabled={!history.length}><Undo2 /> Annuler</Button>
              <Button variant="outline" onClick={resetDrawing}><RotateCcw /> Effacer</Button>
            </div>
          </div>

          <div className="magic-canvas">
            <svg viewBox="0 0 720 520" aria-label={`Coloriage : ${drawing.title}`}>
              <defs>
                <linearGradient id="paper-sky" x1="0" y1="0" x2="0" y2="1"><stop stopColor={drawing.sky} /><stop offset="1" stopColor="#fffaf2" /></linearGradient>
                <filter id="zone-glow"><feGaussianBlur stdDeviation="7" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
              </defs>
              <rect width="720" height="520" rx="28" fill="url(#paper-sky)" />
              <path d="M0 409C112 373 205 435 315 402C425 369 526 428 720 383V520H0Z" fill={drawing.ground} opacity=".72" />
              <g className="page-decor" aria-hidden="true">
                <path d="M57 81L64 98L82 100L68 112L72 130L57 120L41 130L45 112L31 100L49 98ZM656 66L664 86L685 88L669 102L674 122L656 111L638 122L643 102L627 88L648 86Z" />
                <circle cx="102" cy="178" r="8" /><circle cx="626" cy="185" r="6" /><circle cx="594" cy="52" r="4" />
              </g>
              <g className="color-zones">
                {drawing.zones.map((zone) => (
                  <path
                    key={zone.id}
                    className={paintedZone === zone.id ? 'just-painted' : ''}
                    d={zone.d}
                    fill={currentPaint[zone.id] ?? '#fffdf6'}
                    fillRule="evenodd"
                    stroke="#513b5d"
                    strokeWidth="5"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                    tabIndex={0}
                    aria-label={`${zone.label}, ${currentPaint[zone.id] ? 'colorié' : 'à colorier'}`}
                    onClick={() => colorZone(zone.id)}
                    onDoubleClick={() => eraseZone(zone.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        colorZone(zone.id);
                      }
                    }}
                  />
                ))}
              </g>
            </svg>
            <div className="sparkle-burst" key={sparkle} aria-hidden="true">
              {sparkleDots.map((dot, index) => <i key={index} style={{ '--x': `${Math.cos(dot.angle) * dot.distance}px`, '--y': `${Math.sin(dot.angle) * dot.distance}px`, '--delay': `${index * 12}ms` } as React.CSSProperties}>✦</i>)}
            </div>
            {progress === 100 && <div className="coloring-complete"><Sparkles /><strong>Magnifique !</strong><span>Ton dessin est terminé</span></div>}
          </div>

          <div className="palette-board" aria-label="Palette de couleurs">
            <div className="palette-label"><Palette /><span>Choisis une couleur</span></div>
            <div className="color-swatches">
              {COLORS.map((color) => (
                <button key={color.value} className={selectedColor === color.value ? 'selected' : ''} style={{ '--swatch': color.value } as React.CSSProperties} onClick={() => selectColor(color.value)} aria-label={color.name} aria-pressed={selectedColor === color.value}>
                  <span />
                </button>
              ))}
            </div>
            <button className="eraser-hint" onClick={() => {
              const lastZone = [...drawing.zones].reverse().find((zone) => currentPaint[zone.id]);
              if (lastZone) eraseZone(lastZone.id);
            }}><Eraser /> Gomme</button>
          </div>
          <p className="coloring-help">Choisis une couleur puis touche une zone. Double-clique une zone pour l’effacer.</p>
        </section>
      </section>
    </main>
  );
}
