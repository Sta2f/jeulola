/* oxlint-disable next/no-img-element -- Vite game; images are locally rendered WebGL thumbnails. */
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  ArrowLeft,
  Check,
  Eraser,
  Hand,
  Move,
  RotateCcw,
  RotateCw,
  Undo2,
  Redo2,
  Plus,
  Minus,
  Sprout,
  X,
  Trash2,
  Hammer,
  Eye,
  Sparkles,
  Pause,
  Play,
  Camera,
  FolderHeart,
  Copy,
  Maximize,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { readSaved, getAudioSettings } from './preferences';
import { BY_ID, CATEGORIES, PIECES } from './construction/catalog';
import {
  emptyWorld,
  placePiece,
  starterWorld,
  validWorld,
  movePiece,
  removePiece,
  type World,
} from './construction/world';
import {
  createConstructionScene,
  type BuildMode,
  type ConstructionScene,
  type Stage,
  type Target,
} from './construction/scene';

type SavedWorld = { id: string; name: string; world: World; image?: string };
type Collection = { active: string; worlds: SavedWorld[] };
function initialCollection(): Collection {
  const value = readSaved<Collection | null>('construction:v2', null);
  if (
    value &&
    Array.isArray(value.worlds) &&
    value.worlds.length > 0 &&
    value.worlds.length <= 12 &&
    value.worlds.every(
      (s) =>
        s &&
        typeof s.id === 'string' &&
        typeof s.name === 'string' &&
        validWorld(s.world),
    ) &&
    value.worlds.some((s) => s.id === value.active)
  )
    return value;
  return {
    active: 'first',
    worlds: [{ id: 'first', name: 'Le jardin de Lola', world: starterWorld() }],
  };
}
function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="construction-modal"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <button
        className="construction-close"
        aria-label="Fermer"
        onClick={onClose}
      >
        <X />
      </button>
      <h2>{title}</h2>
      {children}
    </dialog>
  );
}
export default function ConstructionGame({ onBack }: { onBack: () => void }) {
  const [collection, setCollection] = useState(initialCollection);
  const active = collection.worlds.find((w) => w.id === collection.active)!;
  const world = active.world;
  const [category, setCategory] = useState('Nature'),
    [selected, setSelected] = useState('grass'),
    [rotation, setRotation] = useState(0),
    [mode, setMode] = useState<BuildMode>('build'),
    [stage, setStage] = useState<Stage>('build');
  const [images, setImages] = useState<Record<string, string>>({}),
    [failed, setFailed] = useState(false),
    [saved, setSaved] = useState(true),
    [paused, setPaused] = useState(false),
    [drawer, setDrawer] = useState(true);
  const [message, setMessage] = useState(
    'Choisis un bloc et glisse-le sur le plateau',
  );
  const [modal, setModal] = useState<'worlds' | 'new' | null>(null),
    [deleteId, setDeleteId] = useState<string | null>(null),
    [name, setName] = useState('');
  const [history, setHistory] = useState<World[]>([]),
    [future, setFuture] = useState<World[]>([]),
    [ghost, setGhost] = useState<{ id: string; x: number; y: number } | null>(
      null,
    );
  const host = useRef<HTMLDivElement>(null),
    scene = useRef<ConstructionScene | null>(null),
    audio = useRef<AudioContext | null>(null),
    piecesList = useRef<HTMLDivElement>(null);
  const state = useRef({ world, selected, rotation, mode, stage });
  useLayoutEffect(() => {
    state.current = { world, selected, rotation, mode, stage };
  }, [world, selected, rotation, mode, stage]);
  const drag = useRef<{
      id: string;
      x: number;
      y: number;
      pointer: number;
      moved: boolean;
    } | null>(null),
    actionRef = useRef<(target: Target, source?: string) => void>(() => {});
  function sound() {
    const settings = getAudioSettings();
    if (!settings.enabled || settings.volume === 0) return;
    try {
      audio.current ??= new AudioContext();
      const ctx = audio.current;
      void ctx.resume();
      const osc = ctx.createOscillator(),
        gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(620, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1050, ctx.currentTime + 0.07);
      gain.gain.setValueAtTime(0.065 * settings.volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.17);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    } catch {
      /* Sound is optional. */
    }
  }
  function updateWorld(next: World) {
    state.current.world = next;
    setCollection((c) => ({
      ...c,
      worlds: c.worlds.map((w) =>
        w.id === c.active ? { ...w, world: next } : w,
      ),
    }));
  }
  function commit(next: World) {
    const previous = state.current.world;
    setHistory((h) => [...h.slice(-39), previous]);
    setFuture([]);
    updateWorld(next);
    sound();
  }
  function act(target: Target, source?: string) {
    const current = state.current;
    if (current.stage !== 'build') return;
    let next: World | null = null;
    if (current.mode === 'erase') {
      if (!target.uid) return;
      next = removePiece(current.world, target.uid);
    } else if (current.mode === 'move') {
      if (!source) return;
      next = movePiece(current.world, source, target.x, target.z);
    } else if (current.mode === 'build')
      next = placePiece(
        current.world,
        current.selected,
        target.x,
        target.z,
        current.rotation,
      );
    if (next) {
      commit(next);
      setMessage(
        current.mode === 'erase'
          ? 'Pièce enlevée. Tu peux annuler !'
          : current.mode === 'move'
            ? 'La petite construction a trouvé sa place !'
            : `${BY_ID[current.selected].name} : bien posé !`,
      );
    } else
      setMessage(
        current.mode === 'erase'
          ? 'Enlève d’abord les pièces du dessus.'
          : 'Essaie une surface libre et plate, avec assez de cases.',
      );
  }
  useLayoutEffect(() => {
    actionRef.current = act;
  });
  useEffect(() => {
    let engine: ConstructionScene | undefined;
    const task = requestAnimationFrame(() => {
      if (!host.current) return;
      try {
        engine = createConstructionScene(
          host.current,
          (target, source) => actionRef.current(target, source),
          setImages,
          () => setFailed(true),
        );
        scene.current = engine;
        engine.setWorld(state.current.world);
      } catch {
        setFailed(true);
      }
    });
    return () => {
      cancelAnimationFrame(task);
      engine?.dispose();
      scene.current = null;
      void audio.current?.close();
      audio.current = null;
    };
  }, []);
  useEffect(() => {
    scene.current?.setWorld(world);
  }, [world]);
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        localStorage.setItem(
          'lola:construction:v2',
          JSON.stringify(collection),
        );
        setSaved(true);
      } catch {
        setSaved(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [collection]);
  useEffect(() => {
    scene.current?.setMode(mode, stage, paused);
  }, [mode, stage, paused]);
  useEffect(() => {
    scene.current?.setSelection(selected, rotation);
  }, [selected, rotation]);
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d || d.pointer !== e.pointerId) return;
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 8) d.moved = true;
      if (d.moved) {
        setGhost({ id: d.id, x: e.clientX, y: e.clientY });
        scene.current?.hover(e.clientX, e.clientY);
      }
    };
    const up = (e: PointerEvent) => {
      const d = drag.current;
      if (!d || d.pointer !== e.pointerId) return;
      if (d.moved) {
        const target = scene.current?.drop(e.clientX, e.clientY);
        if (target) actionRef.current(target);
      }
      drag.current = null;
      setGhost(null);
      scene.current?.clearPreview();
    };
    const cancel = () => {
      drag.current = null;
      setGhost(null);
      scene.current?.clearPreview();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('blur', cancel);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('blur', cancel);
    };
  }, []);
  function chooseMode(tool: BuildMode) {
    setMode(tool);
    setMessage(
      tool === 'rotate'
        ? 'Glisse un doigt sur le plateau pour le tourner.'
        : tool === 'move'
          ? 'Fais glisser une pièce du plateau vers sa nouvelle place.'
          : tool === 'erase'
            ? 'Touche la pièce à enlever.'
            : 'Choisis un bloc et glisse-le sur le plateau',
    );
  }
  function chooseStage(next: Stage) {
    setStage(next);
    setPaused(false);
    setMode('build');
    setMessage(
      next === 'visit'
        ? 'Tourne autour de ton petit monde.'
        : next === 'live'
          ? 'Ton petit monde s’éveille…'
          : 'Choisis un bloc et glisse-le sur le plateau',
    );
  }
  function undo() {
    if (!history.length) return;
    setFuture((f) => [world, ...f]);
    updateWorld(history.at(-1)!);
    setHistory((h) => h.slice(0, -1));
  }
  function redo() {
    if (!future.length) return;
    setHistory((h) => [...h, world]);
    updateWorld(future[0]);
    setFuture((f) => f.slice(1));
  }
  function capture() {
    const image = scene.current?.thumbnail();
    if (image)
      setCollection((c) => ({
        ...c,
        worlds: c.worlds.map((w) => (w.id === c.active ? { ...w, image } : w)),
      }));
  }
  function newWorld(kind: 'empty' | 'garden' | 'island') {
    const id = crypto.randomUUID();
    setCollection((c) => ({
      ...c,
      active: id,
      worlds: [
        ...c.worlds,
        {
          id,
          name: name.trim().slice(0, 40) || `Mon monde ${c.worlds.length + 1}`,
          world:
            kind === 'empty' ? emptyWorld() : starterWorld(kind === 'island'),
        },
      ],
    }));
    setHistory([]);
    setFuture([]);
    setModal(null);
    setName('');
    chooseStage('build');
    scene.current?.resetView();
  }
  function openWorld(id: string) {
    setCollection((c) => ({ ...c, active: id }));
    setHistory([]);
    setFuture([]);
    setModal(null);
    chooseStage('build');
    scene.current?.resetView();
  }
  const piece = BY_ID[selected];
  function scrollPieces(direction: number) {
    const el = piecesList.current;
    if (el)
      el.scrollBy({
        left: direction * el.clientWidth * 0.8,
        top: direction * el.clientHeight * 0.8,
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
      });
  }
  return (
    <main
      className={`construction-game stage-${stage} ${drawer ? '' : 'drawer-closed'}`}
    >
      <header className="construction-top">
        <button
          aria-label="Les jeux"
          onClick={() => {
            capture();
            onBack();
          }}
        >
          <ArrowLeft /> <span>Les jeux</span>
        </button>
        <h1>
          Le petit monde de <span>Lola</span>
        </h1>
        <div>
          <span className="construction-save">
            <Check />
            {saved ? 'Sauvegardé' : 'Non sauvegardé'}
          </span>
          <button
            aria-label="Mes mondes"
            onClick={() => {
              capture();
              setModal('worlds');
            }}
          >
            <FolderHeart />
            <span>Mes mondes</span>
          </button>
        </div>
      </header>
      <section className="construction-workshop">
        <div className="construction-play">
          <div className="construction-caption">
            <span>{active.name}</span>
            <p aria-live="polite">{message}</p>
          </div>
          <div className="construction-canvas" ref={host} />
          {failed && (
            <div className="construction-error">
              <h2>Un petit redémarrage ?</h2>
              <p>
                Le plateau 3D n’a pas pu démarrer. Tes mondes sauvegardés
                restent sur cet appareil.
              </p>
              <button onClick={() => window.location.reload()}>
                Réessayer
              </button>
              <button onClick={onBack}>Les jeux</button>
            </div>
          )}
          {!Object.keys(images).length && !failed && (
            <div className="construction-loading">
              <span />
              <span />
              <span />
              <p>Les petits blocs arrivent…</p>
            </div>
          )}
          <div className="construction-zoom">
            <button
              aria-label="Tourner à gauche"
              onClick={() => scene.current?.rotate(-1)}
            >
              <RotateCcw />
            </button>
            <button
              aria-label="Tourner à droite"
              onClick={() => scene.current?.rotate(1)}
            >
              <RotateCw />
            </button>
            <button
              aria-label="Dézoomer"
              onClick={() => scene.current?.zoom(-1)}
            >
              <Minus />
            </button>
            <button aria-label="Zoomer" onClick={() => scene.current?.zoom(1)}>
              <Plus />
            </button>
            <button
              aria-label="Vue de départ"
              onClick={() => scene.current?.resetView()}
            >
              <Maximize />
            </button>
          </div>
          {stage === 'build' && (
            <div
              className="construction-tools"
              aria-label="Outils de construction"
            >
              <button
                className="mint"
                aria-pressed={mode === 'build'}
                onClick={() => chooseMode('build')}
              >
                <Plus />
                Poser
              </button>
              <button
                className="mint"
                aria-pressed={mode === 'rotate'}
                onClick={() =>
                  chooseMode(mode === 'rotate' ? 'build' : 'rotate')
                }
              >
                <RotateCw />
                Tourner
              </button>
              <button
                className="peach"
                aria-pressed={mode === 'move'}
                onClick={() => chooseMode(mode === 'move' ? 'build' : 'move')}
              >
                <Move />
                Déplacer
              </button>
              <button
                className="rose"
                aria-pressed={mode === 'erase'}
                onClick={() => chooseMode(mode === 'erase' ? 'build' : 'erase')}
              >
                <Eraser />
                Gomme
              </button>
              <button
                className="lilac"
                disabled={!history.length}
                onClick={undo}
              >
                <Undo2 />
                Annuler
              </button>
              <button
                className="lilac"
                disabled={!future.length}
                aria-label="Rétablir"
                onClick={redo}
              >
                <Redo2 />
              </button>
            </div>
          )}
          {stage !== 'build' && (
            <div className="construction-tools">
              {stage === 'live' && (
                <button className="mint" onClick={() => setPaused((v) => !v)}>
                  {paused ? <Play /> : <Pause />}
                  {paused ? 'Continuer' : 'Pause'}
                </button>
              )}
              <button
                className="lilac"
                onClick={() => {
                  const url = scene.current?.photo();
                  if (url) {
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'Le-petit-monde-de-Lola.png';
                    a.click();
                    setMessage('La photo de ton monde est téléchargée.');
                  }
                }}
              >
                <Camera />
                Prendre une photo
              </button>
            </div>
          )}
        </div>
        {stage === 'build' && (
          <aside className="construction-drawer" aria-label="Boîte de blocs">
            <header>
              <h2>Mes blocs</h2>
              <div className="construction-page-buttons">
                <button
                  aria-label="Blocs précédents"
                  onClick={() => scrollPieces(-1)}
                >
                  <ChevronLeft />
                </button>
                <button
                  aria-label="Blocs suivants"
                  onClick={() => scrollPieces(1)}
                >
                  <ChevronRight />
                </button>
              </div>
              <button
                className="drawer-toggle"
                aria-label={drawer ? 'Replier les blocs' : 'Ouvrir les blocs'}
                onClick={() => setDrawer((v) => !v)}
              >
                <ChevronDown />
              </button>
              <span>{PIECES.length} petites merveilles</span>
            </header>
            <div
              className="construction-categories"
              aria-label="Familles de blocs"
            >
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  aria-pressed={category === c}
                  onClick={() => {
                    setCategory(c);
                    piecesList.current?.scrollTo(0, 0);
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="construction-pieces" ref={piecesList}>
              {PIECES.filter((p) => p.category === category).map((p) => (
                <button
                  key={p.id}
                  aria-label={p.name}
                  aria-pressed={selected === p.id && mode === 'build'}
                  onPointerDown={(e) => {
                    if (e.button !== 0 || !e.isPrimary) return;
                    setSelected(p.id);
                    setMode('build');
                    state.current.selected = p.id;
                    state.current.mode = 'build';
                    scene.current?.setSelection(p.id, rotation);
                    drag.current = {
                      id: p.id,
                      x: e.clientX,
                      y: e.clientY,
                      pointer: e.pointerId,
                      moved: false,
                    };
                    e.currentTarget.setPointerCapture(e.pointerId);
                  }}
                  onClick={() => {
                    setSelected(p.id);
                    setMode('build');
                    setMessage(`${p.name} : glisse ou touche une case.`);
                  }}
                >
                  {images[p.id] ? (
                    <img src={images[p.id]} alt="" draggable={false} />
                  ) : (
                    <span className="construction-placeholder" />
                  )}
                  <span>{p.name}</span>
                  {p.w * p.d > 1 && (
                    <small>
                      {p.w} × {p.d}
                    </small>
                  )}
                </button>
              ))}
            </div>
            <div className="construction-selection">
              <span>
                {piece.name}
                <small>
                  {piece.w} × {piece.d} case{piece.w * piece.d > 1 ? 's' : ''}
                </small>
              </span>
              <button
                aria-label="Tourner la pièce"
                title="Tourner la pièce"
                onClick={() => setRotation((r) => (r + 1) % 4)}
              >
                <RotateCw />
                <small>{rotation * 90}°</small>
              </button>
            </div>
            <p className="construction-drawer-tip">
              <Hand />
              Glisse, ou touche puis pose.
            </p>
          </aside>
        )}
      </section>
      <footer className="construction-footer">
        <span>Rêve · Construis · Grandis</span>
        <nav aria-label="Modes de jeu">
          <button
            aria-pressed={stage === 'build'}
            onClick={() => chooseStage('build')}
          >
            <Hammer />
            Construire
          </button>
          <button
            aria-pressed={stage === 'visit'}
            onClick={() => chooseStage('visit')}
          >
            <Eye />
            Visiter
          </button>
          <button
            aria-pressed={stage === 'live'}
            onClick={() => chooseStage('live')}
          >
            <Sparkles />
            Faire vivre
          </button>
        </nav>
        <span>À toi d’imaginer.</span>
      </footer>
      {ghost && (
        <div
          className="construction-ghost"
          style={{ left: ghost.x, top: ghost.y }}
        >
          <img src={images[ghost.id]} alt="" />
        </div>
      )}
      {modal === 'worlds' && (
        <Modal title="Mes petits mondes" onClose={() => setModal(null)}>
          <p className="construction-storage-note">
            Sauvegardés sur cet appareil.
            {!saved &&
              ' La mémoire est pleine : la dernière modification n’a pas été enregistrée.'}
          </p>
          <div className="construction-world-list">
            {collection.worlds.map((w) => (
              <article key={w.id}>
                <button onClick={() => openWorld(w.id)}>
                  {w.image ? <img src={w.image} alt="" /> : <Sprout />}
                  <strong>{w.name}</strong>
                  <small>{w.world.length} pièces</small>
                </button>
                <div>
                  <button
                    disabled={collection.worlds.length >= 12}
                    aria-label={`Dupliquer ${w.name}`}
                    onClick={() => {
                      const id = crypto.randomUUID();
                      setCollection((c) => ({
                        ...c,
                        worlds: [
                          ...c.worlds,
                          { ...w, id, name: `${w.name} (copie)` },
                        ],
                      }));
                    }}
                  >
                    <Copy />
                  </button>
                  <button
                    disabled={collection.worlds.length === 1}
                    aria-label={`Supprimer ${w.name}`}
                    onClick={() => setDeleteId(w.id)}
                  >
                    <Trash2 />
                  </button>
                </div>
              </article>
            ))}
          </div>
          <button
            className="mint"
            disabled={collection.worlds.length >= 12}
            onClick={() => setModal('new')}
          >
            <Plus />
            Nouveau monde
          </button>
          {deleteId && (
            <div className="construction-delete">
              <p>
                Supprimer «{' '}
                {collection.worlds.find((w) => w.id === deleteId)?.name} » ?
              </p>
              <button onClick={() => setDeleteId(null)}>Je le garde</button>
              <button
                className="rose"
                onClick={() => {
                  setCollection((c) => {
                    const worlds = c.worlds.filter((w) => w.id !== deleteId);
                    return {
                      worlds,
                      active: c.active === deleteId ? worlds[0].id : c.active,
                    };
                  });
                  setDeleteId(null);
                  setHistory([]);
                  setFuture([]);
                }}
              >
                Supprimer ce monde
              </button>
            </div>
          )}
        </Modal>
      )}
      {modal === 'new' && (
        <Modal title="Un nouveau petit monde" onClose={() => setModal(null)}>
          <label className="construction-name">
            Son petit nom
            <input
              maxLength={40}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Mon monde ${collection.worlds.length + 1}`}
            />
          </label>
          <div className="construction-new-choices">
            <button onClick={() => newWorld('empty')}>
              <Plus />
              Plateau vide<small>Tout commence avec toi</small>
            </button>
            <button onClick={() => newWorld('garden')}>
              <Sprout />
              Petit jardin<small>Une histoire à continuer</small>
            </button>
            <button onClick={() => newWorld('island')}>
              <Sparkles />
              Petite île<small>Les pieds dans l’eau</small>
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}
