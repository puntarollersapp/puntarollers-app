import { useEffect,useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import { supabase } from '../lib/supabase'

export default function AdminPRVoice(){
 const [items,setItems]=useState([]),[profiles,setProfiles]=useState({}),[error,setError]=useState(''),[loading,setLoading]=useState(true),[savingId,setSavingId]=useState(null)
 useEffect(()=>{let active=true;(async()=>{
  const {data,error:err}=await supabase.from('pr_voice_feedback').select('*').order('created_at',{ascending:false}).limit(300)
  if(!active)return
  if(err){setError('No se pudieron cargar las respuestas.');setLoading(false);return}
  const ids=[...new Set((data||[]).map(x=>x.profile_id))]
  const {data:people}=ids.length?await supabase.from('profiles').select('id,nombre,apellido').in('id',ids):{data:[]}
  if(!active)return
  setProfiles(Object.fromEntries((people||[]).map(p=>[p.id,[p.nombre,p.apellido].filter(Boolean).join(' ')])))
  setItems(data||[]);setLoading(false)
 })();return()=>{active=false}},[])
 async function markReviewed(item){if(savingId)return;setSavingId(item.id);const {error:err}=await supabase.from('pr_voice_feedback').update({reviewed_at:new Date().toISOString()}).eq('id',item.id);setSavingId(null);if(err){setError('No se pudo marcar la opinión como revisada.');return}setItems(old=>old.map(x=>x.id===item.id?{...x,reviewed_at:new Date().toISOString()}:x))}
 return <AppLayout title="PR Voice · Admin"><div className="mx-auto max-w-3xl space-y-5 px-4 pb-24 pt-6 text-white"><header className="rounded-3xl border border-violet-300/20 bg-gradient-to-br from-[#292040] to-[#151423] p-6"><p className="text-xs font-black uppercase tracking-widest text-violet-300">PR VOICE · ADMINISTRACIÓN</p><h1 className="mt-3 text-3xl font-black">Escuchar para mejorar.</h1><p className="mt-2 text-sm text-white/60">Respuestas privadas. Solo compartí testimonios que tengan autorización expresa.</p></header>
 {loading&&<p className="text-sm text-white/50">Cargando respuestas...</p>}{error&&<p className="text-sm text-red-300">{error}</p>}
 <div className="grid grid-cols-3 gap-2">{[['Respuestas',items.length],['Promedio',items.length?(items.reduce((n,x)=>n+x.rating,0)/items.length).toFixed(1):'—'],['Nuevas',items.filter(x=>!x.reviewed_at).length]].map(([label,value])=><div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-3"><p className="text-[10px] text-white/50">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div>)}</div>
 {items.map(item=><article key={item.id} className={`space-y-3 rounded-3xl border bg-[#191629] p-5 ${item.reviewed_at?'border-white/10':'border-violet-300/40'}`}><div className="flex items-center justify-between gap-2"><div><p className="text-sm font-bold">{profiles[item.profile_id]||'Perfil PR'}</p><p className="text-[10px] text-white/40">{new Date(item.created_at).toLocaleDateString('es-UY')} · {item.display_name?'Con nombre':'Sin nombre público'}</p></div><span className="text-lg">{['😕','😐','🙂','😍','🤩'][item.rating-1]}</span></div>{[['💜 Lo positivo',item.highlight],['✨ Para mejorar',item.improvement],['Ideas',item.idea],['Algo más que compartir',item.additional_comment]].filter(([,value])=>value).map(([label,value])=><div key={label}><p className="text-[10px] font-black uppercase tracking-wider text-violet-300">{label}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-white/80">{value}</p></div>)}<div className="flex flex-wrap items-center gap-2">{!item.reviewed_at?<button type="button" disabled={savingId===item.id} onClick={()=>markReviewed(item)} className="rounded-xl bg-violet-300 px-4 py-2 text-xs font-black text-[#171127] disabled:opacity-50">{savingId===item.id?'Guardando...':'✓ Marcar como revisada'}</button>:<span className="text-[10px] font-bold text-emerald-300">✓ Revisada</span>}</div><p className={`inline-block rounded-full border px-3 py-1 text-[10px] font-bold ${item.publish_consent?'border-emerald-400/30 text-emerald-300':'border-amber-400/30 text-amber-300'}`}>{item.publish_consent?'✓ Autorizó compartir':'Privado · No publicar'}</p></article>)}
 {!loading&&!items.length&&!error&&<p className="text-center text-sm text-white/50">Todavía no hay respuestas.</p>}
 </div></AppLayout>
}
