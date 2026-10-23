import {useEffect,useState} from 'react'
import {isSaturday,normalizeSkills,normalizeFamilyClassPost} from '../lib/prKidsClassPosts'
const KEY='prk_demo_publications_v1'
const empty={date:'2026-10-10',title:'',summary:'',skills:'',teacher_note:'',attendance:'both'}
function read(){try{const data=JSON.parse(sessionStorage.getItem(KEY)||'[]');return Array.isArray(data)?data.filter(p=>p?.demo===true).slice(0,30):[]}catch{return []}}
export default function PRKidsDemoStudio({onChange}){
 const [items,setItems]=useState(read)
 const [draft,setDraft]=useState(empty)
 const [error,setError]=useState('')
 useEffect(()=>{onChange(items.filter(p=>p.status==='published').map(p=>({...normalizeFamilyClassPost(p),audience_child_ids:p.audience_child_ids})).filter(p=>p.id))},[items,onChange])
 const save=()=>{const title=draft.title.trim(),summary=draft.summary.trim()
  if(!isSaturday(draft.date)||title.length<4||summary.length<12){setError('Elegí un sábado, un título de al menos 4 letras y una descripción de al menos 12.');return}
  const next=[{id:'demo-'+Date.now(),demo:true,status:'draft',class_date:draft.date,title,summary,skills:normalizeSkills(draft.skills.split(',')),teacher_note:draft.teacher_note,audience_child_ids:draft.attendance==='both'?['demo-1','demo-2']:[draft.attendance],author_display_name:'Profesor de ejemplo'},...items].slice(0,30)
  setItems(next);sessionStorage.setItem(KEY,JSON.stringify(next));setDraft({...empty,date:draft.date});setError('')
 }
 const update=(id,status)=>{const next=items.map(p=>p.id===id?{...p,status}:p);setItems(next);sessionStorage.setItem(KEY,JSON.stringify(next))}
 const clear=()=>{sessionStorage.removeItem(KEY);setItems([]);setError('')}
 return <section className="mt-5 rounded-2xl border border-sky-300/30 bg-slate-900 p-4 text-white" aria-label="Laboratorio de clases ficticias">
  <p className="text-xs font-black tracking-widest text-sky-300">LABORATORIO · SOLO DEMO</p>
  <h2 className="mt-2 text-xl font-black">Probá el recorrido profesor → familia</h2>
  <p className="mt-2 text-xs text-slate-300">Todo es ficticio. Simulá los Check ID registrados y publicá una sola vez: los destinatarios se calculan automáticamente. Se guarda solo en esta pestaña; no se envía nada a familias reales.</p>
  <div className="mt-4 grid gap-3 sm:grid-cols-2">
   <label className="text-xs font-bold">Sábado<input type="date" value={draft.date} onChange={e=>setDraft(p=>({...p,date:e.target.value}))} className="mt-1 w-full rounded-lg border border-white/20 bg-slate-800 p-3"/></label>
   <label className="text-xs font-bold">Título<input value={draft.title} maxLength={100} onChange={e=>setDraft(p=>({...p,title:e.target.value}))} placeholder="Ej.: Aprendimos a frenar" className="mt-1 w-full rounded-lg border border-white/20 bg-slate-800 p-3"/></label>
   <label className="text-xs font-bold sm:col-span-2">¿Qué practicaron?<textarea value={draft.summary} maxLength={2000} onChange={e=>setDraft(p=>({...p,summary:e.target.value}))} rows={3} className="mt-1 w-full rounded-lg border border-white/20 bg-slate-800 p-3"/></label>
   <label className="text-xs font-bold sm:col-span-2">Habilidades (separadas por comas)<input value={draft.skills} onChange={e=>setDraft(p=>({...p,skills:e.target.value}))} placeholder="Equilibrio, Frenadas" className="mt-1 w-full rounded-lg border border-white/20 bg-slate-800 p-3"/></label>
   <label className="text-xs font-bold sm:col-span-2">Asistencias Check ficticias de la clase<select value={draft.attendance} onChange={e=>setDraft(p=>({...p,attendance:e.target.value}))} className="mt-1 w-full rounded-lg border border-white/20 bg-slate-800 p-3"><option value="both">Sofía y Mateo registraron asistencia</option><option value="demo-1">Solo Sofía registró asistencia</option><option value="demo-2">Solo Mateo registró asistencia</option></select></label>
   <label className="text-xs font-bold sm:col-span-2">Mensaje del profesor<input value={draft.teacher_note} maxLength={500} onChange={e=>setDraft(p=>({...p,teacher_note:e.target.value}))} className="mt-1 w-full rounded-lg border border-white/20 bg-slate-800 p-3"/></label>
  </div>
  {error&&<p role="alert" className="mt-3 text-sm text-amber-200">{error}</p>}
  <button type="button" onClick={save} className="mt-4 rounded-xl bg-sky-400 px-5 py-3 text-sm font-black text-slate-950">Guardar borrador de clase ficticia</button>
  {items.map(p=><article key={p.id} className="mt-3 rounded-xl border border-white/20 p-3"><p className="text-xs text-sky-200">{p.class_date} · {p.audience_child_ids?.join(', ')||'Sin destinatarios'} · {p.status==='draft'?'BORRADOR':'PUBLICADA EN DEMO'}</p><strong className="mt-1 block">{p.title}</strong><p className="mt-1 text-sm text-slate-300">{p.summary}</p><button type="button" onClick={()=>update(p.id,p.status==='draft'?'published':'draft')} className="mt-3 rounded-lg border border-sky-300/50 px-3 py-2 text-xs font-bold">{p.status==='draft'?'Publicar en familia ficticia':'Retirar de familia ficticia'}</button></article>)}
  {items.length>0&&<button type="button" onClick={clear} className="mt-4 text-xs font-bold text-amber-200 underline">Borrar todas las pruebas</button>}
 </section>
}
