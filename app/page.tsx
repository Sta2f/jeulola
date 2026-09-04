import { useState } from 'react';
import { Crown, Dog, Gamepad2, Map, Palette, Sparkles, TrafficCone } from 'lucide-react';
import { TrafficLightGame } from './TrafficLightGame';
import { MazeGame } from './MazeGame';
import { ColoringGame } from './ColoringGame';
import { EclairMazeGame } from './EclairMazeGame';

type GameScreen = 'home' | 'traffic' | 'maze' | 'coloring' | 'eclair-maze';

export default function Home() {
  const [screen, setScreen] = useState<GameScreen>('home');

  if (screen === 'traffic') return <TrafficLightGame onBack={() => setScreen('home')} />;
  if (screen === 'maze') return <MazeGame onBack={() => setScreen('home')} />;
  if (screen === 'coloring') return <ColoringGame onBack={() => setScreen('home')} />;
  if (screen === 'eclair-maze') return <EclairMazeGame onBack={() => setScreen('home')} />;

  return (
    <main className="games-home">
      <nav className="home-nav" aria-label="Navigation principale">
        <a className="home-brand" href="#games" aria-label="Le monde de Lola — accueil"><Crown /><span>Le monde de Lola</span></a>
        <span className="game-count"><Gamepad2 /> 4 jeux</span>
      </nav>

      <section className="park-hero" id="games" aria-label="Choisir un jeu">
        {/* oxlint-disable-next-line next/no-img-element -- Vite app with a project-local generated banner. */}
        <img src="/assets/lola-park-banner.webp" alt="Lola et son chat dans un parc enchanté avec un château et une grande roue" />
        <div className="park-vignette" aria-hidden="true" />

        <header className="welcome-board">
          <p><Sparkles /> Bienvenue dans</p>
          <h1>Le monde<br />de Lola</h1>
          <span>Joue · Explore · Découvre</span>
        </header>

        <div className="signpost" aria-label="Les jeux de Lola">
          <div className="signpost-top"><Gamepad2 /><span>Choisis ton jeu</span></div>
          <div className="signpost-pole" aria-hidden="true" />
          <button className="wood-sign sign-pink" onClick={() => setScreen('traffic')}>
            <span className="sign-icon"><TrafficCone /></span>
            <span><strong>Le feu rouge</strong><small>Observe et réagis</small></span>
          </button>
          <button className="wood-sign sign-yellow" onClick={() => setScreen('maze')}>
            <span className="sign-icon"><Map /></span>
            <span><strong>Le labyrinthe</strong><small>Retrouve le château</small></span>
          </button>
          <button className="wood-sign sign-turquoise" onClick={() => setScreen('coloring')}>
            <span className="sign-icon"><Palette /></span>
            <span><strong>Les coloriages</strong><small>Crée avec les couleurs</small></span>
          </button>
          <button className="wood-sign sign-green" onClick={() => setScreen('eclair-maze')}>
            <span className="sign-icon"><Dog /></span>
            <span><strong>Éclair cherche Lola</strong><small>Le labyrinthe expert</small></span>
          </button>
        </div>
      </section>

      <footer className="home-footer"><span>Quatre aventures sont déjà ouvertes</span><span>D’autres jeux arrivent bientôt</span></footer>
    </main>
  );
}
