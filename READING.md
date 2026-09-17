# Le jardin des mots

Jeu de reconnaissance de mots, indépendant de « La magie des lettres ». Les quatre mots initiaux sont ceux des fiches fournies le 17 septembre 2026 : **école, cartable, plumier, image**. Les documents scolaires ne sont pas publiés.

Une partie fait pousser six fleurs. Les mots actifs sont mélangés par cycles, sans répéter immédiatement un mot ni exclure systématiquement les derniers ajouts. Une erreur laisse réessayer, sans chrono ni pénalité. Deux modes : modèle en majuscules (ou cursive système) à associer aux minuscules ; écoute d’une voix puis choix du mot. Le modèle peut être révélé en mode écoute.

## Ajouter des mots

Ouvrir **Le jardin des mots → Mes mots**. Ajouter un mot avec ses accents ; cocher les mots de la séance. Les doublons sont ignorés après normalisation de la casse, des espaces et des apostrophes. Limites : 200 mots, 40 caractères par entrée. Suppression avec bouton de rétablissement.

Tous les mots sont jouables avec le modèle. Les quatre premiers ont une voix française préparée avec DeniseNeural (même réglage que les jeux existants). Les 36 mots du jeu de lettres réutilisent leur audio lorsqu’ils sont ajoutés. Pour un autre mot, le parent peut utiliser le micro : jusqu’à huit secondes de voix enregistrée sur l’appareil, sans envoi au serveur. La permission n’est demandée qu’après toucher le micro. Le flux s’arrête à la fin, en cas d’erreur ou en quittant cet écran. Le mode écoute ne propose que les mots disposant d’une voix.

La liste et les voix sont enregistrées sous `lola:reading-words:v1` dans le navigateur. Pas de synchronisation automatique entre appareils. Export JSON avec les voix, import par fusion qui conserve les mots déjà présents ; ces fichiers peuvent être transférés vers la tablette. Taille cumulée limitée à 3 millions de caractères ; les erreurs de stockage sont affichées et ne donnent pas de fausse confirmation. Un fichier invalide ne remplace jamais la liste.

`scripts/generate-reading-audio.py` prépare les quatre MP3 publics avec Edge TTS et FFmpeg. Aucun TTS navigateur ni génération à distance pendant le jeu. Les gardes audio existantes assurent le volume global et l’arrêt à la sortie.

## Nouvelle histoire

**Lola et Éclair au parc des fées** : dix pages, environ quatre minutes avec la nouvelle voix française dédiée (215,9 secondes de narration et neuf transitions), trois nouvelles illustrations originales. Lola et Éclair retrouvent la graine de lumière des fées et font pousser leur fleur-lanterne. Les quatre mots appris reviennent dans le récit. Ce livre est destiné à être écouté ou lu avec un adulte ; son vocabulaire dépasse les quatre mots du jeu.

Source : `app/stories/lola-parc-fees.json`. Visuels et narration : `public/assets/stories/lola-parc-fees/`. Réexport après signalement d’accents anglais : voix française dédiée DeniseNeural, débit -8 %, hauteur naturelle, repères mot à mot réels, fichiers `voice-fr-v2-page`. Génération : `python scripts/generate-story-audio.py --story lola-parc-fees --narration-only` (paramètres lus dans le JSON).

## Vérifications

Build et lint. Parcours Chromium et WebKit : menus, partie complète, erreur sans pénalité, ajout/doublon, export/import, persistance, mode écoute ; dix pages dans cinq formats (1440×900, 768×1024, 390×844, 320×568, 844×390), audio réel, surlignage, pause/reprise, dix transitions et arrêt final, premier livre toujours accessible. Enregistrement avec microphone simulé Chromium et sauvegarde audio réelle. Ces tests ne remplacent pas un essai avec le microphone et les interruptions audio d’un iPad physique.
