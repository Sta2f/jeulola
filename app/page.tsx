import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, Crown, Dog, Gamepad2, Map, Palette, Rabbit, Sparkles, TrafficCone, Volume2, VolumeX } from 'lucide-react';
import { TrafficLightGame } from './TrafficLightGame';
import { MazeGame } from './MazeGame';
import { ColoringGame } from './ColoringGame';
import { EclairMazeGame } from './EclairMazeGame';
import { BettyHideAndSeek } from './BettyHideAndSeek';
import { LettersGame } from './LettersGame';
import { type FileMusicTheme, preloadFileMusic, startFileMusic, stopAllFileMusic, useGameAudio } from './useGameAudio';
import { readSaved } from './preferences';

declare const __BUILD_ID__: string;

type GameScreen = 'home' | 'traffic' | 'maze-menu' | 'maze' | 'coloring' | 'eclair-maze' | 'betty-hide' | 'letters';

export default function Home() {
  const [screen, setScreen] = useState<GameScreen>('home');
  const [entered, setEntered] = useState(false);
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
      const valid: GameScreen[] = ['home', 'traffic', 'maze-menu', 'maze', 'coloring', 'eclair-maze', 'betty-hide', 'letters'];
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

  return (
    <main className="games-home" onPointerDownCapture={startAudio}>
      {!entered && <section className="home-entry" aria-labelledby="home-entry-title">
        <div className="home-entry-card">
          <span className="home-entry-sparkles" aria-hidden="true">✦　✧　✦</span>
          <p><Sparkles /> Une aventure féerique</p>
          <h2 id="home-entry-title">Bienvenue dans<br />le monde de Lola</h2>
          <span>Des jeux, des couleurs et de la musique t’attendent.</span>
          <button onClick={() => { startAudio(); setEntered(true); }}><Gamepad2 /> Entrer dans le monde de Lola</button>
          <small>La musique commencera dès ton entrée.</small>
        </div>
      </section>}

      <nav className="home-nav" aria-label="Navigation principale">
        <a className="home-brand" href="#games" aria-label="Le monde de Lola — accueil"><Crown /><span>Le monde de Lola</span></a>
        <div className="home-nav-actions"><span className="game-count"><Gamepad2 /> 6 jeux</span><button className="game-sound-toggle light home-sound-toggle" onClick={toggleSound} aria-label={soundOn ? 'Couper la musique d’accueil' : 'Activer la musique d’accueil'}>{soundOn ? <Volume2 /> : <VolumeX />}</button></div>
      </nav>

      <section className="park-hero" id="games" aria-label="Choisir un jeu">
        {/* oxlint-disable-next-line next/no-img-element -- Vite app with a project-local generated banner. */}
        <img src="/assets/lola-park-banner.webp" alt="Lola et son chat dans un parc enchanté avec un château et une grande roue" />
        <div className="park-vignette" aria-hidden="true" />

        <header className="welcome-board">
          {/* oxlint-disable-next-line next/no-img-element -- Project-local generated fairy cloud. */}
          <img src="/assets/lola-cloud-title.webp" alt="" aria-hidden="true" />
          <div className="welcome-cloud-copy">
            <p><Sparkles /> Bienvenue dans</p>
            <h1>Le monde<br />de Lola</h1>
            <span>Joue · Explore · Découvre</span>
          </div>
        </header>

        <div className="signpost" aria-label="Les jeux de Lola">
          <div className="signpost-top"><Gamepad2 /><span>Choisis ton jeu</span></div>
          <div className="signpost-pole" aria-hidden="true" />
          <button className="wood-sign sign-purple" onClick={() => goTo('letters')}>
            <span className="sign-icon" aria-hidden="true">ABC</span>
            <span><strong>La magie des lettres</strong><small>Lis, compose et trace des mots</small></span>
          </button>
          <button className="wood-sign sign-pink" onClick={() => goTo('traffic')}>
            <span className="sign-icon"><TrafficCone /></span>
            <span><strong>Le feu rouge</strong><small>Observe et réagis</small></span>
          </button>
          <button className="wood-sign sign-yellow" onClick={() => goTo('maze-menu')}>
            <span className="sign-icon"><Map /></span>
            <span><strong>Les labyrinthes</strong><small>Choisis ton aventure</small></span>
          </button>
          <button className="wood-sign sign-turquoise" onClick={() => goTo('coloring', 'coloring')}>
            <span className="sign-icon"><Palette /></span>
            <span><strong>Les coloriages</strong><small>Crée avec les couleurs</small></span>
          </button>
          <button className="wood-sign sign-green" onClick={() => goTo('betty-hide', 'hide')}>
            <span className="sign-icon"><Rabbit /></span>
            <span><strong>Cache-cache avec Betty</strong><small>Retrouve la lapine touffue</small></span>
          </button>
        </div>
      </section>

      <section className="lola-achievements" aria-label="Le carnet d’aventures de Lola"><div><Sparkles/><span>Mon carnet d’aventures<small>Les réussites restent sur cet appareil.</small></span></div><span><strong>{wins[0]+wins[1]}</strong> / 40 labyrinthes réussis</span><span><strong>{wins[2]}</strong> / 50 cachettes trouvées</span></section>
      <footer className="home-footer"><span>12 mots à découvrir · 40 labyrinthes · 50 cachettes · 10 coloriages</span><span>Un petit monde, de grandes aventures</span></footer>
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
