// oxlint-disable-next-line import/default -- Phaser 3 exports CommonJS; Vite supplies default interop.
import Phaser from 'phaser';
import { createWorld, startWorld, stepWorld, WORLD, type Vec2, type WorldState } from './model';
import { createFarmTextures, drawFarm } from './art';

export type FarmSnapshot = { status: WorldState['status']; captured: number; remaining: number; stars: number };
export type FarmController = ReturnType<typeof createChickenGame>;

/** The scene only renders the model. Both controls feed this single movement vector. */
export function createChickenGame(parent: HTMLDivElement, onChange: (snapshot: FarmSnapshot) => void, onCapture: () => void) {
  let world = createWorld();
  let input: Vec2 = { x: 0, y: 0 };
  let lastSnapshot = '';
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
    private lastDust = 0;
    create() {
      createFarmTextures(this);
      drawFarm(this);
      this.lolaShadow = this.add.image(0, 0, 'shadow').setDisplaySize(50, 17);
      this.lola = this.add.image(0, 0, 'lola-down').setOrigin(.5, 1).setDisplaySize(64, 96);
      this.hens = world.chickens.map(chicken => this.add.image(chicken.x, chicken.y, `chicken-${chicken.color}`).setOrigin(.5, 1).setDisplaySize(70, 63));
      this.shadows = world.chickens.map(() => this.add.image(0, 0, 'shadow').setDisplaySize(48, 15));
      this.panic = world.chickens.map(() => this.add.text(0, 0, '!', { fontFamily: 'Georgia, serif', fontSize: '26px', fontStyle: 'bold', color: '#a54535', stroke: '#fff7d7', strokeThickness: 4 }).setOrigin(.5));
      publish();
      this.renderWorld(0);
    }
    burst(x: number, y: number) {
      const label = this.add.text(x, y - 45, 'Bien rentrée ! ♥', { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#476b31', stroke: '#fff6cd', strokeThickness: 6 }).setOrigin(.5).setDepth(2000);
      this.tweens.add({ targets: label, y: y - 100, alpha: 0, duration: 1400, onComplete: () => label.destroy() });
      for (let n = 0; n < 8; n++) {
        const feather = this.add.image(x, y - 18, 'feather').setDisplaySize(12, 20).setDepth(1500);
        this.tweens.add({ targets: feather, x: x + Math.cos(n * Math.PI / 4) * 65, y: y - 30 + Math.sin(n * Math.PI / 4) * 40, angle: n * 70, alpha: 0, duration: 900, onComplete: () => feather.destroy() });
      }
    }
    renderWorld(time: number) {
      const moving = world.status === 'playing' && Math.hypot(world.player.vx, world.player.vy) > 1;
      const bob = moving ? Math.abs(Math.sin(time / 80)) * 4 : 0;
      this.lola.setTexture(`lola-${world.player.facing}`).setPosition(world.player.x, world.player.y - bob).setDepth(world.player.y).setAngle(moving ? Math.sin(time / 80) * 3 : 0);
      this.lolaShadow.setPosition(world.player.x, world.player.y - 3).setDepth(world.player.y - 1);
      world.chickens.forEach((chicken, i) => {
        const running = world.status === 'playing' && Math.hypot(chicken.vx, chicken.vy) > 8;
        const hop = running ? Math.abs(Math.sin(time / 65 + i)) * 3 : 0;
        this.hens[i].setPosition(chicken.x, chicken.y - hop).setDepth(chicken.y).setFlipX(chicken.vx < -1).setAngle(running ? Math.sin(time / 70 + i) * 6 : 0);
        this.shadows[i].setPosition(chicken.x, chicken.y - 3).setDepth(chicken.y - 1);
        this.panic[i].setPosition(chicken.x, chicken.y - 76 - hop).setDepth(chicken.y + 1).setVisible(chicken.state === 'panic' || chicken.state === 'flee');
      });
      // Read-only observability also makes input and rendering regressions testable.
      parent.dataset.playerX = world.player.x.toFixed(2);
      parent.dataset.playerY = world.player.y.toFixed(2);
      parent.dataset.status = world.status;
      parent.dataset.chickens = JSON.stringify(world.chickens.map(({ x, y, state }) => ({ x, y, state })));
    }
    update(time: number, delta: number) {
      const before = world.chickens.map(chicken => chicken.state);
      stepWorld(world, input, delta / 1000);
      world.chickens.forEach((chicken, index) => {
        if (chicken.state === 'captured' && before[index] !== 'captured') { this.burst(chicken.x, chicken.y); onCapture(); }
      });
      if (world.status === 'playing' && time - this.lastDust > 190 && Math.hypot(world.player.vx, world.player.vy) > 30) {
        this.lastDust = time;
        const puff = this.add.ellipse(world.player.x, world.player.y - 2, 13, 7, 0xffe5b2, .45).setDepth(world.player.y - 2);
        this.tweens.add({ targets: puff, scale: 1.7, alpha: 0, duration: 400, onComplete: () => puff.destroy() });
      }
      this.renderWorld(time);
      publish();
    }
  }
  const game = new Phaser.Game({
    type: Phaser.AUTO, parent, width: WORLD.width, height: WORLD.height,
    backgroundColor: '#a9cc78', transparent: false, antialias: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    input: { keyboard: false, mouse: false, touch: false },
    audio: { noAudio: true }, scene: FarmScene,
    render: { pixelArt: false, roundPixels: false },
  });
  const resize = new ResizeObserver(() => game.scale.refresh());
  resize.observe(parent);
  return {
    setInput(next: Vec2) { input = next; if (!next.x && !next.y) clearInput(); },
    start() { clearInput(); startWorld(world); publish(); },
    pause() { clearInput(); if (world.status === 'playing') world.status = 'paused'; publish(); },
    resume() { clearInput(); if (world.status === 'paused') world.status = 'playing'; publish(); },
    restart() { clearInput(); world = createWorld(); startWorld(world); publish(); },
    destroy() { resize.disconnect(); clearInput(); game.destroy(true); },
  };
}
