import {useEffect,useState} from 'react'
import {supabase} from '../../lib/supabase'

export default function TrainingCommunityProgress({month}){
 const [people,setPeople]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState('')
 useEffect(()=>{let alive=true;async function load(){const {data,error:e}=await supabase.rpc('pr_training_v2_community_progress',{p_month:month});if(!alive)return;if(e)setError('No se pudo actualizar el progreso del equipo.');else {setPeople(Array.isArray(data)?data:[]);setError('')}setLoading(false)}load();const timer=setInterval(load,60000);return()=>{alive=false;clearInterval(timer)}},[month])
 const completed=people.filter(p=>Number(p.percent)===100).length
 const average=people.length?Math.round(people.reduce((n,p)=>n+Number(p.percent||0),0)/people.length):0
 return <section aria-label="Progreso de tareas de la comunidad" className="mx-3 mt-6 overflow-hidden rounded-[28px] border border-[#FF2777]/30 bg-gradient-to-br from-[#281626] via-[#17171F] to-[#11141D] p-5 sm:p-7">
  <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#FF78AA]">PR TRAINING · NOS MOTIVAMOS ENTRE TODOS</p>
  <h2 className="mt-2 text-2xl font-black italic uppercase text-white">Así va nuestro equipo<span className="text-[#FF2777]">.</span></h2>
  <p className="mt-2 text-xs leading-5 text-white/55">El avance de las seis tareas del mes. Cada aprobación suma. ¡Seguí entrenando!</p>
  <div className="mt-5 grid grid-cols-3 gap-2">{[['Participando',people.length],['Promedio',average+'%'],['Completaron',completed]].map(([label,value])=><div key={label} className="rounded-2xl border border-white/10 bg-white/[.04] p-3 text-center"><p className="text-xl font-black text-white">{value}</p><p className="mt-1 text-[9px] text-white/50">{label}</p></div>)}</div>
  {loading&&<p className="mt-5 text-xs text-white/55">Cargando avances del equipo…</p>}
  {error&&<p role="status" className="mt-4 text-xs text-amber-200">{error}</p>}
  {!loading&&!people.length&&!error&&<p className="mt-5 text-xs text-white/55">Cuando haya tareas asignadas, vas a ver acá cómo avanza el equipo.</p>}
  <div className="mt-5 grid gap-3 sm:grid-cols-2">{people.map(p=><article key={p.id} className="rounded-2xl border border-white/10 bg-black/20 p-3"><div className="flex items-center gap-3">{p.foto?<img src={p.foto} alt="" loading="lazy" className="h-11 w-11 shrink-0 rounded-full object-cover"/>:<div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#FF2777]/20 text-xs font-black text-white">{(p.nombre||p.apellido||"PR").slice(0,1).toUpperCase()}</div>}<div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-white">{[p.nombre,p.apellido].filter(Boolean).join(' ')}</p><p className="mt-1 text-[10px] text-white/45">{p.approved} de {p.total} aprobadas</p></div><strong className="text-lg font-black text-[#C4FF24]">{p.percent}%</strong></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-[#FF2777] to-[#C4FF24]" style={{width:Math.max(0,Math.min(100,Number(p.percent)||0))+'%'}}/></div></article>)}</div>
 </section>
}
