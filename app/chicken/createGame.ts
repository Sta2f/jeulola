// oxlint-disable-next-line import/default -- Phaser 3 exports CommonJS; Vite supplies default interop.
import Phaser from 'phaser';
import { createWorld, startWorld, stepWorld, WORLD, PEN, type Vec2, type WorldState } from './model';
import { createFarmTextures, preloadFarmAssets, drawFarm } from './art';

export type FarmSnapshot = { status: WorldState['status']; captured: number; remaining: number; stars: number };
export type FarmController = ReturnType<typeof createChickenGame>;
const LOLA_SIZE = 146;
const HEN_SIZE = 114;
const POSES = ['idle', 'peck', 'walk-0', 'walk-1', 'panic', 'captured'];

/** World coordinates and physics remain fixed; only the illustrated camera viewport resizes. */
export function createChickenGame(parent: HTMLDivElement, onChange: (snapshot: FarmSnapshot) => void, onCapture: () => void, onReady: () => void = () => {}, onError: () => void = () => {}) {
  let world = createWorld();
  let input: Vec2 = { x: 0, y: 0 };
  let lastSnapshot = '';
  let sceneReady = false;
  const publish = () => {
    const snapshot = { status: world.status, captured: world.captured, remaining: Math.max(0, Math.ceil(90 - world.elapsed)), stars: world.stars };
    const serialized = JSON.stringify(snapshot);
    if (serialized !== lastSnapshot) { lastSnapshot = serialized; onChange(snapshot); }
  };
  const clearInput = () => { input = { x: 0, y: 0 }; world.player.vx = 0; world.player.vy = 0; };
  class FarmScene extends Phaser.Scene {
    private lola!: Phaser.GameObjects.Image;
    private lolaShadow!: Phaser.GameObjects.Image;
    private hens: Phaser.GameObjects.Image[] = [];
    private shadows: Phaser.GameObjects.Image[] = [];
    private panic: Phaser.GameObjects.Text[] = [];
    private guide!: Phaser.GameObjects.Container;
    private guideArrow!: Phaser.GameObjects.Text;
    private ambient!: ReturnType<typeof drawFarm>;
    private focus = new Phaser.Math.Vector2();
    private clock = 0;
    private lastDust = 0;
    private reactionUntil = 0;
    private cameraReset = true;
    private failed = false;
    preload() {
      preloadFarmAssets(this);
      for (const direction of ['down', 'up', 'right']) for (let i = 0; i < 4; i++) {
        this.load.image(`lola-walk-${direction}-${i}`, `/assets/chicken/lola/walk-${direction}-${i}.png`);
      }
      for (const name of ['idle-down', 'run-right', 'surprised', 'victory']) this.load.image(`lola-${name}`, `/assets/chicken/lola/${name}.png`);
      for (const color of ['white', 'brown', 'black']) for (const pose of POSES) this.load.image(`hen-${color}-${pose}`, `/assets/chicken/hens/${color}-${pose}.png`);
      this.load.on('loaderror', () => { this.failed = true; onError(); });
    }
    create() {
      if (this.failed) return;
      createFarmTextures(this);
      this.ambient = drawFarm(this);
      this.lolaShadow = this.add.image(0, 0, 'shadow').setDisplaySize(68, 23);
      this.lola = this.add.image(0, 0, 'lola-idle-down').setOrigin(.5, .96).setDisplaySize(LOLA_SIZE, LOLA_SIZE);
      this.hens = world.chickens.map(chicken => this.add.image(chicken.x, chicken.y, `hen-${chicken.color}-idle`).setOrigin(.5, .945).setDisplaySize(HEN_SIZE, HEN_SIZE));
      this.shadows = world.chickens.map(() => this.add.image(0, 0, 'shadow').setDisplaySize(68, 21));
      this.panic = world.chickens.map(() => this.add.text(0, 0, '!', { fontFamily: 'Georgia, serif', fontSize: '25px', fontStyle: 'bold', color: '#b65335', stroke: '#fff5da', strokeThickness: 5 }).setOrigin(.5));
      const plate = this.add.graphics().fillStyle(0xffedc6, .88).lineStyle(2, 0xab743d, .85).fillRoundedRect(-51, -20, 102, 40, 13).strokeRoundedRect(-51, -20, 102, 40, 13);
      const label = this.add.text(-7, 0, 'Enclos', { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '14px', color: '#654327', fontStyle: 'bold' }).setOrigin(.5);
      this.guideArrow = this.add.text(34, 0, '➜', { fontSize: '23px', color: '#5b7437' }).setOrigin(.5);
      this.guide = this.add.container(0, 0, [plate, label, this.guideArrow]).setScrollFactor(0).setDepth(3000);
      this.scale.on('resize', this.fitCamera, this);
      this.events.once('shutdown', () => this.scale.off('resize', this.fitCamera, this));
      this.fitCamera(); sceneReady = true; this.renderWorld(0); publish(); onReady();
    }
    fitCamera = () => {
      const w = this.scale.width, h = this.scale.height;
      const zoom = w < h ? Phaser.Math.Clamp(w / 650, .82, 1.28) : Phaser.Math.Clamp(w / 840, .9, 1.6);
      const camera = this.cameras.main;
      camera.setBounds(-180, -200, WORLD.width + 360, WORLD.height + 400);
      camera.setZoom(zoom);
      camera.startFollow(this.focus, false, .075, .075);
      camera.setDeadzone(65 / zoom, 45 / zoom);
      this.cameraReset = true;
    };
    puff(x: number, y: number, feathers = false) {
      const puff = this.add.ellipse(x, y - 3, 18, 9, 0xffe7b8, .55).setDepth(y - 1);
      this.tweens.add({ targets: puff, x: x - 8, y: y - 13, scale: 1.8, alpha: 0, duration: 520, ease: 'Sine.Out', onComplete: () => puff.destroy() });
      if (feathers) {
        const feather = this.add.image(x, y - 38, 'feather').setDisplaySize(11, 17).setDepth(y + 2);
        this.tweens.add({ targets: feather, x: x + Math.sin(this.clock) * 25, y: y - 8, angle: 130, alpha: 0, duration: 720, ease: 'Sine.Out', onComplete: () => feather.destroy() });
      }
    }
    burst(x: number, y: number) {
      this.reactionUntil = this.clock + 440;
      const label = this.add.text(x, y - 75, 'Bien rentrée ! ♥', { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '20px', fontStyle: 'bold', color: '#46642e', stroke: '#fff5cb', strokeThickness: 6 }).setOrigin(.5).setDepth(2000);
      this.tweens.add({ targets: label, y: y - 130, alpha: 0, duration: 1600, ease: 'Sine.Out', onComplete: () => label.destroy() });
      for (let n = 0; n < 10; n++) {
        const particle = n % 3 ? this.add.image(x, y - 30, 'feather').setDisplaySize(13, 22) : this.add.text(x, y - 40, '✦', { fontSize: '23px', color: '#ffe58d' });
        particle.setDepth(1600);
        this.tweens.add({ targets: particle, x: x + Math.cos(n * Math.PI / 5) * 64, y: y - 45 + Math.sin(n * Math.PI / 5) * 45, angle: n * 60, alpha: 0, duration: 1100, ease: 'Cubic.Out', onComplete: () => particle.destroy() });
      }
    }
    renderWorld(delta: number) {
      const playing = world.status === 'playing', moving = playing && Math.hypot(world.player.vx, world.player.vy) > 1;
      const direction = world.player.facing === 'left' ? 'right' : world.player.facing;
      const frame = Math.floor(this.clock / 130) % 4;
      let pose = moving ? `walk-${direction}-${frame}` : direction === 'down' ? 'idle-down' : `walk-${direction}-1`;
      if (moving && direction === 'right' && Math.hypot(world.player.vx, world.player.vy) > 175 && frame === 2) pose = 'run-right';
      if (!moving && this.clock < this.reactionUntil) pose = 'surprised';
      if (world.status === 'won') pose = 'victory';
      const bob = moving ? Math.abs(Math.sin(this.clock / 105)) * 3 : world.status === 'won' ? Math.abs(Math.sin(this.clock / 240)) * 7 : 0;
      this.lola.setTexture(`lola-${pose}`).setPosition(world.player.x, world.player.y - bob).setDepth(world.player.y).setFlipX(world.player.facing === 'left' && pose !== 'victory' && pose !== 'surprised').setAngle(moving ? Math.sin(this.clock / 140) * 1.4 : 0);
      this.lolaShadow.setPosition(world.player.x, world.player.y - 2).setDepth(world.player.y - 1);
      world.chickens.forEach((chicken, i) => {
        const speed = Math.hypot(chicken.vx, chicken.vy), running = playing && speed > 8;
        const panic = chicken.state === 'flee' || chicken.state === 'panic';
        let henPose = running ? `walk-${Math.floor(this.clock / (panic ? 95 : 200) + i) % 2}` : Math.sin(this.clock / 850 + i * 2) > .65 ? 'peck' : 'idle';
        if (panic && Math.floor(this.clock / 160) % 3 === 0) henPose = 'panic';
        if (chicken.state === 'captured') henPose = 'captured';
        const hop = running ? Math.abs(Math.sin(this.clock / (panic ? 85 : 150) + i)) * (panic ? 5 : 2) : 0;
        this.hens[i].setTexture(`hen-${chicken.color}-${henPose}`).setPosition(chicken.x, chicken.y - hop).setDepth(chicken.y).setFlipX(chicken.facing === 'left').setAngle(running ? Math.sin(this.clock / 95 + i) * 2.5 : 0);
        this.shadows[i].setPosition(chicken.x, chicken.y - 2).setDepth(chicken.y - 1);
        this.panic[i].setPosition(chicken.x + 31, chicken.y - 103 - hop).setDepth(chicken.y + 1).setVisible(playing && chicken.state === 'panic');
      });
      this.focus.set(world.player.x + (this.scale.width > 650 ? 75 : -35), world.player.y - 25);
      const camera = this.cameras.main;
      camera.setLerp(1 - Math.exp(-Math.max(delta, 1) / 190));
      if (this.cameraReset) { camera.centerOn(this.focus.x, this.focus.y); this.cameraReset = false; }
      const view = camera.worldView;
      const outside = PEN.x > view.right - 40 || PEN.x < view.left + 40 || 320 < view.top + 50 || 320 > view.bottom - 45;
      this.guide.setVisible(playing && outside);
      const guideX = this.scale.width - 70, guideY = this.scale.height - 105;
      this.guide.setScale(1 / camera.zoom).setPosition(
        this.scale.width / 2 + (guideX - this.scale.width / 2) / camera.zoom,
        this.scale.height / 2 + (guideY - this.scale.height / 2) / camera.zoom,
      );
      this.guideArrow.setRotation(Math.atan2(320 - world.player.y, PEN.x - world.player.x));
      parent.dataset.playerX = world.player.x.toFixed(2); parent.dataset.playerY = world.player.y.toFixed(2);
      parent.dataset.status = world.status;
      parent.dataset.camera = JSON.stringify({ x: camera.scrollX, y: camera.scrollY, zoom: camera.zoom, width: camera.width, height: camera.height });
      parent.dataset.chickens = JSON.stringify(world.chickens.map(({ x, y, state }) => ({ x, y, state })));
    }
    update(_time: number, delta: number) {
      if (!sceneReady) return;
      const active = world.status === 'playing' || world.status === 'ready' || world.status === 'won';
      if (active) this.clock += Math.min(delta, 250);
      this.tweens.timeScale = active ? 1 : 0;
      this.ambient.update(this.clock, delta, active);
      const before = world.chickens.map(chicken => chicken.state);
      stepWorld(world, input, delta / 1000);
      world.chickens.forEach((chicken, i) => { if (chicken.state === 'captured' && before[i] !== 'captured') { this.burst(chicken.x, chicken.y); onCapture(); } });
      if (world.status === 'playing' && this.clock - this.lastDust > 170) {
        this.lastDust = this.clock;
        if (Math.hypot(world.player.vx, world.player.vy) > 30) this.puff(world.player.x, world.player.y);
        world.chickens.forEach(chicken => { if (chicken.state === 'flee' || chicken.state === 'panic') this.puff(chicken.x, chicken.y, Math.floor(this.clock / 170) % 3 === 0); });
      }
      this.renderWorld(delta); publish();
    }
  }
  const game = new Phaser.Game({ type: Phaser.AUTO, parent, width: parent.clientWidth || 1000, height: parent.clientHeight || 680,
    backgroundColor: '#88ad42', antialias: true, scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.NO_CENTER },
    input: { keyboard: false, mouse: false, touch: false }, audio: { noAudio: true }, scene: FarmScene,
    render: { pixelArt: false, roundPixels: false },
  });
  const resize = new ResizeObserver(() => { clearInput(); game.scale.refresh(); }); resize.observe(parent);
  return {
    setInput(next: Vec2) { input = next; if (!next.x && !next.y) clearInput(); },
    start() { if (!sceneReady) return; clearInput(); startWorld(world); publish(); },
    pause() { clearInput(); if (world.status === 'playing') world.status = 'paused'; publish(); },
    resume() { clearInput(); if (world.status === 'paused') world.status = 'playing'; publish(); },
    restart() { clearInput(); world = createWorld(); startWorld(world); publish(); },
    destroy() { resize.disconnect(); clearInput(); game.destroy(true); },
  };
}
