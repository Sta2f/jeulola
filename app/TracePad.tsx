import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Eraser, Volume2 } from 'lucide-react';
import { createTraceAssessment, EMPTY_TRACE, TRACE_HEIGHT, TRACE_WIDTH, type TraceResult } from './traceAssessment';
import { useRecordedAudio } from './useRecordedAudio';

const feedback = {
  start: ['À toi de tracer', 'Suis la lettre claire. Objectif : 80 %.'],
  good: ['Réussi !', 'Bravo Lola, ta lettre est bien tracée !'],
  almost: ['Presque !', 'Continue sur les parties encore claires.'],
  again: ['Continue doucement', 'Suis toute la lettre, il reste un petit chemin.'],
  outside: ['Reviens sur la lettre', 'Essaie de rester sur le modèle. Tu peux effacer.'],
};
const voice = { start: 'again', good: 'good', almost: 'almost', again: 'again', outside: 'outside' };

type TracePadProps = { letter: string; onComplete?: () => void; resetKey?: string | number };

export function TracePad(props: TracePadProps) {
  const audio = useRecordedAudio();
  return <TracePadCanvas key={`${props.resetKey ?? ''}:${props.letter}`} {...props} {...audio} />;
}

function TracePadCanvas({ letter, onComplete, playRecording, stopRecording }: TracePadProps & ReturnType<typeof useRecordedAudio>) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef<{ id: number; x: number; y: number } | null>(null);
  const assess = useRef<ReturnType<typeof createTraceAssessment> | null>(null);
  const [result, setResult] = useState<TraceResult>(EMPTY_TRACE);
  const spoken = useRef('start');
  const completed = useRef(false);
  const locked = Boolean(onComplete) && result.verdict === 'good';
  useEffect(() => {
    const element = canvas.current;
    assess.current = createTraceAssessment(letter);
    return () => {
      const active = drawing.current;
      drawing.current = null;
      if (active && element?.hasPointerCapture(active.id)) element.releasePointerCapture(active.id);
    };
  }, [letter]);
  const point = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * TRACE_WIDTH / rect.width, y: (event.clientY - rect.top) * TRACE_HEIGHT / rect.height };
  };
  const segment = (x: number, y: number) => {
    const previous = drawing.current;
    const ctx = canvas.current?.getContext('2d');
    if (!ctx || !previous) return;
    ctx.strokeStyle = '#8650b0'; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(previous.x, previous.y); ctx.lineTo(x, y); ctx.stroke();
    previous.x = x; previous.y = y;
  };
  const finish = (event: PointerEvent<HTMLCanvasElement>) => {
    if (drawing.current?.id !== event.pointerId) return;
    drawing.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!canvas.current || !assess.current) return;
    const next = assess.current(canvas.current);
    setResult(next);
    if (next.verdict !== spoken.current) {
      spoken.current = next.verdict;
      void playRecording(`/assets/stories/eclair-dodo/trace-${voice[next.verdict]}.mp3`);
    }
    if (next.verdict === 'good' && onComplete && !completed.current) {
      completed.current = true;
      onComplete();
    }
  };
  return <div className="trace-training" data-verdict={result.verdict}>
    <div className="trace-drawing-slot"><div className="letters-trace">
      <svg className="letters-trace-model" viewBox="0 0 600 320" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><text x="300" y="245" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="240" fill="#c5afd7">{letter}</text></svg>
      <canvas ref={canvas} width={TRACE_WIDTH} height={TRACE_HEIGHT} aria-label={`Zone de tracé de la lettre ${letter}`} onPointerDown={event => {
        if (drawing.current || (onComplete && completed.current) || !event.isPrimary) return;
        event.preventDefault(); stopRecording();
        event.currentTarget.setPointerCapture(event.pointerId);
        const p = point(event); drawing.current = { id: event.pointerId, ...p }; segment(p.x + .1, p.y);
      }} onPointerMove={event => { if (drawing.current?.id !== event.pointerId) return; event.preventDefault(); const p = point(event); segment(p.x, p.y); }} onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={finish} />
    </div></div>
    <div className="trace-guidance">
      <div className="trace-score"><strong>{result.percent} %</strong><progress aria-label="Réussite du tracé — objectif 80 %" max={100} value={result.percent} /></div>
      <output className="trace-feedback"><strong>{feedback[result.verdict][0]}</strong><span>{feedback[result.verdict][1]}</span></output>
      <div className="trace-actions"><button aria-label="Écouter le conseil de tracé" onClick={() => void playRecording(`/assets/stories/eclair-dodo/trace-${voice[result.verdict]}.mp3`)}><Volume2 /></button><button className="letters-clear" aria-label="Effacer" disabled={locked} onClick={() => {
        if (onComplete && completed.current) return;
        const active = drawing.current;
        drawing.current = null;
        if (active && canvas.current?.hasPointerCapture(active.id)) canvas.current.releasePointerCapture(active.id);
        stopRecording(); canvas.current?.getContext('2d')?.clearRect(0, 0, TRACE_WIDTH, TRACE_HEIGHT); setResult(EMPTY_TRACE); spoken.current = 'start';
      }}><Eraser /><span>Effacer</span></button></div>
    </div>
  </div>;
}
