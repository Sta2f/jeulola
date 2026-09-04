import { useState } from 'react';
import { ArrowRight, Crown, Sparkles, TrafficCone } from 'lucide-react';
import { TrafficLightGame } from './TrafficLightGame';
import { MazeGame } from './MazeGame';

type GameScreen = 'home' | 'traffic' | 'maze';

export default function Home() {
  const [screen, setScreen] = useState<GameScreen>('home');

  if (screen === 'traffic') return <TrafficLightGame onBack={() => setScreen('home')} />;
  if (screen === 'maze') return <MazeGame onBack={() => setScreen('home')} />;

  return (
    <main className="games-home">
      <div className="home-glow" aria-hidden="true" />
      <nav className="home-nav" aria-label="Navigation principale">
        <a className="home-brand" href="#games" aria-label="Les aventures de Lola — accueil"><Crown /><span>Les aventures de Lola</span></a>
        <span className="game-count">2 jeux</span>
      </nav>

      <header className="home-hero">
        <p className="story-kicker"><Sparkles /> Le petit monde de Lola</p>
        <h1>Quelle aventure<br />choisis-tu aujourd’hui&nbsp;?</h1>
        <p>Des jeux tout simples à comprendre, pleins de couleurs, de sons et de petites surprises.</p>
      </header>

      <section className="game-library" id="games" aria-label="Choisir un jeu">
        <button className="game-card traffic-card" onClick={() => setScreen('traffic')}>
          <span className="card-number">01</span>
          <div className="traffic-card-art" aria-hidden="true"><span /><span /><span /></div>
          <div className="game-card-copy">
            <span className="game-type"><TrafficCone /> Réflexes</span>
            <h2>Le feu de Lola</h2>
            <p>Observe les couleurs et attends le bon signal.</p>
            <span className="play-link">Jouer maintenant <ArrowRight /></span>
          </div>
        </button>

        <button className="game-card forest-card" onClick={() => setScreen('maze')}>
          {/* oxlint-disable-next-line next/no-img-element -- Vite app with a project-local generated game asset. */}
          <img src="/assets/enchanted-forest.webp" alt="Forêt enchantée éclairée par la lune avec un château au loin" />
          <span className="card-number">02</span>
          <div className="game-card-copy">
            <span className="game-type"><Crown /> Aventure</span>
            <h2>La princesse perdue</h2>
            <p>Guide Lola à travers les bois jusqu’au château.</p>
            <span className="play-link">Entrer dans la forêt <ArrowRight /></span>
          </div>
        </button>
      </section>
    </main>
  );
}
