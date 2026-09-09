"""Prepare the bedtime narration and genuine word boundaries; no runtime TTS.

Uses the existing Edge TTS workflow. Timings are kept intact (no silence trimming).
The lullaby is an original seamless, slowly plucked C/F/Am/G instrumental loop.
"""
import asyncio
import argparse
import html
import json
import math
import subprocess
import wave
from pathlib import Path
import edge_tts
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
STORY = json.loads((ROOT / 'app/stories/eclair-dodo.json').read_text(encoding='utf-8'))
OUT = ROOT / 'public/assets/stories/eclair-dodo'
OUT.mkdir(parents=True, exist_ok=True)
WORK = ROOT / '.media/story-audio'
WORK.mkdir(parents=True, exist_ok=True)

async def record(key, text, rate='-14%', pitch='+2Hz', speaker='fr-FR-DeniseNeural'):
    target = OUT / f'{key}.mp3'
    metadata = OUT / f'{key}.json'
    if target.exists() and metadata.exists():
        return
    boundaries = []
    source = WORK / f'{key}.mp3'
    voice = edge_tts.Communicate(text, speaker, rate=rate, pitch=pitch, boundary='WordBoundary')
    with source.open('wb') as stream:
        async for chunk in voice.stream():
            if chunk['type'] == 'audio':
                stream.write(chunk['data'])
            elif chunk['type'] == 'WordBoundary':
                boundaries.append({'word': html.unescape(chunk['text']), 'start': round(chunk['offset'] / 10_000_000, 4), 'end': round((chunk['offset'] + chunk['duration']) / 10_000_000, 4)})
    if not boundaries:
        raise ValueError(f'No word boundaries: {key}')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(source), '-af', 'loudnorm=I=-20:TP=-3:LRA=7', '-ar', '24000', '-ac', '1', '-b:a', '64k', str(target)], check=True)
    metadata.write_text(json.dumps(boundaries, ensure_ascii=False), encoding='utf-8')
    print(f'{key}: {len(boundaries)} timed words', flush=True)

def lullaby():
    rate, duration = 24000, 64
    count = rate * duration
    audio = np.zeros(count, dtype=np.float64)
    # Four 16-second phrases; tails wrap to the beginning, so the loop has no cut.
    chords = [[48, 55, 60, 64], [41, 53, 57, 60], [45, 52, 57, 60], [43, 50, 55, 59]]
    for phrase, chord in enumerate(chords):
        for beat, index in enumerate([0, 2, 1, 3, 2, 1, 3, 2]):
            midi = chord[index] + 12
            frequency = 440 * 2 ** ((midi - 69) / 12)
            t = np.arange(rate * 10) / rate
            envelope = (1 - np.exp(-t * 12)) * np.exp(-t / 2.3)
            note = .15 * envelope * (np.sin(2 * math.pi * frequency * t) + .18 * np.sin(2 * math.pi * frequency * 2 * t) * np.exp(-t))
            positions = (np.arange(len(t)) + (phrase * 16 + beat * 2) * rate) % count
            np.add.at(audio, positions, note)
    audio = np.clip(audio, -.9, .9)
    source = WORK / 'lullaby.wav'
    with wave.open(str(source), 'wb') as wav:
        wav.setparams((1, 2, rate, 0, 'NONE', 'not compressed'))
        wav.writeframes((audio * 32767).astype('<i2').tobytes())
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(source), '-c:a', 'libmp3lame', '-b:a', '96k', str(OUT / 'lullaby.mp3')], check=True)

async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--voice', default='fr-FR-VivienneMultilingualNeural')
    parser.add_argument('--prefix', default='voice-v2-page')
    parser.add_argument('--rate', default='-8%')
    parser.add_argument('--narration-only', action='store_true')
    args = parser.parse_args()
    for i, page in enumerate(STORY['pages']):
        await record(f'{args.prefix}-{i + 1}', page['text'], rate=args.rate, pitch='+0Hz', speaker=args.voice)
    if args.narration_only:
        return
    for key, text in [
        ('trace-good', 'Bravo Lola ! Ta lettre est réussie !'),
        ('trace-almost', 'C’est presque bon ! Continue sur les parties claires de la lettre.'),
        ('trace-again', 'Prends ton temps. Suis la lettre claire avec ton doigt.'),
        ('trace-outside', 'Essaie de rester sur la lettre. Tu peux effacer et recommencer doucement.')
    ]:
        await record(key, text, rate='-6%', pitch='+18Hz')
    lullaby()

asyncio.run(main())
