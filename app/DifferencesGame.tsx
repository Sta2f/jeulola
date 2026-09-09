import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { Check, ChevronLeft, ChevronRight, Lightbulb, RotateCcw, Search, X, ZoomIn } from 'lucide-react';
import { differenceLevels, type Difference, type DifferenceLevel } from './differenceLevels';
import { readSaved, saveValue } from './preferences';
import { useAchievements } from './useAchievements';
import { useGameAudio } from './useGameAudio';
import { preloadRecording, useRecordedAudio } from './useRecordedAudio';

const asset = (scene: string, side: 'a' | 'b') => `/assets/differences/${scene}-${side}.webp`;
const correctSound = '/assets/differences/found.mp3';
const wrongSound = '/assets/differences/miss.mp3';
function savedLevel() {
  const value = readSaved<number>('differences:level', 0);
  return Number.isInteger(value) && value >= 0 && value < differenceLevels.length ? value : 0;
}
function savedFound(level: DifferenceLevel) {
  const value = readSaved<unknown>(`differences:${level.scene}`, []);
  return Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === 'string' && level.differences.some(d => d.id === id)))] : [];
}

export function DifferencesGame({ onBack }: { onBack: () => void }) {
  const [level, setLevel] = useState(savedLevel);
  const { startAudio } = useGameAudio('differences');
  useEffect(() => { startAudio(); }, [startAudio]);
  const choose = (next: number) => { setLevel(next); saveValue('differences:level', next); };
  return <main className="differences-page">
    <header className="differences-header"><button onClick={onBack}><ChevronLeft /><span>Les jeux</span></button><h1><Search /> Les 7 différences</h1><label>Niveau <select aria-label="Choisir le niveau" value={level} onChange={e => choose(Number(e.target.value))}>{differenceLevels.map((l, i) => <option key={l.scene} value={i}>{i + 1} · {l.title}</option>)}</select></label></header>
    <DifferenceRound key={level} index={level} onNext={() => choose((level + 1) % differenceLevels.length)} />
  </main>;
}

function DifferenceRound({ index, onNext }: { index: number; onNext: () => void }) {
  const level = differenceLevels[index];
  const [found, setFound] = useState(() => savedFound(level));
  const foundRef = useRef(found);
  const [message, setMessage] = useState('Touche une différence sur l’un des deux dessins.');
  const [hint, setHint] = useState<string | null>(null);
  const [zoom, setZoom] = useState<'a' | 'b' | null>(null);
  const [miss, setMiss] = useState<{ x: number; y: number } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const missTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dialog = useRef<HTMLDialogElement>(null);
  const { playRecording, stopRecording } = useRecordedAudio();
  const won = found.length === 7;
  const completed = useAchievements('differences', index, won);
  useEffect(() => {
    let cancelled = false;
    Promise.all(['a', 'b'].map(side => {
      const image = new Image(); image.src = asset(level.scene, side as 'a' | 'b'); return image.decode();
    })).then(() => { if (!cancelled) setLoaded(true); }).catch(() => { if (!cancelled) setFailed(true); });
    for (const src of [correctSound, wrongSound]) void preloadRecording(src).catch(() => undefined);
    return () => { cancelled = true; clearTimeout(hintTimer.current); clearTimeout(missTimer.current); };
  }, [level.scene, retry]);
  useEffect(() => {
    if (zoom && !dialog.current?.open) dialog.current?.showModal();
    if (!zoom && dialog.current?.open) dialog.current.close();
  }, [zoom]);
  const select = (x: number, y: number, width: number) => {
    if (!loaded || foundRef.current.length === 7) return;
    // Finger tolerance stays the same in physical pixels in the overview and zoom.
    const pad = Math.min(2.4, 10 / width * 100);
    const hit = level.differences.find(d => x >= d.x - pad && x <= d.x + d.w + pad && y >= d.y - pad && y <= d.y + d.h + pad);
    if (!hit) {
      setMessage('Pas de différence ici. Observe encore, tu peux y arriver !');
      setMiss({ x, y }); clearTimeout(missTimer.current); missTimer.current = setTimeout(() => setMiss(null), 650);
      void playRecording(wrongSound); return;
    }
    if (foundRef.current.includes(hit.id)) { setMessage('Tu as déjà trouvé celle-ci !'); return; }
    const next = [...foundRef.current, hit.id]; foundRef.current = next; setFound(next);
    saveValue(`differences:${level.scene}`, next); setHint(null); setMiss(null);
    setMessage(next.length === 7 ? 'Bravo Lola ! Tu as trouvé les 7 différences !' : `${hit.label} : bien vu ! Encore ${7 - next.length}.`);
    void playRecording(correctSound);
  };
  const showHint = () => {
    const next = level.differences.find(d => !found.includes(d.id)); if (!next) return;
    setHint(next.id); setMessage('Regarde dans le cercle doré…');
    clearTimeout(hintTimer.current); hintTimer.current = setTimeout(() => setHint(null), 3500);
  };
  const restart = () => {
    foundRef.current = []; setFound([]); saveValue(`differences:${level.scene}`, []);
    setHint(null); setMiss(null); setMessage('C’est reparti ! Trouve les 7 différences.'); stopRecording();
  };
  return <>
    <section className="differences-summary"><div><small>LOLA, ÉCLAIR ET BETTY · {index + 1} / 10</small><h2>{level.title}</h2></div><div className="differences-progress" aria-label={`${found.length} différences trouvées sur 7`}><strong>{found.length} / 7</strong><span aria-hidden="true">{Array.from({ length: 7 }, (_, i) => <i key={i} data-found={i < found.length}>{i < found.length ? <Check /> : '·'}</i>)}</span></div></section>
    <div className="differences-comparison">
      {loaded ? (['a', 'b'] as const).map(side => <section className="differences-drawing" key={side} aria-label={`Dessin ${side.toUpperCase()}`}>
        <DifferenceDrawing level={level} side={side} found={found} hint={hint} miss={miss} onSelect={select} />
        <button className="differences-zoom" aria-label={`Agrandir le dessin ${side.toUpperCase()}`} onClick={() => setZoom(side)}><ZoomIn /><span>{side.toUpperCase()}</span></button>
      </section>) : <div className="differences-loading" aria-live="polite">{failed ? <><p>Le dessin n’a pas pu charger.</p><button onClick={() => { setFailed(false); setRetry(n => n + 1); }}>Réessayer</button></> : 'Les dessins arrivent…'}</div>}
    </div>
    <footer className="differences-footer"><output aria-live="polite">{won ? 'Bravo Lola ! Les 7 différences sont trouvées !' : message}</output><div><span className="differences-wins">★ {completed.length} / 10</span><button onClick={restart} aria-label="Recommencer ce niveau"><RotateCcw /></button>{won ? <button className="differences-next" onClick={onNext}>{index === 9 ? 'Revenir au premier' : 'Niveau suivant'}<ChevronRight /></button> : <button disabled={!loaded} onClick={showHint}><Lightbulb /> Indice</button>}</div></footer>
    <dialog ref={dialog} className="differences-dialog" onCancel={() => setZoom(null)} onClose={() => setZoom(null)}>
      <header><fieldset aria-label="Comparer les dessins agrandis">{(['a', 'b'] as const).map(side => <button key={side} aria-pressed={zoom === side} onClick={() => setZoom(side)}>Dessin {side.toUpperCase()}</button>)}</fieldset><strong>{found.length} / 7</strong><button aria-label="Fermer le grand dessin" onClick={() => setZoom(null)}><X /></button></header>
      <div className="differences-zoom-stage">{zoom && <DifferenceDrawing level={level} side={zoom} found={found} hint={hint} miss={miss} onSelect={select} />}</div>
      <p aria-live="polite">{won ? 'Les 7 différences sont trouvées !' : 'Passe de A à B pour comparer, puis touche la différence.'}</p>
    </dialog>
  </>;
}

function DifferenceDrawing({ level, side, found, hint, miss, onSelect }: {
  level: DifferenceLevel; side: 'a' | 'b'; found: string[]; hint: string | null; miss: {x: number; y: number} | null;
  onSelect: (x: number, y: number, width: number) => void;
}) {
  const clip = useId();
  const [cursor, setCursor] = useState({ x: 50, y: 50 });
  const [keyboard, setKeyboard] = useState(false);
  const press = useRef<{x: number; y: number; id: number} | null>(null);
  const point = (e: PointerEvent<SVGSVGElement>) => {
    const down = press.current; press.current = null;
    if (!down || down.id !== e.pointerId || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 12) return;
    const r = e.currentTarget.getBoundingClientRect();
    onSelect((e.clientX - r.left) / r.width * 100, (e.clientY - r.top) / r.height * 100, r.width);
  };
  const key = (e: KeyboardEvent<SVGSVGElement>) => {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' '].includes(e.key)) return;
    e.preventDefault(); setKeyboard(true);
    if (e.key === 'Enter' || e.key === ' ') onSelect(cursor.x, cursor.y, e.currentTarget.getBoundingClientRect().width);
    else setCursor(c => ({x: Math.max(0, Math.min(100, c.x + (e.key === 'ArrowLeft' ? -2 : e.key === 'ArrowRight' ? 2 : 0))), y: Math.max(0, Math.min(100, c.y + (e.key === 'ArrowUp' ? -2 : e.key === 'ArrowDown' ? 2 : 0)))}));
  };
  const ring = (d: Difference, isHint: boolean) => <g key={d.id} className={isHint ? 'difference-hint' : 'difference-found'}><rect x={d.x - .5} y={d.y - .5} width={d.w + 1} height={d.h + 1} rx="2" /><text x={d.x + d.w} y={d.y + 1.4}>{isHint ? '?' : '✓'}</text></g>;
  // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- Spatial SVG control: arrows move a visible cursor; Enter selects its coordinates.
  return <svg className="difference-art" viewBox="0 0 100 100" role="button" tabIndex={0} aria-label={`${level.title}, dessin ${side.toUpperCase()}. Touche une différence. Au clavier : flèches pour déplacer le viseur, Entrée pour choisir.`} onKeyDown={key} onBlur={() => setKeyboard(false)} onPointerDown={e => { if (e.isPrimary && e.button === 0) { press.current = {x: e.clientX, y: e.clientY, id: e.pointerId}; e.currentTarget.setPointerCapture(e.pointerId); setKeyboard(false); } }} onPointerUp={point} onPointerCancel={() => { press.current = null; }}>
    <defs><clipPath id={clip}>{level.differences.map(d => <rect key={d.id} x={d.x} y={d.y} width={d.w} height={d.h} />)}</clipPath></defs>
    <image href={asset(level.scene, 'a')} width="100" height="100" />
    {/* Only the seven authored regions can change: incidental AI variation elsewhere is excluded. */}
    {side === 'b' && <image href={asset(level.scene, 'b')} width="100" height="100" clipPath={`url(#${clip})`} />}
    {level.differences.filter(d => found.includes(d.id)).map(d => ring(d, false))}
    {level.differences.filter(d => d.id === hint && !found.includes(d.id)).map(d => ring(d, true))}
    {miss && <g className="difference-miss" transform={`translate(${miss.x} ${miss.y})`}><circle r="2.5" /><path d="M-1 -1L1 1M1 -1L-1 1" /></g>}
    {keyboard && <g className="difference-cursor" transform={`translate(${cursor.x} ${cursor.y})`}><circle r="2"/><path d="M-3 0H3M0 -3V3"/></g>}
  </svg>;
}
