import { useEffect, useState } from 'react';
import { ChevronLeft, Volume2 } from 'lucide-react';
import { getAudioSettings, readSaved, saveValue } from './preferences';
import { useGameAudio } from './useGameAudio';

type Mode = 'plus' | 'minus' | 'mix';
function question(level: number, mode: Mode) {
  const max = [5, 10, 20][level];
  const minus = mode === 'minus' || (mode === 'mix' && Math.random() < .5);
  const a = 1 + Math.floor(Math.random() * max);
  const b = Math.floor(Math.random() * (minus ? a + 1 : max - a + 1));
  const answer = minus ? a - b : a + b;
  const options = new Set([answer]);
  while (options.size < 4) options.add(Math.floor(Math.random() * (max + 1)));
  return { a, b, minus, answer, options: [...options].sort(() => Math.random() - .5) };
}

export function MathGame({ onBack }: { onBack: () => void }) {
  const [level, setLevel] = useState(0);
  const [mode, setMode] = useState<Mode>('plus');
  const [round, setRound] = useState(0);
  const [stars, setStars] = useState(() => { const value = readSaved<unknown>('math:stars', 0); return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0; });
  return <main className="math-page">
    <header className="math-header"><button onClick={onBack}><ChevronLeft /> Les jeux</button><span>LE JARDIN DES NOMBRES</span><span>★ {stars}</span></header>
    <div className="math-title"><span>UN PEU DE MAGIE, UN PEU DE CALCUL</span><h1>Les calculs enchantés</h1><p>Aide les petites fées à compter leur récolte.</p></div>
    <nav className="math-settings" aria-label="Choisir les calculs">
      <div>{(['plus', 'minus', 'mix'] as Mode[]).map((item, i) => <button key={item} aria-pressed={mode === item} onClick={() => setMode(item)}>{['+ Additions', '− Soustractions', '± Les deux'][i]}</button>)}</div>
      <div>{[5, 10, 20].map((max, i) => <button key={max} aria-pressed={level === i} onClick={() => setLevel(i)}>Jusqu’à {max}</button>)}</div>
    </nav>
    <MathRound key={`${level}-${mode}-${round}`} level={level} mode={mode} onWin={() => { setStars(stars + 1); saveValue('math:stars', stars + 1); }} onNext={() => setRound(round + 1)} />
  </main>;
}

function MathRound({ level, mode, onWin, onNext }: { level: number; mode: Mode; onWin: () => void; onNext: () => void }) {
  const [q] = useState(() => question(level, mode));
  const [errors, setErrors] = useState(0);
  const [won, setWon] = useState(false);
  const [message, setMessage] = useState('Choisis le bon nombre. Tu as 3 chances !');
  const { playSfx } = useGameAudio('traffic', false);
  const lost = errors >= 3;
  useEffect(() => () => { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); }, []);
  const listen = () => {
    const audio = getAudioSettings();
    if (!audio.enabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(`Combien font ${q.a} ${q.minus ? 'moins' : 'plus'} ${q.b} ?`);
    speech.lang = 'fr-FR'; speech.rate = .85; speech.volume = audio.volume;
    window.speechSynthesis.speak(speech);
  };
  const choose = (value: number) => {
    if (lost || won) return;
    if (value === q.answer) { setWon(true); setMessage('Bravo Lola ! Une étoile pour ton jardin !'); playSfx('win'); onWin(); }
    else { setErrors(errors + 1); playSfx('wrong'); setMessage(errors === 2 ? 'Les 3 chances sont utilisées. Compte les fleurs puis réessaie !' : 'Pas tout à fait. Compte doucement les fleurs !'); }
  };
  return <section className={`math-card ${won ? 'math-won' : ''}`} aria-label="Le calcul à résoudre">
    <div className="math-round-top"><span aria-live="polite">{3 - errors} chances restantes</span><span aria-hidden="true">{won ? '✨ 🌟 ✨' : '🧚 🌷 🦋'}</span></div>
    <h2 className="math-equation">{q.a} {q.minus ? '−' : '+'} {q.b} = {won ? q.answer : '?'}</h2>
    <div className="math-garden" aria-label={q.minus ? `${q.a} fleurs dont ${q.b} à retirer` : `${q.a} fleurs et ${q.b} fleurs à ajouter`}>
      <div>{Array.from({ length: q.a }, (_, i) => <span key={i} className={q.minus && i >= q.a - q.b ? 'picked-flower' : ''} aria-hidden="true">🌷</span>)}</div>
      {!q.minus && <><b aria-hidden="true">+</b><div>{q.b === 0 ? <span>0</span> : Array.from({ length: q.b }, (_, i) => <span key={i} aria-hidden="true">🌼</span>)}</div></>}
    </div>
    <p className="math-guide">{q.minus ? 'Les fleurs barrées sont cueillies. Combien en reste-t-il ?' : 'Compte toutes les fleurs des deux groupes.'}</p>
    <button className="math-listen" onClick={listen} disabled={!('speechSynthesis' in window)}><Volume2 /> Écouter le calcul</button>
    <div className="math-answers">{q.options.map(value => <button key={value} disabled={won || lost} onClick={() => choose(value)} aria-label={`Réponse ${value}`}>{value}</button>)}</div>
    <output aria-live="polite">{message}</output>
    {won && <button className="math-next" onClick={onNext}>Un autre calcul →</button>}
    {lost && <button className="math-next" onClick={() => { setErrors(0); setMessage('C’est reparti ! Compte les fleurs à ton rythme.'); playSfx('select'); }}>Réessayer ce calcul</button>}
  </section>;
}
