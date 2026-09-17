"""Static French instructions for the schoolbag game; texts live with its word bank."""
import asyncio
import json
import subprocess
from pathlib import Path
import edge_tts

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / 'app/schoolbagWords.json').read_text(encoding='utf-8'))
OUT = ROOT / 'public/assets/schoolbag/audio'
WORK = ROOT / '.media/schoolbag-audio'

async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    WORK.mkdir(parents=True, exist_ok=True)
    entries = [(key, DATA[key]) for key in ['intro', 'door', 'retry', 'finished']]
    for word in DATA['words']:
        entries.extend([(f"image-{word['id']}", word['imagePrompt']), (f"word-{word['id']}", word['wordPrompt'])])
    for key, text in entries:
        target = OUT / f"{DATA['audioVersion']}-{key}.mp3"
        if target.exists():
            continue
        source = WORK / target.name
        await edge_tts.Communicate(text, DATA['voice'], rate=DATA['rate'], pitch='+0Hz').save(str(source))
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(source), '-af', 'loudnorm=I=-20:TP=-3:LRA=7', '-ar', '24000', '-ac', '1', '-b:a', '64k', str(target)], check=True)
        print(f'{key}: ready', flush=True)

asyncio.run(main())
