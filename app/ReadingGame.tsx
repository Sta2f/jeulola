import { recordEducationAnswer } from './educationScore';
/* oxlint-disable next/no-img-element, jsx-a11y/prefer-tag-over-role -- Local images and composed illustrations with accessible descriptions. */
import { useState } from 'react';
import { ArrowLeft, Volume2, Check, ChevronRight, RotateCcw } from 'lucide-react';
import { SchoolbagGame } from './SchoolbagGame';
import data from './readingExercises.json';
import { useRecordedAudio } from './useRecordedAudio';
import { readSaved, saveValue, useAudioSettings } from './preferences';


type Item = { text: string; audio: string; picture?: string; scene?: string; answer?: string; answers?: string[]; options?: string[]; optionAudio?: string[]; optionPictures?: string[]; form?: number };
type Activity = { id: string; title: string; kind: string; prompt: string; audio: string; items: Item[] };
const lessons = data.lessons as { title: string; icon: string; activities: Activity[] }[];
const sound = (id: string) => `/assets/exercises/audio/${id}.mp3`;
const audioFor = (text: string) => Object.entries(data.audio).find(([, value]) => value === text)?.[0];
const shuffled = (values: string[]) => values.map(value => ({ value, sort: Math.random() })).sort((a,b) => a.sort-b.sort).map(x => x.value);
function Writing({ text }: { text: string }) { return <><span className="ex-print">{text}</span><span className="ex-cursive">{text}</span></>; }
function Scene({ name }: { name: string }) {
 if (name === 'witch') return <div className="ex-scene ex-witch" role="img" aria-label="Une sorcière lit dans un livre ouvert"><img alt="" src="/assets/schoolbag/sorciere.webp"/><img alt="" src="/assets/schoolbag/livre.webp"/><span>✦ ✧ ✦</span></div>;
 if (name === 'road') return <div className="ex-scene ex-road" role="img" aria-label="Une rue relie une forêt à une école"><img alt="" src="/assets/schoolbag/foret.webp"/><span/><img alt="" src="/assets/schoolbag/ecole.webp"/></div>;
 return <svg className="ex-scene" viewBox="0 0 360 200" role="img" aria-label="Un homme se rase la joue avec un rasoir"><rect x="12" y="5" width="336" height="190" rx="25" fill="#e2f4f3"/><rect x="40" y="15" width="170" height="165" rx="50" fill="#b4dae4" stroke="#fff" strokeWidth="8"/><path d="M92 196 Q88 144 133 136 L188 136 Q227 148 231 196" fill="#89b8a5"/><rect x="137" y="117" width="39" height="45" rx="15" fill="#efba90"/><ellipse cx="153" cy="80" rx="49" ry="59" fill="#f2c5a2"/><path d="M105 77 Q85 7 150 12 Q213 10 204 62 L182 43 Q147 66 122 42 Z" fill="#644737"/><path d="M117 92 Q152 113 190 89 L184 123 Q156 153 124 122Z" fill="white"/><circle cx="132" cy="75" r="4" fill="#55443c"/><circle cx="174" cy="75" r="4" fill="#55443c"/><path d="M151 80 L147 94 L156 95" fill="none" stroke="#c99575" strokeWidth="3"/><path d="M207 166 Q230 155 204 110" fill="none" stroke="#efba90" strokeWidth="20" strokeLinecap="round"/><g transform="rotate(-20 194 104)"><rect x="188" y="100" width="11" height="44" rx="5" fill="#447480"/><rect x="177" y="95" width="33" height="12" rx="4" fill="#57606a"/><path d="M181 99 H206" stroke="#dde3e6" strokeWidth="3"/></g><circle cx="199" cy="130" r="12" fill="#efba90"/></svg>;
}
export function ReadingGame({ onBack }: { onBack: () => void }) {
 const [screen,setScreen]=useState<'menu'|'bag'|'lessons'>('menu');
 const [lesson,setLesson]=useState<number|null>(null);
 const [activity,setActivity]=useState<Activity|null>(null);
 const [index,setIndex]=useState(0);
 const [selected,setSelected]=useState<string[]>([]);
 const [wrong,setWrong]=useState('');
 const [done,setDone]=useState(false);
 const [finished,setFinished]=useState(false);
 const [options,setOptions]=useState<string[]>([]);
 const [error,setError]=useState('');
 const [completed,setCompleted]=useState<string[]>(()=>{ const saved=readSaved<unknown>('workbook:completed',[]); return Array.isArray(saved)?saved.filter((x):x is string=>typeof x==='string'):[]; });
 const {playRecording,stopRecording}=useRecordedAudio(setError);
 const item=activity?.items[index];
 const settings=useAudioSettings();
 const speak=(id?:string)=>{setError('');if(id)void playRecording(sound(id));};
 const reset=(item:Item)=>{setSelected([]);setWrong('');setDone(false);setOptions(shuffled(item.options??[]));};
 const open=(a:Activity)=>{stopRecording();setActivity(a);setIndex(0);reset(a.items[0]);setFinished(false);speak(a.kind==='listen'?a.items[0].audio:a.audio);};
 const back=()=>{stopRecording();setError('');if(activity){setActivity(null);setFinished(false);}else if(lesson!==null)setLesson(null);else if(screen==='lessons')setScreen('menu');else onBack();};
 const choose=(value:string)=>{
  if(!activity||!item||done)return;
  const correct=activity.kind==='find'?item.answers?.includes(value):item.answer===value;
  if(!correct){recordEducationAnswer(false);setWrong(value);speak(audioFor('Essaie encore.'));return;}
  setWrong('');
  const next=[...new Set([...selected,value])];setSelected(next);
  if(activity.kind!=='find'||next.length===item.answers?.length){recordEducationAnswer(true);setDone(true);speak(audioFor('Bravo Lola !'));}
 };
 const next=()=>{
  stopRecording();
  if(!activity)return;
  if(index+1===activity.items.length){const ids=[...new Set([...completed,activity.id])];setCompleted(ids);saveValue('workbook:completed',ids);setFinished(true);speak(audioFor('Bravo Lola !'));}
  else{setIndex(index+1);reset(activity.items[index+1]);if(activity.kind==='listen')speak(activity.items[index+1].audio);}
 };
 if(screen==='bag')return <SchoolbagGame onBack={()=>setScreen('menu')}/>;
 return <section className="exercise-book" lang="fr" data-activity={activity?.id??''} data-kind={activity?.kind??''} data-item={index}>
  <header><button onClick={back} aria-label="Retour"><ArrowLeft/></button><h1>{activity?.title??(lesson===null?'Mes lectures':lessons[lesson].title)}</h1><button aria-label="Réécouter" onClick={()=>speak(activity?(activity.kind==='listen'?item?.audio:activity.audio):audioFor('Écoute, lis et joue. Tu peux réécouter avec le haut-parleur.'))}><Volume2/></button></header>
  <div className="ex-content">
  {screen==='menu'?<div className="ex-menu"><button onClick={()=>setScreen('bag')}><img src="/assets/schoolbag/bag.webp" alt=""/><strong>Le cartable magique</strong></button><button onClick={()=>{setScreen('lessons');speak(audioFor('Choisis une leçon.'));}}><img src="/assets/schoolbag/livre.webp" alt=""/><strong>Tous les exercices</strong></button></div>:!activity?<div className="ex-menu ex-lessons">{lesson===null?lessons.map((l,i)=><button key={l.title} onClick={()=>setLesson(i)}><span className="ex-icon">{l.icon}</span><strong>{i+1}. {l.title}</strong><small>{l.activities.filter(a=>completed.includes(a.id)).length} / {l.activities.length} ✦</small></button>):lessons[lesson].activities.map(a=><button key={a.id} onClick={()=>open(a)}><strong>{a.title}</strong><small>{completed.includes(a.id)?'✦':'☆'} {a.items.length}</small></button>)}</div>:finished?<div className="ex-finished"><div>✨</div><h2>Bravo Lola !</h2><button onClick={()=>open(activity)}><RotateCcw/> Rejouer</button><button onClick={()=>setActivity(null)}>Les exercices <ChevronRight/></button></div>:item&&<>
   <div className="ex-progress"><span>{index+1} / {activity.items.length}</span><progress value={index+(done?1:0)} max={activity.items.length}/></div>
   <p className="ex-prompt">{activity.prompt}</p>
   {activity.kind==='read'?<div className="ex-reading"><Writing text={item.text}/><button aria-label="Écouter la lecture" onClick={()=>speak(item.audio)}><Volume2/></button></div>:<>
    {item.scene&&<Scene name={item.scene}/>}
    {activity.kind==='picture'&&<img className="ex-picture" src={'/assets/schoolbag/'+item.picture} alt="À associer au mot"/>}
    {activity.kind==='article'&&<div className="ex-model"><img src={'/assets/schoolbag/'+item.picture} alt=""/><Writing text={item.text}/></div>}
    {activity.kind==='images'&&<div className="ex-model"><Writing text={item.text}/><button aria-label="Écouter le mot" onClick={()=>speak(item.audio)}><Volume2/></button></div>}
    {activity.kind==='scripts'&&<div className="ex-model ex-print">{item.text}</div>}
    {(activity.kind==='find'||activity.kind==='letter')&&<div className="ex-letter"><Writing text={item.text}/>{activity.kind==='find'&&<small>{selected.length} / {item.answers?.length}</small>}</div>}
    {activity.kind==='listen'&&(!settings.enabled||settings.volume===0||error)&&<div className="ex-model"><Writing text={item.text}/></div>}
    {activity.kind==='listen'&&<button className="ex-listen" onClick={()=>speak(item.audio)} aria-label="Écouter la syllabe"><Volume2 size={40}/></button>}
    <div className={'ex-options '+(activity.kind==='sentence'?'ex-sentences':'')}>
     {options.map(value=><div className="ex-option-wrap" key={value}><button aria-label={activity.kind==='images'?value:undefined} data-answer={value} disabled={done||selected.includes(value)} aria-pressed={selected.includes(value)} className={(wrong===value?'wrong ':'')+(selected.includes(value)?'correct':'')} onClick={()=>choose(value)}>
      {activity.kind==='images'?<img className="ex-choice-picture" alt="" src={'/assets/schoolbag/'+item.optionPictures?.[item.options!.indexOf(value)]}/>:activity.kind==='scripts'?<span className="ex-cursive">{value}</span>:activity.kind==='letter'?<span className={(item.form??0)>1?'ex-cursive':'ex-print'}>{(item.form??0)%2?value.toUpperCase():value}</span>:<Writing text={value}/>}{selected.includes(value)&&<Check className="ex-check"/>}
     </button>{activity.kind==='sentence'&&<button className="ex-option-audio" aria-label={'Écouter : '+value} onClick={()=>speak(item.optionAudio?.[item.options!.indexOf(value)])}><Volume2/></button>}</div>)}
    </div>
   </>}
   <output className="ex-feedback" aria-live="polite">{done?'✦ Bravo !':wrong?'Essaie encore.':''}</output>
   {(done||activity.kind==='read')&&<button className="ex-next" onClick={next}>{index+1===activity.items.length?'Terminer':'Suite'}<ChevronRight/></button>}
  </>}
  {error&&<p role="alert" className="ex-error">{error}</p>}
  </div>
 </section>;
}
