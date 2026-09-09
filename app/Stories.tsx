import { useEffect, useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Moon, Music2, Pause, Play, RotateCcw, Sparkles } from 'lucide-react';
import { storyAsset, storyLibrary, type Story } from './storyLibrary';
import { useStoryNarration } from './useStoryNarration';
import { stopAllFileMusic, useGameAudio } from './useGameAudio';

export function Stories({ onBack }: { onBack: () => void }) {
  const [selected, setSelected] = useState<Story | null>(null);
  if (selected) return <StoryReader story={selected} onBack={() => { stopAllFileMusic(); setSelected(null); }} />;
  return <main className="stories-library">
    <header className="story-header"><button onClick={onBack}><ChevronLeft />Les jeux</button><span><Moon /> Histoires</span><span /></header>
    <section className="story-shelf" aria-labelledby="stories-title">
      <div className="story-shelf-heading"><span>LE COIN DES RÊVES</span><h1 id="stories-title">Une histoire, un câlin…</h1><p>Écoute la voix et suis les mots qui s’illuminent.</p></div>
      <div className="story-books">{storyLibrary.map(story => <button className="story-book" key={story.id} onClick={() => setSelected(story)}>
        {/* oxlint-disable-next-line next/no-img-element -- Optimized local WebP in a Vite app. */}
        <img src={storyAsset(story, story.cover)} alt={story.coverAlt} />
        <span className="story-book-copy"><small><Moon /> {story.category.toLocaleUpperCase('fr')} · {story.duration.toLocaleUpperCase('fr')}</small><strong>{story.title}</strong><span>{story.subtitle}</span><em><BookOpen /> Ouvrir l’histoire <ChevronRight /></em></span>
      </button>)}</div>
      <p className="story-shelf-note">Les prochaines histoires t’attendront ici.</p>
    </section>
  </main>;
}

function StoryReader({ story, onBack }: { story: Story; onBack: () => void }) {
  const narration = useStoryNarration(story);
  const { startAudio, stopAudio } = useGameAudio('story');
  const [music, setMusic] = useState(true);
  const [effects, setEffects] = useState(true);
  const current = story.pages[narration.page];
  const finished = narration.status === 'ended' && narration.page === story.pages.length - 1;
  const animating = narration.status === 'playing';
  useEffect(() => {
    // Preload just the following illustration; avoid decoding a whole library.
    const next = story.pages[narration.page + 1];
    if (next) { const image = new Image(); image.src = storyAsset(story, `${next.image}.webp`); }
  }, [narration.page, story]);
  useEffect(() => { if (finished) stopAudio(); }, [finished, stopAudio]);
  useEffect(() => { if (narration.status === 'paused' || narration.status === 'error') stopAudio(); }, [narration.status, stopAudio]);
  const listen = () => {
    if (animating || narration.status === 'ended') { narration.pause(); stopAudio(); }
    else { if (music) startAudio(); narration.play(); }
  };
  return <main className="story-reader" data-playing={animating}>
    <header className="story-header"><button onClick={() => { narration.pause(); stopAudio(); onBack(); }}><ChevronLeft />Histoires</button><h1>{story.title}</h1><div className="story-sound-options"><button onClick={() => { setEffects(!effects); narration.setEffectsEnabled(!effects); }} aria-pressed={effects} aria-label={effects ? 'Couper les bruitages' : 'Activer les bruitages'}><Sparkles /></button><button onClick={() => { setMusic(!music); if (music) stopAudio(); else if (animating) startAudio(); }} aria-pressed={music} aria-label={music ? 'Couper la berceuse' : 'Activer la berceuse'}><Music2 /></button></div></header>
    <article className="story-spread" aria-label={`Page ${narration.page + 1} sur ${story.pages.length}`}>
      <figure className="story-illustration">
        {/* oxlint-disable-next-line next/no-img-element -- Optimized local WebP in a Vite app. */}
        <img key={current.image} src={storyAsset(story, `${current.image}.webp`)} alt={current.alt} />
        <div className="story-stardust" aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <i key={i} style={{ left: `${12 + i * 15}%`, top: `${12 + (i % 3) * 12}%`, animationDelay: `${-i * 1.3}s` }}>✦</i>)}</div>
      </figure>
      <div className="story-reading-page">
        <div className="story-chapter"><h2>{current.title}</h2><div className="story-page-number">{String(narration.page + 1).padStart(2, '0')} <span>/ {story.pages.length}</span></div></div>
        <p className="story-words" aria-label={current.text}>{narration.tokens.length ? narration.tokens.map((token, i) => token.start === undefined ? token.text : <span key={i} aria-hidden="true" className={i === narration.activeWord ? 'is-spoken' : ''}>{token.text}</span>) : current.text}</p>
        <output className="story-reading-hint">{narration.error || (finished ? 'Bonne nuit, Lola… L’histoire et la berceuse sont terminées.' : 'Les mots dorés suivent la voix.')}</output>
      </div>
    </article>
    <footer className="story-controls">
      <button aria-label="Page précédente" disabled={narration.page === 0} onClick={() => { void narration.selectPage(narration.page - 1, animating); }}><ChevronLeft /></button>
      {narration.status === 'error' ? <button className="story-play" onClick={() => void narration.selectPage(narration.page, true)}><RotateCcw />Réessayer</button> : finished ? <button className="story-play" onClick={() => { if (music) startAudio(); void narration.selectPage(0, true); }}><RotateCcw />Réécouter</button> : <button className="story-play" disabled={narration.status === 'loading'} onClick={listen}>{animating || narration.status === 'ended' ? <Pause /> : <Play />}{narration.status === 'loading' ? 'Préparation…' : animating || narration.status === 'ended' ? 'Pause' : 'Écouter'}</button>}
      <button aria-label="Page suivante" disabled={narration.page === story.pages.length - 1} onClick={() => { void narration.selectPage(narration.page + 1, animating); }}><ChevronRight /></button>
    </footer>
  </main>;
}
