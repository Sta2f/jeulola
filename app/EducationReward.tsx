import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Gift, X, Volume2 } from 'lucide-react';
import {
  finishEducationCelebration,
  useEducationScore,
  useEducationVisible,
} from './educationScore';
import { preloadRecording, useRecordedAudio } from './useRecordedAudio';
const voice = '/assets/audio/voices/education-gift.mp3';
export function EducationReward() {
  const score = useEducationScore(),
    visible = useEducationVisible();
  const [details, setDetails] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const { playRecording, stopRecording } = useRecordedAudio();
  const celebrating = visible && score.celebration;
  const opened = visible && (details || celebrating);
  useEffect(() => {
    void preloadRecording(voice).catch(() => undefined);
  }, []);
  useEffect(() => {
    if (opened && !dialog.current?.open) dialog.current?.showModal();
    if (!opened && dialog.current?.open) dialog.current.close();
  }, [opened]);
  useEffect(() => {
    if (celebrating) void playRecording(voice);
    return () => stopRecording();
  }, [celebrating, playRecording, stopRecording]);
  const close = () => {
    setDetails(false);
    stopRecording();
    if (score.celebration) finishEducationCelebration();
  };
  return (
    <>
      {visible && (
        <button
          className="education-score"
          onClick={() => setDetails(true)}
          aria-label={`Mon cadeau : ${score.points} points sur 50, ${score.correct} bonnes réponses, ${score.wrong} erreurs`}
        >
          <Gift />
          <strong>{score.points} / 50</strong>
          <span className="education-counts">
            ✓ {score.correct} · ✗ {score.wrong}
          </span>
        </button>
      )}
      {createPortal(
        <dialog
          ref={dialog}
          className={`education-dialog ${celebrating ? 'is-celebrating' : ''}`}
          onCancel={close}
          onClose={close}
          aria-labelledby="education-title"
        >
          <button
            className="education-close"
            aria-label="Fermer le compteur"
            onClick={close}
          >
            <X />
          </button>
          {celebrating && (
            <div className="education-confetti" aria-hidden="true">
              {Array.from({ length: 36 }, (_, i) => (
                <i
                  key={i}
                  style={
                    {
                      '--x': `${(i * 29) % 100}%`,
                      '--delay': `${(i % 9) * -0.22}s`,
                      '--color': ['#ed8bbb', '#e7b43d', '#83cfa7', '#ae94d8'][
                        i % 4
                      ],
                      '--turn': `${i * 37}deg`,
                    } as CSSProperties
                  }
                />
              ))}
            </div>
          )}
          <div className="education-gift" aria-hidden="true">
            🎁
          </div>
          <h2 id="education-title">
            {celebrating ? 'Tu as droit à un cadeau !' : 'Mon prochain cadeau'}
          </h2>
          <p>
            {celebrating
              ? 'Bravo Lola, tu as gagné 50 points !'
              : 'Une bonne réponse : +1. Une erreur : −1.'}
          </p>
          <strong className="education-total">{score.points} / 50</strong>
          <progress
            value={score.points}
            max={50}
            aria-label="Points pour le prochain cadeau"
          />
          <p>
            {celebrating
              ? 'Le compteur repart à zéro pour le prochain cadeau.'
              : '50 points = un cadeau. Le score ne descend jamais sous zéro.'}
          </p>
          <div className="education-totals">
            <span>
              ✓ {score.correct} bonne{score.correct !== 1 ? 's' : ''} réponse
              {score.correct !== 1 ? 's' : ''}
            </span>
            <span>
              ✗ {score.wrong} erreur{score.wrong !== 1 ? 's' : ''}
            </span>
            <span>
              🎁 {score.gifts} cadeau{score.gifts > 1 ? 'x' : ''} gagné
              {score.gifts > 1 ? 's' : ''}
            </span>
          </div>
          {celebrating && (
            <button
              className="education-replay"
              onClick={() => void playRecording(voice)}
            >
              <Volume2 /> Écouter
            </button>
          )}
          <button className="education-continue" onClick={close}>
            {celebrating ? 'Continuer à jouer' : 'C’est parti !'}
          </button>
        </dialog>,
        document.body,
      )}
    </>
  );
}
