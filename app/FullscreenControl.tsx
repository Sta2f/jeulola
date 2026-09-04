import { useEffect, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

type WebkitDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type WebkitElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

export function FullscreenControl() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    const update = () => {
      const webkitDocument = document as WebkitDocument;
      setIsFullscreen(Boolean(document.fullscreenElement ?? webkitDocument.webkitFullscreenElement));
    };
    update();
    document.addEventListener('fullscreenchange', update);
    document.addEventListener('webkitfullscreenchange', update);
    return () => {
      document.removeEventListener('fullscreenchange', update);
      document.removeEventListener('webkitfullscreenchange', update);
    };
  }, []);

  const toggleFullscreen = async () => {
    const webkitDocument = document as WebkitDocument;
    const root = document.documentElement as WebkitElement;
    try {
      if (document.fullscreenElement ?? webkitDocument.webkitFullscreenElement) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else await webkitDocument.webkitExitFullscreen?.();
      } else if (root.requestFullscreen) {
        await root.requestFullscreen();
      } else if (root.webkitRequestFullscreen) {
        await root.webkitRequestFullscreen();
      } else {
        setShowTip(true);
        window.setTimeout(() => setShowTip(false), 6500);
      }
    } catch {
      setShowTip(true);
      window.setTimeout(() => setShowTip(false), 6500);
    }
  };

  return <>
    <button className="app-fullscreen-button" type="button" onClick={toggleFullscreen} aria-label={isFullscreen ? 'Quitter le plein écran' : 'Passer en plein écran'}>
      {isFullscreen ? <Minimize2 /> : <Maximize2 />}
      <span>{isFullscreen ? 'Quitter' : 'Plein écran'}</span>
    </button>
    {showTip && <output className="fullscreen-tip">Sur iPad Safari : touche Partager, puis « Sur l’écran d’accueil » pour jouer réellement comme dans une app.</output>}
  </>;
}
