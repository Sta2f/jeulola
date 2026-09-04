import { useState } from 'react';
import { Crown, Gamepad2, Map, Sparkles, TrafficCone } from 'lucide-react';
import { TrafficLightGame } from './TrafficLightGame';
import { MazeGame } from './MazeGame';

type GameScreen = 'home' | 'traffic' | 'maze';

export default function Home() {
  const [screen, setScreen] = useState<GameScreen>('home');

  if (screen === 'traffic') return <TrafficLightGame onBack={() => setScreen('home')} />;
  if (screen === 'maze') return <MazeGame onBack={() => setScreen('home')} />;

  return (
    <main className="games-home">
      <nav className="home-nav" aria-label="Navigation principale">
        <a className="home-brand" href="#games" aria-label="Le monde de Lola — accueil"><Crown /><span>Le monde de Lola</span></a>
        <span className="game-count"><Gamepad2 /> 2 jeux</span>
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
          <div className="wood-sign sign-turquoise is-coming" aria-label="De nouveaux jeux arrivent bientôt">
            <span className="sign-icon"><Sparkles /></span>
            <span><strong>Bientôt…</strong><small>Une nouvelle surprise</small></span>
          </div>
        </div>
      </section>

      <footer className="home-footer"><span>Deux aventures sont déjà ouvertes</span><span>D’autres jeux arrivent bientôt</span></footer>
    </main>
  );
}
