export type Difference = { id: string; x: number; y: number; w: number; h: number; label: string };
export type DifferenceLevel = { title: string; scene: string; differences: Difference[] };
// Percent coordinates share the same square viewBox on both drawings.
export const differenceLevels: DifferenceLevel[] = [
  {
    "title": "Le pique-nique enchanté",
    "scene": "picnic",
    "differences": [
      {
        "id": "kite",
        "x": 14,
        "y": 1,
        "w": 19,
        "h": 18,
        "label": "Le cerf-volant"
      },
      {
        "id": "balloon",
        "x": 3,
        "y": 13,
        "w": 13,
        "h": 15,
        "label": "Le ballon rose"
      },
      {
        "id": "pennant",
        "x": 83,
        "y": 14,
        "w": 9,
        "h": 11,
        "label": "Le fanion"
      },
      {
        "id": "butterfly",
        "x": 71,
        "y": 28,
        "w": 9,
        "h": 8,
        "label": "Le papillon"
      },
      {
        "id": "mug",
        "x": 1,
        "y": 71,
        "w": 14,
        "h": 12,
        "label": "La tasse"
      },
      {
        "id": "apple",
        "x": 23,
        "y": 79,
        "w": 15,
        "h": 15,
        "label": "La pomme"
      },
      {
        "id": "bow",
        "x": 87,
        "y": 80,
        "w": 10,
        "h": 7,
        "label": "Le nœud du nounours"
      }
    ]
  },
  {
    "title": "Le château de sable",
    "scene": "beach",
    "differences": [
      {
        "id": "flag",
        "x": 52,
        "y": 36,
        "w": 8,
        "h": 8,
        "label": "Le drapeau"
      },
      {
        "id": "gull",
        "x": 66,
        "y": 3,
        "w": 15,
        "h": 9,
        "label": "La mouette"
      },
      {
        "id": "bucket",
        "x": 0,
        "y": 59,
        "w": 16,
        "h": 18,
        "label": "Le seau"
      },
      {
        "id": "spade",
        "x": 14,
        "y": 74,
        "w": 28,
        "h": 15,
        "label": "La pelle"
      },
      {
        "id": "shell",
        "x": 62,
        "y": 73,
        "w": 8,
        "h": 6,
        "label": "Le coquillage"
      },
      {
        "id": "crab",
        "x": 80,
        "y": 73,
        "w": 19,
        "h": 12,
        "label": "Le crabe"
      },
      {
        "id": "glasses",
        "x": 59,
        "y": 84,
        "w": 24,
        "h": 14,
        "label": "Les lunettes"
      }
    ]
  },
  {
    "title": "Les petits pâtissiers",
    "scene": "bakery",
    "differences": [
      {
        "id": "jar",
        "x": 66,
        "y": 5,
        "w": 8,
        "h": 12,
        "label": "Le bocal"
      },
      {
        "id": "heart",
        "x": 4,
        "y": 32,
        "w": 5,
        "h": 6,
        "label": "Le cœur du pichet"
      },
      {
        "id": "hen",
        "x": 17,
        "y": 22,
        "w": 9,
        "h": 8,
        "label": "La poule"
      },
      {
        "id": "fridgeflower",
        "x": 94,
        "y": 16,
        "w": 6,
        "h": 7,
        "label": "La fleur du frigo"
      },
      {
        "id": "cupcake",
        "x": 31,
        "y": 74,
        "w": 18,
        "h": 10,
        "label": "Le petit gâteau"
      },
      {
        "id": "eggshell",
        "x": 63,
        "y": 84,
        "w": 11,
        "h": 10,
        "label": "La coquille"
      },
      {
        "id": "towelheart",
        "x": 2,
        "y": 91,
        "w": 7,
        "h": 9,
        "label": "Le cœur du torchon"
      }
    ]
  },
  {
    "title": "Le bateau des bois",
    "scene": "forest",
    "differences": [
      {
        "id": "butterfly",
        "x": 25,
        "y": 7,
        "w": 8,
        "h": 9,
        "label": "Le papillon"
      },
      {
        "id": "balloon",
        "x": 82,
        "y": 0,
        "w": 12,
        "h": 16,
        "label": "Le ballon"
      },
      {
        "id": "birdhouse",
        "x": 83,
        "y": 22,
        "w": 3,
        "h": 4,
        "label": "Le nichoir"
      },
      {
        "id": "apple",
        "x": 0,
        "y": 61,
        "w": 10,
        "h": 9,
        "label": "La pomme"
      },
      {
        "id": "duck",
        "x": 91,
        "y": 69,
        "w": 9,
        "h": 11,
        "label": "Le canard"
      },
      {
        "id": "sail",
        "x": 50,
        "y": 67,
        "w": 14,
        "h": 13,
        "label": "La voile"
      },
      {
        "id": "pennant",
        "x": 41,
        "y": 3,
        "w": 5,
        "h": 6,
        "label": "Le fanion"
      }
    ]
  },
  {
    "title": "Un ami dans la neige",
    "scene": "snow",
    "differences": [
      {
        "id": "bow",
        "x": 79,
        "y": 32,
        "w": 8,
        "h": 9,
        "label": "Le ruban"
      },
      {
        "id": "mug",
        "x": 18,
        "y": 76,
        "w": 18,
        "h": 15,
        "label": "La tasse"
      },
      {
        "id": "button",
        "x": 40,
        "y": 61,
        "w": 7,
        "h": 8,
        "label": "Le bouton"
      },
      {
        "id": "carrot",
        "x": 40,
        "y": 28,
        "w": 9,
        "h": 8,
        "label": "Le nez"
      },
      {
        "id": "gift",
        "x": 77,
        "y": 78,
        "w": 23,
        "h": 15,
        "label": "Le cadeau"
      },
      {
        "id": "bird",
        "x": 8,
        "y": 3,
        "w": 11,
        "h": 7,
        "label": "L’oiseau"
      },
      {
        "id": "feeder",
        "x": 78,
        "y": 4,
        "w": 8,
        "h": 15,
        "label": "La mangeoire"
      }
    ]
  },
  {
    "title": "Le camping sur la Lune",
    "scene": "space",
    "differences": [
      {
        "id": "moon",
        "x": 87,
        "y": 4,
        "w": 9,
        "h": 10,
        "label": "Le ballon lune"
      },
      {
        "id": "flag",
        "x": 80,
        "y": 20,
        "w": 8,
        "h": 8,
        "label": "Le drapeau étoilé"
      },
      {
        "id": "mug",
        "x": 6,
        "y": 69,
        "w": 15,
        "h": 12,
        "label": "La tasse bleue"
      },
      {
        "id": "heart",
        "x": 78,
        "y": 78,
        "w": 5,
        "h": 5,
        "label": "La tasse rose"
      },
      {
        "id": "nose",
        "x": 94,
        "y": 82,
        "w": 6,
        "h": 6,
        "label": "La petite fusée"
      },
      {
        "id": "badge",
        "x": 49,
        "y": 49,
        "w": 5,
        "h": 5,
        "label": "L’écusson"
      },
      {
        "id": "window",
        "x": 8.5,
        "y": 10.5,
        "w": 3.8,
        "h": 3.8,
        "label": "Le hublot"
      }
    ]
  },
  {
    "title": "Le potager de Betty",
    "scene": "garden",
    "differences": [
      {
        "id": "ladybug",
        "x": 9,
        "y": 85,
        "w": 8,
        "h": 6,
        "label": "La coccinelle"
      },
      {
        "id": "mug",
        "x": 86,
        "y": 44,
        "w": 10,
        "h": 9,
        "label": "La tasse"
      },
      {
        "id": "pennant",
        "x": 74,
        "y": 2,
        "w": 6,
        "h": 8,
        "label": "Le fanion"
      },
      {
        "id": "spade",
        "x": 59,
        "y": 81,
        "w": 18,
        "h": 11,
        "label": "La pelle"
      },
      {
        "id": "birdhole",
        "x": 29,
        "y": 8,
        "w": 4,
        "h": 4,
        "label": "Le nichoir"
      },
      {
        "id": "collar",
        "x": 25,
        "y": 50,
        "w": 10,
        "h": 6,
        "label": "Le collier d’Éclair"
      },
      {
        "id": "flower",
        "x": 1,
        "y": 64,
        "w": 5,
        "h": 5,
        "label": "L’arrosoir"
      }
    ]
  },
  {
    "title": "Le goûter d’anniversaire",
    "scene": "birthday",
    "differences": [
      {
        "id": "balloon",
        "x": 4,
        "y": 16,
        "w": 13,
        "h": 16,
        "label": "Le ballon violet"
      },
      {
        "id": "cup",
        "x": 77,
        "y": 64,
        "w": 10,
        "h": 14,
        "label": "Le gobelet"
      },
      {
        "id": "flower",
        "x": 46,
        "y": 65,
        "w": 6,
        "h": 6,
        "label": "La fleur du gâteau"
      },
      {
        "id": "bow",
        "x": 36,
        "y": 87,
        "w": 8,
        "h": 6,
        "label": "Le ruban du doudou"
      },
      {
        "id": "hat",
        "x": 63,
        "y": 78,
        "w": 7,
        "h": 6,
        "label": "Le pompon"
      },
      {
        "id": "house",
        "x": 76,
        "y": 5,
        "w": 12,
        "h": 12,
        "label": "Le nichoir"
      },
      {
        "id": "candle",
        "x": 53,
        "y": 55,
        "w": 3,
        "h": 7,
        "label": "La bougie"
      }
    ]
  },
  {
    "title": "Le trésor de l’océan",
    "scene": "aquarium",
    "differences": [
      {
        "id": "flag",
        "x": 5,
        "y": 58,
        "w": 6,
        "h": 4,
        "label": "Le drapeau"
      },
      {
        "id": "octopus",
        "x": 3,
        "y": 4,
        "w": 20,
        "h": 23,
        "label": "La pieuvre"
      },
      {
        "id": "chest",
        "x": 43,
        "y": 72,
        "w": 8,
        "h": 9,
        "label": "Le coffre"
      },
      {
        "id": "fish",
        "x": 23,
        "y": 28,
        "w": 8,
        "h": 5,
        "label": "Le poisson"
      },
      {
        "id": "star",
        "x": 32,
        "y": 85,
        "w": 21,
        "h": 11,
        "label": "L’étoile de mer"
      },
      {
        "id": "flower",
        "x": 57,
        "y": 84,
        "w": 18,
        "h": 14,
        "label": "La fleur"
      },
      {
        "id": "bottle",
        "x": 69,
        "y": 79,
        "w": 29,
        "h": 11,
        "label": "Le message"
      }
    ]
  },
  {
    "title": "Les secrets du dodo",
    "scene": "bedtime",
    "differences": [
      {
        "id": "heart",
        "x": 22.4,
        "y": 12.5,
        "w": 3,
        "h": 4,
        "label": "Le cœur du cadre"
      },
      {
        "id": "bow",
        "x": 94,
        "y": 14,
        "w": 6,
        "h": 5,
        "label": "Le nœud du nounours"
      },
      {
        "id": "moon",
        "x": 62,
        "y": 3,
        "w": 8,
        "h": 9,
        "label": "La lune"
      },
      {
        "id": "mug",
        "x": 84,
        "y": 70,
        "w": 16,
        "h": 16,
        "label": "La tasse"
      },
      {
        "id": "star",
        "x": 17,
        "y": 78,
        "w": 28,
        "h": 19,
        "label": "Le coussin étoile"
      },
      {
        "id": "vase",
        "x": 38,
        "y": 24,
        "w": 6,
        "h": 7,
        "label": "Le vase"
      },
      {
        "id": "bookstar",
        "x": 38,
        "y": 57,
        "w": 3,
        "h": 3,
        "label": "L’étoile du livre"
      }
    ]
  }
];
