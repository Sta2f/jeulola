"""Build static neural French clips with complete sentence intonation, not word stitching."""
import asyncio
import json
import subprocess
from pathlib import Path
import edge_tts

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/voices'
OUT.mkdir(parents=True, exist_ok=True)
(ROOT / '.media').mkdir(exist_ok=True)
WORDS = ['lune', 'vélo', 'rose', 'pomme', 'lama', 'robot', 'pirate', 'tomate', 'banane', 'tortue', 'salade', 'ananas']
entries = [(f'word-{i}', f'{word.capitalize()} !') for i, word in enumerate(WORDS)]
entries += [('bravo', 'Bravo Lola, tu as trouvé !'), ('math-bravo', 'Bravo Lola, une étoile pour toi !')]
for a in range(1, 21):
    for b in range(0, 21-a):
        entries.append((f'plus-{a}-{b}', f'Combien font {a} plus {b} ?'))
    for b in range(a+1):
        entries.append((f'minus-{a}-{b}', f'Combien font {a} moins {b} ?'))

semaphore = asyncio.Semaphore(3)
async def batch(index, items):
    if all((OUT / f'{key}.mp3').exists() for key, _ in items):
        return
    async with semaphore:
        source = ROOT / f'.media/voice-batch-{index}.mp3'
        boundaries = []
        stream = edge_tts.Communicate(' '.join(text for _, text in items), 'fr-FR-DeniseNeural', rate='-6%', pitch='+18Hz', boundary='SentenceBoundary')
        with source.open('wb') as audio:
            async for chunk in stream.stream():
                if chunk['type'] == 'audio': audio.write(chunk['data'])
                elif chunk['type'] == 'SentenceBoundary': boundaries.append(chunk)
        (ROOT / f'.media/voice-batch-{index}.json').write_text(json.dumps(boundaries, ensure_ascii=False), encoding='utf-8')
        if len(boundaries) != len(items):
            raise ValueError(f'Batch {index}: {len(boundaries)} sentences for {len(items)} clips')
        for (key, _), boundary in zip(items, boundaries):
            start = max(0, boundary['offset'] / 10_000_000 - .03)
            duration = boundary['duration'] / 10_000_000 + .08
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(start), '-t', str(duration), '-i', str(source), '-af', 'loudnorm=I=-20:TP=-3:LRA=7', '-ar', '24000', '-ac', '1', '-b:a', '64k', str(OUT / f'{key}.mp3')], check=True)
        print(f'Batch {index}: {len(items)} clips ready', flush=True)

async def main():
    await asyncio.gather(*(batch(i//35, entries[i:i+35]) for i in range(0,len(entries),35)))
    print(f'COMPLETE: {len(entries)} neural voice clips', flush=True)

asyncio.run(main())
