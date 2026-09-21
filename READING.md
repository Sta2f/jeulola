# Le cartable magique

Remplace Le jardin des mots. Les quatre mots sont ceux des fiches fournies : **plumier, image, école, cartable**. Les photos scolaires ne sont pas publiées.

Après « Jouer », une explication enregistrée accompagne le début du jeu. Lola place le cartable devant la porte. Elle range ensuite l'image du plumier, puis son mot ; même séquence pour image, école et cartable. Chaque carte-mot présente simultanément les minuscules imprimées et l'écriture scolaire. Les choix sont mélangés à chaque étape. Glisser-déposer, toucher une carte puis la destination, et clavier sont pris en charge. Une erreur laisse réessayer sans pénalité. Toutes les paires terminées ouvrent le portail de l'école. « Encore » recommence devant la porte.

## Suite du 21 septembre 2026

Les cinq mots du lexique « Le crayon orange » sont ajoutés : **crayon, orange, ciseaux, usine, colle**. Orange désigne la couleur, représentée par un disque uni comme dans le livre. Les quatre premiers mots restent disponibles : la partie comporte vingt-huit paires image/mot. Quatre choix au maximum par étape, cible toujours présente. Un compteur compact remplace la rangée d'étoiles pour rester lisible sur téléphone. Dix nouvelles consignes enregistrées avec les mêmes paramètres français. Les exercices de repérage des lettres i, o et u des photos ne sont pas ajoutés à cette activité de mots.

## Suite de l’automne

Sept mots du lexique et des mots-clés « C’est l’automne » rejoignent la partie : **automne, renard, arbre, tête, marron, forêt, écharpe**. Seize mots au total, toujours quatre choix par étape. Les accents restent présents dans les deux écritures. Les visuels distinguent la saison (feuilles orange qui tombent), un arbre isolé et une forêt verte. Marron désigne le fruit. Quatorze nouvelles consignes françaises ; les anciennes restent intactes. Les photos du manuel restent privées.

## Suite de la sorcière

Six mots du lexique « La sorcière Aglaé » : **sorcière, lune, livre, magie, formule, potiron**. Vingt-deux mots au total. La magie est représentée par une baguette qui lance des étoiles ; la formule par un parchemin « Abracadabra ! ». Le potiron est entier, sans visage découpé. Douze nouvelles consignes françaises et six visuels originaux. Les exercices de repérage de lettres restent hors de cette activité.

## Suite de la recette

Six mots du lexique « La recette du serpent magique » : **recette, serpent, soupe, eau, casserole, minute**. Vingt-huit mots au total, quatre choix par étape. Une fiche de cuisine représente la recette ; un minuteur « 1 min » représente la minute. Douze nouvelles consignes françaises et six illustrations originales. Le texte culinaire et les exercices de syllabes des photos ne sont pas reproduits dans ce jeu.

## Ajouter des mots avec Codex

Modifier `app/schoolbagWords.json`, ajouter le visuel WebP transparent sous `public/assets/schoolbag/`, puis lancer `python scripts/generate-schoolbag-audio.py`. Chaque entrée contient un identifiant stable, le texte accentué, le nom du visuel et deux consignes françaises complètes. Le jeu construit les choix et les étapes depuis ce fichier. Aucun écran de gestion ni microphone dans le jeu. Les anciennes données du jardin conservées dans le navigateur ne sont pas supprimées.

Le générateur ne remplace pas les clips existants. Pour modifier une consigne déjà exportée, supprimer uniquement son MP3 et le régénérer, ou augmenter `audioVersion` pour un réexport complet. Génération via Edge TTS et FFmpeg : **fr-FR-DeniseNeural**, débit **−8 %**, hauteur naturelle, normalisation −20 LUFS. C'est la même voix que la version corrigée de **Lola et Éclair au parc des fées**. Aucun TTS navigateur. Les voix préparées sont hébergées avec le jeu. Volume, silence et arrêt à la sortie utilisent les réglages communs. Si le son est coupé ou indisponible, la consigne affiche aussi le mot cible.

## Visuels et police

Illustrations originales générées pour le jeu : entrée féerique, cartable ouvert, plumier rayé, école et portrait encadré d'un chihuahua. Éclair et la fée animée réutilisent les ressources du portail. Traînée d'étoiles pendant le déplacement, lumière et éclats à chaque réussite, portail final. Les animations respectent la préférence de réduction des mouvements.

Écriture scolaire : **Borel**, Rosalie Wagner, fichier original non modifié. Licence SIL Open Font License 1.1 vérifiée avant intégration ; copie livrée dans `public/assets/fonts/Borel-OFL.txt`. Source du projet : https://github.com/RosaWagner/Borel ; distribution : https://github.com/google/fonts/tree/main/ofl/borel. Les mots restent de vrais textes accessibles, avec une police embarquée indépendante des polices de l'appareil.

## Histoire

**Lola et Éclair au parc des fées** : dix pages, environ quatre minutes, trois illustrations. Source : `app/stories/lola-parc-fees.json`. Visuels et narration : `public/assets/stories/lola-parc-fees/`. Version française corrigée `voice-fr-v2-page`, débit −8 %, repères mot à mot. Réexport : `python scripts/generate-story-audio.py --story lola-parc-fees --narration-only`. Ce livre peut être écouté ou lu avec un adulte ; son vocabulaire dépasse les quatre mots du jeu.

## Vérification

Lint et build TypeScript/Vite. Parcours Chromium et WebKit : démarrage avec audio décodé/joué, cartable déplacé, erreur sans progression, vingt-huit paires image/mot, police chargée, clic/toucher/clavier, nouvelle partie et sortie. Vérification visuelle à 1440×900, 768×1024, 390×844, 320×568 et 844×390. Contrôle de non-régression des dix pages et narrations de l'histoire. Les navigateurs simulés ne remplacent pas une validation sur iPad physique.
