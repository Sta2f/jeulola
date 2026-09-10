# Les aventures de Lola

Un petit portail de jeux pour Lola, avec un feu tricolore interactif et un labyrinthe animé dans une forêt enchantée.

## Développement

```bash
npm install
npm run dev
```

Le dépôt contient aussi la configuration nécessaire pour un déploiement direct sur Vercel.

## Lola au poulailler — dix niveaux

Jeu Phaser 3 illustré intégré au menu. Lola guide de trois à douze poules vers la porte ouverte
de l’enclos en s’approchant derrière elles. Les interactions sont automatiques.
Déplacement avec les flèches, ZQSD, WASD ou le joystick flottant en bas à gauche.
Le joystick et le HUD se superposent au décor ; relâcher le doigt arrête Lola.
La caméra rapprochée suit Lola en douceur, avec une zone morte, sans changer les
coordonnées du monde lors d’une rotation de l’écran. Le décor dépasse l’écran.
La partie se met en pause quand l’onglet est masqué ou la fenêtre perd le focus.

Les dix niveaux ajoutent chacun une poule et augmentent leur vitesse de 5 %
(jusqu’à +45 %). Lola reste plus rapide. La durée passe de 90 à 135 secondes de jeu
actif, avec un résultat encourageant à la fin. Terminer rapporte une étoile ;
les seuils des deux et trois étoiles sont proportionnels au temps disponible
(75 et 50 secondes au premier niveau).
Chaque niveau peut être choisi librement ou enchaîné après une victoire. Les meilleurs
résultats et le dernier niveau choisi sont conservés sur l’appareil dans
`lola:chicken:progress`. L’ancien record `lola:chicken:stars` devient celui du niveau 1.

- `app/chicken/model.ts` : simulation indépendante du rendu, collisions, états des poules.
- `app/chicken/levels.ts` et `progress.ts` : difficulté et records par niveau.
- `app/chicken/audio.ts` : moteur pour des enregistrements, volume partagé, pause et nettoyage.
- `app/chicken/createGame.ts` : scène Phaser chargée uniquement à l’ouverture du jeu.
- `app/chicken/art.ts` : décor illustré modulaire, profondeur par Y et ambiance animée.
- `app/chicken/FloatingJoystick.tsx` : contact flottant, zone morte, pointeur capturé.
- `app/ChickenGame.tsx` : interface, pause, résultat et persistance.

Les 51 PNG transparents de `public/assets/chicken` sont des illustrations générées
à partir de la direction artistique fournie : 16 poses de Lola, 18 poses de poules,
16 accessoires et un poulailler. Chaque élément est indépendant. Les animations
combinent les poses, le mouvement, les plumes, la poussière et les ombres ; feuillage,
papillons et eau bougent discrètement. Les images ne constituent jamais un niveau
unique aplati. Les œufs restent hors de cette version.

Chaque poule capturée déclenche **Game Win Short Chime Sweep** de **Ni Sound**
(Matching Game), et la victoire du niveau déclenche **You Win Horn** de **Tomas Herudek**
(Cinematic Logos). Ces deux sons Artlist ont été fournis par le propriétaire du jeu ;
les enregistrements complets et leurs fins naturelles sont conservés.
Ils accompagnent les enregistrements récupérés sur YouTube : ambiance de ferme en boucle,
trois caquètements, battements d’ailes et quatre variantes de pas dans l’herbe.
Les onze MP3 sont servis localement
depuis `public/assets/chicken/audio` (environ 890 Ko), sans lecteur YouTube ni compte
externe pendant la partie. Les sources, licences et adaptations sont indiquées dans
`public/assets/chicken/audio/CREDITS.md` et dans la page « Crédits des sons » du jeu.
Le clic de démarrage active Web Audio ; pause, onglet masqué, son coupé et sortie
arrêtent les enregistrements. Le volume et la préférence de son restent partagés
avec les autres jeux. Les effets sont espacés pour garder les douze poules agréables
à écouter ; la boucle de 40 secondes utilise un fondu croisé de deux secondes.

Les prompts sont conservés avec les assets et les scripts de détourage dans
`scripts/chicken-*-assets.py`. Les scripts utilisent Pillow/NumPy (SciPy pour les
poules et accessoires) et les sources locales sous `output/imagegen`, hors du site.
Le détourage et l’export local des PNG ont été explicitement autorisés.

Vérifications : `npm run lint`, `npm run build`, puis `npm run test:chicken`
(Node 24 ou une version compatible avec l’exécution TypeScript native).
