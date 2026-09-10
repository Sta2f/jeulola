import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Home from './page';
import { FullscreenControl } from './FullscreenControl';
import { ResponsiveTouch } from './ResponsiveTouch';
import './globals.css';
import './polish.css';
import './game-comfort.css';
import './math.css';
import './responsive.css';
import './audit-fixes.css';
import './play-space.css';
import './stories.css';
import './differences.css';
import './letters.css';
import './chicken.css';
import './chicken/joystick.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ResponsiveTouch />
    <Home />
    <FullscreenControl />
  </StrictMode>,
);
