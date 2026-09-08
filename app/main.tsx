import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Home from './page';
import { FullscreenControl } from './FullscreenControl';
import './globals.css';
import './polish.css';
import './game-comfort.css';
import './letters.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Home />
    <FullscreenControl />
  </StrictMode>,
);
