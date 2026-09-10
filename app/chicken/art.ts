import type * as Phaser from 'phaser';

/** Original, separately rendered artwork. Every position uses the 1000 × 680 farm. */
const INK = '#6c4937';
type Brush = CanvasRenderingContext2D;

function oval(c: Brush, x: number, y: number, rx: number, ry: number, color: string, line = 0, rotation = 0) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
  c.fillStyle = color;
  c.fill();
  if (line) { c.strokeStyle = INK; c.lineWidth = line; c.stroke(); }
}

function shape(c: Brush, points: number[][], color: string, line = 0) {
  c.beginPath();
  points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.closePath();
  c.fillStyle = color;
  c.fill();
  if (line) { c.strokeStyle = INK; c.lineWidth = line; c.stroke(); }
}

function rounded(c: Brush, x: number, y: number, w: number, h: number, r: number, color: string, line = 0) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fillStyle = color;
  c.fill();
  if (line) { c.strokeStyle = INK; c.lineWidth = line; c.stroke(); }
}

function stroke(c: Brush, points: number[][], color: string, width: number) {
  c.beginPath();
  points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.strokeStyle = color;
  c.lineWidth = width;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.stroke();
}

function texture(scene: Phaser.Scene, key: string, w: number, h: number, paint: (c: Brush) => void) {
  if (scene.textures.exists(key)) return;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const c = canvas.getContext('2d');
  if (!c) return;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  paint(c);
  scene.textures.addCanvas(key, canvas);
}

function flower(c: Brush, x: number, y: number, size: number, color = '#fff7dc') {
  for (let petal = 0; petal < 5; petal++) {
    const angle = petal * Math.PI * 2 / 5;
    oval(c, x + Math.cos(angle) * size, y + Math.sin(angle) * size, size * 0.8, size * 0.65, color, 0, angle);
  }
  oval(c, x, y, size * 0.65, size * 0.65, '#efbe4a');
}

function lola(c: Brush, direction: 'down' | 'up' | 'left' | 'right') {
  const side = direction === 'left' || direction === 'right';
  const back = direction === 'up';
  if (direction === 'left') { c.translate(96, 0); c.scale(-1, 1); }
  // A silhouette reads clearly at the in-game size: ponytail, overalls, yellow boots.
  if (!back) {
    oval(c, side ? 23 : 20, 44, side ? 16 : 13, 26, '#834530', 2.6, -0.27);
    oval(c, side ? 17 : 14, 62, 10, 18, '#965235', 2.3, 0.25);
    stroke(c, [[20, 26], [13, 40], [14, 52]], '#b37042', 3);
    oval(c, 29, 23, 8, 6, '#ef77a0', 2);
  }
  // Feet and relaxed arms are slightly asymmetrical to give the idle pose life.
  rounded(c, side ? 43 : 32, 109, 13, 25, 5, '#3383a7', 2.4);
  rounded(c, side ? 59 : 52, 111, 13, 23, 5, '#4195b5', 2.4);
  rounded(c, side ? 40 : 28, 127, 22, 13, 5, '#f4bd40', 2.6);
  rounded(c, side ? 58 : 51, 127, 21, 13, 5, '#ffce4b', 2.6);
  stroke(c, [[side ? 44 : 32, 132], [side ? 52 : 40, 132]], '#ffe387', 2.2);
  stroke(c, [[side ? 63 : 56, 132], [side ? 69 : 65, 132]], '#ffe387', 2.2);
  oval(c, side ? 36 : 27, 95, 8, 17, '#f5b787', 2.4, 0.18);
  oval(c, side ? 70 : 74, 94, 8, 17, '#ffc995', 2.4, -0.18);
  rounded(c, 29, 75, 44, 30, 12, '#ea6993', 2.7);
  rounded(c, side ? 42 : 34, 81, 31, 36, 8, '#4294b6', 2.7);
  rounded(c, side ? 44 : 35, 77, 7, 23, 3, '#53a7c5', 1.8);
  if (!side) rounded(c, 60, 77, 7, 23, 3, '#53a7c5', 1.8);
  if (!back) {
    oval(c, side ? 48 : 39, 94, 2.3, 2.3, '#ffdc62');
    if (!side) oval(c, 63, 94, 2.3, 2.3, '#ffdc62');
    rounded(c, side ? 50 : 44, 100, 13, 11, 3, '#6db8ce', 1.5);
  } else stroke(c, [[39, 87], [64, 108]], '#6fbcd1', 2.3);
  // Hair cap, ears, and warm peach face.
  oval(c, side ? 51 : 51, 47, 31, 35, '#7d432e', 3);
  if (back) {
    oval(c, 52, 49, 28, 30, '#955339');
    stroke(c, [[36, 25], [29, 47], [32, 62]], '#bd7b4b', 3);
    stroke(c, [[66, 24], [74, 43], [69, 59]], '#673c30', 3);
    oval(c, 48, 47, 11, 8, '#e981a0', 2.2);
    oval(c, 44, 65, 15, 26, '#814430', 2.6, -0.19);
    stroke(c, [[42, 48], [36, 62], [38, 80]], '#b97545', 3);
    return;
  }
  oval(c, side ? 37 : 22, 56, 7, 10, '#efaf81', 2);
  if (!side) oval(c, 79, 56, 7, 10, '#f7bc8c', 2);
  oval(c, side ? 59 : 51, 55, side ? 24 : 27, 28, '#ffca99', 2.4);
  // The fringe is drawn as a single swept lock, not a grid of face pieces.
  c.beginPath();
  c.moveTo(24, 44); c.bezierCurveTo(19, 17, 40, 7, 57, 16);
  c.bezierCurveTo(82, 14, 87, 35, 76, 46);
  c.bezierCurveTo(70, 32, 63, 31, 59, 29);
  c.bezierCurveTo(58, 44, 46, 48, 43, 44);
  c.bezierCurveTo(47, 37, 47, 32, 46, 30);
  c.bezierCurveTo(39, 43, 34, 47, 24, 44);
  c.fillStyle = '#995633'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.4; c.stroke();
  stroke(c, [[31, 28], [39, 22], [49, 21]], '#c6884b', 3.5);
  if (side) {
    oval(c, 69, 56, 4.8, 7, '#44332e');
    oval(c, 70.2, 53.5, 1.9, 2.3, '#ffffff');
    oval(c, 62, 66, 6.5, 3.2, '#f09c86');
    oval(c, 82, 62, 3.8, 3.3, '#ffca99');
    stroke(c, [[71, 72], [75, 73], [79, 70]], '#965245', 1.9);
    stroke(c, [[65, 45], [71, 44]], '#72412f', 2.2);
  } else {
    oval(c, 40, 57, 4.6, 6.8, '#47342f');
    oval(c, 63, 57, 4.6, 6.8, '#47342f');
    oval(c, 41, 54.5, 1.7, 2, '#ffffff');
    oval(c, 64, 54.5, 1.7, 2, '#ffffff');
    oval(c, 32, 66, 6, 3.2, '#f3a38b');
    oval(c, 71, 66, 6, 3.2, '#f3a38b');
    stroke(c, [[47, 72], [52, 74], [57, 71]], '#9a5144', 1.9);
    stroke(c, [[35, 46], [42, 45]], '#73462f', 2);
    stroke(c, [[59, 45], [66, 46]], '#73462f', 2);
  }
}

function chicken(c: Brush, color: 'white' | 'brown' | 'black') {
  const palette = color === 'white'
    ? { body: '#fff6df', shade: '#e7d7b5', light: '#ffffff', line: '#a78b6e' }
    : color === 'brown'
      ? { body: '#bf6b36', shade: '#975331', light: '#dc9452', line: '#754831' }
      : { body: '#5a5962', shade: '#42444e', light: '#7b7983', line: '#383943' };
  // Thin feet remain above the transparent baseline used by depth sorting.
  stroke(c, [[47, 83], [43, 96], [34, 97]], '#bb8136', 4.3);
  stroke(c, [[44, 95], [49, 99]], '#bb8136', 3.7);
  stroke(c, [[72, 82], [74, 96], [66, 99]], '#bb8136', 4.3);
  stroke(c, [[74, 96], [82, 98]], '#bb8136', 3.7);
  oval(c, 23, 55, 11, 25, palette.light, 2.6, -0.64);
  oval(c, 32, 51, 10, 22, palette.body, 2.6, -0.31);
  oval(c, 55, 65, 34, 25, palette.body, 2.6, -0.07);
  oval(c, 58, 75, 27, 12, palette.shade);
  oval(c, 80, 46, 18, 29, palette.body, 2.7, 0.1);
  // Small scalloped comb and wattle are legible even in a moving flock.
  oval(c, 74, 18, 6, 11, '#df584c', 2.1, -0.36);
  oval(c, 83, 15, 6, 11, '#ef6b57', 2.1);
  oval(c, 91, 20, 5.5, 9, '#df584c', 2.1, 0.36);
  oval(c, 92, 51, 5, 9, '#e55e51', 1.8, -0.2);
  shape(c, [[94, 33], [110, 39], [95, 45]], '#e9ab43', 2.2);
  stroke(c, [[98, 39], [105, 39]], '#bf7e36', 1.4);
  oval(c, 87, 33, 5.3, 5.6, '#fffdf3');
  oval(c, 88.4, 33.2, 3, 3.7, '#342d30');
  oval(c, 89.3, 32, 1.1, 1.1, '#ffffff');
  c.beginPath(); c.moveTo(29, 59); c.bezierCurveTo(50, 50, 75, 48, 66, 66);
  c.bezierCurveTo(65, 76, 52, 79, 49, 72); c.bezierCurveTo(42, 79, 32, 69, 29, 59);
  c.fillStyle = palette.light; c.fill(); c.strokeStyle = palette.line; c.lineWidth = 2; c.stroke();
  stroke(c, [[37, 61], [43, 67], [49, 66]], palette.line, 1.6);
  stroke(c, [[50, 58], [57, 64]], palette.line, 1.6);
  oval(c, 83, 47, 4, 2.4, color === 'white' ? '#f2beab' : '#d98d76');
}

function makeGround(c: Brush) {
  let seed = 821;
  const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const grass = c.createLinearGradient(0, 0, 0, 680);
  grass.addColorStop(0, '#9cc75e'); grass.addColorStop(1, '#bddb76');
  c.fillStyle = grass; c.fillRect(0, 0, 1000, 680);
  // Broad meadow shapes and dappled light give the terrain a painted quality.
  for (let i = 0; i < 95; i++) {
    oval(c, rand() * 1000, rand() * 680, 20 + rand() * 75, 10 + rand() * 34, i % 3 ? '#afd16a' : '#a4ca5c');
  }
  c.beginPath(); c.moveTo(161, 255);
  c.bezierCurveTo(211, 165, 411, 181, 507, 169);
  c.bezierCurveTo(642, 150, 734, 198, 842, 256);
  c.bezierCurveTo(936, 314, 922, 468, 829, 532);
  c.bezierCurveTo(724, 604, 558, 588, 436, 557);
  c.bezierCurveTo(327, 532, 206, 555, 158, 480);
  c.bezierCurveTo(108, 406, 130, 329, 161, 255);
  const dirt = c.createLinearGradient(0, 180, 0, 600);
  dirt.addColorStop(0, '#eace91'); dirt.addColorStop(1, '#f4dfaa');
  c.fillStyle = dirt; c.fill();
  c.save(); c.clip();
  for (let i = 0; i < 200; i++) {
    const x = rand() * 1000, y = rand() * 680;
    oval(c, x, y, 1 + rand() * 13, 0.7 + rand() * 4, i % 4 ? '#e5c98955' : '#fff1c866');
  }
  for (let i = 0; i < 36; i++) {
    const x = 130 + rand() * 760, y = 185 + rand() * 410;
    oval(c, x, y + 2, 4 + rand() * 3, 2, '#b79f7855');
    oval(c, x, y, 3 + rand() * 3, 2 + rand() * 2, '#c9b993');
  }
  c.restore();
  // Sprinkle flowers at the edges; the movement area stays easy to read.
  for (let i = 0; i < 220; i++) {
    const x = rand() * 1000, y = rand() * 680;
    const outsideCourt = ((x - 510) / 404) ** 2 + ((y - 378) / 243) ** 2 > 1;
    if (!outsideCourt || (x < 310 && y > 500)) continue;
    const tall = 3 + rand() * 5;
    stroke(c, [[x - 3, y], [x - 5, y - tall], [x, y], [x + 3, y - tall - 1]], '#7fac46', 1.5);
    if (i % 4 === 0) flower(c, x + 1, y - tall, 2 + rand() * 1.5, i % 8 ? '#fffbe9' : '#efb2b6');
  }
  // Golden straw makes the destination immediately different from the courtyard.
  rounded(c, 760, 158, 205, 259, 28, '#d8c67d');
  rounded(c, 770, 169, 184, 233, 22, '#edda93');
  for (let i = 0; i < 100; i++) {
    const x = 781 + rand() * 158, y = 178 + rand() * 210;
    stroke(c, [[x, y], [x + 3 + rand() * 8, y - 2 - rand() * 2]], i % 3 ? '#d8bb65' : '#fff0b3', 1.5);
  }
  // Quiet movement cue leading through the wide, open gate.
  c.setLineDash([5, 9]); c.strokeStyle = '#c9b36c'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(760, 269); c.lineTo(760, 371); c.stroke(); c.setLineDash([]);
}

export function createFarmTextures(scene: Phaser.Scene) {
  texture(scene, 'farm-ground', 1000, 680, makeGround);
  for (const direction of ['down', 'up', 'left', 'right'] as const) {
    texture(scene, `lola-${direction}`, 96, 144, c => lola(c, direction));
  }
  for (const color of ['white', 'brown', 'black'] as const) {
    texture(scene, `chicken-${color}`, 116, 104, c => chicken(c, color));
  }
  texture(scene, 'shadow', 100, 32, c => {
    const g = c.createRadialGradient(50, 16, 2, 50, 16, 49);
    g.addColorStop(0, '#664e3e36'); g.addColorStop(1, '#664e3e00');
    c.save(); c.translate(0, 10); c.scale(1, 0.34); c.fillStyle = g; c.fillRect(0, -10, 100, 75); c.restore();
    oval(c, 50, 16, 35, 8, '#69563d20');
  });
  texture(scene, 'feather', 32, 32, c => {
    oval(c, 16, 13, 6, 12, '#fff9e6', 1, 0.5);
    stroke(c, [[10, 29], [20, 5]], '#d9c8a4', 1.6);
    stroke(c, [[14, 19], [10, 13]], '#e8d9b6', 1);
  });
  texture(scene, 'farm-coop', 250, 220, c => {
    oval(c, 125, 209, 106, 10, '#6b583332');
    shape(c, [[42, 78], [183, 64], [212, 95], [211, 188], [45, 202]], '#b85242', 3);
    shape(c, [[183, 65], [213, 94], [211, 188], [181, 177]], '#a34137', 2.5);
    shape(c, [[41, 82], [108, 23], [185, 68], [184, 177], [44, 194]], '#d46a4e', 3);
    for (let x = 56; x < 180; x += 22) stroke(c, [[x, 88], [x, 178]], '#b65341', 2);
    shape(c, [[24, 85], [105, 12], [224, 83], [209, 100], [108, 39], [38, 100]], '#526f7a', 3);
    shape(c, [[105, 12], [144, 11], [238, 70], [224, 83]], '#729099', 3);
    stroke(c, [[107, 39], [207, 100]], '#b7c8c2', 5);
    stroke(c, [[25, 85], [106, 13], [144, 11]], '#d5dfd1', 4);
    for (let i = 0; i < 5; i++) stroke(c, [[117 + i * 18, 25 + i * 10], [103 + i * 19, 42 + i * 12]], '#425e6b', 1.4);
    rounded(c, 95, 111, 66, 79, 2, '#704b36', 3);
    rounded(c, 102, 118, 52, 70, 1, '#5d412f');
    stroke(c, [[92, 188], [92, 108], [164, 108], [164, 188]], '#fff0cf', 7);
    shape(c, [[100, 182], [158, 180], [180, 214], [102, 217]], '#c99958', 2.5);
    for (let i = 0; i < 4; i++) stroke(c, [[103, 188 + i * 7], [161 + i * 5, 186 + i * 8]], '#9a7042', 2.1);
    rounded(c, 55, 104, 26, 29, 2, '#547b80', 4);
    stroke(c, [[53, 119], [83, 119]], '#fff0ce', 3);
    stroke(c, [[68, 104], [68, 133]], '#fff0ce', 3);
    oval(c, 111, 72, 19, 18, '#e8bd72', 2);
    oval(c, 111, 75, 10, 6, '#f8e1a5');
    oval(c, 119, 67, 4, 7, '#f8e1a5');
    shape(c, [[122, 64], [128, 67], [122, 69]], '#c78a41');
    flower(c, 52, 197, 5); flower(c, 193, 191, 4, '#f2a9ac');
  });
  texture(scene, 'farm-hay', 128, 105, c => {
    oval(c, 63, 94, 56, 8, '#665b3228');
    shape(c, [[15, 41], [76, 31], [104, 48], [104, 91], [17, 94]], '#e6ba51', 2.5);
    shape(c, [[15, 41], [41, 22], [106, 32], [104, 48]], '#f6d879', 2.5);
    shape(c, [[76, 48], [104, 48], [104, 91], [75, 92]], '#cfa244', 2);
    stroke(c, [[34, 39], [34, 92]], '#ae9750', 5);
    stroke(c, [[81, 40], [81, 90]], '#ae9750', 5);
    rounded(c, 67, 4, 51, 40, 8, '#e8c260', 2.5);
    oval(c, 113, 25, 9, 19, '#efd17b', 2);
    oval(c, 112, 25, 5, 11, '#dab358', 1.4);
    oval(c, 112, 25, 2, 5, '#b59142');
    for (let i = 0; i < 17; i++) {
      const x = 21 + (i * 19) % 79, y = 51 + (i * 13) % 34;
      stroke(c, [[x, y], [x + 9, y - 2]], i % 2 ? '#f6dc83' : '#d3a347', 1.5);
    }
    stroke(c, [[76, 10], [101, 8]], '#f6dc83', 2);
    stroke(c, [[72, 25], [101, 20]], '#f6dc83', 2);
  });
  texture(scene, 'farm-barrel', 80, 100, c => {
    oval(c, 40, 91, 31, 7, '#6552332b');
    c.beginPath(); c.moveTo(14, 19); c.bezierCurveTo(8, 37, 8, 63, 15, 85);
    c.bezierCurveTo(34, 95, 49, 95, 65, 85); c.bezierCurveTo(73, 58, 73, 36, 65, 19);
    c.closePath(); c.fillStyle = '#af784b'; c.fill(); c.lineWidth = 2.7; c.strokeStyle = INK; c.stroke();
    for (const x of [22, 34, 47, 59]) stroke(c, [[x, 26], [x - 1, 83]], '#8b613f', 2);
    oval(c, 40, 20, 26, 11, '#d2a16a', 3);
    oval(c, 40, 20, 19, 6, '#75553b');
    oval(c, 40, 22, 17, 4, '#7fbfce');
    stroke(c, [[12, 40], [28, 44], [51, 44], [68, 40]], '#66737a', 7);
    stroke(c, [[14, 73], [29, 77], [50, 77], [66, 73]], '#66737a', 7);
    stroke(c, [[14, 38], [28, 42], [51, 42], [67, 38]], '#93a29e', 1.8);
    stroke(c, [[16, 71], [29, 75], [50, 75], [65, 71]], '#93a29e', 1.8);
  });
  texture(scene, 'farm-tree', 170, 220, c => {
    oval(c, 86, 208, 55, 10, '#47652f28');
    shape(c, [[66, 200], [77, 104], [94, 99], [105, 202], [115, 208], [83, 212], [57, 209]], '#a0774a', 3);
    stroke(c, [[84, 179], [85, 145], [111, 109]], '#755b3b', 5);
    stroke(c, [[78, 144], [61, 112]], '#755b3b', 5);
    stroke(c, [[87, 189], [90, 176]], '#cfac72', 3);
    const leaves = [[43, 90, 32], [115, 97, 37], [57, 49, 36], [102, 39, 33], [133, 64, 28], [83, 89, 42], [33, 64, 25]];
    for (const [x, y, r] of leaves) oval(c, x, y, r, r * 0.91, '#689745', 2.8);
    for (const [x, y, r] of [[52, 44, 24], [94, 35, 27], [128, 57, 19], [72, 75, 32], [113, 95, 25], [36, 71, 21]]) {
      oval(c, x, y, r, r * 0.8, '#85b34f');
    }
    for (const [x, y] of [[47, 37], [86, 23], [72, 66], [127, 52], [112, 92]]) oval(c, x, y, 10, 5, '#abc96b', 0, -0.4);
    for (const [x, y] of [[41, 85], [101, 59], [128, 103], [78, 111]]) {
      oval(c, x, y, 7, 8, '#e58162', 1.7);
      stroke(c, [[x, y - 7], [x + 2, y - 11]], '#6e633c', 1.8);
      oval(c, x + 5, y - 8, 5, 2.5, '#bed77d', 0, -0.4);
      oval(c, x - 2, y - 3, 2, 3, '#f7b284');
    }
    for (const x of [55, 68, 100, 113]) stroke(c, [[x, 210], [x - 5, 199], [x + 1, 205], [x + 6, 198]], '#6e9946', 2.5);
    flower(c, 110, 206, 4.3); flower(c, 64, 211, 3.4, '#efadb3');
  });
  texture(scene, 'farm-wheelbarrow', 132, 114, c => {
    oval(c, 65, 106, 51, 6, '#60533926');
    stroke(c, [[37, 71], [34, 101], [47, 101]], '#6a726d', 5);
    stroke(c, [[81, 73], [98, 97]], '#6a726d', 5);
    oval(c, 99, 92, 15, 18, '#596866', 2.5);
    oval(c, 99, 92, 9, 12, '#b8c2ae', 2);
    oval(c, 99, 92, 3, 4, '#718077');
    stroke(c, [[31, 56], [12, 36], [5, 34]], '#856044', 7);
    stroke(c, [[89, 60], [57, 27], [50, 24]], '#856044', 7);
    shape(c, [[21, 45], [81, 34], [121, 59], [98, 87], [39, 75]], '#ab7647', 3);
    shape(c, [[21, 45], [42, 29], [98, 31], [121, 59], [76, 65]], '#d3a766', 2.5);
    shape(c, [[32, 46], [46, 36], [93, 38], [109, 56], [75, 57]], '#f0d076', 1.8);
    for (let i = 0; i < 13; i++) {
      const x = 39 + (i * 13) % 57, y = 43 + (i * 7) % 12;
      stroke(c, [[x, y], [x + 10, y - 3]], i % 2 ? '#fff0b0' : '#ccaa52', 1.7);
    }
    stroke(c, [[26, 48], [75, 68], [117, 60]], '#e7bd7d', 5);
    stroke(c, [[44, 70], [69, 76], [97, 81]], '#815d40', 2);
  });
  texture(scene, 'farm-fence', 140, 76, c => {
    oval(c, 70, 69, 66, 6, '#53643a22');
    rounded(c, 10, 27, 118, 12, 3, '#c49b5e', 2);
    rounded(c, 10, 49, 118, 11, 3, '#bd9256', 2);
    stroke(c, [[13, 29], [127, 29]], '#efcc8c', 2.7);
    for (const x of [5, 120]) {
      shape(c, [[x, 16], [x + 7, 11], [x + 15, 16], [x + 15, 70], [x, 70]], '#cda266', 2.2);
      stroke(c, [[x + 3, 21], [x + 3, 64]], '#efd098', 2.5);
      oval(c, x + 8, 32, 1.8, 1.8, '#836a4c');
      oval(c, x + 8, 53, 1.8, 1.8, '#836a4c');
    }
  });
  texture(scene, 'farm-sign', 156, 104, c => {
    rounded(c, 70, 37, 14, 62, 3, '#a17a4c', 2.5);
    c.save(); c.translate(78, 32); c.rotate(-0.04);
    rounded(c, -72, -24, 144, 56, 9, '#bc8b50', 2.5);
    rounded(c, -68, -24, 136, 50, 8, '#e6bd79', 1.5);
    stroke(c, [[-59, -18], [55, -18]], '#f6d69a', 2.2);
    oval(c, -58, 1, 2.4, 2.4, '#9a774f'); oval(c, 58, 1, 2.4, 2.4, '#9a774f');
    c.fillStyle = '#64422f'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = 'bold 25px "Trebuchet MS", sans-serif'; c.fillText('Enclos', 0, 3);
    c.restore();
    stroke(c, [[68, 99], [61, 88], [67, 91], [65, 82]], '#80a64a', 2.6);
    flower(c, 87, 98, 3.8, '#fffbe5');
  });
  texture(scene, 'farm-bush', 126, 76, c => {
    oval(c, 65, 68, 53, 5, '#53643a24');
    for (const [x, y, r] of [[26, 48, 22], [51, 34, 26], [82, 39, 28], [103, 51, 19]]) oval(c, x, y, r, r * 0.82, '#78a34c', 2);
    for (const [x, y, r] of [[26, 42, 17], [52, 27, 18], [82, 32, 18]]) oval(c, x, y, r, r * 0.74, '#99bf61');
    for (const [x, y] of [[34, 43], [64, 27], [88, 45], [61, 59]]) flower(c, x, y, 4.2);
  });
}

/** Draws only scenery; actors, input, collision and progression belong to the scene. */
export function drawFarm(scene: Phaser.Scene) {
  scene.add.image(0, 0, 'farm-ground').setOrigin(0).setDepth(-1000);
  const prop = (key: string, x: number, y: number, w: number, h: number, depth = y) =>
    scene.add.image(x, y, key).setOrigin(0.5, 1).setDisplaySize(w, h).setDepth(depth);

  // The perimeter leaves all of the playable courtyard visible.
  for (let x = 68; x < 970; x += 116) {
    if (x > 740) continue;
    prop('farm-fence', x, 60, 132, 62, 20);
  }
  for (let x = 352; x < 965; x += 116) prop('farm-fence', x, 674, 132, 62, 690);
  prop('farm-bush', 27, 304, 91, 55, 304);
  prop('farm-bush', 977, 510, 108, 65, 510);
  prop('farm-bush', 707, 56, 104, 63, 56);
  prop('farm-bush', 528, 649, 83, 50, 649);
  prop('farm-tree', 75, 142, 124, 161);
  prop('farm-tree', 966, 112, 132, 171);
  prop('farm-hay', 215, 201, 111, 91);
  prop('farm-barrel', 595, 146, 57, 72);
  prop('farm-wheelbarrow', 150, 510, 107, 93);
  prop('farm-coop', 858, 158, 212, 187);

  // Enclosure rails follow the physical pen. The left opening is y=260..380.
  for (const x of [811, 906]) prop('farm-fence', x, 171, 110, 61, 171);
  for (const x of [810, 907]) prop('farm-fence', x, 424, 110, 61, 424);
  const verticalFence = (x: number, start: number, end: number) => {
    const g = scene.add.graphics().setDepth(end + 2);
    g.fillStyle(0xb48b53, 1); g.lineStyle(2, 0x815f3e, 1);
    for (const railX of [x - 5, x + 3]) {
      g.fillRoundedRect(railX, start - 28, 6, end - start, 2);
      g.strokeRoundedRect(railX, start - 28, 6, end - start, 2);
    }
    for (let y = start; y <= end; y += Math.max((end - start) / 2, 15)) {
      g.fillStyle(0xcda266); g.fillRoundedRect(x - 7, y - 42, 15, 44, 3);
      g.strokeRoundedRect(x - 7, y - 42, 15, 44, 3);
      g.lineStyle(2, 0xefcf91); g.lineBetween(x - 3, y - 35, x - 3, y - 4);
      g.lineStyle(2, 0x815f3e);
    }
  };
  verticalFence(960, 169, 414);
  verticalFence(760, 171, 260);
  verticalFence(760, 380, 414);
  prop('farm-sign', 884, 458, 130, 87, 460);

  // A low contrast arrow is an invitation, not another control to tap.
  const arrow = scene.add.graphics().setDepth(-100);
  arrow.fillStyle(0xffffe7, 0.58);
  arrow.fillPoints([{ x: 790, y: 306 }, { x: 815, y: 306 }, { x: 815, y: 297 }, { x: 832, y: 320 }, { x: 815, y: 343 }, { x: 815, y: 334 }, { x: 790, y: 334 }], true);
}
