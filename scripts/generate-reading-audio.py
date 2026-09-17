"""Prepare the four school-word recordings, with the existing French game voice."""
import asyncio
import subprocess
from pathlib import Path
import edge_tts

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/reading'
WORK = ROOT / '.media/reading-audio'

async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    WORK.mkdir(parents=True, exist_ok=True)
    for i, word in enumerate(['école', 'cartable', 'plumier', 'image']):
        target = OUT / f'word-{i}.mp3'
        if target.exists():
            continue
        source = WORK / f'word-{i}.mp3'
        await edge_tts.Communicate(word, 'fr-FR-DeniseNeural', rate='-6%', pitch='+18Hz').save(str(source))
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(source), '-af', 'loudnorm=I=-20:TP=-3:LRA=7', '-ar', '24000', '-ac', '1', '-b:a', '64k', str(target)], check=True)
        print(f'{word}: ready', flush=True)

asyncio.run(main())
