"""Generate the workbook's content-addressed French recordings."""
import asyncio,json,subprocess
from pathlib import Path
import edge_tts
ROOT=Path(__file__).resolve().parents[1]
DATA=json.loads((ROOT/'app/readingExercises.json').read_text('utf-8'))
OUT=ROOT/'public/assets/exercises/audio'
WORK=ROOT/'.media/exercise-audio'
async def main():
 OUT.mkdir(parents=True,exist_ok=True);WORK.mkdir(parents=True,exist_ok=True)
 semaphore=asyncio.Semaphore(4)
 async def generate(key,text):
  async with semaphore:
   target=OUT/f'{key}.mp3'
   if target.exists():return
   for attempt in range(3):
    try:
     source=WORK/target.name
     await edge_tts.Communicate(text,'fr-FR-DeniseNeural',rate='-8%',pitch='+0Hz').save(str(source))
     subprocess.run(['ffmpeg','-v','error','-y','-i',str(source),'-af','loudnorm=I=-20:TP=-3:LRA=7','-ar','24000','-ac','1','-b:a','64k',str(target)],check=True)
     print(key,flush=True);return
    except Exception:
     if attempt==2:raise
     await asyncio.sleep(2)
 await asyncio.gather(*(generate(k,t) for k,t in DATA['audio'].items()))
asyncio.run(main())
