import { useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import { PR_SEASON_ASSETS } from '../lib/prSeason'

export default function AttendanceNext(){
 const{user}=useAuth()
 const name=[user?.nombre,user?.apellido].filter(Boolean).join(' ')||'Alumno Punta Rollers'
 const[idReady,setIdReady]=useState(true)
 return <AppLayout title="Asistencia"><main className="mx-auto w-full max-w-[720px] space-y-4 px-4 pb-32 pt-4 text-white">
  <section className="relative overflow-hidden rounded-[36px] border border-cyan-300/15 bg-[#090d10] p-6">
   <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl"/><div className="absolute -bottom-20 left-8 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl"/>
   <div className="relative"><p className="text-[8px] font-black tracking-[.24em] text-cyan-200">PR CHECK · TU IDENTIDAD</p><h1 className="mt-3 text-[32px] font-black tracking-[-.04em]">Tu entrada a Punta Rollers.</h1><p className="mt-3 max-w-[480px] text-[11px] leading-5 text-white/38">Este será tu PR ID para registrar clases, eventos y experiencias. Un solo acceso, conectado a tu historia.</p></div>
  </section>
  <section className="rounded-[32px] border border-white/[.07] bg-[#101015] p-5">
   <div className="flex items-center justify-between"><div><p className="text-[8px] font-black tracking-[.18em] text-white/25">PR MEMBER</p><h2 className="mt-1 text-xl font-black">{name}</h2></div><span className="rounded-full border border-emerald-300/15 bg-emerald-300/[.06] px-3 py-1 text-[8px] font-black text-emerald-200">ACTIVO</span></div>
   <div className="mt-5 grid place-items-center rounded-[26px] border border-cyan-300/10 bg-cyan-300/[.035] p-5">
    {idReady?<img src={PR_SEASON_ASSETS.qrIdLogo} onError={()=>setIdReady(false)} alt="PR ID" className="max-h-[330px] w-full max-w-[260px] object-contain"/>:<div className="grid min-h-[220px] w-full max-w-[260px] place-items-center rounded-[22px] border border-dashed border-white/10 p-6 text-center"><div><p className="text-[9px] font-black text-cyan-200/65">QR ID OFICIAL</p><p className="mt-2 text-[9px] leading-4 text-white/25">El original ya está recuperado del ZIP. Falta incorporarlo físicamente al build de la beta.</p></div></div>}
   </div>
   <p className="mt-4 text-center text-[8px] font-black uppercase tracking-[.16em] text-white/20">Mostrá este ID al profesor para registrar tu asistencia</p>
  </section>
  <section className="grid grid-cols-3 gap-2"><Mini v="—" l="PRESENTE"/><Mini v="—" l="JUSTIFICADAS"/><Mini v="—" l="TOTAL"/></section>
  <section className="rounded-[28px] border border-white/[.07] bg-white/[.02] p-5"><p className="text-[8px] font-black tracking-[.18em] text-white/25">HISTORIAL</p><h2 className="mt-1 text-xl font-black">Tu asistencia va a vivir acá.</h2><p className="mt-2 text-[10px] leading-5 text-white/35">No mostramos datos inventados. Cuando PR Check quede conectado, vas a ver fecha, clase, sede y estado de cada registro.</p></section>
 </main></AppLayout>
}
function Mini({v,l}){return <div className="rounded-[20px] border border-white/[.07] bg-black/20 p-4 text-center"><p className="text-xl font-black">{v}</p><p className="mt-1 text-[7px] font-black tracking-[.12em] text-white/22">{l}</p></div>}
