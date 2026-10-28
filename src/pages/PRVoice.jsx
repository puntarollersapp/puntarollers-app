import { useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const faces=['😕','😐','🙂','😍','🤩']
const input='w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-violet-300'
export default function PRVoice(){
 const {user}=useAuth()
 const [rating,setRating]=useState(0)
 const [highlight,setHighlight]=useState('')
 const [improvement,setImprovement]=useState('')
 const [idea,setIdea]=useState('')
 const [additionalComment,setAdditionalComment]=useState('')
 const [named,setNamed]=useState(false)
 const [publish,setPublish]=useState(false)
 const [busy,setBusy]=useState(false)
 const [done,setDone]=useState(false)
 const [error,setError]=useState('')
 async function submit(e){
  e.preventDefault()
  if(!rating||busy)return
  setBusy(true);setError('')
  const {error:err}=await supabase.from('pr_voice_feedback').insert({profile_id:user.id,rating,highlight:highlight.trim(),improvement:improvement.trim(),idea:idea.trim(),additional_comment:additionalComment.trim(),display_name:named,publish_consent:publish})
  setBusy(false)
  if(err){setError('No pudimos guardar tu opinión. Probá nuevamente.');return}
  setDone(true)
 }
 return <AppLayout title="PR Voice"><div className="mx-auto max-w-xl space-y-4 px-4 pb-24 pt-5 text-white">
  <header className="relative overflow-hidden rounded-[30px] border border-violet-300/20 bg-gradient-to-br from-[#242040] via-[#141324] to-[#111b2a] p-6 shadow-2xl">
   <p className="text-[10px] font-black uppercase tracking-[.22em] text-cyan-300">PUNTA ROLLERS · PR VOICE</p>
   <h1 className="mt-5 text-[clamp(30px,9vw,48px)] font-black uppercase leading-none tracking-tight">TU OPINIÓN<br/><span className="text-violet-300">NOS IMPORTA.</span></h1>
   <h2 className="mt-3 text-lg font-black">Tu voz nos mueve.</h2>
   <p className="mt-3 text-sm leading-6 text-white/65">Lo que te gusta, lo que cambiarías y tus nuevas ideas nos ayudan a construir un Punta Rollers mejor. Queremos escucharte de verdad.</p>
   <p className="mt-4 inline-block rounded-full border border-cyan-300/20 bg-cyan-300/5 px-3 py-2 text-[10px] font-bold text-cyan-200">Tu espacio para hablar con libertad · A tu ritmo</p>
  </header>
  {done?<section className="rounded-3xl border border-violet-300/20 bg-[#191629] p-8 text-center"><p className="text-5xl text-violet-300">✓</p><h2 className="mt-4 text-2xl font-black">¡Gracias por tu opinión!</h2><p className="mt-3 text-sm text-white/60">Gracias por dedicar tu tiempo a compartir tu experiencia. Leemos cada opinión para cuidar lo que hacemos bien y mejorar lo que haga falta.</p></section>:
  <form onSubmit={submit} className="space-y-4">
   <section className="rounded-3xl border border-white/10 bg-[#191629] p-5"><p className="text-[10px] font-black tracking-widest text-violet-300">01 · TU EXPERIENCIA</p><h2 className="mt-2 text-xl font-black">¿Cómo te sentís en PR?</h2><p className="mt-1 text-xs text-white/50">Elegí una carita.</p><div className="mt-4 grid grid-cols-5 gap-2">{faces.map((face,i)=><button type="button" key={face} aria-label={['Podría mejorar','Regular','Bien','Muy bien','Increíble'][i]} aria-pressed={rating===i+1} onClick={()=>setRating(i+1)} className={`rounded-2xl border py-3 text-2xl transition ${rating===i+1?'border-violet-300 bg-violet-400/20':'border-white/10 bg-white/5'}`}>{face}</button>)}</div></section>
   <section className="space-y-4 rounded-3xl border border-white/10 bg-[#191629] p-5"><div><p className="text-[10px] font-black tracking-widest text-cyan-300">02 · CONTANOS</p><h2 className="mt-2 text-xl font-black">Tu experiencia cuenta.</h2><p className="text-xs text-white/50">Podés responder una, varias o todas las preguntas. Tomate el tiempo que necesites.</p></div>{[['¿Qué es lo que más te gusta de Punta Rollers?',highlight,setHighlight],['¿Qué mejorarías de tu experiencia?',improvement,setImprovement],['¿Qué te gustaría que hagamos próximamente?',idea,setIdea],['¿Hay algo más que quieras decirnos?',additionalComment,setAdditionalComment]].map(([label,value,setValue])=><label key={label} className="block space-y-2"><span className="text-xs font-bold">{label}</span><textarea rows={3} value={value} onChange={e=>setValue(e.target.value)} placeholder="Este espacio es tuyo. Escribí con libertad..." className={input}/></label>)}</section>
   <section className="space-y-3 rounded-3xl border border-white/10 bg-[#191629] p-5"><p className="text-[10px] font-black tracking-widest text-violet-300">03 · TU PRIVACIDAD</p><h2 className="text-xl font-black">¿Cómo querés compartirlo?</h2><p className="text-xs leading-5 text-white/60">Podés elegir que tu nombre no se muestre fuera del equipo administrador. La administración puede identificar al remitente para gestionar el feedback de manera responsable. Tus comentarios no se publican automáticamente.</p><div className="grid grid-cols-2 gap-2">{[[false,'Sin mi nombre'],[true,'Con mi nombre']].map(([value,label])=><button type="button" key={label} onClick={()=>setNamed(value)} className={`rounded-xl border p-3 text-xs font-bold ${named===value?'border-violet-300 bg-violet-400/20':'border-white/10'}`}>{label}</button>)}</div><label className="flex items-start gap-3 rounded-xl border border-white/10 p-3 text-xs leading-5 text-white/70"><input type="checkbox" checked={publish} onChange={e=>setPublish(e.target.checked)} className="mt-1 accent-violet-400"/><span>Autorizo a Punta Rollers a compartir fragmentos de mi opinión en Instagram u otras redes {named?'con mi nombre':'sin mi nombre'}. Es opcional.</span></label></section>
   <section className="rounded-3xl border border-white/10 bg-[#141924] p-5"><p className="text-[10px] font-black uppercase tracking-[.16em] text-cyan-300">POR QUÉ TE ESCUCHAMOS</p><h2 className="mt-2 text-lg font-black">Tu experiencia nos ayuda a crecer.</h2><p className="mt-3 text-xs leading-6 text-white/65">Creamos este espacio para entender cómo vivís Punta Rollers, reconocer lo que funciona, cuidar lo que valorás y detectar aquello que podemos hacer mejor. No buscamos publicar tus respuestas: queremos escucharte. Las opiniones positivas y las críticas sinceras son igual de importantes para nosotros. Valoramos mucho tu tiempo y la confianza de compartir lo que pensás.</p></section>
   {error&&<p role="alert" className="text-sm text-red-300">{error}</p>}
   <button type="submit" disabled={!rating||busy} className="w-full rounded-2xl bg-violet-300 p-4 text-sm font-black text-[#171127] disabled:opacity-40">{busy?'Enviando...':'Enviar mi opinión'}</button>
  </form>}
 </div></AppLayout>
}
