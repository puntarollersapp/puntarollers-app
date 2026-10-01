import { useEffect, useState } from 'react'
import { isRollerweenActive } from '../lib/rollerween'

const ROLLERWEEN_ART = '/rollerween-2026-final.png?v=20261001-upload'

export default function LoadingScreen({onDone}){
  const[leaving,setLeaving]=useState(false),rollerween=isRollerweenActive()
  useEffect(()=>{const t1=setTimeout(()=>setLeaving(true),2400),t2=setTimeout(()=>onDone?.(),2900);return()=>{clearTimeout(t1);clearTimeout(t2)}},[onDone])
  return <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-500 ${leaving?'pointer-events-none opacity-0':'opacity-100'}`} style={{background:rollerween?'radial-gradient(circle at 50% 38%,rgba(116,38,190,.20),transparent 36%),linear-gradient(180deg,#070509,#020203)':'radial-gradient(ellipse 80% 60% at 50% 40%,#0d0d22 0%,#050508 100%)'}}>
    {rollerween?<><div className="absolute inset-0 opacity-20" style={{backgroundImage:'repeating-linear-gradient(8deg,transparent 0 28px,rgba(255,255,255,.018) 29px)'}}/><div className="relative z-10 flex w-full flex-col items-center px-6 text-center"><img src={ROLLERWEEN_ART} alt="RollerWeen Season 2026 · Punta Rollers" className="mb-5 block h-auto w-[175px] max-w-[52vw] object-contain" style={{filter:'drop-shadow(0 0 16px rgba(143,47,255,.26)) drop-shadow(0 0 22px rgba(190,255,55,.07))'}}/><div className="h-[6px] w-60 max-w-[68vw] overflow-hidden rounded-full border border-violet-300/25 bg-white/[.055] p-[1px]"><div className="h-full w-full origin-left rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-400 to-[#BEFF37]" style={{animation:'rwLoader 2.35s cubic-bezier(.2,.8,.2,1) both',boxShadow:'0 0 14px rgba(190,255,55,.32)'}}/></div><p className="mt-3 font-mono text-[8px] font-black tracking-[.18em] text-white/35">Cargando Season de Halloween...</p></div><style>{`@keyframes rwLoader{0%{transform:scaleX(.03);opacity:.45}70%{transform:scaleX(.82);opacity:1}100%{transform:scaleX(1)}}`}</style></>:<><div className="relative logo-reveal"><img src="/logo.png" alt="PuntaRollers" className="h-44 w-44 object-contain" style={{filter:'drop-shadow(0 0 16px rgba(201,168,76,0.5))'}}/></div><p className="tagline-reveal mt-8 text-xs uppercase font-body" style={{letterSpacing:'.22em',color:'#C9A84C',opacity:0}}>Pertenecer no es para todos.</p></>}
    {!rollerween&&<div className="relative z-10 mt-10 flex gap-1.5 opacity-40">{[0,1,2].map(i=><div key={i} className="h-1 w-1 rounded-full bg-pr-gold" style={{animation:`fadeIn 1.2s ease-in-out ${i*.2}s infinite alternate`}}/>)}</div>}
  </div>
}
