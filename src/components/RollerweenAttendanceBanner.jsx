import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import ProfileAvatar from './ProfileAvatar'
import { ROLLERWEEN, isTimeTrialBannerActive } from '../lib/rollerween'

function nameOf(p){return p?.nombre_completo||[p?.nombre,p?.apellido].filter(Boolean).join(' ')||'Roller PR'}

export default function RollerweenAttendanceBanner(){
  const [people,setPeople]=useState([])
  const [now,setNow]=useState(()=>Date.now())

  useEffect(()=>{
    if(!isTimeTrialBannerActive(new Date(now)))return
    let alive=true
    async function load(){
      const [{data:rsvps},{data:profiles}]=await Promise.all([
        supabase.from('pr_event_rsvps').select('profile_id,updated_at').eq('event_slug',ROLLERWEEN.timeTrial.slug).eq('status','attending').order('updated_at',{ascending:true}),
        supabase.from('profiles_feed').select('*').limit(500),
      ])
      if(!alive)return
      const map=new Map((profiles||[]).map(p=>[String(p.id),p]))
      setPeople((rsvps||[]).map(r=>map.get(String(r.profile_id))).filter(Boolean))
      setNow(Date.now())
    }
    load()
    const t=window.setInterval(load,30000)
    window.addEventListener('focus',load)
    return()=>{alive=false;window.clearInterval(t);window.removeEventListener('focus',load)}
  },[])

  if(!isTimeTrialBannerActive(new Date(now)))return null

  return <article className="pr-rollerween-card mb-4 rounded-[28px] p-5">
    <div className="relative z-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="pr-rw-kicker">07 OCT · 19:30 · TOMA #04</p>
          <h3 className="pr-rw-title mt-1 text-[31px] text-white">¿QUIÉNES<br/><span className="pr-rw-purple">VAN A ESTAR?</span></h3>
        </div>
        <div className="pr-rw-pumpkin-wheel scale-[.58]" aria-hidden="true"/>
      </div>
      <p className="mt-3 max-w-[330px] text-[10px] leading-4 text-white/40">Pista de Ciclismo Punta del Este · frente al Centro de Convenciones.</p>
      {people.length?<div className="mt-4 flex items-center">
        <div className="flex -space-x-3">{people.slice(0,9).map((p,i)=><div key={p.id||i} title={nameOf(p)} className="rounded-full border-[3px] border-[#0a080d]"><ProfileAvatar profile={p} className="h-11 w-11" rounded="rounded-full"/></div>)}</div>
        {people.length>9&&<span className="ml-2 rounded-full border border-violet-300/20 bg-violet-400/10 px-2 py-1 text-[9px] font-black text-violet-200">+{people.length-9}</span>}
      </div>:<div className="mt-4 rounded-[17px] border border-dashed border-white/10 p-4 text-[10px] text-white/30">Las confirmaciones van a aparecer acá.</div>}
      <div className="mt-4 flex items-center justify-between border-t border-white/[.06] pt-3">
        <p className="text-[8px] font-black uppercase tracking-[.14em] text-white/25">{people.length} confirmado{people.length===1?'':'s'}</p>
        <span className="text-[8px] font-black text-[#BEFF37]">ROAD TO SHIFTER →</span>
      </div>
    </div>
  </article>
}
