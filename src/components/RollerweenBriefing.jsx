import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ROLLERWEEN, isRollerweenActive, rollerweenNoticeKey } from '../lib/rollerween'

function EventBlock({ accent='purple', event, number }) {
  const acid=accent==='acid'
  return <article className={`rounded-[22px] border p-4 ${acid?'border-[#BEFF37]/20 bg-[#BEFF37]/[.045]':'border-violet-300/15 bg-violet-400/[.055]'}`}>
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className={`text-[8px] font-black uppercase tracking-[.18em] ${acid?'text-[#BEFF37]':'text-violet-300'}`}>{number} · {event.dateLabel}</p>
        <h3 className="mt-1 text-[24px] font-black leading-none text-white">{event.title}</h3>
      </div>
      <span className={`rounded-md border px-2 py-1 font-mono text-[10px] font-black ${acid?'border-[#BEFF37]/30 text-[#BEFF37]':'border-violet-300/25 text-violet-200'}`}>{event.timeLabel}</span>
    </div>
    <p className="mt-3 text-[11px] leading-5 text-white/52">{event.detail}</p>
    <p className="mt-3 border-t border-white/[.06] pt-3 text-[9px] font-bold leading-4 text-white/34">↳ {event.place}</p>
  </article>
}

export default function RollerweenBriefing({ user }) {
  const [open,setOpen]=useState(false)
  const [attending,setAttending]=useState(false)
  const [saving,setSaving]=useState(false)
  const active=isRollerweenActive()
  const noticeStillRelevant=Date.now()<=new Date(ROLLERWEEN.roll.startsAt).getTime()

  useEffect(()=>{
    if(!active||!noticeStillRelevant||!user?.id)return
    let alive=true
    async function boot(){
      const [{data:rsvp}]=await Promise.all([
        supabase.from('pr_event_rsvps').select('status').eq('event_slug',ROLLERWEEN.timeTrial.slug).eq('profile_id',user.id).maybeSingle()
      ])
      if(!alive)return
      setAttending(rsvp?.status==='attending')
      try{
        if(window.localStorage.getItem(rollerweenNoticeKey(user.id))!=='seen')setOpen(true)
      }catch{setOpen(true)}
    }
    boot()
    return()=>{alive=false}
  },[active,noticeStillRelevant,user?.id])

  useEffect(()=>{
    if(!open)return
    const prev=document.body.style.overflow
    document.body.style.overflow='hidden'
    return()=>{document.body.style.overflow=prev}
  },[open])

  function close(){
    try{window.localStorage.setItem(rollerweenNoticeKey(user?.id),'seen')}catch{}
    setOpen(false)
  }

  async function toggleAttend(){
    if(!user?.id||saving)return
    setSaving(true)
    const next=!attending
    const {error}=await supabase.from('pr_event_rsvps').upsert({
      event_slug:ROLLERWEEN.timeTrial.slug,
      profile_id:user.id,
      status:next?'attending':'not_attending',
      updated_at:new Date().toISOString(),
    },{onConflict:'event_slug,profile_id'})
    if(!error)setAttending(next)
    setSaving(false)
  }

  if(!open)return null

  return <div className="fixed inset-0 z-[210] overflow-y-auto bg-black/90 px-3 py-[max(12px,env(safe-area-inset-top))] backdrop-blur-xl" role="dialog" aria-modal="true" aria-labelledby="rollerween-brief-title">
    <div className="mx-auto flex min-h-full w-full max-w-[470px] items-center">
      <section className="pr-rollerween-card pr-rw-paper relative w-full rounded-[32px] p-5 shadow-[0_38px_120px_rgba(0,0,0,.78)]">
        <div className="pr-rw-scratch right-[-18px] top-[74px]" aria-hidden="true"/>
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="pr-rw-stamp">OCT.01 · NEW SEASON</div>
              <p className="mt-5 pr-rw-kicker">ROAD TO SHIFTER · AVISO IMPORTANTE</p>
              <h2 id="rollerween-brief-title" className="pr-rw-title pr-rw-glitch mt-2 text-[42px] text-white">OCTUBRE<br/><span className="pr-rw-purple">ENTRA EN SU</span><br/><span className="pr-rw-acid">BLOQUE FINAL.</span></h2>
            </div>
            <div className="pr-rw-pumpkin-wheel shrink-0 scale-[.72]" aria-hidden="true"/>
          </div>

          <p className="mt-5 max-w-[390px] text-[12px] leading-5 text-white/52">La carrera es el <b className="text-white">01 de noviembre</b>. Entre clínica, deberes y puesta a punto, octubre tiene poco margen: estas dos fechas pasan a ser parte clave del cierre de preparación.</p>

          <div className="mt-5 space-y-3">
            <EventBlock number="01" event={ROLLERWEEN.timeTrial}/>
            <EventBlock number="02" accent="acid" event={ROLLERWEEN.roll}/>
          </div>

          <div className="mt-4 rounded-[20px] border border-orange-300/15 bg-orange-400/[.055] p-4">
            <p className="text-[8px] font-black uppercase tracking-[.18em] text-orange-200">LLEGAR BIEN TAMBIÉN ES ENTRENAR</p>
            <p className="mt-2 text-[11px] leading-5 text-white/48">Venimos trabajando hace meses. Desde acá priorizamos <b className="text-white">llegar enteros a la largada</b>: evitamos sumar riesgos, golpes, maniobras innecesarias o cargas que no aporten en estas últimas semanas.</p>
          </div>

          <button type="button" onClick={toggleAttend} disabled={saving} className={`mt-5 flex min-h-14 w-full items-center justify-between rounded-[18px] border px-5 text-left transition active:scale-[.99] ${attending?'border-[#BEFF37]/40 bg-[#BEFF37] text-black':'border-violet-300/25 bg-violet-500/20 text-white'}`}>
            <span><small className={`block text-[7px] font-black uppercase tracking-[.17em] ${attending?'text-black/55':'text-violet-200/70'}`}>TOMA DE TIEMPO · 07/10</small><b className="mt-1 block text-[12px] font-black">{saving?'GUARDANDO…':attending?'✓ ASISTENCIA CONFIRMADA':'VOY A ASISTIR'}</b></span>
            <span className="text-xl">{attending?'✓':'→'}</span>
          </button>

          <p className="mt-3 text-center text-[9px] leading-4 text-white/25">{attending?'Tu perfil aparecerá en el banner de asistencia del RollerFeed.':'Podés confirmar ahora y tu perfil se suma al banner del RollerFeed.'}</p>
          <button type="button" onClick={close} className="mt-3 w-full py-3 text-[9px] font-black uppercase tracking-[.16em] text-white/35">ENTENDIDO · ENTRAR A PR</button>
        </div>
      </section>
    </div>
  </div>
}
