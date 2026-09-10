import type * as Phaser from 'phaser';

/** Individually inspected atlas bounds, preserving the original painted silhouettes. */
export const FARM_PROP_FRAMES = {
  fence: [8, 69, 307, 234], 'fence-side': [327, 13, 292, 298], gate: [632, 56, 299, 253], hay: [941, 54, 306, 253],
  tree: [5, 322, 309, 321], bush: [320, 348, 307, 284], barrel: [671, 369, 229, 259], wheelbarrow: [944, 356, 297, 273],
  feeder: [10, 708, 301, 203], crates: [320, 696, 309, 224], stump: [637, 708, 300, 228], scarecrow: [954, 632, 292, 318],
  pond: [8, 953, 310, 278], flowers: [322, 969, 305, 263], stones: [643, 1009, 293, 204], sign: [944, 960, 302, 272],
} as const;
type PropName = keyof typeof FARM_PROP_FRAMES;
type Brush = CanvasRenderingContext2D;

export function preloadFarmAssets(scene: Phaser.Scene) {
  scene.load.image('hero-coop', '/assets/chicken/hero-coop.png');
  for (const name of Object.keys(FARM_PROP_FRAMES)) scene.load.image(`farm-${name}`, `/assets/chicken/props/${name}.png`);
}
function texture(scene: Phaser.Scene, key: string, width: number, height: number, draw: (c: Brush) => void) {
  if (scene.textures.exists(key)) return;
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const c = canvas.getContext('2d'); if (!c) return; draw(c); scene.textures.addCanvas(key, canvas);
}
function random(seed: number) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }

/** Characters and props are real bitmap illustrations. Only terrain materials and tiny effects use canvas. */
export function createFarmTextures(scene: Phaser.Scene) {
  for (const ground of ['grass', 'dirt'] as const) texture(scene, `farm-${ground}-tile`, 256, 256, c => {
    const rand = random(ground === 'grass' ? 531 : 828);
    c.fillStyle = ground === 'grass' ? '#87ac3d' : '#d9b775'; c.fillRect(0, 0, 256, 256);
    const palette = ground === 'grass' ? ['#638f3340', '#a6be5049', '#bed46a36', '#b0c7584a', '#507e3426'] : ['#fce2a22c', '#edd29326', '#bc95541c', '#ffe7ac36'];
    for (let i = 0; i < 3000; i++) {
      c.fillStyle = palette[i % palette.length]; c.beginPath();
      c.ellipse(rand() * 256, rand() * 256, 0.6 + rand() * 8, 0.5 + rand() * 3, rand() * 3, 0, Math.PI * 2); c.fill();
    }
    for (let i = 0; i < 330; i++) {
      const x = rand() * 256, y = rand() * 256;
      c.strokeStyle = ground === 'grass' ? '#d0d87660' : '#aa8c513e'; c.lineWidth = 0.7;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + rand() * 3 - 1.5, y - rand() * 4 - 1); c.stroke();
    }
  });
  texture(scene, 'farm-straw-tile', 128, 128, c => {
    const rand = random(219); c.fillStyle = '#e0bd64'; c.fillRect(0, 0, 128, 128); c.lineCap = 'round';
    for (let i = 0; i < 440; i++) {
      const x = rand() * 128, y = rand() * 128;
      c.strokeStyle = ['#ffde77a3', '#aa7e336e', '#f4d581a6', '#ebc96098'][i % 4]; c.lineWidth = 0.6 + rand() * 1.6;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + 3 + rand() * 12, y - 1 - rand() * 6); c.stroke();
    }
  });
  texture(scene, 'shadow', 128, 48, c => {
    c.save(); c.translate(64, 24); c.scale(1, 0.32);
    const g = c.createRadialGradient(0, 0, 3, 0, 0, 62);
    g.addColorStop(0, '#433b2850'); g.addColorStop(0.6, '#433b2822'); g.addColorStop(1, '#433b2800');
    c.fillStyle = g; c.fillRect(-64, -70, 128, 140); c.restore();
  });
  texture(scene, 'feather', 40, 52, c => {
    c.lineWidth = 1.2; c.strokeStyle = '#b8a07a'; c.beginPath(); c.ellipse(22, 21, 8, 19, 0.42, 0, Math.PI * 2);
    const g = c.createLinearGradient(10, 0, 30, 30); g.addColorStop(0, '#fffef6'); g.addColorStop(1, '#dfcfa8');
    c.fillStyle = g; c.fill(); c.stroke(); c.strokeStyle = '#a98f68'; c.beginPath(); c.moveTo(11, 49); c.lineTo(29, 4); c.stroke();
  });
  texture(scene, 'farm-leaf', 22, 18, c => {
    c.fillStyle = '#bed356'; c.strokeStyle = '#6b9237'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(1, 15); c.quadraticCurveTo(3, 0, 20, 2); c.quadraticCurveTo(21, 17, 1, 15); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(3, 14); c.lineTo(17, 5); c.stroke();
  });
  texture(scene, 'farm-butterfly', 46, 38, c => {
    for (const side of [-1, 1]) {
      c.fillStyle = '#f5a749'; c.strokeStyle = '#75502d'; c.lineWidth = 1.5;
      c.beginPath(); c.ellipse(23 + side * 10, 12, 9, 13, side * 0.45, 0, Math.PI * 2); c.fill(); c.stroke();
      c.fillStyle = '#e8c353'; c.beginPath(); c.ellipse(23 + side * 9, 26, 7, 8, side * 0.3, 0, Math.PI * 2); c.fill(); c.stroke();
      c.fillStyle = '#fff1ad'; c.beginPath(); c.ellipse(23 + side * 12, 9, 3, 4, 0, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = '#59442c'; c.beginPath(); c.ellipse(23, 21, 2, 12, 0, 0, Math.PI * 2); c.fill();
  });
}

export function drawFarm(scene: Phaser.Scene) {
  scene.add.tileSprite(500, 320, 1460, 1200, 'farm-grass-tile').setDepth(-1000).setTileScale(0.7);
  const path = scene.make.graphics({ x: 0, y: 0 });
  const court: { x: number; y: number }[] = [];
  for (let i = 0; i < 96; i++) {
    const a = i / 96 * Math.PI * 2, ripple = Math.sin(a * 11) * 9 + Math.sin(a * 17) * 5;
    court.push({ x: 516 + Math.cos(a) * (391 + ripple), y: 374 + Math.sin(a) * (225 + ripple * 0.52) });
  }
  path.fillStyle(0xffffff).fillPoints(court, true).fillRoundedRect(668, 164, 204, 217, 45);
  scene.add.tileSprite(510, 350, 840, 530, 'farm-dirt-tile').setDepth(-950).setTileScale(0.8).setMask(path.createGeometryMask());
  const sunlight = scene.add.graphics().setDepth(-940);
  for (let i = 7; i > 0; i--) sunlight.fillStyle(0xffe6a0, 0.016).fillEllipse(511, 383, 450 + i * 44, 220 + i * 21);
  const straw = scene.make.graphics({ x: 0, y: 0 }); straw.fillStyle(0xffffff).fillRoundedRect(760, 160, 200, 250, 14);
  scene.add.tileSprite(860, 285, 200, 250, 'farm-straw-tile').setDepth(-935).setMask(straw.createGeometryMask());

  const sways: { image: Phaser.GameObjects.Image; phase: number; strength: number }[] = [];
  let objectNumber = 0;
  const prop = (key: PropName, x: number, y: number, width: number, depth = y, flip = false) => {
    const image = scene.add.image(x, y, `farm-${key}`).setOrigin(0.5, 1);
    image.setDisplaySize(width, width * image.height / image.width).setDepth(depth).setFlipX(flip); objectNumber++; return image;
  };
  const sway = (key: 'tree' | 'bush' | 'flowers' | 'scarecrow', x: number, y: number, width: number, depth = y, strength = 0.7) => {
    const image = prop(key, x, y, width, depth, objectNumber % 3 === 0);
    sways.push({ image, phase: objectNumber * 1.87, strength }); return image;
  };
  const shadow = (x: number, y: number, width: number, height: number) => scene.add.image(x, y, 'shadow').setDisplaySize(width, height).setDepth(y - 2).setAlpha(0.85);

  // Orchard and foreground continue beyond the playable rectangle for a moving camera.
  for (let i = 0; i < 10; i++) {
    const x = -165 + i * 157;
    sway('tree', x, -33 + Math.sin(i * 1.4) * 20, 210 + i % 3 * 23, -70 + i, 0.25);
    sway('bush', x + 65, 35 + Math.sin(i) * 13, 137, 36, 0.45);
  }
  for (let i = 0; i < 6; i++) {
    sway('tree', -125 + (i % 2) * 49, 142 + i * 133, 230 + i % 2 * 35, 155 + i * 133, 0.25);
    sway('tree', 1120 - (i % 2) * 34, 123 + i * 137, 235, 124 + i * 137, 0.25);
    sway('bush', -14, 208 + i * 92, 94, 211 + i * 92, 0.35);
    sway('bush', 1005, 215 + i * 94, 99, 216 + i * 94, 0.35);
  }
  for (let x = 99; x < 730; x += 110) prop('fence', x, 107, 127, 93);
  prop('fence-side', 19, 185, 74, 178); prop('fence-side', 19, 271, 74, 270);
  prop('fence-side', 992, 541, 70, 540, true); prop('fence-side', 989, 635, 70, 634, true);
  shadow(852, 154, 268, 55);
  scene.add.image(850, 162, 'hero-coop').setOrigin(0.5, 1).setDisplaySize(330, 330).setDepth(146);
  shadow(212, 191, 98, 29); prop('hay', 215, 201, 113); prop('barrel', 595, 145, 60);
  sway('tree', 83, 140, 208, 136, 0.3); prop('wheelbarrow', 150, 509, 120);
  sway('scarecrow', 317, 128, 98, 125, 0.32); prop('crates', 672, 143, 85, 143);
  prop('feeder', 897, 220, 84, 219); prop('pond', 76, 615, 167, 520);
  prop('stump', 535, 663, 90, 664); prop('hay', 1040, 662, 129, 660);
  const details: [PropName, number, number, number][] = [
    ['flowers', 118, 252, 39], ['stones', 335, 162, 34], ['flowers', 407, 117, 38], ['stones', 536, 180, 29],
    ['flowers', 656, 220, 33], ['stones', 90, 369, 43], ['flowers', 101, 426, 30], ['flowers', 199, 549, 31],
    ['stones', 319, 574, 36], ['flowers', 393, 616, 47], ['stones', 639, 603, 31], ['flowers', 730, 569, 37],
    ['flowers', 963, 472, 40], ['stones', 958, 537, 42], ['flowers', 884, 582, 35], ['flowers', 677, 108, 39],
    ['flowers', 739, 182, 29], ['flowers', 706, 400, 26],
  ];
  details.forEach(([key, x, y, w]) => prop(key, x, y, w, key === 'stones' ? -910 : y - 12));
  for (let i = 0; i < 12; i++) {
    const x = -80 + i * 113;
    sway('bush', x, 763 + Math.sin(i * 1.7) * 17, 157, 765, 0.45);
    sway('flowers', x + 49, 711 + Math.cos(i * 1.3) * 10, 80, 712, 0.55);
  }
  for (let x = 332; x < 976; x += 116) prop('fence', x, 674, 135, 671);
  sway('flowers', 240, 690, 97, 691, 0.5); sway('bush', 21, 688, 116, 693, 0.5);
  // Gates and rails follow the model's enclosure; left opening stays at y260..380.
  for (const x of [812, 908]) prop('fence', x, 172, 110, 163);
  for (const x of [812, 908]) prop('fence', x, 423, 110, 416);
  for (const y of [241, 327, 413]) prop('fence-side', 961, y, 65, y, true).setDisplaySize(65, 101);
  prop('fence-side', 760, 261, 70, 260).setDisplaySize(70, 110);
  prop('fence-side', 760, 415, 48, 412).setDisplaySize(48, 58);
  prop('sign', 896, 476, 116, 477);
  scene.add.text(896, 397, 'Enclos', { fontFamily: 'Georgia, serif', fontSize: '19px', fontStyle: 'bold', color: '#542b14', stroke: '#f6c875', strokeThickness: 0.8 }).setOrigin(0.5).setDepth(478);
  const entry = scene.add.graphics().setDepth(-915).lineStyle(2, 0xffefb9, 0.52);
  for (let y = 285; y < 360; y += 15) entry.lineBetween(758, y, 758, y + 6);
  entry.fillStyle(0xffe9a3, 0.55).fillPoints([{ x: 787, y: 312 }, { x: 810, y: 312 }, { x: 810, y: 304 }, { x: 825, y: 321 }, { x: 810, y: 339 }, { x: 810, y: 330 }, { x: 787, y: 330 }], true);
  const butterflies = [
    { image: scene.add.image(180, 231, 'farm-butterfly').setScale(0.34).setDepth(1300), x: 180, y: 231, phase: 0 },
    { image: scene.add.image(735, 525, 'farm-butterfly').setScale(0.30).setDepth(1300), x: 735, y: 525, phase: 2.7 },
  ];
  const leaves = Array.from({ length: 8 }, (_, i) => ({ image: scene.add.image(0, 0, 'farm-leaf').setScale(0.30 + i % 3 * 0.1).setDepth(1100).setAlpha(0.76), x: [56, 117, 969, 1018][i % 4], phase: i * 1.91 }));
  const ripples = scene.add.graphics().setDepth(521);
  let ambientTime = 0;
  return {
    update(_time: number, delta: number, active: boolean) {
      if (!active) return;
      ambientTime += Math.min(delta, 60); const t = ambientTime / 1000;
      sways.forEach(({ image, phase, strength }) => image.setRotation(Math.sin(t * 0.7 + phase) * strength * 0.012));
      butterflies.forEach(({ image, x, y, phase }) => image.setPosition(x + Math.sin(t * 0.6 + phase) * 48, y + Math.cos(t * 0.81 + phase) * 20).setScale(0.16 + Math.abs(Math.sin(t * 13 + phase)) * 0.2, 0.34).setAngle(Math.sin(t * 0.7 + phase) * 16));
      leaves.forEach(({ image, x, phase }) => {
        const fall = (t * 17 + phase * 37) % 270;
        image.setPosition(x + Math.sin(t * 1.3 + phase) * 31, 55 + fall).setAngle(t * 38 + phase * 49).setAlpha(Math.sin(fall / 270 * Math.PI) * 0.65);
      });
      ripples.clear();
      for (let i = 0; i < 3; i++) {
        const progress = (t * 0.22 + i / 3) % 1;
        ripples.lineStyle(0.9, 0xd0f2d7, (1 - progress) * 0.38).strokeEllipse(76 + i * 12, 558 + i * 6, 7 + progress * 35, 3 + progress * 10);
      }
    },
  };
}
