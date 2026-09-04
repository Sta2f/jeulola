import { useEffect, useState } from 'react';
import { ChevronLeft, Crown, Dog, Gamepad2, Map, Palette, Rabbit, Sparkles, TrafficCone, Volume2, VolumeX } from 'lucide-react';
import { TrafficLightGame } from './TrafficLightGame';
import { MazeGame } from './MazeGame';
import { ColoringGame } from './ColoringGame';
import { EclairMazeGame } from './EclairMazeGame';
import { BettyHideAndSeek } from './BettyHideAndSeek';
import { useGameAudio } from './useGameAudio';

type GameScreen = 'home' | 'traffic' | 'maze-menu' | 'maze' | 'coloring' | 'eclair-maze' | 'betty-hide';

export default function Home() {
  const [screen, setScreen] = useState<GameScreen>('home');
  const { soundOn, startAudio, stopAudio, toggleSound } = useGameAudio('home');

  useEffect(() => {
    if (screen !== 'home') stopAudio();
  }, [screen, stopAudio]);

  if (screen === 'traffic') return <TrafficLightGame onBack={() => setScreen('home')} />;
  if (screen === 'maze-menu') return <MazeMenu onBack={() => setScreen('home')} onPrincess={() => setScreen('maze')} onEclair={() => setScreen('eclair-maze')} />;
  if (screen === 'maze') return <MazeGame onBack={() => setScreen('maze-menu')} />;
  if (screen === 'coloring') return <ColoringGame onBack={() => setScreen('home')} />;
  if (screen === 'eclair-maze') return <EclairMazeGame onBack={() => setScreen('maze-menu')} />;
  if (screen === 'betty-hide') return <BettyHideAndSeek onBack={() => setScreen('home')} />;

  return (
    <main className="games-home" onPointerDownCapture={startAudio}>
      <nav className="home-nav" aria-label="Navigation principale">
        <a className="home-brand" href="#games" aria-label="Le monde de Lola — accueil"><Crown /><span>Le monde de Lola</span></a>
        <div className="home-nav-actions"><span className="game-count"><Gamepad2 /> 5 jeux</span><button className="game-sound-toggle light home-sound-toggle" onClick={toggleSound} aria-label={soundOn ? 'Couper la musique d’accueil' : 'Activer la musique d’accueil'}>{soundOn ? <Volume2 /> : <VolumeX />}</button></div>
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
          <button className="wood-sign sign-pink" onClick={() => setScreen('traffic')}>
            <span className="sign-icon"><TrafficCone /></span>
            <span><strong>Le feu rouge</strong><small>Observe et réagis</small></span>
          </button>
          <button className="wood-sign sign-yellow" onClick={() => setScreen('maze-menu')}>
            <span className="sign-icon"><Map /></span>
            <span><strong>Les labyrinthes</strong><small>Choisis ton aventure</small></span>
          </button>
          <button className="wood-sign sign-turquoise" onClick={() => setScreen('coloring')}>
            <span className="sign-icon"><Palette /></span>
            <span><strong>Les coloriages</strong><small>Crée avec les couleurs</small></span>
          </button>
          <button className="wood-sign sign-green" onClick={() => setScreen('betty-hide')}>
            <span className="sign-icon"><Rabbit /></span>
            <span><strong>Cache-cache avec Betty</strong><small>Retrouve la lapine touffue</small></span>
          </button>
        </div>
      </section>

      <footer className="home-footer"><span>Cinq aventures sont déjà ouvertes</span><span>D’autres jeux arrivent bientôt</span></footer>
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
        <span><small>10 niveaux enchantés</small><strong>La princesse perdue</strong><em>Guide Lola jusqu’au château</em></span>
      </button>
      <button className="maze-adventure eclair-adventure" onClick={onEclair}>
        {/* oxlint-disable-next-line next/no-img-element -- Project-local game character. */}
        <img src="/assets/eclair-chihuahua-cutout.webp" alt="Éclair, le chihuahua chocolat" />
        <span><small>10 niveaux experts</small><strong>Aide Éclair à retrouver Lola !</strong><em>Suis sa piste dans la forêt</em></span>
        <Dog aria-hidden="true" />
      </button>
    </section>
  </main>;
}
