# Histoires de Lola

L’onglet **Histoires** est une bibliothèque, indépendante des jeux. Première histoire originale : **Éclair et le dernier bisou**, six pages, environ deux minutes. Le livre se lit en double page sur un écran large et en une page illustrée continue en portrait.

## Ajouter une histoire

1. Ajouter un fichier JSON dans `app/stories` sur le modèle de `eclair-dodo.json` : identifiant stable, titre, sous-titre et pages (titre, illustration, description accessible, texte).
2. Ajouter l’histoire à `storyLibrary` dans `app/storyLibrary.ts`.
3. Préparer dans `public/assets/stories/<id>/` les illustrations WebP et, pour chaque page, `page-N.mp3` et `page-N.json` avec les limites de chaque mot (`word`, `start`, `end` en secondes).
4. Vérifier la concordance complète du texte et des mots de l’enregistrement. L’alignement gère les apostrophes et les mots composés ; il refuse les repères qui ne correspondent pas. Ne pas remplacer les vrais repères par une estimation de durée.
5. Adapter les métadonnées de couverture si la durée ou le thème change. La berceuse actuelle est associée au thème audio `story` ; un autre fond pourra être ajouté au catalogue audio.

## Son et lecture

- Voix française synthétique neuronale préparée en fichiers, DeniseNeural, débit −14 %, hauteur +2 Hz, normalisation −20 LUFS. Pas de voix robotique du navigateur. `scripts/generate-story-audio.py` reproduit les fichiers via le service Edge TTS utilisé par le projet.
- Le service reçoit uniquement le texte fictif de l’histoire, pas d’enregistrement ni d’information issue de l’appareil de Lola.
- Repères WordBoundary d’origine ; aucune coupe du silence initial après la génération. Le lecteur suit `audio.currentTime`, y compris après pause ou chargement lent.
- Berceuse instrumentale originale de 64 secondes en boucle, accords lents C/F/Am/G, mélodie douce synthétisée par le script. Volume de fond 0,075 × volume général ; voix 0,75 × volume général.
- FX originaux discrets dans `app/storySoundEffects.ts` : page, étoile, couverture, soupir. Ils utilisent le contexte de narration déjà débloqué et s’arrêtent avec elle. Interrupteurs distincts pour musique et bruitages.
- La lecture s’arrête en quittant le livre, en masquant le navigateur et à volume zéro. À la dernière page, la berceuse s’arrête aussi. Au retour d’un écran verrouillé, toucher Écouter reprend la voix là où elle était.
- Les décors animés n’utilisent que transformation/opacité pendant la lecture et respectent la réduction des animations.

## Illustrations

Trois illustrations produites avec l’outil intégré de génération d’images, puis compressées en WebP sans changement de composition :

- `public/assets/stories/eclair-dodo/window.webp`
- `public/assets/stories/eclair-dodo/cuddle.webp`
- `public/assets/stories/eclair-dodo/sleep.webp`

Référence commune : `public/assets/eclair-chihuahua-cutout.webp`, utilisée uniquement pour le personnage. Prompt commun : « Polished original children’s bedtime book illustration, landscape 3:2. Tiny entirely chocolate-brown chihuahua, big ears, warm brown eyes, teal collar and small gold lightning pendant. No white fur or tan markings. Storybook painted textures, gentle cinematic 3D-like character, velvety lavender midnight blues, amber nightlight, plush fabrics, kind peaceful mood. No text, letters, watermark or panels. »

Scènes : (1) Éclair près d’une fenêtre en arche, première étoile et panier à couverture rose ; (2) Lola en pyjama lavande borde Éclair et lui caresse l’oreille ; (3) Éclair dort dans son panier sous la couverture rose, lune et veilleuse douce. Les originaux PNG restent conservés dans le dossier de génération Codex.

## Tracé guidé

Objectif 80 %. Le score est le minimum entre la couverture du modèle et la précision du tracé. Le modèle est rasterisé à petite taille, avec tolérance pour un doigt : suivre le centre d’une lettre épaisse suffit, inutile de la remplir. L’analyse ne s’exécute qu’au relâchement du doigt. Un point isolé ou un gribouillage couvrant toute la zone ne valide pas la lettre. Retours : réussi (≥80), presque (≥50), continuer, ou revenir sur le modèle si la précision est <65 %. Il s’agit d’un encouragement ludique, pas d’une évaluation pédagogique de l’ordre des gestes.

## Safari et musique

Un seul élément audio de musique est conservé entre les jeux afin de réutiliser l’autorisation obtenue au premier toucher. Gain Web Audio pour le volume iPad, reprise sur toucher / retour au premier plan / reconnexion, erreur visible « Relancer le son ». Un retour rapide pendant `suspend()` est géré. Une reprise n’annule jamais une coupure volontaire ni un retour au menu sans musique.

Les tests Chromium/WebKit Windows couvrent les interactions et les tailles ; WebKit Windows ne dispose pas du contexte Web Audio. Les interruptions iPad sont simulées, la vérification sur un iPad physique reste nécessaire.
