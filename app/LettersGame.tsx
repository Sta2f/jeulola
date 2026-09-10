import { useEffect, useRef, useState } from 'react';
import { ArrowRight, BookOpen, Check, ChevronLeft, Lightbulb, Pencil, RotateCcw, Volume2 } from 'lucide-react';
import { TracePad } from './TracePad';
import { words } from './letterWords';
import { readSaved, saveValue } from './preferences';
import { useGameAudio } from './useGameAudio';
import { preloadRecording, useRecordedAudio } from './useRecordedAudio';

type Mode = 'build' | 'read' | 'write';
function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function savedWins() {
  const value = readSaved<unknown>('letters:wins', []);
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => {
    if (typeof item !== 'string' || !/^(build|read|write):\d+$/.test(item)) return false;
    return Number(item.split(':')[1]) < words.length;
  }))];
}

export function LettersGame({ onBack }: { onBack: () => void }) {
  const { startAudio } = useGameAudio('letters');
  useEffect(() => { startAudio(); }, [startAudio]);
  const [mode, setMode] = useState<Mode>('build');
  const [level, setLevel] = useState(0);
  const [wins, setWins] = useState(savedWins);
  const addWin = () => {
    const next = [...new Set([...wins, `${mode}:${level}`])];
    setWins(next);
    saveValue('letters:wins', next);
  };
  return <main className={`letters-page letters-mode-${mode}`} onPointerDownCapture={startAudio}>
    <header className="letters-header">
      <button onClick={onBack}><ChevronLeft /> Les jeux</button>
      <div className="letters-title"><h1>La magie des lettres</h1></div>
      <span className="letters-stars" aria-label={`${wins.length} étoiles sur ${words.length * 3}`}>★ {wins.length} / {words.length * 3}</span>
    </header>
    <div className="letters-controls">
      <nav className="letters-modes" aria-label="Choisir une activité">
        <button aria-pressed={mode === 'build'} onClick={() => setMode('build')}><span>ABC</span> Je compose</button>
        <button aria-pressed={mode === 'read'} onClick={() => setMode('read')}><BookOpen /> Je lis</button>
        <button aria-pressed={mode === 'write'} onClick={() => setMode('write')}><Pencil /> Je trace</button>
      </nav>
      <label className="letters-word-select">Mon mot
        <select value={level} onChange={event => setLevel(Number(event.target.value))}>
          {words.map((word, index) => <option key={word.text} value={index}>{index + 1}. {word.picture} {word.text.toLowerCase()}{wins.includes(`${mode}:${index}`) ? ' ★' : ''}</option>)}
        </select>
      </label>
    </div>
    <LetterRound key={`${mode}-${level}`} mode={mode} level={level} onWin={addWin} onNext={() => setLevel((level + 1) % words.length)} />
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
  const [completedLetters, setCompletedLetters] = useState<number[]>([]);
  const [traceAdvance, setTraceAdvance] = useState<number | null>(null);
  const winRecorded = useRef(false);
  const { playSfx } = useGameAudio('traffic', false);
  const { playRecording, stopRecording } = useRecordedAudio();
  const wordAudio = `/assets/audio/voices/word-${level}.mp3`;
  useEffect(() => { void preloadRecording(wordAudio).catch(() => undefined); }, [wordAudio]);
  const [errors, setErrors] = useState(0);
  const lost = errors >= 3;

  // Give Lola a moment to see her success; changing word/mode cancels the transition.
  useEffect(() => {
    if (traceAdvance === null) return;
    const timer = window.setTimeout(() => {
      setTraceLetter(traceAdvance);
      setTraceAdvance(null);
      setMessage('');
    }, 1100);
    return () => window.clearTimeout(timer);
  }, [traceAdvance]);

  const success = () => {
    if (winRecorded.current) return;
    winRecorded.current = true;
    setWon(true);
    setMessage(mode === 'write' ? `Bravo Lola ! Tu as tracé tout le mot ${word.text.toLowerCase()} !` : 'Bravo Lola ! Tu as trouvé le mot !');
    onWin();
    // The last traced letter already has its own recorded encouragement.
    if (mode !== 'write') void playRecording('/assets/audio/voices/bravo.mp3');
  };
  const completeLetter = () => {
    if (won || completedLetters.includes(traceLetter)) return;
    const next = [...completedLetters, traceLetter];
    setCompletedLetters(next);
    if (next.length === word.text.length) {
      playSfx('win');
      success();
    } else {
      playSfx('sparkle');
      setMessage(`Bravo pour le ${word.text[traceLetter]} ! Place au ${word.text[traceLetter + 1]}.`);
      setTraceAdvance(traceLetter + 1);
    }
  };
  const pick = (id: number, letter: string) => {
    if (won || lost || picked.includes(id)) return;
    if (letter !== word.text[picked.length]) {
      stopRecording();
      playSfx(errors === 2 ? 'letter-lost' : 'letter-wrong');
      setErrors(errors + 1);
      setMessage(errors === 2 ? 'Regarde le modèle, puis réessaie tranquillement.' : 'Essaie une autre lettre. Tu peux regarder le modèle !');
      if (errors === 2) setHint(true);
      return;
    }
    playSfx(picked.length + 1 === word.text.length ? 'win' : 'sparkle');
    setPicked([...picked, id]);
    setMessage('Bien joué, continue !');
    if (picked.length + 1 === word.text.length) success();
  };

  return <section className={`letters-card letters-card-${mode}${won ? ' is-won' : ''}`} aria-label="Le jeu de lettres">
    <div className="letters-card-top">
      <span>Mot {level + 1} / {words.length}</span>
      <span>{won ? '★ Mot réussi !' : mode === 'write' ? `${completedLetters.length} / ${word.text.length} lettres tracées` : mode === 'build' ? `${3 - errors} chances restantes` : 'À toi de lire'}</span>
    </div>
    <div className="letters-round-layout">
      <div className="letters-prompt">
        <div className="letters-picture" aria-hidden="true">{word.picture}</div>
        <h2>{mode === 'build' ? 'Remets les lettres dans l’ordre' : mode === 'read' ? 'Trouve le mot de l’image' : 'Trace le mot, lettre par lettre'}</h2>
        <button className="letters-listen" onClick={() => void playRecording(wordAudio)}><Volume2 /> Écouter le mot</button>
        {mode === 'write' && <p className="letters-word-preview"><strong>{word.text}</strong><span>{word.text.toLowerCase()}</span></p>}
        {won && mode !== 'write' && <p className="letters-model">{word.text.toLowerCase()}<span>{word.syllables}</span></p>}
      </div>
      <div className="letters-workspace">
        {mode === 'build' && <>
          <div className="letters-slots" aria-label="Le mot à composer">{word.text.split('').map((letter, index) => <span className={index < picked.length ? 'is-filled' : ''} key={index} aria-label={index < picked.length ? letter : `Lettre ${index + 1} à trouver`}>{index < picked.length ? letter : <small>{index + 1}</small>}</span>)}</div>
          <div className="letters-tiles">{tiles.map(tile => <button className={picked.includes(tile.id) ? 'is-used' : ''} key={tile.id} aria-label={`Lettre ${tile.letter}`} disabled={picked.includes(tile.id) || won || lost} onClick={() => pick(tile.id, tile.letter)}>{tile.letter}</button>)}</div>
          <div className="letters-help"><button onClick={() => setHint(!hint)} aria-expanded={hint}><Lightbulb /> {hint ? 'Cacher' : 'Voir'} le modèle</button><button disabled={won || lost || !picked.length} onClick={() => { setPicked(picked.slice(0, -1)); setMessage(''); }}><RotateCcw /> Revenir</button></div>
          {lost && <button className="letters-next" onClick={() => { setErrors(0); setPicked([]); setMessage('Nouvel essai !'); playSfx('select'); }}>Réessayer ce mot <RotateCcw /></button>}
          {hint && <p className="letters-model">{word.text} <span>{word.text.toLowerCase()}</span></p>}
        </>}
        {mode === 'read' && <div className="letters-choices">{choices.map(choice => <button key={choice.text} disabled={won} className={won && choice === word ? 'is-correct' : ''} onClick={() => { stopRecording(); playSfx(choice === word ? 'win' : 'letter-wrong'); if (choice === word) success(); else setMessage('Pas encore. Écoute le mot et essaie à nouveau.'); }}>{choice.text.toLowerCase()}</button>)}</div>}
        {mode === 'write' && <>
          <ol className="letters-trace-picker" aria-label="Les lettres du mot">{word.text.split('').map((letter, index) => <li key={index} className={completedLetters.includes(index) ? 'is-complete' : ''} aria-current={traceLetter === index ? 'step' : undefined} aria-label={`Lettre ${index + 1} : ${letter}${completedLetters.includes(index) ? ', réussie' : traceLetter === index ? ', à tracer' : ', à venir'}`}><span>{letter}</span>{completedLetters.includes(index) && <Check aria-hidden="true" />}</li>)}</ol>
          <p className="letters-trace-progress">{won ? 'Toutes les lettres sont réussies !' : `Lettre ${traceLetter + 1} sur ${word.text.length} · Suis le modèle avec ton doigt.`}</p>
          <TracePad resetKey={traceLetter} letter={word.text[traceLetter]} onComplete={completeLetter} />
        </>}
      </div>
    </div>
    <div className="letters-round-footer">
      <output className={`letters-feedback${won ? ' is-won' : ''}`}>{message}</output>
      {won && <button className="letters-next" onClick={() => { stopRecording(); onNext(); }}>{level === words.length - 1 ? 'Rejouer les mots' : 'Mot suivant'} <ArrowRight /></button>}
    </div>
    {won && <div className="letters-celebration" aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <span key={index}>✦</span>)}</div>}
  </section>;
}
