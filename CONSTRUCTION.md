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
Three.js est fixé à r162 pour conserver WebGL 1 (retiré à partir de r163).
Le contexte essaie WebGL 2 puis WebGL 1. Sur iPad/iPhone ou WebGL 1, le rendu
utilise un ratio de pixels de 1, des vignettes de 96 pixels et aucune ombre portée
pour réduire la charge GPU. La compilation cible également Safari 14 et suivants.
Les tailles des nuages et des dessins sont mesurées avec ResizeObserver, sans
dépendre des unités de conteneur CSS absentes de Safari 15. Les tests WebKit et
WebGL 1 forcé ne remplacent pas la validation physique sur l'iPad sous iPadOS 15.8.7.

Gestes tactiles : glisser dans l'axe de la bibliothèque la fait défiler ; glisser
vers le plateau emporte une pièce. Les boutons précédent/suivant avancent sans
animation pour accepter les appuis répétés. En mode Déplacer, le point de prise
est conservé sur un plan fixe : les faces du modèle ne perturbent plus la visée.
L'original est masqué pendant la prévisualisation et réapparaît si le geste est
annulé ou la destination refusée. Les scripts locaux `construction-ipad-gestures-qa.mjs`
et `construction-ipad-webkit-qa.mjs` vérifient défilement, accès aux dernières plantes,
déplacement de cube/arbre/pièce tournée, et annulation sur trois formats.

Contrôles : `npm run test:construction`, `npm run lint`, `npm run build`.
Les scripts de QA locaux dans `output/playwright/construction-*.mjs` vérifient aussi
les interactions, la sauvegarde, six tailles d'écran et WebKit.

Le cycle jour/coucher de soleil/nuit reste une évolution ultérieure, conformément au périmètre convenu.
