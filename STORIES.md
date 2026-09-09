# Histoires de Lola

L’onglet **Histoires** est une bibliothèque, indépendante des jeux. Première histoire originale : **Éclair et le dernier bisou**, six pages, environ deux minutes. Un seul fond ivoire (#fbf4e8) continue derrière l’illustration, le texte et les commandes : aucun cadre, pli central ou séparation. L’illustration et le texte sont côte à côte sur grand écran, superposés en portrait.

## Ajouter une histoire

1. Ajouter un fichier JSON dans `app/stories` sur le modèle de `eclair-dodo.json` : identifiant stable, titre, sous-titre et pages (titre, illustration, description accessible, texte).
2. Ajouter l’histoire à `storyLibrary` dans `app/storyLibrary.ts`.
3. Préparer dans `public/assets/stories/<id>/` les illustrations WebP et, pour chaque page, `<narrationPrefix>-N.mp3` et `<narrationPrefix>-N.json` avec les limites de chaque mot (`word`, `start`, `end` en secondes). Le champ `narrationPrefix` permet de versionner les fichiers ensemble pour éviter un mélange de voix et repères mis en cache.
4. Vérifier la concordance complète du texte et des mots de l’enregistrement. L’alignement gère les apostrophes et les mots composés ; il refuse les repères qui ne correspondent pas. Ne pas remplacer les vrais repères par une estimation de durée.
5. Adapter les métadonnées de couverture si la durée ou le thème change. La berceuse actuelle est associée au thème audio `story` ; un autre fond pourra être ajouté au catalogue audio.

## Son et lecture

- Nouvelle voix française synthétique neuronale : VivienneMultilingualNeural, débit −8 %, hauteur naturelle +0 Hz, normalisation −20 LUFS. Pas de `speechSynthesis` navigateur. `python scripts/generate-story-audio.py --narration-only` reproduit `voice-v2-page-N.mp3/json` via le service Edge TTS utilisé par le projet. Les anciens fichiers et les voix du tracé sont conservés mais ne servent pas à la narration du livre.
- Le service reçoit uniquement le texte fictif de l’histoire, pas d’enregistrement ni d’information issue de l’appareil de Lola.
- Repères WordBoundary d’origine ; aucune coupe du silence initial après la génération. Le lecteur suit `audio.currentTime`, y compris après pause ou chargement lent.
- Berceuse instrumentale originale de 64 secondes en boucle, accords lents C/F/Am/G, mélodie douce synthétisée par le script. Volume de fond 0,075 × volume général ; voix 0,75 × volume général.
- Suppression des oscillateurs, bruits blancs, effets de page et tintements électroniques. Deux vrais enregistrements : froissement de tissu (NachtmahrTV, CC0) et soupir de chien endormi (iainmccurdy, CC BY 4.0). Sources, licences et transformations : `public/assets/stories/eclair-dodo/credits.txt`, accessible depuis l’icône d’information du livre. Extraits de 2,4 et 2,8 secondes, normalisés à −29 LUFS, puis gain 0,55 avant le volume de narration.
- Les FX sont chargés/décodés une seule fois par contexte audio et déclenchés aux mots « couverture » et « soupir ». Un effet non chargé est ignoré, jamais joué en retard. Ils s’arrêtent avec la lecture et disposent d’un interrupteur indépendant.
- La lecture s’arrête en quittant le livre, en masquant le navigateur et à volume zéro. À la dernière page, la berceuse s’arrête aussi. Au retour d’un écran verrouillé, toucher Écouter reprend la voix là où elle était.
- Aucun zoom, translation ou animation de l’illustration principale. Six petites étoiles animent uniquement leur opacité durant la lecture, se mettent en pause sans repartir de zéro et respectent la réduction des animations. L’illustration suivante est préchargée et décodée, sans remontage forcé de l’image.

## Illustrations

Trois illustrations produites avec l’outil intégré de génération d’images, puis compressées en WebP sans changement de composition :

- `public/assets/stories/eclair-dodo/window.webp`
- `public/assets/stories/eclair-dodo/cuddle.webp`
- `public/assets/stories/eclair-dodo/sleep.webp`

Référence commune : `public/assets/eclair-chihuahua-cutout.webp`, utilisée uniquement pour le personnage. Prompt commun : « Polished original children’s bedtime book illustration, landscape 3:2. Tiny entirely chocolate-brown chihuahua, big ears, warm brown eyes, teal collar and small gold lightning pendant. No white fur or tan markings. Storybook painted textures, gentle cinematic 3D-like character, velvety lavender midnight blues, amber nightlight, plush fabrics, kind peaceful mood. No text, letters, watermark or panels. »

Scènes : (1) Éclair près d’une fenêtre en arche, première étoile et panier à couverture rose ; (2) Lola en pyjama lavande borde Éclair et lui caresse l’oreille ; (3) Éclair dort dans son panier sous la couverture rose, lune et veilleuse douce. Les originaux PNG restent conservés dans le dossier de génération Codex.

### Révision sans cadres du 9 septembre 2026

Les scènes de chambre ci-dessus sont conservées comme références. Le lecteur utilise désormais ces fichiers du projet, générés avec l’outil intégré imagegen puis compressés en WebP :

- `public/assets/stories/eclair-dodo/window-cutout.webp` — véritable alpha, Éclair entier sous une petite lune.
- `public/assets/stories/eclair-dodo/cuddle-paper.webp` — Lola et le panier sur papier blanc ; composition CSS statique `mix-blend-mode:multiply` sur l’ivoire, sans bord visible. Les deux essais avec damier incrusté ont été rejetés, jamais publiés.
- `public/assets/stories/eclair-dodo/sleep-cutout.webp` — véritable alpha, Éclair endormi dans son panier complet.

Prompts de production (références : les trois illustrations de chambre correspondantes) :

1. Background extraction. Keep the entire chocolate-brown chihuahua, teal collar, lightning pendant, sitting and looking up softly, and a tiny golden crescent moon. Remove room, furniture, floor and rug. Genuinely transparent background, no checkerboard, no frame, no oval, no text. Preserve the textured storybook character.
2. Keep Lola in lavender pajamas kneeling beside the chocolate puppy in his complete wicker basket with pink blanket and teddy bear, her hand on his ear. Remove room, floor and furniture. Completely flat pure white background edge to edge, no shadows outside characters, no halo, no gradient, no checkerboard, no border or words. Whole girl and basket visible.
3. Background extraction. Keep the chocolate chihuahua curled up asleep in the complete wicker basket with pink blanket, teal collar and lightning pendant. Remove the entire room and all toys outside the basket. Genuinely transparent background, no checkerboard, rectangle, oval or text.

## Tracé guidé

Objectif 80 %. Le score est le minimum entre la couverture du modèle et la précision du tracé. Le modèle est rasterisé à petite taille, avec tolérance pour un doigt : suivre le centre d’une lettre épaisse suffit, inutile de la remplir. L’analyse ne s’exécute qu’au relâchement du doigt. Un point isolé ou un gribouillage couvrant toute la zone ne valide pas la lettre. Retours : réussi (≥80), presque (≥50), continuer, ou revenir sur le modèle si la précision est <65 %. Il s’agit d’un encouragement ludique, pas d’une évaluation pédagogique de l’ordre des gestes.

## Safari et musique

Un seul élément audio de musique est conservé entre les jeux afin de réutiliser l’autorisation obtenue au premier toucher. Gain Web Audio pour le volume iPad, reprise sur toucher / retour au premier plan / reconnexion, erreur visible « Relancer le son ». Un retour rapide pendant `suspend()` est géré. Une reprise n’annule jamais une coupure volontaire ni un retour au menu sans musique.

Les tests Chromium/WebKit Windows couvrent les interactions et les tailles ; WebKit Windows ne dispose pas du contexte Web Audio. Les interruptions iPad sont simulées, la vérification sur un iPad physique reste nécessaire.
