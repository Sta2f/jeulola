import { recordEducationAnswer } from './educationScore';
/* oxlint-disable next/no-img-element -- Local optimized game sprites in a Vite app. */
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { ArrowLeft, HelpCircle, Play, RotateCcw, Star, Volume2 } from 'lucide-react';
import words from './schoolbagWords.json';
import { HomeEnchantment } from './HomeEnchantment';
import { preloadRecording, useRecordedAudio } from './useRecordedAudio';
import { readSaved, saveValue, useAudioSettings } from './preferences';
import { useGameAudio } from './useGameAudio';

type Phase = 'door' | 'image' | 'word' | 'done';
type Card = { id: string; kind: 'bag' | 'image' | 'word'; text: string; picture: string };
type Point = { x: number; y: number };
type FlyingCard = { card: Card; from: Point; to: Point; width: number; height: number };
const asset = (name: string) => `/assets/schoolbag/${name}`;
const voice = (name: string) => asset(`audio/${words.audioVersion}-${name}.mp3`);
const bag: Card = { id: 'bag', kind: 'bag', text: 'cartable', picture: 'bag.webp' };
const shuffled = () => {
  const ids = words.words.map(word => word.id);
  for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
  return ids;
};
const pointIn = (point: Point, rect: DOMRect) => point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;

function CardFace({ card }: { card: Card }) {
  if (card.kind !== 'word') return <img src={asset(card.picture)} alt="" draggable={false} />;
  return <><span className="bag-print">{card.text}</span><span className="bag-cursive" lang="fr">{card.text}</span></>;
}

export function SchoolbagGame({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<Phase>('door');
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [order, setOrder] = useState(shuffled);
  const [selected, setSelected] = useState<Card | null>(null);
  const [wrong, setWrong] = useState('');
  const [busy, setBusy] = useState(false);
  const [burst, setBurst] = useState(0);
  const [flight, setFlight] = useState<FlyingCard | null>(null);
  const [dragging, setDragging] = useState<(Point & { card: Card }) | null>(null);
  const [trail, setTrail] = useState<(Point & { id: number })[]>([]);
  const [audioError, setAudioError] = useState('');
  const [hidden, setHidden] = useState(() => document.hidden);
  const audioSettings = useAudioSettings();
  const { playRecording, stopRecording } = useRecordedAudio(setAudioError);
  const { startAudio, stopAudio } = useGameAudio('story');
  const target = useRef<HTMLButtonElement>(null);
  const selectedBox = useRef<DOMRect | null>(null);
  const press = useRef<{ card: Card; id: number; start: Point; moved: boolean } | null>(null);
  const lock = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const suppressClick = useRef(false);
  const particleId = useRef(0);
  const lastParticle = useRef(0);
  const current = words.words[index];
  const muted = !audioSettings.enabled || audioSettings.volume === 0;
  const choiceIds = new Set([current.id, ...order.filter(id => id !== current.id).slice(0, 3)]);
  const cards: Card[] = order.filter(id => choiceIds.has(id)).map(id => words.words.find(word => word.id === id)!).map(word => ({ ...word, kind: phase === 'word' ? 'word' : 'image' }));
  const caption = phase === 'door' ? 'Devant la porte' : phase === 'done' ? 'Prêt !' : `${phase === 'image' ? 'L’image' : 'Le mot'}${muted || audioError ? ` : ${current.text}` : ''}`;
  const instruction = phase === 'door' ? words.door : phase === 'done' ? words.finished : phase === 'image' ? current.imagePrompt : current.wordPrompt;
  const instructionKey = (nextPhase: Phase, nextIndex = index) => nextPhase === 'door' || nextPhase === 'done' ? nextPhase === 'door' ? 'door' : 'finished' : `${nextPhase}-${words.words[nextIndex].id}`;
  const later = (callback: () => void, delay: number) => { const id = setTimeout(callback, delay); timers.current.push(id); };
  const speak = (key: string) => { setAudioError(''); void playRecording(voice(key)); };

  useEffect(() => {
    for (const key of ['intro', 'door', 'retry', 'image-plumier', 'word-plumier']) void preloadRecording(voice(key)).catch(() => undefined);
    void document.fonts.load('30px Borel').catch(() => undefined);
    const change = () => { setHidden(document.hidden); if (document.hidden) { press.current = null; setDragging(null); setTrail([]); } };
    document.addEventListener('visibilitychange', change);
    return () => {
      document.removeEventListener('visibilitychange', change);
      // oxlint-disable-next-line react-hooks/exhaustive-deps -- The timer collection only grows; cancel all pending transitions on exit.
      timers.current.forEach(clearTimeout);
    };
  }, []);

  const start = () => { setStarted(true); startAudio(); speak('intro'); };
  const restart = () => {
    timers.current.forEach(clearTimeout); timers.current = []; lock.current = false;
    setPhase('door'); setIndex(0); setOrder(shuffled()); setSelected(null); setBusy(false); setWrong(''); setFlight(null); setTrail([]); setBurst(0);
    startAudio(); speak('door');
  };
  const finishDrop = (card: Card, source?: DOMRect | Point) => {
    if (!started || lock.current || phase === 'done' || !target.current) return;
    const correct = phase === 'door' ? card.kind === 'bag' : card.kind === phase && card.id === current.id;
    setSelected(null); setDragging(null); press.current = null;
    if (phase !== 'door') recordEducationAnswer(correct);
    if (!correct) {
      setWrong(card.id); speak('retry');
      later(() => setWrong(''), 600);
      return;
    }
    lock.current = true; setBusy(true); setWrong(''); stopRecording();
    const destination = target.current.getBoundingClientRect();
    const rect = source ?? selectedBox.current ?? destination;
    const hasSize = rect instanceof DOMRect;
    const from = hasSize ? { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 } : rect;
    setFlight({ card, from, to: { x: destination.x + destination.width / 2, y: destination.y + destination.height * (phase === 'door' ? .5 : .42) }, width: hasSize ? rect.width : 140, height: hasSize ? rect.height : 140 });
    setBurst(value => value + 1);
    later(() => {
      setFlight(null); setBusy(false); lock.current = false; setOrder(shuffled());
      const nextPhase: Phase = phase === 'door' ? 'image' : phase === 'image' ? 'word' : index + 1 === words.words.length ? 'done' : 'image';
      const nextIndex = phase === 'word' && nextPhase !== 'done' ? index + 1 : index;
      setIndex(nextIndex); setPhase(nextPhase);
      if (nextPhase === 'done') { saveValue('schoolbag:completed', Number(readSaved('schoolbag:completed', 0)) + 1); stopAudio(); }
      if (!document.hidden) speak(instructionKey(nextPhase, nextIndex));
    }, 850);
  };
  const down = (event: ReactPointerEvent<HTMLButtonElement>, card: Card) => {
    if (!started || lock.current || !event.isPrimary || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    press.current = { card, id: event.pointerId, start: { x: event.clientX, y: event.clientY }, moved: false };
    selectedBox.current = event.currentTarget.getBoundingClientRect();
  };
  const move = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const active = press.current;
    if (!active || active.id !== event.pointerId) return;
    if (!active.moved && Math.hypot(event.clientX - active.start.x, event.clientY - active.start.y) < 8) return;
    active.moved = true; setSelected(null);
    const point = { x: event.clientX, y: event.clientY };
    setDragging({ ...point, card: active.card });
    if (performance.now() - lastParticle.current > 35) {
      lastParticle.current = performance.now(); const id = ++particleId.current;
      setTrail(previous => [...previous.slice(-15), { ...point, id }]);
    }
  };
  const up = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const active = press.current;
    if (!active || active.id !== event.pointerId) return;
    press.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!active.moved) return;
    suppressClick.current = true; later(() => { suppressClick.current = false; }, 250);
    setDragging(null); later(() => setTrail([]), 600);
    const point = { x: event.clientX, y: event.clientY };
    if (target.current && pointIn(point, target.current.getBoundingClientRect())) finishDrop(active.card, point);
  };
  const cancel = () => { press.current = null; setDragging(null); setTrail([]); };
  const renderCard = (card: Card, className: string) => <button
    key={`${card.kind}-${card.id}`} type="button" className={`${className} ${selected?.id === card.id ? 'is-selected' : ''} ${wrong === card.id ? 'is-wrong' : ''} ${dragging?.card.id === card.id ? 'is-dragging' : ''}`}
    data-card={card.id} data-kind={card.kind} data-press-on-down="true" disabled={!started || busy}
    aria-label={card.kind === 'bag' ? 'Le cartable à déplacer' : `${card.kind === 'word' ? 'Mot' : 'Image'} : ${card.text}`} aria-pressed={selected?.id === card.id}
    onPointerDown={event => down(event, card)} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel} onLostPointerCapture={() => { if (press.current) cancel(); }}
    onClick={event => { if (suppressClick.current && event.detail !== 0) return; if (lock.current) return; selectedBox.current = event.currentTarget.getBoundingClientRect(); setSelected(selected?.id === card.id ? null : card); }}
  ><CardFace card={card} /></button>;

  return <main className="schoolbag-game" data-phase={phase} data-target-word={current.id} data-busy={busy} data-hidden={hidden} style={{ '--magic-power': 1 + .45 * index / Math.max(1, words.words.length - 1) } as CSSProperties}>
    <header className="bag-header"><button aria-label="Les jeux" onClick={() => { stopRecording(); stopAudio(); onBack(); }}><ArrowLeft /></button><h1>Le cartable magique</h1><div><button aria-label="Réécouter les règles" onClick={() => { if (!started) setStarted(true); startAudio(); speak('intro'); }}><HelpCircle /></button><button aria-label="Réécouter la consigne" onClick={() => { if (!started) start(); else speak(instructionKey(phase)); }}><Volume2 /></button></div></header>
    <section className="bag-stage" aria-label="La porte magique">
      <div className="bag-stars" aria-hidden="true">{Array.from({ length: 28 }, (_, i) => <i key={i} style={{ left: `${4 + (i * 31) % 93}%`, top: `${5 + (i * 17) % 83}%`, '--delay': `${-i * .47}s`, '--duration': `${4 + i % 5}s` } as CSSProperties}>✦</i>)}</div>
      <div className="bag-fairy" aria-hidden="true"><HomeEnchantment /></div>
      {started && <div className="bag-command"><span aria-hidden="true">{caption}</span><span className="bag-sr-only" aria-live="polite">{instruction}</span></div>}
      <div className="bag-progress" aria-label={`${phase === 'done' ? words.words.length : index} mots sur ${words.words.length}`}><Star className={phase === 'done' || index > 0 ? 'is-lit' : ''} aria-hidden="true" /><span aria-hidden="true">{phase === 'done' ? words.words.length : index} / {words.words.length}</span></div>
      <div className="bag-portal" aria-hidden="true"><img src={asset('ecole.webp')} alt="" /></div>
      <img className={`bag-eclair ${busy || phase === 'done' ? 'is-happy' : ''}`} src="/assets/eclair-chihuahua-cutout.webp" alt="Éclair" draggable={false} />
      <button ref={target} className={`bag-drop ${selected || dragging ? 'is-waiting' : ''} ${busy ? 'is-catching' : ''}`} aria-label={phase === 'door' ? 'Devant la porte' : 'Dans le cartable'} disabled={!started || busy || phase === 'done'} onClick={() => { if (selected) finishDrop(selected); }}>
        <span className="bag-halo" aria-hidden="true" />
        {phase !== 'door' && <img className="bag-main-sprite" src={asset('bag.webp')} alt="" draggable={false} />}
        {phase === 'door' && <span className="bag-door-mark" aria-hidden="true">✦</span>}
        {phase === 'word' && <img className="bag-picture-reminder" src={asset(current.picture)} alt="" draggable={false} />}
      </button>
      {phase === 'door' && renderCard(bag, 'bag-to-place')}
      {burst > 0 && <div key={burst} className="bag-burst" aria-hidden="true">{Array.from({ length: phase === 'done' ? 56 : 32 }, (_, i) => <i key={i} style={{ '--dx': `${Math.cos(i * 2.4) * (55 + (i % 7) * 23)}px`, '--dy': `${Math.sin(i * 2.4) * (70 + (i % 7) * 26) - 40}px`, '--spark-color': ['#fff5b4', '#ffc7ef', '#a9ffff', '#e4c0ff'][i % 4], '--delay': `${i % 5 * .045}s` } as CSSProperties}>✦</i>)}</div>}
      {!started && <div className="bag-start"><button onClick={start}><Play />Jouer</button></div>}
      {phase === 'done' && <div className="bag-finished"><button onClick={restart}><RotateCcw />Encore</button></div>}
    </section>
    <section className={`bag-tray ${phase === 'door' || phase === 'done' ? 'is-empty' : ''}`} aria-label={phase === 'word' ? 'Les mots' : 'Les images'}>
      {started && (phase === 'image' || phase === 'word') && cards.map(card => renderCard(card, `bag-choice bag-choice-${phase}`))}
    </section>
    {audioError && <button className="bag-audio-retry" onClick={() => speak(instructionKey(phase))}><Volume2 />Relancer la voix</button>}
    {dragging && <div className={`bag-drag-ghost ${dragging.card.kind === 'word' ? 'is-word' : ''}`} style={{ left: dragging.x, top: dragging.y }} aria-hidden="true"><CardFace card={dragging.card} /></div>}
    {flight && <div className={`bag-flight ${flight.card.kind === 'word' ? 'is-word' : ''}`} style={{ left: flight.from.x, top: flight.from.y, width: flight.width, height: flight.height, '--fly-x': `${flight.to.x - flight.from.x}px`, '--fly-y': `${flight.to.y - flight.from.y}px` } as CSSProperties} aria-hidden="true"><div><CardFace card={flight.card} /></div></div>}
    <div className="bag-pointer-trail" aria-hidden="true">{trail.map(point => <i key={point.id} style={{ left: point.x, top: point.y }} onAnimationEnd={() => setTrail(previous => previous.filter(p => p.id !== point.id))}>✦</i>)}</div>
  </main>;
}
