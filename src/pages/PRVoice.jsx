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
 const [showSuccess,setShowSuccess]=useState(false)
 const [error,setError]=useState('')
 async function submit(e){
  e.preventDefault()
  if(!rating||busy)return
  setBusy(true);setError('')
  const {error:err}=await supabase.from('pr_voice_feedback').insert({profile_id:user.id,rating,highlight:highlight.trim(),improvement:improvement.trim(),idea:idea.trim(),additional_comment:additionalComment.trim(),display_name:named,publish_consent:publish})
  setBusy(false)
  if(err){setError('No pudimos guardar tu opinión. Probá nuevamente.');return}
  setDone(true)
  setShowSuccess(true)
 }
 return <AppLayout title="PR Voice"><div className="mx-auto max-w-xl space-y-4 px-4 pb-24 pt-5 text-white">
  <header className="relative isolate overflow-hidden rounded-[30px] border border-violet-300/25 bg-gradient-to-br from-[#252040] via-[#141324] to-[#111b2a] px-5 py-9 text-center shadow-2xl">
   <div aria-hidden="true" className="pointer-events-none absolute -left-12 -top-20 h-56 w-56 rounded-full bg-violet-400/15 blur-[60px]"/>
   <div aria-hidden="true" className="pointer-events-none absolute -right-14 bottom-0 h-48 w-48 rounded-full bg-cyan-300/10 blur-[55px]"/>
   <div className="relative"><p className="text-[10px] font-black uppercase tracking-[.28em] text-cyan-300">PUNTA ROLLERS / TU ESPACIO</p>
    <h1 className="mx-auto mt-5 w-fit -rotate-2 bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text text-[clamp(48px,13vw,76px)] font-black italic leading-none tracking-[-.075em] text-transparent" style={{fontFamily:'Impact, Haettenschweiler, Arial Narrow Bold, sans-serif'}}>FeedBack!</h1>
    <div className="mx-auto mt-4 h-[2px] w-24 rounded-full bg-gradient-to-r from-transparent via-violet-300 to-transparent"/>
    <h2 className="mt-5 text-xl font-black leading-tight">Tu opinión nos importa.<br/><span className="text-violet-300">Tu voz nos mueve.</span></h2>
    <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-white/65">Queremos saber qué te gusta, qué podemos mejorar y qué ideas tenés. Tu experiencia nos ayuda a construir un Punta Rollers mejor.</p>
    <p className="mt-5 inline-block rounded-full border border-cyan-300/20 bg-cyan-300/5 px-3 py-2 text-[10px] font-bold text-cyan-200">Tu espacio para hablar con libertad · A tu ritmo</p>
   </div>
  </header>
  {showSuccess&&<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-5 backdrop-blur-md"><div role="alertdialog" aria-modal="true" aria-labelledby="pr-voice-success-title" className="w-full max-w-sm rounded-[30px] border border-violet-300/30 bg-gradient-to-br from-[#29213f] to-[#141624] p-7 text-center shadow-2xl"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-emerald-300/30 bg-emerald-300/10 text-3xl font-black text-emerald-300">✓</div><h2 id="pr-voice-success-title" className="mt-5 text-2xl font-black">¡Gracias!</h2><p className="mt-2 text-lg font-bold text-violet-200">Feedback enviado.</p><p className="mt-3 text-sm leading-6 text-white/60">Valoramos tu tiempo y tu sinceridad. Tu opinión nos ayuda a seguir mejorando.</p><button type="button" onClick={()=>setShowSuccess(false)} className="mt-6 w-full rounded-2xl bg-violet-300 px-5 py-3 text-sm font-black text-[#171127]">Cerrar</button></div></div>}
  {done?<section className="rounded-3xl border border-violet-300/20 bg-[#191629] p-8 text-center"><p className="text-5xl text-violet-300">✓</p><h2 className="mt-4 text-2xl font-black">¡Gracias por tu opinión!</h2><p className="mt-3 text-sm text-white/60">Gracias por dedicar tu tiempo a compartir tu experiencia. Leemos cada opinión para cuidar lo que hacemos bien y mejorar lo que haga falta.</p></section>:
  <form onSubmit={submit} className="space-y-4">
   <section className="rounded-3xl border border-white/10 bg-[#191629] p-5"><p className="text-[10px] font-black tracking-widest text-violet-300">01 · TU EXPERIENCIA</p><h2 className="mt-2 text-xl font-black">¿Cómo te sentís en PR?</h2><p className="mt-1 text-xs text-white/50">Elegí una carita.</p><div className="mt-4 grid grid-cols-5 gap-2">{faces.map((face,i)=><button type="button" key={face} aria-label={['Podría mejorar','Regular','Bien','Muy bien','Increíble'][i]} aria-pressed={rating===i+1} onClick={()=>setRating(i+1)} className={`rounded-2xl border py-3 text-2xl transition ${rating===i+1?'border-violet-300 bg-violet-400/20':'border-white/10 bg-white/5'}`}>{face}</button>)}</div></section>
   <section className="space-y-4 rounded-3xl border border-white/10 bg-[#191629] p-5"><div><p className="text-[10px] font-black tracking-widest text-cyan-300">02 · CONTANOS</p><h2 className="mt-2 text-xl font-black">Tu experiencia cuenta.</h2><p className="text-xs text-white/50">Podés responder una, varias o todas las preguntas. Tomate el tiempo que necesites.</p></div>{[['¿Qué es lo que más te gusta de Punta Rollers?',highlight,setHighlight],['¿Qué te gustaría mejorar de Punta Rollers?',improvement,setImprovement],['¿Qué te gustaría que hagamos próximamente?',idea,setIdea],['¿Hay algo más que quieras decirnos?',additionalComment,setAdditionalComment]].map(([label,value,setValue])=><label key={label} className="block space-y-2"><span className="text-xs font-bold">{label}</span><textarea rows={3} value={value} onChange={e=>setValue(e.target.value)} placeholder="Este espacio es tuyo. Escribí con libertad..." className={input}/></label>)}</section>
   <section className="space-y-3 rounded-3xl border border-white/10 bg-[#191629] p-5"><p className="text-[10px] font-black tracking-widest text-violet-300">03 · TU PRIVACIDAD</p><h2 className="text-xl font-black">¿Cómo querés compartirlo?</h2><p className="text-xs leading-5 text-white/60">Podés elegir que tu nombre no se muestre fuera del equipo administrador. La administración puede identificar al remitente para gestionar el feedback de manera responsable. Tus comentarios no se publican automáticamente.</p><div className="grid grid-cols-2 gap-2">{[[false,'Sin mi nombre'],[true,'Con mi nombre']].map(([value,label])=><button type="button" key={label} onClick={()=>setNamed(value)} className={`rounded-xl border p-3 text-xs font-bold ${named===value?'border-violet-300 bg-violet-400/20':'border-white/10'}`}>{label}</button>)}</div><label className="flex items-start gap-3 rounded-xl border border-white/10 p-3 text-xs leading-5 text-white/70"><input type="checkbox" checked={publish} onChange={e=>setPublish(e.target.checked)} className="mt-1 accent-violet-400"/><span>Autorizo a Punta Rollers a compartir fragmentos de mi opinión en Instagram u otras redes {named?'con mi nombre':'sin mi nombre'}. Es opcional.</span></label></section>

   {error&&<p role="alert" className="text-sm text-red-300">{error}</p>}
   <button type="submit" disabled={!rating||busy} className="w-full rounded-2xl bg-violet-300 p-4 text-sm font-black text-[#171127] disabled:opacity-40">{busy?'Enviando...' :'Enviar feedback'}</button>
   <section className="rounded-3xl border border-white/10 bg-[#141924] p-5"><p className="text-[10px] font-black uppercase tracking-[.16em] text-cyan-300">POR QUÉ TE ESCUCHAMOS</p><h2 className="mt-2 text-lg font-black">Tu experiencia nos ayuda a crecer.</h2><p className="mt-3 text-xs leading-6 text-white/65">Creamos este espacio para entender cómo vivís Punta Rollers, reconocer lo que funciona, cuidar lo que valorás y detectar aquello que podemos hacer mejor. No buscamos publicar tus respuestas: queremos escucharte. Las opiniones positivas y las críticas sinceras son igual de importantes para nosotros. Valoramos mucho tu tiempo y la confianza de compartir lo que pensás.</p></section>
  </form>}
 </div></AppLayout>
}
