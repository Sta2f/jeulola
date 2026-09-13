export type Piece = {
  id: string;
  name: string;
  category: string;
  color: string;
  kind: string;
  height: number;
  w: number;
  d: number;
};
export const CATEGORIES = [
  'Nature',
  'Plantes',
  'Construction',
  'Animaux',
  'Magie',
  'Couleurs',
];
export const PIECES: Piece[] = [];
function add(
  category: string,
  rows: [string, string, string, string, number?, number?, number?][],
) {
  for (const [id, name, kind, color, height = 0, w = 1, d = 1] of rows)
    PIECES.push({ id, name, kind, color, height, w, d, category });
}
add('Nature', [
  ['grass', 'Herbe', 'grass', '#95bc55', 1],
  ['flowers', 'Herbe fleurie', 'flowers', '#94b656', 1],
  ['earth', 'Terre', 'cube', '#bd9373', 1],
  ['mud', 'Boue', 'cube', '#977565', 1],
  ['sand', 'Sable', 'cube', '#efd299', 1],
  ['stone', 'Pierre', 'stone', '#aaa4ae', 1],
  ['snow', 'Neige', 'cube', '#f1eff6', 1],
  ['ice', 'Glace', 'glass', '#badfe6', 1],
  ['water', 'Eau', 'water', '#67cbd9', 1],
  ['deepwater', 'Eau profonde', 'water', '#479ebc', 1],
  ['lava', 'Lave magique', 'water', '#f0aa88', 1],
  ['river', 'Rivière', 'river', '#68c9d5', 1],
  ['riverbend', 'Virage de rivière', 'riverbend', '#68c9d5', 1],
  ['waterfall', 'Cascade', 'waterfall', '#82d7df', 2],
  ['moss', 'Mousse', 'grass', '#789c62', 1],
  ['cliff', 'Falaise', 'cliff', '#b5ac9d', 2],
  ['pebbles', 'Galets', 'pebbles', '#c0b7ae'],
  ['pinksand', 'Sable rose', 'cube', '#e9c0b5', 1],
  ['snowearth', 'Terre enneigée', 'grass', '#f3f0e8', 1],
  ['rock', 'Rocher', 'rock', '#b1aeb4'],
]);
add('Plantes', [
  ['tree', 'Arbre', 'tree', '#9bb867'],
  ['pine', 'Sapin', 'pine', '#568f7a'],
  ['birch', 'Bouleau', 'birch', '#b4c97c'],
  ['willow', 'Saule', 'willow', '#9bba77', 0, 2, 2],
  ['palm', 'Palmier', 'palm', '#82b47c'],
  ['cherry', 'Cerisier', 'tree', '#e8acc0'],
  ['apple', 'Pommier', 'apple', '#91ae63'],
  ['autumn', 'Arbre d’automne', 'tree', '#dcab76'],
  ['bush', 'Buisson', 'bush', '#87ac67'],
  ['flowerbush', 'Buisson fleuri', 'flowerbush', '#96b87d'],
  ['hedge', 'Haie', 'hedge', '#80a66b'],
  ['lavender', 'Lavande', 'lavender', '#ad93d1'],
  ['daisy', 'Marguerites', 'bouquet', '#fff5e1'],
  ['rose', 'Roses', 'roses', '#e9a4b5'],
  ['tulip', 'Tulipes', 'tulips', '#e6a796'],
  ['sunflower', 'Tournesols', 'sunflower', '#efd17a'],
  ['poppy', 'Coquelicots', 'bouquet', '#df8b7b'],
  ['mushroom', 'Champignons rouges', 'mushroom', '#dc8177'],
  ['brownmushroom', 'Champignons bruns', 'mushroom', '#b39680'],
  ['lily', 'Nénuphar', 'lily', '#9abd75'],
  ['reeds', 'Roseaux', 'reeds', '#b4a47c'],
  ['fern', 'Fougères', 'fern', '#85ae83'],
  ['cactus', 'Cactus', 'cactus', '#8ab5a0'],
  ['ivy', 'Lierre', 'ivy', '#8fae76'],
]);
add('Construction', [
  ['wall', 'Mur crème', 'wall', '#eddabb', 1],
  ['brickwall', 'Mur de briques', 'wall', '#cb9f8b', 1],
  ['stonewall', 'Mur de pierre', 'wall', '#b7b2ae', 1],
  ['window', 'Fenêtre', 'window', '#c5b2d9', 1],
  ['door', 'Porte', 'door', '#c89c81', 1],
  ['roof', 'Toit pointu', 'roof', '#b49cd2'],
  ['roundroof', 'Toit arrondi', 'roundroof', '#a3c4be'],
  ['stairs', 'Escalier', 'stairs', '#dac5a6', 0, 1, 2],
  ['fence', 'Clôture', 'fence', '#ead8b8'],
  ['flowerfence', 'Clôture fleurie', 'flowerfence', '#e9d8bb'],
  ['gate', 'Portillon', 'fence', '#c6ac8a'],
  ['bridge', 'Petit pont', 'bridge', '#d9b38a', 0, 1, 3],
  ['bigbridge', 'Grand pont', 'bridge', '#cba783', 0, 2, 4],
  ['arch', 'Arche', 'gate', '#e8d0ae'],
  ['column', 'Colonne', 'column', '#ecddc9', 2],
  ['path', 'Chemin', 'path', '#d0beab', 1],
  ['paving', 'Pavés', 'path', '#b5b0b7', 1],
  ['terrace', 'Terrasse', 'terrace', '#d9b99a', 1],
  ['bench', 'Banc', 'bench', '#c3a286', 0, 2, 1],
  ['table', 'Table', 'table', '#caae90'],
  ['lamp', 'Lampadaire', 'lamp', '#f1d796'],
  ['fountain', 'Fontaine', 'fountain', '#c8c5cb', 0, 2, 2],
  ['well', 'Puits', 'well', '#bcb2ab'],
  ['house', 'Maison', 'house', '#efb69b', 0, 2, 2],
  ['cottage', 'Maisonnette', 'house', '#a7c9bb', 0, 2, 2],
  ['tower', 'Tour', 'tower', '#d9bfd9', 2],
  ['mill', 'Moulin', 'mill', '#ead7bd', 0, 2, 3],
  ['greenhouse', 'Serre', 'greenhouse', '#afd8cf', 0, 2, 2],
]);
add('Animaux', [
  ['dog', 'Chien', 'dog', '#b69782'],
  ['cat', 'Chat', 'cat', '#d9b394'],
  ['bunny', 'Lapin', 'bunny', '#f3e6df'],
  ['chicken', 'Poule', 'chicken', '#f7edd9'],
  ['chick', 'Poussin', 'chick', '#efd288'],
  ['duck', 'Canard', 'duck', '#f9edc9'],
  ['sheep', 'Mouton', 'sheep', '#f6eee0'],
  ['horse', 'Cheval', 'horse', '#ba9275', 0, 1, 2],
  ['frog', 'Grenouille', 'frog', '#9abd83'],
  ['butterfly', 'Papillon', 'butterfly', '#d4afda'],
  ['fish', 'Poisson', 'fish', '#edbe91'],
  ['turtle', 'Tortue', 'turtle', '#95ad7b'],
  ['ladybug', 'Coccinelle', 'ladybug', '#d98a81'],
  ['bee', 'Abeille', 'bee', '#e2c072'],
  ['fox', 'Renard', 'fox', '#d4a27d'],
  ['hedgehog', 'Hérisson', 'hedgehog', '#aa9181'],
]);
add('Magie', [
  ['crystal', 'Cristal violet', 'crystal', '#b9a2de'],
  ['pinkcrystal', 'Cristal rose', 'crystal', '#e5b2d0'],
  ['bluecrystal', 'Cristal bleu', 'crystal', '#a3d2e7'],
  ['glowtree', 'Arbre lumineux', 'tree', '#bcd9b3'],
  ['giantmushroom', 'Champignon géant', 'mushroom', '#c3a5d8', 0, 2, 2],
  ['portal', 'Portail', 'portal', '#b9a6d8', 0, 2, 1],
  ['star', 'Étoile', 'star', '#f0d794'],
  ['cloud', 'Nuage', 'cloud', '#f3edf5'],
  ['rainbow', 'Arc-en-ciel', 'rainbow', '#e8b3bd', 0, 2, 1],
  ['fairyhouse', 'Maison de fée', 'fairyhouse', '#e9c0cf', 0, 2, 3],
  ['magiclantern', 'Lanterne magique', 'lamp', '#c6b5e6'],
  ['glowflower', 'Fleur lumineuse', 'bouquet', '#d1d9a1'],
  ['floatingrock', 'Pierre flottante', 'floatingrock', '#b5adbd'],
  ['moon', 'Lune', 'moon', '#eedba9'],
  ['stardust', 'Poussière d’étoiles', 'stardust', '#eedcaa'],
  ['dragonegg', 'Œuf de dragon', 'egg', '#b2c9c1'],
  ['dragon', 'Petit dragon', 'dragon', '#a1c2b5'],
  ['unicorn', 'Licorne', 'unicorn', '#eee1e7', 0, 1, 2],
  ['chest', 'Coffre enchanté', 'chest', '#c0a4c6'],
  ['castle', 'Château miniature', 'castle', '#e4cddd', 0, 3, 3],
]);
const colors: [string, string, string][] = [
  ['cream', 'Crème', '#f0dfc1'],
  ['pink', 'Rose', '#e5b0c1'],
  ['coral', 'Corail', '#df9c92'],
  ['peach', 'Pêche', '#ecbaa0'],
  ['yellow', 'Jaune', '#edd18c'],
  ['mint', 'Menthe', '#add5c2'],
  ['green', 'Vert', '#a2bf86'],
  ['blue', 'Bleu', '#a5cddf'],
  ['purple', 'Lilas', '#bea9dc'],
  ['turquoise', 'Turquoise', '#9ccfcb'],
];
add(
  'Couleurs',
  colors.map(([id, name, color]) => [id, name, 'cube', color, 1]),
);
add(
  'Couleurs',
  colors
    .filter(([id]) =>
      ['pink', 'yellow', 'blue', 'green', 'purple'].includes(id),
    )
    .map(([id, name, color]) => [
      `${id}glass`,
      `${name} transparent`,
      'glass',
      color,
      1,
    ]),
);
add('Couleurs', [
  ['triangle', 'Triangle', 'roof', '#e0b6bd'],
  ['ramp', 'Rampe', 'ramp', '#b1d0c5'],
  ['cylinder', 'Cylindre', 'column', '#e8ce90', 1],
  ['half', 'Demi-cube', 'half', '#b7c9df'],
  ['long', 'Longue brique', 'long', '#c7b2db', 1, 2, 1],
]);
export const BY_ID = Object.fromEntries(PIECES.map((p) => [p.id, p])) as Record<
  string,
  Piece
>;
