# Les aventures de Lola

Un petit portail de jeux pour Lola, avec un feu tricolore interactif et un labyrinthe animé dans une forêt enchantée.

## Développement

```bash
npm install
npm run dev
```

Le dépôt contient aussi la configuration nécessaire pour un déploiement direct sur Vercel.

## Lola au poulailler — niveau 1

Prototype Phaser 3 intégré au menu. Lola guide trois poules vers la porte ouverte
de l’enclos en s’approchant derrière elles. Les interactions sont automatiques.
Déplacement avec les flèches, ZQSD, WASD ou le joystick flottant en bas à gauche.
La zone tactile reste séparée de la cour ; relâcher le doigt arrête Lola.
La partie se met en pause quand l’onglet est masqué ou la fenêtre perd le focus.

Une partie dure 90 secondes de jeu actif, avec un résultat encourageant à la fin.
Terminer rapporte une étoile, terminer en 75 secondes deux, en 50 secondes trois.
Le meilleur résultat est conservé localement sur l’appareil.

- `app/chicken/model.ts` : simulation indépendante du rendu, collisions, états des poules.
- `app/chicken/createGame.ts` : scène Phaser chargée uniquement à l’ouverture du jeu.
- `app/chicken/art.ts` : textures provisoires séparées, remplaçables par des sprites PNG.
- `app/chicken/FloatingJoystick.tsx` : contact flottant, zone morte, pointeur capturé.
- `app/ChickenGame.tsx` : interface, pause, résultat et persistance.

Les visuels du prototype sont dessinés séparément ; la planche de référence n’est
pas utilisée comme une grande image du niveau. Les sprites définitifs, œufs cachés
et niveaux suivants restent pour une prochaine étape après validation du gameplay.

Vérifications : `npm run lint`, `npm run build`, puis `npm run test:chicken`
(Node 24 ou une version compatible avec l’exécution TypeScript native).
