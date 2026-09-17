import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, ChevronRight, Download, Flower2, Headphones, Mic, Plus, RotateCcw, Settings2, Square, Trash2, Upload, Volume2 } from 'lucide-react';
import { getAudioSettings, readSaved, saveValue } from './preferences';
import { useRecordedAudio } from './useRecordedAudio';
import { loadWords, makeRound, normalizeWord, validWord, validateWords, wordAudio, WORDS_KEY, type ReadingWord } from './readingWords';

export function ReadingGame({ onBack }: { onBack: () => void }) {
  const [initial] = useState(loadWords);
  const [words, setWords] = useState(initial.words);
  const [notice, setNotice] = useState(initial.warning);
  const [managing, setManaging] = useState(false);
  const [mode, setMode] = useState<'model' | 'listen'>('model');
  const [cursive, setCursive] = useState(false);
  const [round, setRound] = useState<ReturnType<typeof makeRound>>([]);
  const [step, setStep] = useState(0);
  const [solved, setSolved] = useState(false);
  const [wrong, setWrong] = useState<string[]>([]);
  const [hint, setHint] = useState(false);
  const [gardens, setGardens] = useState(() => Math.max(0, Number(readSaved('reading-gardens', 0)) || 0));
  const { playRecording, stopRecording } = useRecordedAudio(setNotice);
  const eligible = words.filter(word => word.enabled && (mode === 'model' || wordAudio(word)));
  const current = round[step];
  const finished = round.length > 0 && !current;
  const updateWords = (next: ReadingWord[]) => {
    try {
      const checked = validateWords(next);
      localStorage.setItem(WORDS_KEY, JSON.stringify(checked));
      setWords(checked); setNotice('Enregistré sur cet appareil.'); return true;
    } catch (error) { setNotice(error instanceof Error && error.name !== 'QuotaExceededError' ? error.message : 'La sauvegarde est pleine ou bloquée. Exporte ta liste, puis retire quelques enregistrements.'); return false; }
  };
  const listen = (word: ReadingWord) => {
    const settings = getAudioSettings();
    if (!settings.enabled || !settings.volume) { setNotice('Active le son avec le réglage Volume en bas de l’écran.'); return; }
    const audio = wordAudio(word);
    if (audio) void playRecording(audio);
  };
  const reset = () => { stopRecording(); setRound([]); setStep(0); setSolved(false); setWrong([]); setHint(false); setNotice(''); };
  const start = () => {
    const next = makeRound(eligible);
    stopRecording(); setRound(next); setStep(0); setSolved(false); setWrong([]); setHint(false); setNotice('');
    if (mode === 'listen' && next[0]) listen(next[0].target);
  };
  const choose = (word: ReadingWord) => {
    if (solved) return;
    if (word.text !== current.target.text) { setWrong(previous => [...new Set([...previous, word.text])]); return; }
    setSolved(true); stopRecording();
    if (step === round.length - 1) { setGardens(gardens + 1); saveValue('reading-gardens', gardens + 1); }
  };
  const next = () => {
    stopRecording(); setStep(step + 1); setSolved(false); setWrong([]); setHint(false);
    if (mode === 'listen' && round[step + 1]) listen(round[step + 1].target);
  };
  if (managing) return <WordManager words={words} notice={notice} onNotice={setNotice} onSave={updateWords} onListen={listen} onBack={() => { stopRecording(); setManaging(false); setNotice(''); }} />;
  return <main className="reading-game">
    <header className="reading-header"><button onClick={onBack}><ArrowLeft /><span>Les jeux</span></button><span>LE JARDIN DES MOTS</span><button onClick={() => { reset(); setManaging(true); }}><Settings2 /><span>Mes mots</span></button></header>
    <div className="reading-layout">
      <aside className="reading-scene" aria-label="Le jardin enchanté de Lola et Éclair">
        <div className="reading-scene-copy"><span>UNE PETITE GRAINE DE MAGIE</span><h1>Chaque mot<br />fait grandir<br />ton jardin.</h1><p>Lola, Éclair et les fées t’attendent.</p></div>
        <div className="reading-garden" aria-label={`${finished ? 6 : step + (solved ? 1 : 0)} fleurs sur 6`}>{Array.from({ length: 6 }, (_, i) => <Flower2 key={i} className={finished || i < step + (solved ? 1 : 0) ? 'is-grown' : ''} />)}</div>
      </aside>
      <section className="reading-play" aria-labelledby="reading-title">
        {!round.length ? <>
          <span className="reading-eyebrow">MES PREMIERS MOTS</span><h2 id="reading-title">On fait fleurir<br />les mots ?</h2><p>Retrouve le bon mot et offre une fleur aux fées. Prends tout ton temps.</p>
          <div className="reading-modes" aria-label="Façon de jouer"><button aria-pressed={mode === 'model'} onClick={() => setMode('model')}>Aa <span>Avec le modèle</span></button><button aria-pressed={mode === 'listen'} onClick={() => setMode('listen')}><Headphones /><span>À l’écoute</span></button></div>
          {mode === 'model' ? <label className="reading-check"><input type="checkbox" checked={cursive} onChange={e => setCursive(e.target.checked)} /> Modèle en cursive plutôt qu’en majuscules</label> : <p className="reading-small">Écoute le mot, puis retrouve son étiquette. Seuls les mots avec une voix sont proposés.</p>}
          <p className="reading-small">{eligible.length} mots disponibles · 6 fleurs à faire pousser</p>
          <button className="reading-primary" disabled={eligible.length < 2} onClick={start}><Flower2 />C’est parti !</button>
          {eligible.length < 2 && <output>Active au moins deux mots{mode === 'listen' ? ' avec une voix' : ''} dans « Mes mots ».</output>}
          <span className="reading-small">{gardens ? `${gardens} jardin${gardens > 1 ? 's' : ''} déjà fleuri${gardens > 1 ? 's' : ''}` : 'Une petite partie, beaucoup de découvertes.'}</span>
        </> : finished ? <>
          <Flower2 className="reading-celebration" /><span className="reading-eyebrow">LES SIX FLEURS SONT OUVERTES</span><h2 id="reading-title">Bravo, Lola !</h2><p>Grâce à toi, le jardin des fées est tout fleuri.</p><button className="reading-primary" onClick={start}><RotateCcw />Un nouveau jardin</button><button onClick={reset}>Choisir ma façon de jouer</button>
        </> : <>
          <div className="reading-round-top"><span className="reading-eyebrow">FLEUR {step + 1} SUR {round.length}</span><button onClick={reset} aria-label="Revenir au choix du jeu"><ArrowLeft /></button></div>
          <h2 id="reading-title">{mode === 'listen' ? 'Quel mot entends-tu ?' : 'Retrouve ce mot'}</h2>
          {mode === 'model' || hint ? <div className={`reading-model ${cursive ? 'is-cursive' : ''}`}>{cursive ? current.target.text : current.target.text.toLocaleUpperCase('fr')}</div> : <button className="reading-listen" onClick={() => listen(current.target)}><Volume2 />Écouter le mot</button>}
          <div className="reading-choices">{current.choices.map(word => <button key={word.text} disabled={solved || wrong.includes(word.text)} className={solved && word.text === current.target.text ? 'is-correct' : ''} onClick={() => choose(word)}>{word.text}{solved && word.text === current.target.text && <Check />}</button>)}</div>
          <output className="reading-feedback">{solved ? 'Oui ! Une nouvelle fleur pour le jardin.' : wrong.length ? 'Essaie encore, tu as tout ton temps.' : 'Touche la bonne étiquette.'}</output>
          {solved ? <button className="reading-primary" onClick={next}>{step === round.length - 1 ? 'Voir mon jardin' : 'La fleur suivante'}<ChevronRight /></button> : <div className="reading-help">{wordAudio(current.target) && <button onClick={() => listen(current.target)}><Volume2 />Réécouter</button>}{mode === 'listen' && !hint && <button onClick={() => setHint(true)}>Voir le modèle</button>}</div>}
        </>}
        {notice && <output className="reading-notice">{notice}</output>}
      </section>
    </div>
  </main>;
}

function WordManager({ words, notice, onNotice, onSave, onListen, onBack }: { words: ReadingWord[]; notice: string; onNotice: (message: string) => void; onSave: (words: ReadingWord[]) => boolean; onListen: (word: ReadingWord) => void; onBack: () => void }) {
  const [draft, setDraft] = useState('');
  const [undo, setUndo] = useState<ReadingWord | null>(null);
  const [recording, setRecording] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; clearTimeout(timer.current); if (recorder.current?.state === 'recording') recorder.current.stop(); stream.current?.getTracks().forEach(track => track.stop()); }; }, []);
  const add = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault(); const text = normalizeWord(draft);
    if (!validWord(text)) { onNotice('Écris un mot de 1 à 40 lettres, avec ses accents.'); return; }
    if (words.some(word => word.text === text)) { onNotice('Ce mot est déjà dans la liste.'); return; }
    if (onSave([...words, { text, enabled: true }])) setDraft('');
  };
  const exportWords = () => {
    const blob = new Blob([JSON.stringify({ version: 1, words }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'les-mots-de-lola.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const importWords = async (file: File | undefined) => {
    if (!file) return;
    try {
      if (file.size > 3_100_000) throw new Error('Ce fichier est trop volumineux.');
      const data = JSON.parse(await file.text());
      if (data.version !== 1) throw new Error('Ce fichier n’est pas une sauvegarde du jardin des mots.');
      const incoming = validateWords(data.words);
      const merged = [...words];
      incoming.forEach(word => { if (!merged.some(saved => saved.text === word.text)) merged.push(word); });
      if (onSave(merged)) onNotice(`${merged.length - words.length} mot(s) ajouté(s). Les mots déjà présents sont conservés.`);
    } catch (error) { onNotice(error instanceof Error ? error.message : 'Impossible de lire cette sauvegarde.'); }
  };
  const record = async (word: ReadingWord) => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { onNotice('Le microphone n’est pas disponible dans ce navigateur. Le mode avec modèle fonctionne pour tous les mots.'); return; }
    setRecording(word.text); onNotice('Autorise le microphone, puis prononce uniquement le mot.');
    try {
      const input = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) { input.getTracks().forEach(track => track.stop()); return; }
      stream.current = input;
      const media = new MediaRecorder(input); recorder.current = media; const chunks: BlobPart[] = [];
      media.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      media.onerror = () => { clearTimeout(timer.current); input.getTracks().forEach(track => track.stop()); if (mounted.current) { setRecording(null); onNotice('L’enregistrement a échoué. Tu peux réessayer.'); } };
      media.onstop = async () => {
        clearTimeout(timer.current); input.getTracks().forEach(track => track.stop());
        if (!mounted.current) return;
        const blob = new Blob(chunks, { type: media.mimeType });
        if (blob.size === 0 || blob.size > 500_000) { setRecording(null); onNotice('Enregistrement vide ou trop long. Réessaie en disant seulement le mot.'); return; }
        const reader = new FileReader();
        reader.onload = () => { if (!mounted.current) return; setRecording(null); const recording = reader.result; if (typeof recording === 'string') onSave(words.map(item => item.text === word.text ? { ...item, recording } : item)); };
        reader.onerror = () => { if (mounted.current) { setRecording(null); onNotice('Impossible de conserver cette voix. Réessaie.'); } };
        reader.readAsDataURL(blob);
      };
      media.start(); onNotice(`Dis « ${word.text} », puis touche Arrêter. Huit secondes maximum.`);
      timer.current = setTimeout(() => { if (media.state === 'recording') media.stop(); }, 8000);
    } catch { if (mounted.current) { setRecording(null); onNotice('Le microphone est indisponible ou son accès a été refusé. Tu peux continuer avec le modèle.'); } stream.current?.getTracks().forEach(track => track.stop()); }
  };
  return <main className="reading-manager">
    <header className="reading-header"><button onClick={onBack}><ArrowLeft />Le jardin</button><span>ESPACE PARENT</span></header>
    <section className="reading-manager-content"><h1>Les mots de Lola</h1><p>Ajoute les mots appris en classe. Coche ceux à travailler aujourd’hui.</p><p className="reading-small">La liste et les voix restent dans ce navigateur. Exporte une copie pour les garder ou les transférer sur la tablette.</p>
      <form onSubmit={add}><label htmlFor="new-reading-word">Un nouveau mot</label><div><input id="new-reading-word" value={draft} maxLength={40} onChange={e => setDraft(e.target.value)} placeholder="Exemple : maman" autoComplete="off" disabled={!!recording} /><button className="reading-primary" disabled={!!recording || !draft.trim()}><Plus />Ajouter</button></div></form>
      <output className="reading-notice">{notice || `${words.filter(word => word.enabled).length} mots cochés sur ${words.length}`}</output>
      <div className="reading-word-list">{words.map(word => <div className="reading-word-row" key={word.text}><label><input type="checkbox" checked={word.enabled} disabled={!!recording} onChange={e => onSave(words.map(item => item.text === word.text ? { ...item, enabled: e.target.checked } : item))} /><span>{word.text}<small>{wordAudio(word) ? 'Avec une voix' : 'Avec le modèle · voix à ajouter'}</small></span></label><div>
        {wordAudio(word) && <button disabled={!!recording} onClick={() => onListen(word)} aria-label={`Écouter ${word.text}`}><Volume2 /></button>}
        {recording === word.text ? <button onClick={() => { if (recorder.current?.state === 'recording') recorder.current.stop(); }} aria-label={`Arrêter l’enregistrement de ${word.text}`}><Square />Arrêter</button> : <button disabled={!!recording} onClick={() => void record(word)} aria-label={`Enregistrer ma voix pour ${word.text}`}><Mic /></button>}
        <button disabled={!!recording} onClick={() => { if (onSave(words.filter(item => item.text !== word.text))) setUndo(word); }} aria-label={`Retirer ${word.text}`}><Trash2 /></button>
      </div></div>)}</div>
      {undo && <button disabled={!!recording} onClick={() => { if (onSave(words.some(word => word.text === undo.text) ? words : [...words, undo])) setUndo(null); }}><RotateCcw />Rétablir « {undo.text} »</button>}
      <p className="reading-small">Le micro permet d’enregistrer ta prononciation pour le jeu à l’écoute. Aucune voix n’est envoyée en ligne.</p>
      <div className="reading-backup"><button disabled={!!recording} onClick={exportWords}><Download />Exporter ma liste</button><label className="reading-file"><Upload />Importer une liste<input type="file" accept="application/json,.json" disabled={!!recording} onChange={e => { void importWords(e.target.files?.[0]); e.target.value = ''; }} /></label></div>
    </section>
  </main>;
}
