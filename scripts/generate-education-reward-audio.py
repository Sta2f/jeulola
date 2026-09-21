"""Regenerate the French fifty-point reward announcement."""
import asyncio
import subprocess
from pathlib import Path
import edge_tts
ROOT = Path(__file__).resolve().parents[1]
TEXT = 'Bravo Lola ! Tu as gagné cinquante points ! Tu as droit à un cadeau ! Le compteur repart à zéro. À toi de jouer !'
async def main():
    source = ROOT / '.media/education-gift.mp3'
    source.parent.mkdir(exist_ok=True)
    await edge_tts.Communicate(TEXT, 'fr-FR-DeniseNeural', rate='-8%').save(str(source))
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(source), '-af', 'loudnorm=I=-20:TP=-3:LRA=7', '-ar', '24000', '-ac', '1', '-b:a', '64k', str(ROOT / 'public/assets/audio/voices/education-gift.mp3')], check=True)
asyncio.run(main())
