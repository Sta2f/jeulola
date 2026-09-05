import { useEffect, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { setAudioSettings, useAudioSettings } from './preferences';

type WebkitDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type WebkitElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

export function FullscreenControl() {
  const audio = useAudioSettings();
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
    <details className="sound-settings"><summary aria-label="Régler le volume">♪ <span>Volume</span></summary><label>Musique et sons <output>{Math.round(audio.volume * 100)} %</output><input aria-label="Volume de la musique et des bruitages" type="range" min="0" max="100" value={Math.round(audio.volume * 100)} onChange={(event) => setAudioSettings({ volume: Number(event.target.value) / 100 })} /></label></details>
    <button className="app-fullscreen-button" type="button" onClick={toggleFullscreen} aria-label={isFullscreen ? 'Quitter le plein écran' : 'Passer en plein écran'}>
      {isFullscreen ? <Minimize2 /> : <Maximize2 />}
      <span>{isFullscreen ? 'Quitter' : 'Plein écran'}</span>
    </button>
    {showTip && <output className="fullscreen-tip">Sur iPad Safari : touche Partager, puis « Sur l’écran d’accueil » pour jouer réellement comme dans une app.</output>}
  </>;
}
