import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Home from './page';
import { FullscreenControl } from './FullscreenControl';
import './globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Home />
    <FullscreenControl />
  </StrictMode>,
);
