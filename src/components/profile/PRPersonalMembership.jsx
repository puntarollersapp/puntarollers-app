import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import PassCard from '../PRPersonalPassCard'

export function usePersonalMembership(profileId) {
 const [state,setState]=useState(null)
 useEffect(()=>{let alive=true;setState(null);if(!profileId)return;async function load(){const {data,error}=await supabase.rpc('pr_personal_my_membership');if(alive&&!error)setState({profileId,data:data||null})}load();const timer=setInterval(load,60000);const refresh=()=>{if(document.visibilityState==='visible')load()};document.addEventListener('visibilitychange',refresh);return()=>{alive=false;clearInterval(timer);document.removeEventListener('visibilitychange',refresh)}},[profileId])
 return state?.profileId===profileId?state.data:null
}
export default function PRPersonalMembership({membership,profile}) {
 if(!membership?.pass)return null
 const pass=membership.pass
 const total=Math.max(0,Number(pass.clases_cargadas)||0)
 const used=Math.min(total,Math.max(0,Number(pass.clases_utilizadas)||0))
 const left=Math.max(0,Number(pass.clases_disponibles)||0)
 const exclusive=Boolean(membership.exclusive||profile?.es_solo_personalizadas)
 const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Montevideo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())
 const active=Boolean(membership.active&&pass.habilitada&&pass.estado==='activa'&&left>0&&(!pass.fecha_vencimiento||pass.fecha_vencimiento>=today))
 const completed=total>0&&used>=total&&left===0
 const title=completed?'Cuponera finalizada':left===0?'Sin clases disponibles':'Cuponera no vigente'
 const card=<PassCard student={profile} pass={pass} reservedCredits={membership.reservedCredits} bookableCredits={active?membership.bookableCredits:0} inactive={!active&&!completed}/>
 return <section className="pr-profile-personal-pass mb-4 min-w-0 space-y-3" aria-label="Cuponeras de clases particulares">
  <header className="px-1"><p className="text-[10px] font-black uppercase tracking-[.16em] text-[#a5efdc]">PR PERSONAL · 1 A 1</p><h2 className="mt-1 text-lg font-black leading-tight text-white">Cuponeras de clases particulares</h2><p className="mt-1 text-xs leading-relaxed text-white/60">{exclusive?'Acá podés consultar tu cuponera de clases individuales.':'Este apartado es exclusivo de tus clases individuales. No está relacionado con tu mensualidad ni con tus clases grupales.'}</p></header>
  {active?<>{card}<Link to="/personalizadas" className="flex min-h-12 items-center justify-center rounded-xl bg-[#a5efdc] px-4 py-3 text-sm font-black text-[#17332c]">{Number(membership.bookableCredits)>0?'Consultar agenda y reservar clases':'Consultar agenda y reservas'} →</Link></>:<details key={pass.id} className="group overflow-hidden rounded-[22px] border border-white/10 bg-[#191a20]">
    <summary className="flex min-h-[78px] cursor-pointer list-none items-center gap-3 p-4 text-left [&::-webkit-details-marker]:hidden">
     <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-[#a5efdc]"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16v14H4zM4 9h16M9 13h6m-6 3h4"/></svg></span>
     <span className="min-w-0 flex-1"><span className="block text-[10px] font-black uppercase tracking-wider text-white/45">Historial · PR Pass</span><span className="mt-1 block text-sm font-black text-white">{title}</span><span className="mt-1 block text-xs leading-relaxed text-white/60">{completed?used+' de '+total+' clases realizadas · 0 pendientes':left===0?'No hay clases particulares para reservar.':'Sin disponibilidad para reservar actualmente.'}</span><span className="mt-1 block text-[11px] font-bold text-[#a5efdc]">Ver detalle de la cuponera</span></span>
     <svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-[#a5efdc] transition-transform group-open:rotate-180 motion-reduce:transition-none"><path d="m6 9 6 6 6-6"/></svg>
    </summary>
    <div className="space-y-3 border-t border-white/10 p-2 sm:p-3"><p className="px-2 pt-2 text-xs leading-relaxed text-white/65">{completed?'Esta cuponera ya fue utilizada en su totalidad y se conserva como registro de tus clases particulares.':'Esta cuponera se conserva como registro. No está habilitada para nuevas reservas.'}{!exclusive?' Tu actividad grupal y tu mensualidad se gestionan por separado.':''}</p>{card}</div>
   </details>}
 </section>
}
