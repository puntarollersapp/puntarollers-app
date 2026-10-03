import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const CAMPAIGN='rollermap-explorer-2026-10-v1'

export default function ExplorerLaunchPopup({ userId }) {
  const navigate=useNavigate()
  const [open,setOpen]=useState(false)
  useEffect(()=>{
    if(!userId)return
    const key=`pr:${CAMPAIGN}:${userId}`
    if(!localStorage.getItem(key)) setOpen(true)
  },[userId])
  function dismiss(){
    if(userId)localStorage.setItem(`pr:${CAMPAIGN}:${userId}`,'seen')
    setOpen(false)
  }
  function explore(){dismiss();navigate('/app/rollermap?modo=explorador')}
  if(!open)return null
  return <div className="fixed inset-0 z-[120] grid place-items-center bg-black/80 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="explorer-launch-title">
    <section className="w-full max-w-md overflow-hidden rounded-[30px] border border-cyan-300/20 bg-[#0a0a16] shadow-2xl">
      <div className="h-1 bg-gradient-to-r from-cyan-400 via-violet-500 to-orange-400" />
      <div className="p-6">
        <p className="text-[10px] font-black tracking-[.22em] text-cyan-300">ROLLERMAP · NUEVA FUNCIÓN</p>
        <h2 id="explorer-launch-title" className="mt-2 font-display text-3xl text-white">Modo Explorador</h2>
        <p className="mt-3 text-sm leading-6 text-white/65">Estamos construyendo entre todos un mapa útil para patinar mejor. Ahora podés aportar calles, tramos y recomendaciones desde RollerMap.</p>
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[.04] p-4 text-xs leading-5 text-white/55">
          Tus aportes no se publican automáticamente. Primero pasan por revisión de Punta Rollers para cuidar la calidad y seguridad de la información.
        </div>
        <button onClick={explore} className="mt-6 w-full rounded-2xl bg-cyan-300 px-4 py-4 text-sm font-black text-[#071014]">Explorar y contribuir →</button>
        <button onClick={dismiss} className="mt-2 w-full py-3 text-xs font-bold text-white/40">Ver más tarde</button>
      </div>
    </section>
  </div>
}
