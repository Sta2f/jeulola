# Ambiance sonore de Lola

Direction demandée par Julien : douce, féerique, expressive, inspirée d’un dessin animé. Pas de voix robotique du navigateur. Musique discrète sous les voix, pas de sons qui continuent après avoir quitté un jeu.

Références fournies le 9 septembre 2026 (originaux conservés dans Downloads) :

| Original | Usage | Version web |
| --- | --- | --- |
| mauvaise lettre.wav | Mauvaise lettre / mauvais mot | effects/wrong-letter.mp3 |
| perdu lettre.wav | Trois erreurs dans les lettres | effects/letters-lost.mp3 |
| eclair gagant.wav | Éclair retrouve Lola | effects/eclair-win.mp3 |
| perdu.wav | Plus de chances dans Betty ou les calculs | effects/lost.mp3 |

Les copies web sont normalisées à −22 LUFS, puis atténuées par le réglage global. Les originaux n’ont pas été modifiés.

Les mots et les questions de calcul utilisent des enregistrements neuronaux français préparés avec `fr-FR-DeniseNeural`, débit −6 %, hauteur +18 Hz. Il s’agit d’une voix synthétique, pas d’un clonage. Chaque calcul est une phrase entière, pas un collage de chiffres. Normalisation −20 LUFS avant le volume du jeu.

`scripts/generate-voices.py` recrée les 454 petits fichiers statiques avec `edge-tts` et FFmpeg. Le service de synthèse n’est utilisé qu’à la préparation : aucun texte ni donnée de Lola n’est envoyé pendant le jeu. Le navigateur charge seulement le mot ou le calcul sélectionné.

Pour de futurs sons, prendre ces quatre fichiers comme références de style et garder la même discrétion sonore. Contrôler les niveaux, le mute, le réglage sur iOS, l’arrêt au retour arrière et le premier déclenchement avec cache vide.
