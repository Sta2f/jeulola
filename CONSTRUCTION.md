# Le petit monde de Lola

Jeu de construction libre ajouté au portail des jeux, sans score ni pièces à débloquer.

## Direction et interface

La référence approuvée est une boîte de jouets magnétiques pastel : plateau crème,
blocs arrondis, eau translucide, fleurs, arbres et petits bâtiments en volume.
La scène Three.js est réellement rotative. Les vignettes sont rendues à partir des
mêmes modèles que le plateau. La bibliothèque prend 22 % de la largeur en paysage.
Sur téléphone, elle devient un tiroir inférieur repliable, avec des flèches de défilement.

## Jeu

- 128 pièces : Nature (20), Plantes (24), Construction (28), Animaux (16), Magie (20), Couleurs (20).
- Plateau de 14 × 14 cases, empilement jusqu'à huit unités de hauteur.
- Empreintes de plusieurs cases et rotation des pièces par quarts de tour.
- Glisser-déposer souris/tactile ou sélection puis toucher une case ; aperçu translucide et cases compatibles éclairées.
- Déplacer transporte une pièce et les éléments qu'elle supporte. Les destinations en collision sont refusées.
- Une grande pièce exige des supports de même hauteur ; un pont peut franchir un espace si ses extrémités sont soutenues.
- La gomme refuse d'enlever un support occupé ; Annuler et Rétablir gardent 40 étapes.
- Construire : pièces, grille, outils. Visiter : vue libre sans grille et export PNG.
- Faire vivre : promenade des petits animaux sur des surfaces accessibles de même hauteur, eau animée, végétation oscillante, lumières. Pause disponible. Les animaux retrouvent leur position de construction en revenant à Construire.
- Les animaux sans trajet compatible restent sur place ; les grands animaux demandent un passage assez large.
- Les animations respectent la réduction des mouvements ; les sons respectent le réglage audio global.

## Sauvegardes

Jusqu'à 12 mondes locaux, ouverture, duplication et suppression confirmée. Création
depuis un plateau vide, un jardin ou une île. Données validées et enregistrées dans
`lola:construction:v2` sur l'appareil. Un échec de stockage est signalé ; aucune
synchronisation entre appareils n'est annoncée. Les versions précédentes des jeux
et leurs clés de sauvegarde ne sont pas modifiées.

## Technique et vérification

`catalog.ts` définit les pièces, `world.ts` les règles testables, `models.ts` les
modèles, `scene.ts` le rendu et les gestes, `ConstructionGame.tsx` les écrans.
Chargement différé de Three.js à l'ouverture du jeu. Géométries et matériaux partagés,
rendu à la demande en construction/visite, arrêt lorsque la page est masquée.
WebKit utilise une surface visible 2D alimentée par le rendu WebGL pour éviter la
disparition de sa couche de composition après redimensionnement ; la scène reste 3D.

Contrôles : `npm run test:construction`, `npm run lint`, `npm run build`.
Les scripts de QA locaux dans `output/playwright/construction-*.mjs` vérifient aussi
les interactions, la sauvegarde, six tailles d'écran et WebKit.

Le cycle jour/coucher de soleil/nuit reste une évolution ultérieure, conformément au périmètre convenu.
