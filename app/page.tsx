import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, Crown, Dog, Gamepad2, Map, Palette, Pause, Rabbit, Sparkles, TrafficCone, Volume2, VolumeX } from 'lucide-react';
import { TrafficLightGame } from './TrafficLightGame';
import { MazeGame } from './MazeGame';
import { ColoringGame } from './ColoringGame';
import { EclairMazeGame } from './EclairMazeGame';
import { BettyHideAndSeek } from './BettyHideAndSeek';
import { LettersGame } from './LettersGame';
import { MathGame } from './MathGame';
import { FairyGameButton } from './FairyGameButton';
import { HomeEnchantment } from './HomeEnchantment';
import { type FileMusicTheme, preloadFileMusic, startFileMusic, stopAllFileMusic, useGameAudio } from './useGameAudio';
import { readSaved, saveValue } from './preferences';

declare const __BUILD_ID__: string;

type GameScreen = 'home' | 'traffic' | 'maze-menu' | 'maze' | 'coloring' | 'eclair-maze' | 'betty-hide' | 'letters' | 'math';

export default function Home() {
  const [screen, setScreen] = useState<GameScreen>('home');
  const [entered, setEntered] = useState(false);
  const [motionPaused, setMotionPaused] = useState(() => readSaved<boolean>('home-motion-paused', false) === true);
  useEffect(() => saveValue('home-motion-paused', motionPaused), [motionPaused]);
  const [pageVisible, setPageVisible] = useState(() => !document.hidden);
  useEffect(() => {
    const updateVisibility = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', updateVisibility);
    return () => document.removeEventListener('visibilitychange', updateVisibility);
  }, []);
  const wins = ['princess', 'eclair', 'betty'].map(game => { const value = readSaved<number[]>(`wins:${game}`, []); return Array.isArray(value) ? new Set(value).size : 0; });
  const { soundOn, startAudio, stopAudio, toggleSound } = useGameAudio('home');

  const goTo = useCallback((nextScreen: GameScreen, music?: FileMusicTheme) => {
    stopAudio();
    stopAllFileMusic();
    if (music) startFileMusic(music);
    setScreen(nextScreen);
    window.history.pushState({ lolaScreen: nextScreen }, '', `#${nextScreen}`);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [stopAudio]);

  useEffect(() => {
    window.history.replaceState({ lolaScreen: 'home' }, '', '#home');
    const back = (event: PopStateEvent) => {
      const next = event.state?.lolaScreen as GameScreen;
      const valid: GameScreen[] = ['home', 'traffic', 'maze-menu', 'maze', 'coloring', 'eclair-maze', 'betty-hide', 'letters', 'math'];
      stopAudio();
      stopAllFileMusic();
      setScreen(valid.includes(next) ? next : 'home');
      window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', back);
    return () => window.removeEventListener('popstate', back);
  }, [stopAudio]);

  useEffect(() => {
    if (screen !== 'home') stopAudio();
    else if (entered) startAudio();
  }, [entered, screen, startAudio, stopAudio]);

  useEffect(() => preloadFileMusic(), []);

  useEffect(() => {
    let checking = false;
    const checkForUpdate = async () => {
      if (checking) return;
      checking = true;
      try {
        const response = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
        const latest = await response.json() as { buildId?: string };
        if (latest.buildId && latest.buildId !== __BUILD_ID__) {
          window.location.replace(`/?update=${encodeURIComponent(latest.buildId)}`);
        }
      } catch {
        // The game keeps working offline and checks again the next time Safari becomes active.
      } finally {
        checking = false;
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void checkForUpdate();
    };
    void checkForUpdate();
    const updateTimer = window.setInterval(checkForUpdate, 12000);
    window.addEventListener('focus', checkForUpdate);
    window.addEventListener('online', checkForUpdate);
    window.addEventListener('pageshow', checkForUpdate);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.clearInterval(updateTimer);
      window.removeEventListener('focus', checkForUpdate);
      window.removeEventListener('online', checkForUpdate);
      window.removeEventListener('pageshow', checkForUpdate);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  if (screen === 'traffic') return <TrafficLightGame onBack={() => goTo('home')} />;
  if (screen === 'maze-menu') return <MazeMenu onBack={() => goTo('home')} onPrincess={() => goTo('maze', 'forest')} onEclair={() => goTo('eclair-maze', 'dog')} />;
  if (screen === 'maze') return <MazeGame onBack={() => goTo('maze-menu')} />;
  if (screen === 'coloring') return <ColoringGame onBack={() => goTo('home')} />;
  if (screen === 'eclair-maze') return <EclairMazeGame onBack={() => goTo('maze-menu')} />;
  if (screen === 'betty-hide') return <BettyHideAndSeek onBack={() => goTo('home')} />;
  if (screen === 'letters') return <LettersGame onBack={() => goTo('home')} />;
  if (screen === 'math') return <MathGame onBack={() => goTo('home')} />;

  return (
    <main className="games-home" onPointerDownCapture={startAudio}>
      {!entered && <section className="home-entry" aria-labelledby="home-entry-title">
        <div className="home-entry-card">
          <p><Sparkles /> La magie t’attend</p>
          <h2 id="home-entry-title">Le monde de Lola</h2>
          <button onClick={() => { startAudio(); setEntered(true); }}><Gamepad2 /> On joue ?</button>
          <small>Avec une douce musique ♪</small>
        </div>
      </section>}

      <nav className="home-nav" aria-label="Navigation principale">
        <details className="home-achievements"><summary aria-label="Mes réussites" title="Mes réussites"><Crown /></summary><div><strong>Mes réussites</strong><p>✦ {wins[0]+wins[1]} / 40 labyrinthes</p><p>🐾 {wins[2]} / 50 cachettes</p></div></details>
        <div className="home-nav-actions">
          <span className="game-count"><Gamepad2 /> 7 jeux</span>
          <button className="game-sound-toggle light home-motion-toggle" onClick={() => setMotionPaused(value => !value)} aria-label={motionPaused ? 'Animer le décor' : 'Mettre les animations en pause'} title={motionPaused ? 'Animer le décor' : 'Mettre les animations en pause'}>{motionPaused ? <Sparkles /> : <Pause />}</button>
          <button className="game-sound-toggle light home-sound-toggle" onClick={toggleSound} aria-label={soundOn ? 'Couper la musique d’accueil' : 'Activer la musique d’accueil'}>{soundOn ? <Volume2 /> : <VolumeX />}</button>
        </div>
      </nav>

      <section className="park-hero" id="games" aria-label="Choisir un jeu" data-motion-paused={!entered || !pageVisible || motionPaused}>
        {/* oxlint-disable-next-line next/no-img-element -- Vite app with a project-local generated banner. */}
        <img src="/assets/lola-park-banner.webp" alt="Lola et son chat dans un parc enchanté avec un château et une grande roue" />
        <div className="park-vignette" aria-hidden="true" />
        <HomeEnchantment />

        <header className="welcome-board">
          {/* oxlint-disable-next-line next/no-img-element -- Project-local generated fairy cloud. */}
          <img src="/assets/lola-cloud-title.webp" alt="" aria-hidden="true" />
          <div className="welcome-cloud-copy">
            <p><Sparkles /> Bienvenue dans</p>
            <h1>Le monde<br />de Lola</h1>
            <span>Joue · Explore · Découvre</span>
          </div>
        </header>

        <nav className="fairy-menu" aria-label="Les jeux de Lola">
          <FairyGameButton tone="honey" icon="123" onClick={() => goTo('math', 'math')}>Les calculs enchantés</FairyGameButton>
          <FairyGameButton tone="lilac" icon="ABC" onClick={() => goTo('letters', 'letters')}>La magie des lettres</FairyGameButton>
          <FairyGameButton tone="rose" icon={<TrafficCone />} onClick={() => goTo('traffic')}>Le feu rouge</FairyGameButton>
          <FairyGameButton tone="honey" icon={<Map />} onClick={() => goTo('maze-menu')}>Les labyrinthes</FairyGameButton>
          <FairyGameButton tone="sky" icon={<Palette />} onClick={() => goTo('coloring', 'coloring')}>Les coloriages</FairyGameButton>
          <FairyGameButton tone="mint" icon={<Rabbit />} onClick={() => goTo('betty-hide', 'hide')}>Cache-cache avec Betty</FairyGameButton>
        </nav>
      </section>

    </main>
  );
}

function MazeMenu({ onBack, onPrincess, onEclair }: { onBack: () => void; onPrincess: () => void; onEclair: () => void }) {
  return <main className="maze-menu-page">
    <header className="maze-menu-header">
      <button className="back-button" onClick={onBack}><ChevronLeft /><span>Les jeux</span></button>
      <div><p>DEUX GRANDES AVENTURES</p><h1>Les labyrinthes de Lola</h1></div>
      <Map aria-hidden="true" />
    </header>
    <section className="maze-menu-content">
      <button className="maze-adventure princess-adventure" onClick={onPrincess}>
        {/* oxlint-disable-next-line next/no-img-element -- Project-local game character. */}
        <img src="/assets/princess-lantern.webp" alt="Lola avec sa lanterne" />
        <span><small>20 niveaux enchantés</small><strong>La princesse perdue</strong><em>Guide Lola jusqu’au château</em></span>
      </button>
      <button className="maze-adventure eclair-adventure" onClick={onEclair}>
        {/* oxlint-disable-next-line next/no-img-element -- Project-local game character. */}
        <img src="/assets/eclair-chihuahua-cutout.webp" alt="Éclair, le chihuahua chocolat" />
        <span><small>20 niveaux experts</small><strong>Aide Éclair à retrouver Lola !</strong><em>Suis sa piste dans la forêt</em></span>
        <Dog aria-hidden="true" />
      </button>
    </section>
  </main>;
}
