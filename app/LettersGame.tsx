import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { ArrowRight, BookOpen, ChevronLeft, Eraser, Lightbulb, Pencil, RotateCcw, Volume2 } from 'lucide-react';
import { getAudioSettings, readSaved, saveValue } from './preferences';
import { useGameAudio } from './useGameAudio';

const words = [
  { text: 'LUNE', picture: '🌙', syllables: 'lu · ne' },
  { text: 'VÉLO', picture: '🚲', syllables: 'vé · lo' },
  { text: 'ROSE', picture: '🌹', syllables: 'ro · se' },
  { text: 'POMME', picture: '🍎', syllables: 'pom · me' },
  { text: 'LAMA', picture: '🦙', syllables: 'la · ma' },
  { text: 'ROBOT', picture: '🤖', syllables: 'ro · bot' },
  { text: 'PIRATE', picture: '🏴‍☠️', syllables: 'pi · ra · te' },
  { text: 'TOMATE', picture: '🍅', syllables: 'to · ma · te' },
  { text: 'BANANE', picture: '🍌', syllables: 'ba · na · ne' },
  { text: 'TORTUE', picture: '🐢', syllables: 'tor · tue' },
  { text: 'SALADE', picture: '🥗', syllables: 'sa · la · de' },
  { text: 'ANANAS', picture: '🍍', syllables: 'a · na · nas' },
];
type Mode = 'build' | 'read' | 'write';
function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
function savedWins() {
  const value = readSaved<unknown>('letters:wins', []);
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export function LettersGame({ onBack }: { onBack: () => void }) {
  const { startAudio } = useGameAudio('letters');
  useEffect(() => { startAudio(); }, [startAudio]);
  const [mode, setMode] = useState<Mode>('build');
  const [level, setLevel] = useState(0);
  const [wins, setWins] = useState(savedWins);
  const [round, setRound] = useState(0);
  useEffect(() => () => { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); }, []);
  const change = (next: Mode) => { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); setMode(next); };
  return <main className="letters-page" onPointerDownCapture={startAudio}>
    <header className="letters-header"><button onClick={onBack}><ChevronLeft /> Les jeux</button><span>LE MONDE DE LOLA</span><span className="letters-stars">★ {wins.length} / 24</span></header>
    <div className="letters-title"><span>UN MOT APRÈS L’AUTRE</span><h1>La magie des lettres</h1><p>Écoute, joue et écris à ton rythme.</p></div>
    <nav className="letters-modes" aria-label="Choisir une activité">
      <button aria-pressed={mode === 'build'} onClick={() => change('build')}><span>ABC</span> Je compose</button>
      <button aria-pressed={mode === 'read'} onClick={() => change('read')}><BookOpen /> Je lis</button>
      <button aria-pressed={mode === 'write'} onClick={() => change('write')}><Pencil /> Je trace</button>
    </nav>
    <LetterRound key={`${mode}-${level}-${round}`} mode={mode} level={level} onWin={() => {
      const next = [...new Set([...wins, `${mode}:${level}`])]; setWins(next); saveValue('letters:wins', next);
    }} onNext={() => { setLevel((level + 1) % words.length); setRound(round + 1); }} />
    <nav className="letters-word-list" aria-label="Choisir un mot">{words.map((word, index) => <button key={word.text} aria-label={`Mot ${index + 1} : ${word.text.toLowerCase()}`} aria-pressed={level === index} onClick={() => { setLevel(index); if ('speechSynthesis' in window) window.speechSynthesis.cancel(); }}><span aria-hidden="true">{word.picture}</span><small>{index + 1}{wins.includes(`${mode}:${index}`) ? ' ★' : ''}</small></button>)}</nav>
    <p className="letters-note">Les étoiles récompensent les mots lus et composés. Le tracé est un entraînement libre, à partager avec un adulte.</p>
  </main>;
}

function LetterRound({ mode, level, onWin, onNext }: { mode: Mode; level: number; onWin: () => void; onNext: () => void }) {
  const word = words[level];
  const [tiles] = useState(() => shuffle(word.text.split('').map((letter, id) => ({ letter, id }))));
  const [choices] = useState(() => shuffle([word, ...shuffle(words.filter(item => item !== word)).slice(0, 2)]));
  const [picked, setPicked] = useState<number[]>([]);
  const [hint, setHint] = useState(false);
  const [won, setWon] = useState(false);
  const [message, setMessage] = useState('');
  const [traceLetter, setTraceLetter] = useState(0);
  const [clear, setClear] = useState(0);
  const { playSfx } = useGameAudio('traffic', false);
  const [errors, setErrors] = useState(0);
  const lost = errors >= 3;
  const speechAvailable = 'speechSynthesis' in window;
  const speak = (text: string, requested = false) => {
    if (!speechAvailable) return;
    const audio = getAudioSettings();
    if (!requested && !audio.enabled) return;
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text.toLowerCase()); speech.lang = 'fr-FR'; speech.rate = .8;
    speech.volume = audio.volume;
    speech.onerror = (event) => { if (event.error !== 'interrupted' && event.error !== 'canceled') setMessage('La voix ne répond pas. Tu peux jouer avec le modèle ou demander à un adulte de lire le mot.'); };
    window.speechSynthesis.speak(speech);
  };
  const success = () => { setWon(true); setMessage('Bravo Lola ! Tu as trouvé le mot !'); onWin(); speak(`Bravo Lola ! ${word.text}`); };
  const pick = (id: number, letter: string) => {
    if (won || lost || picked.includes(id)) return;
    if (letter !== word.text[picked.length]) {
      playSfx('wrong');
      setErrors(errors + 1);
      setMessage(errors === 2 ? 'Trois erreurs. Regarde le modèle, puis réessaie !' : 'Essaie une autre lettre. Tu peux regarder le modèle !');
      return;
    }
    playSfx(picked.length + 1 === word.text.length ? 'win' : 'sparkle');
    setPicked([...picked, id]); setMessage('Bien joué, continue !');
    if (picked.length + 1 === word.text.length) success();
  };
  return <section className={`letters-card letters-card-${mode}`} aria-label="Le jeu de lettres">
    <div className="letters-card-top"><span>Mot {level + 1} / {words.length}</span><span aria-live="polite">{mode === 'write' ? 'À toi de tracer' : won ? '★ Une étoile gagnée' : mode === 'build' ? `${3 - errors} chances restantes · 3 erreurs maximum` : 'Chaque essai compte'}</span></div>
    <div className="letters-picture" aria-hidden="true">{word.picture}</div>
    <h2>{mode === 'build' ? 'Remets les lettres dans l’ordre' : mode === 'read' ? 'Trouve le mot de l’image' : 'Trace les lettres du mot'}</h2>
    <button className="letters-listen" onClick={() => speak(word.text, true)} disabled={!speechAvailable}><Volume2 /> Écouter le mot</button>
    {!speechAvailable && <p>La voix n’est pas disponible ici. Regarde le modèle ou lis avec un adulte.</p>}
    {mode === 'build' && <>
      <div className="letters-slots" aria-label="Le mot à composer">{word.text.split('').map((letter, index) => <span key={index} aria-label={index < picked.length ? letter : `Lettre ${index + 1} à trouver`}>{index < picked.length ? letter : <small>{index + 1}</small>}</span>)}</div>
      <div className="letters-tiles">{tiles.map(tile => <button key={tile.id} aria-label={`Lettre ${tile.letter}`} disabled={picked.includes(tile.id) || won || lost} onClick={() => pick(tile.id, tile.letter)}>{tile.letter}</button>)}</div>
      <div className="letters-help"><button onClick={() => setHint(!hint)} aria-expanded={hint}><Lightbulb /> {hint ? 'Cacher' : 'Voir'} le modèle</button><button disabled={won || lost || !picked.length} onClick={() => { setPicked(picked.slice(0, -1)); setMessage(''); }}><RotateCcw /> Revenir</button></div>
      {lost && <button className="letters-next" onClick={() => { setErrors(0); setPicked([]); setMessage('Nouvel essai !'); playSfx('select'); }}>Réessayer ce mot <RotateCcw /></button>}
      {hint && <p className="letters-model">{word.text} <span>{word.text.toLowerCase()}</span></p>}
    </>}
    {mode === 'read' && <div className="letters-choices">{choices.map(choice => <button key={choice.text} disabled={won} onClick={() => { playSfx(choice === word ? 'win' : 'wrong'); if (choice === word) success(); else setMessage('Pas encore. Écoute le mot et essaie à nouveau.'); }}>{choice.text.toLowerCase()}</button>)}</div>}
    {mode === 'write' && <>
      <p className="letters-model">{word.text} <span>{word.text.toLowerCase()}</span></p>
      <div className="letters-trace-picker" aria-label="Lettre à tracer">{word.text.split('').map((letter, index) => <button key={index} aria-pressed={traceLetter === index} onClick={() => setTraceLetter(index)}>{letter}</button>)}</div>
      <p>Suis la grande lettre avec ton doigt ou ta souris.</p>
      <TracePad key={`${traceLetter}-${clear}`} letter={word.text[traceLetter]} />
      <button className="letters-clear" onClick={() => setClear(clear + 1)}><Eraser /> Effacer le tracé</button>
      <p className="letters-note">Tu peux aussi recopier « {word.text.toLowerCase()} » sur une feuille.</p>
    </>}
    <output className={`letters-feedback ${won ? 'is-won' : ''}`}>{message || (mode === 'write' ? 'Prends ton temps, tu peux recommencer autant que tu veux.' : 'Tu peux écouter le mot autant de fois que tu veux.')}</output>
    {won && <p className="letters-model">{word.text.toLowerCase()}<span>{word.syllables}</span></p>}
    {(won || mode === 'write') && <button className="letters-next" onClick={() => { if (speechAvailable) window.speechSynthesis.cancel(); onNext(); }}>{level === words.length - 1 ? 'Rejouer les mots' : 'Mot suivant'} <ArrowRight /></button>}
  </section>;
}

function TracePad({ letter }: { letter: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef<number | null>(null);
  const point = (event: PointerEvent<HTMLCanvasElement>) => { const rect = event.currentTarget.getBoundingClientRect(); return { x: (event.clientX - rect.left) * 600 / rect.width, y: (event.clientY - rect.top) * 320 / rect.height }; };
  return <div className="letters-trace"><span aria-hidden="true">{letter}</span><canvas ref={canvas} width={600} height={320} aria-label={`Zone de tracé libre de la lettre ${letter}`} onPointerDown={event => {
    if (drawing.current !== null) return;
    drawing.current = event.pointerId; event.currentTarget.setPointerCapture(event.pointerId);
    const ctx = canvas.current?.getContext('2d'); if (!ctx) return;
    const p = point(event); ctx.strokeStyle = '#7b43ad'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + .1, p.y); ctx.stroke();
  }} onPointerMove={event => { if (drawing.current !== event.pointerId) return; const p = point(event); const ctx = canvas.current?.getContext('2d'); ctx?.lineTo(p.x, p.y); ctx?.stroke(); }} onPointerUp={() => { drawing.current = null; }} onPointerCancel={() => { drawing.current = null; }} onLostPointerCapture={() => { drawing.current = null; }} /></div>;
}
